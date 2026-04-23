export interface Disposable {
  dispose(): void;
}

export interface Damageable {
  health: number;
  takeDamage(amount: number): boolean;
}

export type { Collider, ArenaBounds, WallDefinition } from '@neon/shared';
