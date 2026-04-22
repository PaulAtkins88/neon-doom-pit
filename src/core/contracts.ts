export interface Disposable {
  dispose(): void;
}

export interface Damageable {
  health: number;
  takeDamage(amount: number): boolean;
}

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WallDefinition {
  x: number;
  z: number;
  w: number;
  d: number;
}
