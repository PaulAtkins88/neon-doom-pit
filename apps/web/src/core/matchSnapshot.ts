import type { EntityId, MatchId, MatchSnapshot, MonsterSnapshot, PickupSnapshot, PlayerId, PlayerSnapshot, ProjectileSnapshot, RoomCode, SessionSnapshot, Vector3Like } from '@neon/shared';
import { createMatchId, createPlayerId } from '@neon/shared';
import type { SessionState } from './GameState';
import type { Player } from '../entities/Player';
import type { Pickup } from '../entities/Pickup';
import type { Projectile } from '../entities/Projectile';
import type { Monster } from '../entities/monsters/Monster';

export interface PlayerHudState {
  health: number;
  ammo: number;
  kills: number;
}

export interface LocalMatchSnapshotSource {
  session: SessionState;
  player: Player;
  monsters: Monster[];
  projectiles: Projectile[];
  pickups: Pickup[];
  tick: number;
  matchId: MatchId;
  roomCode?: RoomCode | null;
  playerId: PlayerId;
}

function toVector3Like(position: { x: number; y: number; z: number }): Vector3Like {
  return {
    x: position.x,
    y: position.y,
    z: position.z,
  };
}

function createPlayerSnapshot(player: Player, playerId: PlayerId): PlayerSnapshot {
  return {
    id: playerId,
    entityId: player.id as EntityId,
    position: toVector3Like(player.object.position),
    yaw: player.object.rotation.y,
    health: player.health,
    ammo: player.ammo,
    weapon: player.weapon,
    shotgunCharges: player.shotgunCharges,
    kills: player.kills,
    reloadTimer: player.reloadTimer,
    fireCooldown: player.fireCooldown,
  };
}

function createMonsterSnapshot(monster: Monster): MonsterSnapshot {
  return {
    id: monster.id as EntityId,
    type: monster.type,
    position: toVector3Like(monster.object3D.position),
    health: monster.health,
    alive: monster.alive,
  };
}

function createProjectileSnapshot(projectile: Projectile): ProjectileSnapshot {
  return {
    id: projectile.id as EntityId,
    owner: projectile.owner,
    position: toVector3Like(projectile.object3D.position),
    velocity: toVector3Like(projectile.velocity),
    damage: projectile.damage,
    radius: projectile.radius,
  };
}

function createPickupSnapshot(pickup: Pickup): PickupSnapshot {
  return {
    id: pickup.id as EntityId,
    type: pickup.type,
    position: toVector3Like(pickup.object3D.position),
    active: pickup.alive,
  };
}

export function createPlayerHudState(player: Player): PlayerHudState {
  return {
    health: player.health,
    ammo: player.ammo,
    kills: player.kills,
  };
}

export function createSessionSnapshot(session: SessionState): SessionSnapshot {
  return {
    active: session.active,
    gameOver: session.gameOver,
    wave: session.wave,
    enemyRespawnTimer: session.enemyRespawnTimer,
    levelComplete: session.levelComplete,
    levelCompleteTimer: session.levelCompleteTimer,
    pickupRespawnTimer: session.pickupRespawnTimer,
  };
}

export function createLocalMatchSnapshot(source: LocalMatchSnapshotSource): MatchSnapshot {
  return {
    matchId: source.matchId,
    roomCode: source.roomCode ?? null,
    tick: source.tick,
    session: createSessionSnapshot(source.session),
    players: [createPlayerSnapshot(source.player, source.playerId)],
    monsters: source.monsters.map((monster) => createMonsterSnapshot(monster)),
    projectiles: source.projectiles.map((projectile) => createProjectileSnapshot(projectile)),
    pickups: source.pickups.map((pickup) => createPickupSnapshot(pickup)),
  };
}

export function createLocalMatchIdentity(): { matchId: MatchId; playerId: PlayerId } {
  return {
    matchId: createMatchId(),
    playerId: createPlayerId(),
  };
}
