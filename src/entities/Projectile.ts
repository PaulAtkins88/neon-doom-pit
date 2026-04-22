import * as THREE from 'three';
import type { Collider } from '../core/contracts';
import { GameObject } from './GameObject';

type ProjectileUpdateResult = 'active' | 'hit' | 'expired';
export type ProjectileOwner = 'player' | 'enemy';

/** Projectile entity with simple TTL and collider-based impact checks. */
export class Projectile extends GameObject {
  readonly velocity: THREE.Vector3;
  readonly damage: number;
  readonly owner: ProjectileOwner;
  readonly radius: number;
  readonly hitPadding: number;
  private readonly previousPosition = new THREE.Vector3();
  private ttl: number;

  /** Creates a projectile from a mesh, velocity, lifetime, damage payload, and ownership. */
  constructor(
    mesh: THREE.Object3D,
    velocity: THREE.Vector3,
    ttl: number,
    damage: number,
    owner: ProjectileOwner,
    radius: number,
    hitPadding = 0,
  ) {
    super(mesh);
    this.velocity = velocity;
    this.ttl = ttl;
    this.damage = damage;
    this.owner = owner;
    this.radius = radius;
    this.hitPadding = hitPadding;
    this.previousPosition.copy(this.object3D.position);
  }

  /** Advances the projectile and reports whether it is still active, hit the player, or expired. */
  update(deltaSeconds: number, colliders: Collider[]): ProjectileUpdateResult {
    this.previousPosition.copy(this.object3D.position);
    this.ttl -= deltaSeconds;
    this.object3D.position.addScaledVector(this.velocity, deltaSeconds);

    const hitWall = colliders.some((collider) => {
      const x = this.object3D.position.x;
      const z = this.object3D.position.z;
      return x >= collider.minX && x <= collider.maxX && z >= collider.minZ && z <= collider.maxZ;
    });

    if (this.ttl <= 0 || hitWall) {
      return 'expired';
    }

    return 'active';
  }

  /** Checks whether the projectile swept through a circular target this frame. */
  hitsTarget(targetPosition: THREE.Vector3, targetRadius: number): boolean {
    const combinedRadius = this.radius + targetRadius + this.hitPadding;
    const segment = this.object3D.position.clone().sub(this.previousPosition);
    const toTarget = targetPosition.clone().sub(this.previousPosition);
    const segmentLengthSq = segment.lengthSq();

    if (segmentLengthSq === 0) {
      return toTarget.lengthSq() <= combinedRadius * combinedRadius;
    }

    const projection = THREE.MathUtils.clamp(toTarget.dot(segment) / segmentLengthSq, 0, 1);
    const closestPoint = this.previousPosition.clone().addScaledVector(segment, projection);
    return closestPoint.distanceToSquared(targetPosition) <= combinedRadius * combinedRadius;
  }
}
