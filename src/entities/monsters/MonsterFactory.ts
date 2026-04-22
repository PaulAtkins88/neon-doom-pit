import * as THREE from 'three';
import type { MonsterKind } from '../../config/monsterConfigs';
import { ChargerMonster } from './ChargerMonster';
import { GruntMonster } from './GruntMonster';
import { ImpMonster } from './ImpMonster';
import type { Monster } from './Monster';
import { SpitterMonster } from './SpitterMonster';

/** Creates the correct monster subclass for a typed monster kind. */
export function createMonster(kind: MonsterKind, position: THREE.Vector3): Monster {
  if (kind === 'charger') {
    return new ChargerMonster(position);
  }

  if (kind === 'spitter') {
    return new SpitterMonster(position);
  }

  if (kind === 'imp') {
    return new ImpMonster(position);
  }

  return new GruntMonster(position);
}
