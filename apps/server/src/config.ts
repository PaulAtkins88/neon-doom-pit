import type { MonsterKind, SessionSnapshot } from '@neon/shared';

export const PORT = Number(process.env.PORT ?? 2567);
export const MAX_PLAYERS_PER_ROOM = 2;
export const MATCH_TICK_RATE = 20;
export const MATCH_TICK_MS = 1000 / MATCH_TICK_RATE;
export const MATCH_TICK_SECONDS = MATCH_TICK_MS / 1000;
export const RECONNECT_GRACE_MS = 20_000;
export const ROOM_EXPIRY_TOMBSTONE_MS = 30_000;

export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_AMMO = 24;
export const PLAYER_RELOAD_DURATION = 1.8;
export const PLAYER_FIRE_COOLDOWN = 0.14;
export const PLAYER_EMPTY_FIRE_COOLDOWN = 0.25;
export const PLAYER_SPEED = 5.6;
export const PLAYER_SPRINT_SPEED = 8.5;
export const PLAYER_PROJECTILE_SPEED = 15.5;
export const PLAYER_PROJECTILE_RADIUS = 0.09;
export const PLAYER_PROJECTILE_TTL = 1.8;
export const PLAYER_PROJECTILE_DAMAGE = 1;
export const PLAYER_SHOTGUN_PELLETS = 5;
export const PLAYER_SHOTGUN_SPREAD = 0.14;

export const MONSTER_MELEE_COOLDOWN_OVERRIDES: Partial<Record<MonsterKind, number>> = {
  grunt: 1.1,
  charger: 0.65,
};

export const INITIAL_ENEMY_SPAWN_POINTS = [
  { x: -13, y: 0, z: 7 },
  { x: 13, y: 0, z: 6 },
  { x: -15, y: 0, z: -4 },
  { x: 15, y: 0, z: -5 },
  { x: 0, y: 0, z: -16 },
];

export const ENEMY_RESPAWN_SPAWN_POINTS = [
  { x: -13, y: 0, z: -24 },
  { x: 13, y: 0, z: -25 },
  { x: 0, y: 0, z: -19 },
  { x: -11, y: 0, z: -9 },
  { x: 11, y: 0, z: -11 },
];

export const COMPLETED_WAVES_TO_WIN = 3;
export const WAVE_CLEAR_DELAY = 1.8;
export const ENEMY_RESPAWN_DELAY = 3.4;
export const PICKUP_RESPAWN_DELAY = 18;
export const PICKUP_RADIUS = 0.6;
export const SHOTGUN_PICKUP_CHARGES = 8;

export const PICKUP_SPAWN_POINTS = [
  { x: -14, y: 0.8, z: -8 },
  { x: 14, y: 0.8, z: -14 },
];

export const PLAYER_SPAWN_POSITION = { x: 0, y: 1.7, z: 6.5 };
export const PLAYER_SECOND_SPAWN_OFFSET_X = 2.4;

export const DEFAULT_SESSION: SessionSnapshot = {
  active: false,
  gameOver: false,
  wave: 0,
  enemyRespawnTimer: 0,
  levelComplete: false,
  levelCompleteTimer: 0,
  pickupRespawnTimer: 0,
};

export interface MonsterConfig {
  health: number;
  radius: number;
  speed: number;
  sightRange: number;
  attackRange: number;
  keepDistance: number;
  meleeDamage: number;
  projectileSpeed: number;
  projectileCooldown: number;
  projectileRadius: number;
  projectileTtl: number;
  attackCooldown: number;
}

export function createMonsterKindsForWave(wave: number): MonsterKind[] {
  const types: MonsterKind[] = [];
  const gruntCount = 2 + wave;
  const chargerCount = Math.min(1 + Math.floor(wave / 2), 3);
  const impCount = Math.max(1, Math.floor((wave + 1) / 2));
  const spitterCount = Math.max(0, wave - 1);

  for (let index = 0; index < gruntCount; index += 1) {
    types.push('grunt');
  }

  for (let index = 0; index < chargerCount; index += 1) {
    types.push('charger');
  }

  for (let index = 0; index < impCount; index += 1) {
    types.push('imp');
  }

  for (let index = 0; index < spitterCount; index += 1) {
    types.push('spitter');
  }

  return types;
}

export function getMonsterConfig(kind: MonsterKind): MonsterConfig {
  if (kind === 'grunt') {
    return { health: 3, radius: 0.6, speed: 1.65, sightRange: 12, attackRange: 2.1, keepDistance: 0, meleeDamage: 9, projectileSpeed: 0, projectileCooldown: 0, projectileRadius: 0.09, projectileTtl: 0, attackCooldown: 0.8 };
  }

  if (kind === 'charger') {
    return { health: 2, radius: 0.58, speed: 3.35 * 1.15, sightRange: 18, attackRange: 1.6, keepDistance: 0, meleeDamage: 16, projectileSpeed: 0, projectileCooldown: 0, projectileRadius: 0.09, projectileTtl: 0, attackCooldown: 0.65 };
  }

  if (kind === 'imp') {
    return { health: 2, radius: 0.52, speed: 2.1, sightRange: 16, attackRange: 1.8, keepDistance: 0, meleeDamage: 0, projectileSpeed: 9.4, projectileCooldown: 1, projectileRadius: 0.08, projectileTtl: 2.2, attackCooldown: 0.9 };
  }

  return { health: 2, radius: 0.58, speed: 1.4, sightRange: 18, attackRange: 9.5, keepDistance: 8.2, meleeDamage: 0, projectileSpeed: 7.2, projectileCooldown: 1.25, projectileRadius: 0.1, projectileTtl: 2.2, attackCooldown: 1.1 };
}
