import * as THREE from 'three';
import { MONSTER_CONFIGS } from '../../config/monsterConfigs';
import type { MonsterAttackContext } from './Monster';
import { Monster } from './Monster';

/** Fast melee enemy that surges toward the player before impact. */
export class ChargerMonster extends Monster {
  /** Creates a charger at the provided spawn position. */
  constructor(position: THREE.Vector3) {
    super('charger', MONSTER_CONFIGS.charger, position);
  }

  /** Boosts movement speed while the charger is still closing the gap. */
  protected override resolveMovementSpeed(distance: number): number {
    return distance > this.config.attackRange ? this.speed * 1.15 : this.speed;
  }

  /** Applies the charger's harder-hitting melee attack. */
  protected override updateAttack(distance: number, playerPosition: THREE.Vector3, attackContext: MonsterAttackContext): void {
    void playerPosition;
    if (distance < this.config.attackRange && this.attackCooldown <= 0) {
      attackContext.damagePlayer(this.config.meleeDamage, this.config.eyeMessage);
      this.attackCooldown = 0.65;
    }
  }
}
