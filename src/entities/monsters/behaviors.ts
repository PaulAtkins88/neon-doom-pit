import * as THREE from 'three';
import type { Collider } from '../../core/contracts';
import { circleIntersectsCollider } from '../../utils/math';

/**
 * Attempts to move a monster while respecting arena colliders.
 * Returning `null` keeps the caller logic simple for blocked movement.
 */
export function tryMoveWithColliders(
  currentPosition: THREE.Vector3,
  direction: THREE.Vector3,
  speed: number,
  deltaSeconds: number,
  radius: number,
  colliders: Collider[],
): THREE.Vector3 | null {
  const proposed = currentPosition.clone().addScaledVector(direction, speed * deltaSeconds);
  const blocked = colliders.some((collider) => circleIntersectsCollider(proposed.x, proposed.z, radius, collider));
  return blocked ? null : proposed;
}

/** Briefly overdrives the eye emissive to communicate a hit reaction. */
export function pulseEye(eye: THREE.Mesh, aliveCheck: () => boolean, baseIntensity: number, intensity: number): void {
  const material = eye.material as THREE.MeshStandardMaterial;
  material.emissiveIntensity = intensity;

  window.setTimeout(() => {
    if (aliveCheck()) {
      material.emissiveIntensity = baseIntensity;
    }
  }, 80);
}
