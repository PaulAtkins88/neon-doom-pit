import { PLAYER_MAX_AMMO } from '../config/gameConfig';

export interface HudStats {
  health: number;
  ammo: number;
  kills: number;
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

/** Owns all DOM-facing HUD and overlay interactions. */
export class HudSystem {
  private readonly overlay = getRequiredElement<HTMLElement>('#overlay');
  private readonly startButton = getRequiredElement<HTMLButtonElement>('#startButton');
  private readonly tip = getRequiredElement<HTMLElement>('#tip');
  private readonly health = getRequiredElement<HTMLElement>('#health');
  private readonly ammo = getRequiredElement<HTMLElement>('#ammo');
  private readonly kills = getRequiredElement<HTMLElement>('#kills');
  private readonly damageFlash = getRequiredElement<HTMLElement>('#damageFlash');
  private readonly muzzleFlash = getRequiredElement<HTMLElement>('#muzzleFlash');

  /** The overlay button used to start or restart a run. */
  get startActionButton(): HTMLButtonElement {
    return this.startButton;
  }

  /** Updates the lower-center instruction text. */
  setTip(text: string): void {
    this.tip.textContent = text;
  }

  /** Syncs the HUD stat cards to the current player values. */
  updateHud(stats: HudStats): void {
    this.health.textContent = String(Math.max(0, Math.ceil(stats.health)));
    this.ammo.textContent = String(stats.ammo);
    this.kills.textContent = String(stats.kills);
  }

  /** Shows the overlay panel. */
  showOverlay(): void {
    this.overlay.classList.remove('hidden');
  }

  /** Hides the overlay panel. */
  hideOverlay(): void {
    this.overlay.classList.add('hidden');
  }

  /** Sets the primary overlay action label. */
  setStartButtonText(text: string): void {
    this.startButton.textContent = text;
  }

  /** Plays the damage vignette flash. */
  flashDamage(): void {
    this.flash(this.damageFlash, 120);
  }

  /** Plays the muzzle flash overlay. */
  flashMuzzle(): void {
    this.flash(this.muzzleFlash, 60);
  }

  /** Applies the default pre-run UI state. */
  showInitialState(): void {
    this.setStartButtonText('Enter Arena');
    this.setTip('Click to fire. Survive the arena.');
  }

  /** Shows the manual reload message. */
  showReloading(): void {
    this.setTip('Reloading...');
  }

  /** Shows the automatic empty-mag reload message. */
  showOutOfAmmo(): void {
    this.setTip('Out of ammo. Reloading...');
  }

  /** Shows the post-reload confirmation message. */
  showReloadComplete(): void {
    this.setTip('Reloaded. Back to work.');
  }

  /** Shows the pause hint after pointer lock is released. */
  showPause(): void {
    this.setTip('Paused. Click to jump back in.');
  }

  /** Shows the standard in-combat objective reminder. */
  showSweepArena(): void {
    this.setTip('Sweep the arena.');
  }

  /** Shows a pickup acquisition message. */
  showPickup(message: string): void {
    this.setTip(message);
  }

  /** Exposes the configured max ammo for UI callers that need it. */
  get maxAmmo(): number {
    return PLAYER_MAX_AMMO;
  }

  /** Fades a full-screen HUD effect in and back out. */
  private flash(element: HTMLElement, durationMs: number): void {
    element.style.opacity = '1';
    window.setTimeout(() => {
      element.style.opacity = '0';
    }, durationMs);
  }
}
