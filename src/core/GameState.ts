/** Mutable run state that drives wave flow, pausing, and win/loss transitions. */
export interface SessionState {
  active: boolean;
  gameOver: boolean;
  wave: number;
  enemyRespawnTimer: number;
  levelComplete: boolean;
  levelCompleteTimer: number;
  pickupRespawnTimer: number;
}

/** Creates a fresh session state for a new run. */
export function createInitialSessionState(): SessionState {
  return {
    active: false,
    gameOver: false,
    wave: 0,
    enemyRespawnTimer: 0,
    levelComplete: false,
    levelCompleteTimer: 0,
    pickupRespawnTimer: 0,
  };
}
