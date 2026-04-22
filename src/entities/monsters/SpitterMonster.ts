import * as THREE from 'three';
import { MONSTER_CONFIGS } from '../../config/monsterConfigs';
import type { MonsterAttackContext } from './Monster';
import { Monster } from './Monster';

/** Ranged enemy that tries to maintain distance while firing toxic shots. */
export class SpitterMonster extends Monster {
  /** Creates a spitter at the provided spawn position. */
  constructor(position: THREE.Vector3) {
    super('spitter', MONSTER_CONFIGS.spitter, position);
  }

  /** Backs away when the player gets inside the preferred ranged band. */
  protected override resolveMovementDirection(toPlayer: THREE.Vector3, distance: number): THREE.Vector3 {
    if (distance < this.config.keepDistance) {
      return toPlayer.negate();
    }

    return toPlayer;
  }

  /** Keeps the spitter orbiting around a preferred engagement distance. */
  protected override shouldApplyMove(distance: number): boolean {
    return distance > this.config.keepDistance || distance < this.config.keepDistance - 1.8;
  }

  /** Fires a projectile when the player is visible and the cooldown has elapsed. */
  protected override updateAttack(distance: number, playerPosition: THREE.Vector3, attackContext: MonsterAttackContext): void {
    if (distance < this.config.sightRange && this.attackCooldown <= 0) {
      attackContext.launchProjectile(this, playerPosition.clone().sub(this.object3D.position).normalize());
      this.attackCooldown = this.config.projectileCooldown;
    }
  }
}
