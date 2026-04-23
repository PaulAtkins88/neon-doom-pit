import * as THREE from 'three';
import { MONSTER_CONFIGS } from '../../config/monsterConfigs';
import type { MonsterAttackContext } from './Monster';
import { Monster } from './Monster';

/** Agile ranged enemy that shares the ranged spacing pattern with a faster firebolt attack. */
export class ImpMonster extends Monster {
  /** Creates an imp at the provided spawn position. */
  constructor(position: THREE.Vector3) {
    super('imp', MONSTER_CONFIGS.imp, position);
  }

  /** Backs away when the player gets too close. */
  protected override resolveMovementDirection(toPlayer: THREE.Vector3, distance: number): THREE.Vector3 {
    if (distance < this.config.keepDistance) {
      return toPlayer.negate();
    }

    return toPlayer;
  }

  /** Keeps the imp near its preferred ranged spacing. */
  protected override shouldApplyMove(distance: number): boolean {
    return distance > this.config.keepDistance || distance < this.config.keepDistance - 1.8;
  }

  /** Fires an imp projectile at the player. */
  protected override updateAttack(distance: number, playerPosition: THREE.Vector3, attackContext: MonsterAttackContext): void {
    if (distance < this.config.sightRange && this.attackCooldown <= 0) {
      attackContext.launchProjectile(this, playerPosition.clone().sub(this.object3D.position).normalize());
      this.attackCooldown = this.config.projectileCooldown;
    }
  }
}
