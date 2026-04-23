import type { MonsterKind } from '../config/monsterConfigs';
import { COMPLETED_WAVES_TO_WIN, ENEMY_RESPAWN_DELAY, WAVE_CLEAR_DELAY } from '../config/gameConfig';
import type { SessionState } from '../core/GameState';
import { createMonster } from '../entities/monsters/MonsterFactory';
import type { Monster } from '../entities/monsters/Monster';
import type { GameWorld } from '../world/GameWorld';

/** Builds wave compositions and handles respawn/victory transitions. */
export class WaveSystem {
  /** Creates a wave system backed by immutable world spawn data. */
  constructor(private readonly world: GameWorld) {}

  /** Builds the monster list for a given wave number. */
  buildWave(wave: number): MonsterKind[] {
    const types: MonsterKind[] = [];
    const gruntCount = 2 + wave;
    const chargerCount = Math.min(1 + Math.floor(wave / 2), 3);
    const impCount = Math.max(1, Math.floor((wave + 1) / 2));
    const spitterCount = Math.max(0, wave - 1);

    for (let index = 0; index < gruntCount; index += 1) {
      types.push('grunt');
    }

    for (let index = 0; index < chargerCount; index += 1) {
      types.push('charger');
    }

    for (let index = 0; index < impCount; index += 1) {
      types.push('imp');
    }

    for (let index = 0; index < spitterCount; index += 1) {
      types.push('spitter');
    }

    return types;
  }

  /** Starts a wave and returns the initial monster instances to add to the scene. */
  startWave(wave: number, state: SessionState): Monster[] {
    state.wave = wave;
    state.enemyRespawnTimer = 0;
    state.levelComplete = false;
    state.levelCompleteTimer = 0;

    return this.buildWave(wave).map((kind, index) => createMonster(kind, this.world.initialSpawnPoints[index % this.world.initialSpawnPoints.length].clone()));
  }

  /** Handles drip-feed respawns while a wave is still active. */
  updateRespawn(deltaSeconds: number, state: SessionState, monsters: Monster[]): Monster[] {
    if (monsters.length >= 3 + state.wave || state.levelComplete) {
      return [];
    }

    state.enemyRespawnTimer -= deltaSeconds;
    if (state.enemyRespawnTimer > 0) {
      return [];
    }

    state.enemyRespawnTimer = ENEMY_RESPAWN_DELAY;
    const types: MonsterKind[] = ['grunt', 'grunt', 'charger', 'imp', 'spitter'];
    const kind = types[Math.floor(Math.random() * types.length)];
    return [createMonster(kind, this.world.getRandomArenaSpawn())];
  }

  /** Advances the wave-clear timer and reports the next high-level transition. */
  updateWaveCompletion(deltaSeconds: number, state: SessionState, monsters: Monster[]): 'continue' | 'start-next' | 'victory' {
    if (monsters.length > 0) {
      return 'continue';
    }

    if (!state.levelComplete) {
      state.levelComplete = true;
      state.levelCompleteTimer = WAVE_CLEAR_DELAY;
    }

    state.levelCompleteTimer -= deltaSeconds;
    if (state.levelCompleteTimer > 0) {
      return 'continue';
    }

    if (state.wave >= COMPLETED_WAVES_TO_WIN - 1) {
      return 'victory';
    }

    return 'start-next';
  }
}
