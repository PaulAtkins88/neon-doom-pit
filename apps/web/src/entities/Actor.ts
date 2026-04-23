import type * as THREE from 'three';
import type { Damageable } from '../core/contracts';
import { GameObject } from './GameObject';

/** Shared base for living entities that have health and a collision radius. */
export abstract class Actor extends GameObject implements Damageable {
  readonly radius: number;
  health: number;

  /** Creates a damageable entity around a three.js object. */
  protected constructor(object3D: THREE.Object3D, radius: number, health: number) {
    super(object3D);
    this.radius = radius;
    this.health = health;
  }

  /** Applies damage and returns true when the actor should die. */
  takeDamage(amount: number): boolean {
    this.health -= amount;
    return this.health <= 0;
  }
}
