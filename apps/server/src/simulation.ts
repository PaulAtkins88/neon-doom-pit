import { createEntityId, type EntityId, type MonsterKind, type Vector3Like } from '@neon/shared';
import {
  COMPLETED_WAVES_TO_WIN,
  DEFAULT_SESSION,
  ENEMY_RESPAWN_DELAY,
  ENEMY_RESPAWN_SPAWN_POINTS,
  INITIAL_ENEMY_SPAWN_POINTS,
  MONSTER_MELEE_COOLDOWN_OVERRIDES,
  PICKUP_RESPAWN_DELAY,
  PICKUP_SPAWN_POINTS,
  PLAYER_EMPTY_FIRE_COOLDOWN,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_MAX_AMMO,
  PLAYER_MAX_HEALTH,
  PLAYER_PROJECTILE_DAMAGE,
  PLAYER_PROJECTILE_RADIUS,
  PLAYER_PROJECTILE_SPEED,
  PLAYER_PROJECTILE_TTL,
  PLAYER_RELOAD_DURATION,
  PLAYER_SECOND_SPAWN_OFFSET_X,
  PLAYER_SHOTGUN_PELLETS,
  PLAYER_SPAWN_POSITION,
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  SHOTGUN_PICKUP_CHARGES,
  WAVE_CLEAR_DELAY,
  createMonsterKindsForWave,
  getMonsterConfig,
} from './config';
import {
  applyShotgunSpread,
  getAimDirection,
  hitsCircle,
  pickupHitsPlayer,
  projectileHitArena,
  tryMovePosition,
} from './world';
import type {
  MonsterSimulationState,
  PickupSimulationState,
  PlayerInputState,
  PlayerSimulationState,
  ProjectileSimulationState,
  RoomRecord,
  SessionRecord,
} from './types';

export function createDefaultInputState(): PlayerInputState {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    pitch: 0,
    sprint: false,
    shooting: false,
    reloadRequested: false,
  };
}

export function createInitialPlayerSimulation(spawnIndex: number): PlayerSimulationState {
  const spawn = spawnIndex === 0
    ? { x: PLAYER_SPAWN_POSITION.x, y: PLAYER_SPAWN_POSITION.y, z: PLAYER_SPAWN_POSITION.z }
    : { x: PLAYER_SPAWN_POSITION.x + PLAYER_SECOND_SPAWN_OFFSET_X, y: PLAYER_SPAWN_POSITION.y, z: PLAYER_SPAWN_POSITION.z };

  return {
    position: spawn,
    yaw: 0,
    health: PLAYER_MAX_HEALTH,
    ammo: PLAYER_MAX_AMMO,
    weapon: 'rifle',
    shotgunCharges: 0,
    kills: 0,
    reloadTimer: 0,
    fireCooldown: 0,
  };
}

export function createInitialPickups(): PickupSimulationState[] {
  return PICKUP_SPAWN_POINTS.map((position, index) => ({
    id: createEntityId(),
    type: index % 2 === 0 ? 'shotgun' : 'health',
    position: { ...position },
    active: true,
  }));
}

export function simulateRoom(room: RoomRecord, deltaSeconds: number): void {
  for (const session of room.sessions.values()) {
    simulatePlayer(room, session, deltaSeconds);
  }

  simulateMonsters(room, deltaSeconds);
  simulateProjectiles(room, deltaSeconds);
  simulatePickups(room, deltaSeconds);
  updateWaveState(room, deltaSeconds);
}

function createMonsterSimulation(kind: MonsterKind, position: Vector3Like): MonsterSimulationState {
  const config = getMonsterConfig(kind);
  return {
    id: createEntityId(),
    type: kind,
    position: { ...position },
    health: config.health,
    radius: config.radius,
    speed: config.speed,
    sightRange: config.sightRange,
    attackRange: config.attackRange,
    keepDistance: config.keepDistance,
    meleeDamage: config.meleeDamage,
    projectileSpeed: config.projectileSpeed,
    projectileCooldown: config.projectileCooldown,
    projectileRadius: config.projectileRadius,
    projectileTtl: config.projectileTtl,
    attackCooldown: config.attackCooldown,
    bob: Math.random() * Math.PI * 2,
    alive: true,
  };
}

function simulatePlayer(room: RoomRecord, session: SessionRecord, deltaSeconds: number): void {
  if (!session.connected) {
    session.input = createDefaultInputState();
    return;
  }

  const { input, simulation } = session;
  simulation.yaw = input.yaw;

  if (simulation.fireCooldown > 0) {
    simulation.fireCooldown = Math.max(0, simulation.fireCooldown - deltaSeconds);
  }

  if (simulation.reloadTimer > 0) {
    simulation.reloadTimer = Math.max(0, simulation.reloadTimer - deltaSeconds);
    if (simulation.reloadTimer === 0) {
      simulation.ammo = PLAYER_MAX_AMMO;
    }
  }

  if (input.reloadRequested && simulation.reloadTimer <= 0 && simulation.ammo < PLAYER_MAX_AMMO) {
    simulation.reloadTimer = PLAYER_RELOAD_DURATION;
  }

  if (input.shooting && simulation.reloadTimer <= 0 && simulation.fireCooldown <= 0) {
    if (simulation.ammo > 0) {
      simulation.ammo -= 1;
      simulation.fireCooldown = PLAYER_FIRE_COOLDOWN;

      if (simulation.weapon === 'shotgun' && simulation.shotgunCharges > 0) {
        simulation.shotgunCharges -= 1;

        for (let index = 0; index < PLAYER_SHOTGUN_PELLETS; index += 1) {
          spawnPlayerProjectile(room, session, applyShotgunSpread(getAimDirection(input.yaw, input.pitch)));
        }

        if (simulation.shotgunCharges <= 0) {
          simulation.weapon = 'rifle';
          simulation.shotgunCharges = 0;
        }
      } else {
        spawnPlayerProjectile(room, session, getAimDirection(input.yaw, input.pitch));
      }
    } else {
      simulation.reloadTimer = PLAYER_RELOAD_DURATION;
      simulation.fireCooldown = PLAYER_EMPTY_FIRE_COOLDOWN;
    }
  }

  const moveLength = Math.hypot(input.moveX, input.moveZ);
  if (moveLength <= 0) {
    session.input.reloadRequested = false;
    return;
  }

  const normalizedMoveX = input.moveX / moveLength;
  const normalizedMoveZ = input.moveZ / moveLength;
  const forwardX = -Math.sin(simulation.yaw);
  const forwardZ = -Math.cos(simulation.yaw);
  const rightX = Math.cos(simulation.yaw);
  const rightZ = -Math.sin(simulation.yaw);
  const worldMoveX = forwardX * -normalizedMoveZ + rightX * normalizedMoveX;
  const worldMoveZ = forwardZ * -normalizedMoveZ + rightZ * normalizedMoveX;
  const speed = input.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
  tryMove(simulation, worldMoveX * speed * deltaSeconds, worldMoveZ * speed * deltaSeconds);
  session.input.reloadRequested = false;
}

function simulateMonsters(room: RoomRecord, deltaSeconds: number): void {
  for (const monster of room.monsters) {
    if (!monster.alive) {
      continue;
    }

    monster.bob += deltaSeconds * 5;
    monster.attackCooldown = Math.max(0, monster.attackCooldown - deltaSeconds);

    const targetPlayer = getClosestConnectedPlayer(room, monster.position);

    if (!targetPlayer) {
      continue;
    }

    const toPlayerX = targetPlayer.simulation.position.x - monster.position.x;
    const toPlayerZ = targetPlayer.simulation.position.z - monster.position.z;
    const distance = Math.hypot(toPlayerX, toPlayerZ);

    if (distance > 0.001) {
      let moveX = toPlayerX / distance;
      let moveZ = toPlayerZ / distance;

      if (monster.keepDistance > 0 && distance < monster.keepDistance) {
        moveX *= -1;
        moveZ *= -1;
      }

      const shouldMove = monster.keepDistance > 0
        ? distance > monster.keepDistance || distance < monster.keepDistance - 1.8
        : distance > monster.attackRange;

      if (shouldMove) {
        tryMoveMonster(monster, moveX * monster.speed * deltaSeconds, moveZ * monster.speed * deltaSeconds);
      }
    }

    if (monster.attackCooldown > 0 || distance > monster.sightRange) {
      continue;
    }

    if (monster.projectileSpeed > 0) {
      spawnEnemyProjectile(room, monster, targetPlayer.simulation.position);
      monster.attackCooldown = monster.projectileCooldown;
      continue;
    }

    if (distance < monster.attackRange) {
      targetPlayer.simulation.health = Math.max(0, targetPlayer.simulation.health - monster.meleeDamage);
      monster.attackCooldown = MONSTER_MELEE_COOLDOWN_OVERRIDES[monster.type] ?? getMonsterConfig(monster.type).attackCooldown;
    }
  }
}

function spawnPlayerProjectile(
  room: RoomRecord,
  session: SessionRecord,
  aimDirection: Vector3Like,
): void {
  const { simulation } = session;

  room.projectiles.push({
    id: createEntityId(),
    owner: 'player',
    position: {
      x: simulation.position.x + aimDirection.x * 0.85,
      y: simulation.position.y + aimDirection.y * 0.85,
      z: simulation.position.z + aimDirection.z * 0.85,
    },
    previousPosition: {
      x: simulation.position.x,
      y: simulation.position.y,
      z: simulation.position.z,
    },
    velocity: {
      x: aimDirection.x * PLAYER_PROJECTILE_SPEED,
      y: aimDirection.y * PLAYER_PROJECTILE_SPEED,
      z: aimDirection.z * PLAYER_PROJECTILE_SPEED,
    },
    damage: PLAYER_PROJECTILE_DAMAGE,
    radius: PLAYER_PROJECTILE_RADIUS,
    ttl: PLAYER_PROJECTILE_TTL,
    sourceEntityId: session.entityId,
  });
}

function simulateProjectiles(room: RoomRecord, deltaSeconds: number): void {
  for (let index = room.projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = room.projectiles[index];
    projectile.previousPosition.x = projectile.position.x;
    projectile.previousPosition.y = projectile.position.y;
    projectile.previousPosition.z = projectile.position.z;
    projectile.ttl -= deltaSeconds;
    projectile.position.x += projectile.velocity.x * deltaSeconds;
    projectile.position.y += projectile.velocity.y * deltaSeconds;
    projectile.position.z += projectile.velocity.z * deltaSeconds;

    if (projectile.owner === 'player') {
      const hitMonster = room.monsters.find((monster) => monster.alive && hitsCircle(projectile, monster.position.x, monster.position.z, monster.radius));
      if (hitMonster) {
        hitMonster.health = Math.max(0, hitMonster.health - projectile.damage);
        if (hitMonster.health <= 0) {
          hitMonster.alive = false;
          const owner = findPlayerByEntityId(room, projectile.sourceEntityId);
          if (owner) {
            owner.simulation.kills += 1;
          }
        }

        room.projectiles.splice(index, 1);
        continue;
      }
    }

    if (projectile.owner === 'enemy') {
      const hitPlayer = room.sessionOrder
        .map((token) => room.sessions.get(token))
        .filter((session): session is SessionRecord => session !== undefined && session.connected && session.simulation.health > 0)
        .find((session) => hitsCircle(projectile, session.simulation.position.x, session.simulation.position.z, 0.45));

      if (hitPlayer) {
        hitPlayer.simulation.health = Math.max(0, hitPlayer.simulation.health - projectile.damage);
        room.projectiles.splice(index, 1);
        continue;
      }
    }

    if (projectile.ttl <= 0 || projectileHitArena(projectile)) {
      room.projectiles.splice(index, 1);
    }
  }
}

function simulatePickups(room: RoomRecord, deltaSeconds: number): void {
  if (!room.sessionState.active || room.sessionState.gameOver) {
    room.sessionState.pickupRespawnTimer = 0;
    return;
  }

  for (const session of room.sessions.values()) {
    if (!session.connected || session.simulation.health <= 0) {
      continue;
    }

    for (const pickup of room.pickups) {
      if (!pickup.active || !pickupHitsPlayer(pickup, session.simulation.position)) {
        continue;
      }

      applyPickupToPlayer(pickup, session.simulation);
      pickup.active = false;
    }
  }

  if (room.pickups.every((pickup) => !pickup.active)) {
    if (room.sessionState.pickupRespawnTimer <= 0) {
      room.sessionState.pickupRespawnTimer = PICKUP_RESPAWN_DELAY;
    } else {
      room.sessionState.pickupRespawnTimer = Math.max(0, room.sessionState.pickupRespawnTimer - deltaSeconds);
      if (room.sessionState.pickupRespawnTimer === 0) {
        for (const pickup of room.pickups) {
          pickup.active = true;
        }
      }
    }

    return;
  }

  room.sessionState.pickupRespawnTimer = 0;
}

function updateWaveState(room: RoomRecord, deltaSeconds: number): void {
  const connectedSessions = Array.from(room.sessions.values()).filter((session) => session.connected);
  room.sessionState.gameOver = connectedSessions.length > 0 && connectedSessions.some((session) => session.simulation.health <= 0);

  if (room.sessionState.gameOver) {
    room.sessionState.active = false;
    room.runRequested = false;
  } else if (room.runRequested && room.sessions.size > 0) {
    startRun(room);
  }

  if (!room.sessionState.active || room.sessionState.gameOver) {
    room.sessionState.levelComplete = false;
    room.sessionState.levelCompleteTimer = 0;
    room.sessionState.enemyRespawnTimer = 0;
    return;
  }

  if (room.sessionState.wave === 0 && room.monsters.length === 0 && room.monsterQueue.length === 0) {
    startWave(room, 0);
  }

  room.monsters = room.monsters.filter((monster) => monster.alive);

  if (room.monsterQueue.length > 0 && room.monsters.length < 3 + room.sessionState.wave) {
    room.sessionState.enemyRespawnTimer -= deltaSeconds;
    if (room.sessionState.enemyRespawnTimer <= 0) {
      spawnNextQueuedMonster(room);
      room.sessionState.enemyRespawnTimer = room.monsterQueue.length > 0 ? ENEMY_RESPAWN_DELAY : 0;
    }
  } else if (room.monsters.length === 0 && room.monsterQueue.length === 0) {
    if (!room.sessionState.levelComplete) {
      room.sessionState.levelComplete = true;
      room.sessionState.levelCompleteTimer = WAVE_CLEAR_DELAY;
    }

    room.sessionState.levelCompleteTimer -= deltaSeconds;
    if (room.sessionState.levelCompleteTimer <= 0) {
      if (room.sessionState.wave >= COMPLETED_WAVES_TO_WIN - 1) {
        room.sessionState.active = false;
        room.sessionState.levelComplete = true;
        room.sessionState.levelCompleteTimer = 0;
        room.runRequested = false;
        return;
      }

      startWave(room, room.sessionState.wave + 1);
    }
  } else {
    room.sessionState.levelComplete = false;
    room.sessionState.levelCompleteTimer = 0;
  }
}

function startRun(room: RoomRecord): void {
  room.runRequested = false;
  room.sessionState.active = true;
  room.sessionState.gameOver = false;
  room.sessionState.wave = 0;
  room.sessionState.enemyRespawnTimer = 0;
  room.sessionState.levelComplete = false;
  room.sessionState.levelCompleteTimer = 0;
  room.sessionState.pickupRespawnTimer = 0;
  room.monsters = [];
  room.monsterQueue = [];
  room.projectiles = [];
  room.pickups = createInitialPickups();

  let spawnIndex = 0;
  for (const session of room.sessions.values()) {
    session.input = createDefaultInputState();
    session.simulation = createInitialPlayerSimulation(spawnIndex);
    spawnIndex += 1;
  }

  startWave(room, 0);
}

function startWave(room: RoomRecord, wave: number): void {
  room.sessionState.wave = wave;
  room.sessionState.levelComplete = false;
  room.sessionState.levelCompleteTimer = 0;
  room.sessionState.enemyRespawnTimer = 0;
  room.monsters = [];
  room.monsterQueue = createMonsterKindsForWave(wave);

  const initialCount = Math.min(room.monsterQueue.length, INITIAL_ENEMY_SPAWN_POINTS.length);
  for (let index = 0; index < initialCount; index += 1) {
    const kind = room.monsterQueue.shift();
    if (!kind) {
      break;
    }

    room.monsters.push(createMonsterSimulation(kind, INITIAL_ENEMY_SPAWN_POINTS[index]));
  }
}

function spawnNextQueuedMonster(room: RoomRecord): void {
  const kind = room.monsterQueue.shift();
  if (!kind) {
    return;
  }

  const spawn = ENEMY_RESPAWN_SPAWN_POINTS[Math.floor(Math.random() * ENEMY_RESPAWN_SPAWN_POINTS.length)];
  room.monsters.push(createMonsterSimulation(kind, spawn));
}

function spawnEnemyProjectile(
  room: RoomRecord,
  monster: MonsterSimulationState,
  targetPosition: Vector3Like,
): void {
  const direction = {
    x: targetPosition.x - monster.position.x,
    y: targetPosition.y - (monster.position.y + 1),
    z: targetPosition.z - monster.position.z,
  };
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;

  room.projectiles.push({
    id: createEntityId(),
    owner: 'enemy',
    position: {
      x: monster.position.x + (direction.x / length) * 0.85,
      y: monster.position.y + 1 + (direction.y / length) * 0.85,
      z: monster.position.z + (direction.z / length) * 0.85,
    },
    previousPosition: { x: monster.position.x, y: monster.position.y + 1, z: monster.position.z },
    velocity: {
      x: (direction.x / length) * monster.projectileSpeed,
      y: (direction.y / length) * monster.projectileSpeed,
      z: (direction.z / length) * monster.projectileSpeed,
    },
    damage: 12,
    radius: monster.projectileRadius,
    ttl: monster.projectileTtl,
    sourceEntityId: monster.id,
  });
}

function applyPickupToPlayer(pickup: PickupSimulationState, simulation: PlayerSimulationState): void {
  if (pickup.type === 'health') {
    simulation.health = Math.min(PLAYER_MAX_HEALTH, simulation.health + 25);
    return;
  }

  simulation.weapon = 'shotgun';
  simulation.shotgunCharges = SHOTGUN_PICKUP_CHARGES;
}

function getClosestConnectedPlayer(
  room: RoomRecord,
  fromPosition: { x: number; z: number },
): SessionRecord | null {
  let closest: SessionRecord | null = null;
  let closestDistanceSq = Number.POSITIVE_INFINITY;

  for (const session of room.sessions.values()) {
    if (!session.connected || session.simulation.health <= 0) {
      continue;
    }

    const deltaX = session.simulation.position.x - fromPosition.x;
    const deltaZ = session.simulation.position.z - fromPosition.z;
    const distanceSq = deltaX * deltaX + deltaZ * deltaZ;
    if (distanceSq < closestDistanceSq) {
      closest = session;
      closestDistanceSq = distanceSq;
    }
  }

  return closest;
}

function tryMoveMonster(monster: MonsterSimulationState, deltaX: number, deltaZ: number): void {
  tryMovePosition(monster.position, monster.radius, deltaX, deltaZ);
}

function findPlayerByEntityId(room: RoomRecord, entityId: EntityId | undefined): SessionRecord | null {
  if (!entityId) {
    return null;
  }

  for (const session of room.sessions.values()) {
    if (session.entityId === entityId) {
      return session;
    }
  }

  return null;
}

function tryMove(simulation: PlayerSimulationState, deltaX: number, deltaZ: number): void {
  tryMovePosition(simulation.position, 0.45, deltaX, deltaZ);
}
