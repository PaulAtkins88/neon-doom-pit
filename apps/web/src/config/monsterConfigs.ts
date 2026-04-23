import type { MonsterKind } from '@neon/shared';

interface MonsterVisualConfig {
  bodySize: [number, number, number];
  legSize: [number, number, number];
  bodyColor: number;
  bodyEmissive: number;
  eyeColor: number;
  eyeEmissive: number;
  auraColor: number;
}

interface MonsterCombatConfig {
  attackCooldown: number;
  attackRange: number;
  sightRange: number;
  keepDistance: number;
  meleeDamage: number;
  projectileSpeed: number;
  projectileCooldown: number;
  projectileRadius: number;
  projectileTtl: number;
}

export interface MonsterConfig extends MonsterVisualConfig, MonsterCombatConfig {
  health: number;
  radius: number;
  speed: number;
  speedJitter: number;
  eyeMessage: string;
  hitMessage: string;
}

export const MONSTER_CONFIGS: Record<MonsterKind, MonsterConfig> = {
  grunt: {
    health: 3,
    radius: 0.6,
    speed: 1.65,
    speedJitter: 0.65,
    attackCooldown: 0.8,
    attackRange: 2.1,
    sightRange: 12,
    keepDistance: 0,
    meleeDamage: 9,
    projectileSpeed: 0,
    projectileCooldown: 0,
    projectileRadius: 0.09,
    projectileTtl: 0,
    bodySize: [0.95, 1.2, 0.7],
    legSize: [0.74, 0.6, 0.55],
    bodyColor: 0x7a2316,
    bodyEmissive: 0x2b0400,
    eyeColor: 0xffd36f,
    eyeEmissive: 0xff7a2f,
    auraColor: 0xff7a2f,
    eyeMessage: 'The horde claws into you.',
    hitMessage: 'Target shredded. Keep moving.',
  },
  spitter: {
    health: 2,
    radius: 0.58,
    speed: 1.4,
    speedJitter: 0.2,
    attackCooldown: 1.1,
    attackRange: 9.5,
    sightRange: 18,
    keepDistance: 8.2,
    meleeDamage: 0,
    projectileSpeed: 7.2,
    projectileCooldown: 1.25,
    projectileRadius: 0.1,
    projectileTtl: 2.2,
    bodySize: [1.0, 1.0, 1.0],
    legSize: [0.68, 0.52, 0.48],
    bodyColor: 0x2e6f6a,
    bodyEmissive: 0x08211d,
    eyeColor: 0x9bffea,
    eyeEmissive: 0x23f0c6,
    auraColor: 0x23f0c6,
    eyeMessage: 'A toxic bolt burns through you.',
    hitMessage: 'The spitter collapses.',
  },
  charger: {
    health: 2,
    radius: 0.58,
    speed: 3.35,
    speedJitter: 0.2,
    attackCooldown: 0.65,
    attackRange: 1.6,
    sightRange: 18,
    keepDistance: 0,
    meleeDamage: 16,
    projectileSpeed: 0,
    projectileCooldown: 0,
    projectileRadius: 0.09,
    projectileTtl: 0,
    bodySize: [1.1, 1.0, 0.72],
    legSize: [0.82, 0.48, 0.56],
    bodyColor: 0x86221e,
    bodyEmissive: 0x2f0500,
    eyeColor: 0xff8d4a,
    eyeEmissive: 0xff4d1f,
    auraColor: 0xff4d1f,
    eyeMessage: 'The charger slams into you.',
    hitMessage: 'The charger breaks apart.',
  },
  imp: {
    health: 2,
    radius: 0.52,
    speed: 2.1,
    speedJitter: 0.45,
    attackCooldown: 0.9,
    attackRange: 1.8,
    sightRange: 16,
    keepDistance: 0,
    meleeDamage: 0,
    projectileSpeed: 9.4,
    projectileCooldown: 1.0,
    projectileRadius: 0.08,
    projectileTtl: 2.2,
    bodySize: [0.82, 1.0, 0.82],
    legSize: [0.5, 0.52, 0.48],
    bodyColor: 0x7a4a1c,
    bodyEmissive: 0x2e1200,
    eyeColor: 0xffcf8a,
    eyeEmissive: 0xff8a26,
    auraColor: 0xff8a26,
    eyeMessage: 'A firebolt slams into your armor.',
    hitMessage: 'The imp fractures.',
  },
};
