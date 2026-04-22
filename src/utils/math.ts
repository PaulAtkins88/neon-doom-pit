import type { Collider } from '../core/contracts';

/** Clamps a numeric value to an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Checks a 2D circle against an axis-aligned arena collider.
 * This is used for player and monster wall collision without a full physics engine.
 */
export function circleIntersectsCollider(x: number, z: number, radius: number, collider: Collider): boolean {
  const nearestX = clamp(x, collider.minX, collider.maxX);
  const nearestZ = clamp(z, collider.minZ, collider.maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}
