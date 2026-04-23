import * as THREE from 'three';
import { MONSTER_CONFIGS } from '../../config/monsterConfigs';
import type { MonsterAttackContext } from './Monster';
import { Monster } from './Monster';

/** Basic melee enemy that closes distance and swipes at close range. */
export class GruntMonster extends Monster {
  /** Creates a grunt at the provided spawn position. */
  constructor(position: THREE.Vector3) {
    super('grunt', MONSTER_CONFIGS.grunt, position);
  }

  /** Applies the grunt's close-range melee attack cadence. */
  protected override updateAttack(distance: number, playerPosition: THREE.Vector3, attackContext: MonsterAttackContext): void {
    void playerPosition;
    if (distance < this.config.attackRange && this.attackCooldown <= 0) {
      attackContext.damagePlayer(this.config.meleeDamage, this.config.eyeMessage);
      this.attackCooldown = 1.1;
    }
  }
}
