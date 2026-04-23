import {
  ARENA_BOUNDS,
  circleIntersectsCollider,
  createArenaColliders,
  type Collider,
  type Vector3Like,
} from '@neon/shared';
import { PICKUP_RADIUS, PLAYER_SHOTGUN_SPREAD } from './config';
import type { ProjectileSimulationState } from './types';

export const ARENA_COLLIDERS = createArenaColliders();

export function applyShotgunSpread(direction: Vector3Like): Vector3Like {
  const spread = {
    x: direction.x + (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD,
    y: direction.y + (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD,
    z: direction.z + (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD,
  };
  const length = Math.hypot(spread.x, spread.y, spread.z) || 1;

  return {
    x: spread.x / length,
    y: spread.y / length,
    z: spread.z / length,
  };
}

export function getAimDirection(yaw: number, pitch: number): Vector3Like {
  const cosPitch = Math.cos(pitch);

  return {
    x: -Math.sin(yaw) * cosPitch,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cosPitch,
  };
}

export function normalizePitch(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return clamp(value, -Math.PI / 2, Math.PI / 2);
}

export function normalizeYaw(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function pickupHitsPlayer(
  pickup: { position: Vector3Like },
  playerPosition: Vector3Like,
): boolean {
  const dx = pickup.position.x - playerPosition.x;
  const dy = pickup.position.y - playerPosition.y;
  const dz = pickup.position.z - playerPosition.z;
  const combinedRadius = PICKUP_RADIUS + 0.45;
  return dx * dx + dy * dy + dz * dz <= combinedRadius * combinedRadius;
}

export function tryMovePosition(
  position: { x: number; z: number },
  radius: number,
  deltaX: number,
  deltaZ: number,
): void {
  const nextX = clamp(position.x + deltaX, ARENA_BOUNDS.minX, ARENA_BOUNDS.maxX);
  const nextZ = clamp(position.z + deltaZ, ARENA_BOUNDS.minZ, ARENA_BOUNDS.maxZ);

  const blocked = ARENA_COLLIDERS.some((collider) => circleIntersectsCollider(nextX, nextZ, radius, collider));
  if (blocked) {
    return;
  }

  position.x = nextX;
  position.z = nextZ;
}

export function projectileHitArena(projectile: ProjectileSimulationState): boolean {
  if (projectile.position.x < ARENA_BOUNDS.minX
    || projectile.position.x > ARENA_BOUNDS.maxX
    || projectile.position.z < ARENA_BOUNDS.minZ
    || projectile.position.z > ARENA_BOUNDS.maxZ) {
    return true;
  }

  return ARENA_COLLIDERS.some((collider) => projectileHitsCollider(projectile, collider));
}

export function hitsCircle(
  projectile: ProjectileSimulationState,
  targetX: number,
  targetZ: number,
  targetRadius: number,
): boolean {
  const combinedRadius = projectile.radius + targetRadius;
  const segmentX = projectile.position.x - projectile.previousPosition.x;
  const segmentZ = projectile.position.z - projectile.previousPosition.z;
  const toTargetX = targetX - projectile.previousPosition.x;
  const toTargetZ = targetZ - projectile.previousPosition.z;
  const segmentLengthSq = segmentX * segmentX + segmentZ * segmentZ;

  if (segmentLengthSq === 0) {
    return toTargetX * toTargetX + toTargetZ * toTargetZ <= combinedRadius * combinedRadius;
  }

  const projection = clamp((toTargetX * segmentX + toTargetZ * segmentZ) / segmentLengthSq, 0, 1);
  const closestX = projectile.previousPosition.x + segmentX * projection;
  const closestZ = projectile.previousPosition.z + segmentZ * projection;
  const deltaX = targetX - closestX;
  const deltaZ = targetZ - closestZ;
  return deltaX * deltaX + deltaZ * deltaZ <= combinedRadius * combinedRadius;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function projectileHitsCollider(projectile: ProjectileSimulationState, collider: Collider): boolean {
  const segmentX = projectile.position.x - projectile.previousPosition.x;
  const segmentZ = projectile.position.z - projectile.previousPosition.z;
  const length = Math.hypot(segmentX, segmentZ);
  const steps = Math.max(1, Math.ceil(length / Math.max(projectile.radius, 0.05)));

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const sampleX = projectile.previousPosition.x + segmentX * t;
    const sampleZ = projectile.previousPosition.z + segmentZ * t;

    if (circleIntersectsCollider(sampleX, sampleZ, projectile.radius, collider)) {
      return true;
    }
  }

  return false;
}
