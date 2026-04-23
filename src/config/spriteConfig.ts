import type { MonsterKind } from './monsterConfigs';
import type { PickupType } from '../entities/Pickup';
import type { ProjectileOwner } from '../entities/Projectile';

interface BillboardSpriteConfig {
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly alphaTest?: number;
  readonly depthWrite?: boolean;
  readonly color?: number;
  readonly additive?: boolean;
  readonly emissive?: number;
  readonly emissiveIntensity?: number;
}

interface MonsterSpriteConfig extends BillboardSpriteConfig {
  readonly eyeOffset: [number, number, number];
}

export const PICKUP_SPRITES: Record<PickupType, BillboardSpriteConfig> = {
  health: {
    path: 'sprites/pickups/health.png',
    width: 1.0,
    height: 1.0,
    alphaTest: 0.4,
    depthWrite: false,
  },
  shotgun: {
    path: 'sprites/pickups/shotgun.png',
    width: 1.0,
    height: 1.0,
    alphaTest: 0.4,
    depthWrite: false,
  },
};

export const MONSTER_SPRITES: Record<MonsterKind, MonsterSpriteConfig> = {
  grunt: {
    path: 'sprites/monsters/grunt.png',
    width: 1.55,
    height: 1.8,
    alphaTest: 0.32,
    depthWrite: false,
    eyeOffset: [0, 1.05, 0.06],
  },
  spitter: {
    path: 'sprites/monsters/spitter.png',
    width: 1.65,
    height: 1.85,
    alphaTest: 0.32,
    depthWrite: false,
    eyeOffset: [0, 1.08, 0.06],
  },
  charger: {
    path: 'sprites/monsters/charger.png',
    width: 1.8,
    height: 2.05,
    alphaTest: 0.32,
    depthWrite: false,
    eyeOffset: [0, 1.14, 0.06],
  },
  imp: {
    path: 'sprites/monsters/imp.png',
    width: 1.45,
    height: 1.7,
    alphaTest: 0.32,
    depthWrite: false,
    eyeOffset: [0, 1.0, 0.06],
  },
};

export const PROP_SPRITES = {
  debrisBrown: {
    path: 'sprites/props/debris-brown.png',
    width: 1.7,
    height: 1.35,
    alphaTest: 0.28,
    depthWrite: false,
  },
  debrisGrey: {
    path: 'sprites/props/debris-grey.png',
    width: 1.55,
    height: 1.25,
    alphaTest: 0.28,
    depthWrite: false,
  },
} as const;

export const PROJECTILE_SPRITES: Record<ProjectileOwner, BillboardSpriteConfig> = {
  player: {
    path: 'sprites/projectiles/bolt.png',
    width: 0.55,
    height: 0.55,
    additive: true,
    color: 0xffcf6b,
    alphaTest: 0.08,
    depthWrite: false,
    emissive: 0xffb347,
    emissiveIntensity: 0.7,
  },
  enemy: {
    path: 'sprites/projectiles/bolt.png',
    width: 0.58,
    height: 0.58,
    additive: true,
    color: 0xc85cff,
    alphaTest: 0.08,
    depthWrite: false,
    emissive: 0xc85cff,
    emissiveIntensity: 0.75,
  },
};
