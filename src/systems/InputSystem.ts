type KeyCode = 'KeyW' | 'KeyA' | 'KeyS' | 'KeyD' | 'ShiftLeft' | 'ShiftRight';

const TRACKED_KEYS: KeyCode[] = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'];

/** Tracks keyboard and mouse input relevant to the prototype. */
export class InputSystem {
  readonly keys: Record<KeyCode, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ShiftLeft: false,
    ShiftRight: false,
  };

  /** Registers the runtime input listeners for reloads, movement keys, and firing. */
  bind(onReload: () => void, onMouseDown: () => void): void {
    window.addEventListener('keydown', (event) => {
      if (this.isTrackedKey(event.code)) {
        this.keys[event.code] = true;
      }

      if (event.code === 'KeyR') {
        onReload();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.isTrackedKey(event.code)) {
        this.keys[event.code] = false;
      }
    });

    window.addEventListener('mousedown', onMouseDown);
  }

  /** Narrows arbitrary keyboard event codes to the tracked control set. */
  private isTrackedKey(code: string): code is KeyCode {
    return TRACKED_KEYS.includes(code as KeyCode);
  }
}
