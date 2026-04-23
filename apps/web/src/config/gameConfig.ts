import * as THREE from 'three';
import { ARENA_BOUNDS, LEVEL_WALLS, type ArenaBounds, type WallDefinition } from '@neon/shared';

export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_AMMO = 24;
export const PLAYER_RADIUS = 0.45;
export const PLAYER_SPEED = 5.6;
export const PLAYER_SPRINT_SPEED = 8.5;
export const PLAYER_RELOAD_DURATION = 1.8;
export const PLAYER_FIRE_COOLDOWN = 0.14;
export const PLAYER_EMPTY_FIRE_COOLDOWN = 0.25;
export const PLAYER_PROJECTILE_SPEED = 15.5;
export const PLAYER_PROJECTILE_RADIUS = 0.09;
export const PLAYER_PROJECTILE_TTL = 1.8;
export const PLAYER_PROJECTILE_DAMAGE = 1;
export const PLAYER_PROJECTILE_HIT_PADDING = 0.14;
export const PLAYER_SHOTGUN_PELLETS = 5;
export const PLAYER_SHOTGUN_SPREAD = 0.14;
export const SHOTGUN_PICKUP_CHARGES = 8;
export const PICKUP_RESPAWN_DELAY = 18;
export const PICKUP_RADIUS = 0.6;
export const PLAYER_SPAWN_POSITION = new THREE.Vector3(0, 1.7, 6.5);

export const CAMERA_START_POSITION = new THREE.Vector3(0, 1.7, 11);

export { ARENA_BOUNDS, LEVEL_WALLS };

export const INITIAL_ENEMY_SPAWN_POINTS = [
  new THREE.Vector3(-13, 0, 7),
  new THREE.Vector3(13, 0, 6),
  new THREE.Vector3(-15, 0, -4),
  new THREE.Vector3(15, 0, -5),
  new THREE.Vector3(0, 0, -16),
];

export const ENEMY_RESPAWN_SPAWN_POINTS = [
  new THREE.Vector3(-13, 0, -24),
  new THREE.Vector3(13, 0, -25),
  new THREE.Vector3(0, 0, -19),
  new THREE.Vector3(-11, 0, -9),
  new THREE.Vector3(11, 0, -11),
];

export const PICKUP_SPAWN_POINTS = [
  new THREE.Vector3(-14, 0, -8),
  new THREE.Vector3(14, 0, -14),
];

export const COMPLETED_WAVES_TO_WIN = 3;
export const WAVE_CLEAR_DELAY = 1.8;
export const ENEMY_RESPAWN_DELAY = 3.4;
export const ENEMY_KILL_RESPAWN_DELAY = 2.4;
