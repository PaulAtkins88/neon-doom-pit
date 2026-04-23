import * as THREE from 'three';
import { ARENA_BOUNDS, createArenaColliders } from '@neon/shared';
import { ENEMY_RESPAWN_SPAWN_POINTS, INITIAL_ENEMY_SPAWN_POINTS } from '../config/gameConfig';
import type { ArenaBounds, Collider } from '../core/contracts';
import { buildArena } from './ArenaFactory';

export class GameWorld {
  readonly scene: THREE.Scene;
  readonly colliders: Collider[];
  readonly arenaBounds: ArenaBounds;
  readonly initialSpawnPoints = INITIAL_ENEMY_SPAWN_POINTS;
  readonly respawnSpawnPoints = ENEMY_RESPAWN_SPAWN_POINTS;

  /**
   * Creates the three.js scene and builds the static arena geometry.
   * The world owns immutable map context such as bounds, colliders, and spawn points.
   */
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140d14);
    this.scene.fog = new THREE.Fog(0x140d14, 12, 46);
    this.arenaBounds = ARENA_BOUNDS;

    buildArena(this.scene);
    this.colliders = createArenaColliders();
  }

  /** Returns a random enemy respawn position within the playable arena. */
  getRandomArenaSpawn(): THREE.Vector3 {
    const x = THREE.MathUtils.randFloat(this.arenaBounds.minX + 2, this.arenaBounds.maxX - 2);
    const z = THREE.MathUtils.randFloat(this.arenaBounds.minZ + 2, this.arenaBounds.maxZ - 2);
    const candidates = [
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(THREE.MathUtils.randFloat(-11, 11), 0, THREE.MathUtils.randFloat(-22, 4)),
      new THREE.Vector3(THREE.MathUtils.randFloat(-10, 10), 0, THREE.MathUtils.randFloat(-20, 2)),
      ...this.respawnSpawnPoints.map((spawn) => spawn.clone()),
    ];

    return candidates[Math.floor(Math.random() * candidates.length)].clone();
  }
}
