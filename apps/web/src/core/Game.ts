import * as THREE from 'three';
import type { MatchSnapshot, MatchId, PlayerId, PlayerSnapshot, RoomCode } from '@neon/shared';
import { CAMERA_START_POSITION, PICKUP_RADIUS, PICKUP_RESPAWN_DELAY, PICKUP_SPAWN_POINTS, PLAYER_PROJECTILE_DAMAGE, PLAYER_PROJECTILE_HIT_PADDING, PLAYER_PROJECTILE_RADIUS, PLAYER_PROJECTILE_SPEED, PLAYER_PROJECTILE_TTL, SHOTGUN_PICKUP_CHARGES } from '../config/gameConfig';
import { PROJECTILE_SPRITES } from '../config/spriteConfig';
import { createInitialSessionState, type SessionState } from './GameState';
import { createLocalMatchIdentity, createLocalMatchSnapshot, createPlayerHudState } from './matchSnapshot';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Pickup } from '../entities/Pickup';
import type { Monster } from '../entities/monsters/Monster';
import { createBillboard } from '../render/billboards';
import { CombatSystem } from '../systems/CombatSystem';
import { HudSystem } from '../systems/HudSystem';
import { InputSystem } from '../systems/InputSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { GameWorld } from '../world/GameWorld';
import type { MultiplayerClient } from '../network/MultiplayerClient';
import { ReplicatedMatchView } from '../network/ReplicatedMatchView';
import { ReplicatedMonsterView } from '../network/ReplicatedMonsterView';
import { ReplicatedPickupView } from '../network/ReplicatedPickupView';
import { ReplicatedProjectileView } from '../network/ReplicatedProjectileView';

export interface MatchContext {
  matchId: MatchId;
  playerId: PlayerId;
  roomCode: RoomCode;
}

/**
 * Top-level game coordinator.
 * This class wires together the world, entities, DOM HUD, input, combat, and wave progression.
 */
export class Game {
  private readonly world: GameWorld;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly player: Player;
  private readonly hud: HudSystem;
  private readonly input: InputSystem;
  private readonly combat: CombatSystem;
  private readonly waveSystem: WaveSystem;
  private readonly replicatedMatchView: ReplicatedMatchView;
  private readonly replicatedMonsterView: ReplicatedMonsterView;
  private readonly replicatedPickupView: ReplicatedPickupView;
  private readonly replicatedProjectileView: ReplicatedProjectileView;

  private readonly state: SessionState = createInitialSessionState();
  private readonly monsters: Monster[] = [];
  private readonly projectiles: Projectile[] = [];
  private readonly pickups: Pickup[] = [];
  private matchContext: MatchContext;
  private latestSnapshot: MatchSnapshot;
  private simulationTick = 0;
  private multiplayerClient: MultiplayerClient | null = null;
  private multiplayerActive = false;
  private localInputSequence = 0;
  private readonly authoritativeForward = new THREE.Vector3();
  private multiplayerStartHandler: (() => void) | null = null;

  /** Creates the runtime shell around the canvas, three.js renderer, and game systems. */
  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game');
    if (!canvas) {
      throw new Error('Missing #game canvas');
    }

    this.world = new GameWorld();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
    this.camera.position.copy(CAMERA_START_POSITION);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.player = new Player(this.camera);
    this.world.scene.add(this.camera);

    this.hud = new HudSystem();
    this.input = new InputSystem();
    this.combat = new CombatSystem(this.camera);
    this.waveSystem = new WaveSystem(this.world);
    this.replicatedMatchView = new ReplicatedMatchView(this.world.scene, () => this.matchContext.playerId);
    this.replicatedMonsterView = new ReplicatedMonsterView(this.world.scene);
    this.replicatedPickupView = new ReplicatedPickupView(this.world.scene);
    this.replicatedProjectileView = new ReplicatedProjectileView(this.world.scene);

    const identity = createLocalMatchIdentity();
    this.matchContext = {
      matchId: identity.matchId,
      playerId: identity.playerId,
      roomCode: 'LOCAL00' as RoomCode,
    };
    this.latestSnapshot = this.buildSnapshot();
  }

  /** Initializes a fresh run, binds browser events, and starts the frame loop. */
  start(): void {
    this.resetGame();
    this.bindEvents();
    this.animate();
  }

  /** Wires browser, DOM, and pointer-lock events to runtime behavior. */
  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);

    this.input.bind(
      () => {
        if (this.player.beginManualReload()) {
          this.hud.showReloading();
        }
      },
      () => {
        if (this.isAuthoritativeMultiplayer()) {
          return;
        }

        if (!this.player.controls.isLocked) {
          return;
        }

        this.combat.shoot(this.player, this.state, this.hud, (direction) => {
          this.launchPlayerShot(direction);
        });
      },
    );

    this.hud.startActionButton.addEventListener('click', () => this.startRun());

    this.player.controls.addEventListener('lock', () => {
      this.hud.hideOverlay();

      if (this.isAuthoritativeMultiplayer()) {
        return;
      }

      this.state.active = true;
      this.hud.showSweepArena();
    });

    this.player.controls.addEventListener('unlock', () => {
      if (this.isAuthoritativeMultiplayer()) {
        if (!this.state.gameOver) {
          this.hud.showOverlay();
          this.hud.showPause();
        }
        return;
      }

      this.state.active = false;
      if (!this.state.gameOver) {
        this.hud.showOverlay();
        this.hud.showPause();
      }
    });
  }

  /** Main requestAnimationFrame loop. */
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaSeconds = Math.min(this.clock.getDelta(), 0.05);

    this.updatePlayer(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updatePickups(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.replicatedMatchView.update();
    this.replicatedMonsterView.update();
    this.replicatedPickupView.update(deltaSeconds);
    this.latestSnapshot = this.buildSnapshot();
    this.simulationTick += 1;

    this.renderer.render(this.world.scene, this.camera);
  };

  /** Returns the latest simulation-oriented match state snapshot. */
  getSnapshot(): MatchSnapshot {
    return this.latestSnapshot;
  }

  /** Replaces the local placeholder match identity with a server-issued room context. */
  setMatchContext(context: MatchContext): void {
    const enteringNewRoom = context.roomCode !== ('LOCAL00' as RoomCode)
      && (
        !this.multiplayerActive
        || this.matchContext.matchId !== context.matchId
        || this.matchContext.playerId !== context.playerId
        || this.matchContext.roomCode !== context.roomCode
      );

    this.matchContext = context;
    this.multiplayerActive = context.roomCode !== ('LOCAL00' as RoomCode);

    if (enteringNewRoom) {
      this.clearMonsters();
      this.clearProjectiles();
      this.clearPickups();
      this.replicatedMatchView.clear();
      this.replicatedMonsterView.clear();
      this.replicatedPickupView.clear();
      this.replicatedProjectileView.clear();
    }

    this.latestSnapshot = this.buildSnapshot();
  }

  setMultiplayerClient(client: MultiplayerClient): void {
    this.multiplayerClient = client;
  }

  syncLocalInputSequence(sequence: number): void {
    this.localInputSequence = sequence;
  }

  handleMultiplayerDisconnected(
    startButtonText = 'Reconnect',
    tip = 'Disconnected from the room server. Reconnect to resume the co-op run.',
  ): void {
    if (!this.isAuthoritativeMultiplayer()) {
      return;
    }

    if (this.player.controls.isLocked) {
      this.player.controls.unlock();
    }

    this.state.active = false;
    this.clearReplicatedViews();
    this.hud.showOverlay();
    this.hud.setStartButtonText(startButtonText);
    this.hud.setTip(tip);
  }

  setMultiplayerStartHandler(handler: (() => void) | null): void {
    this.multiplayerStartHandler = handler;
  }

  /** Applies the latest authoritative snapshot to non-local replicated visuals. */
  applyReplicatedSnapshot(snapshot: MatchSnapshot): void {
    const localPlayer = snapshot.players.find((player) => player.id === this.matchContext.playerId);

    if (localPlayer) {
      this.applyAuthoritativeLocalPlayer(localPlayer);
    }

    this.replicatedMatchView.applySnapshot(snapshot);
    this.replicatedMonsterView.applySnapshot(snapshot);
    this.replicatedPickupView.applySnapshot(snapshot);
    this.replicatedProjectileView.applySnapshot(snapshot);
    this.state.active = snapshot.session.active;
    this.state.gameOver = snapshot.session.gameOver;
    this.state.wave = snapshot.session.wave;
    this.state.enemyRespawnTimer = snapshot.session.enemyRespawnTimer;
    this.state.levelComplete = snapshot.session.levelComplete;
    this.state.levelCompleteTimer = snapshot.session.levelCompleteTimer;
    this.state.pickupRespawnTimer = snapshot.session.pickupRespawnTimer;

    if (this.isAuthoritativeMultiplayer()) {
      this.syncAuthoritativeSessionUi(snapshot);
    }

    this.latestSnapshot = snapshot;
  }

  /** Updates player movement and reload completion messaging. */
  private updatePlayer(deltaSeconds: number): void {
    if (this.isAuthoritativeMultiplayer()) {
      this.sendPlayerInput();
      this.player.updatePresentation(deltaSeconds, this.input.keys);
      return;
    }

    if (!this.player.controls.isLocked || this.state.gameOver) {
      return;
    }

    this.player.update(deltaSeconds, this.input.keys, this.world.colliders);

    if (this.player.consumeReloadCompletion()) {
      this.hud.showReloadComplete();
      this.hud.updateHud(createPlayerHudState(this.player));
    }
  }

  /** Updates all monster AI, wave transitions, and victory flow. */
  private updateEnemies(deltaSeconds: number): void {
    if (this.isAuthoritativeMultiplayer()) {
      return;
    }

    if (!this.state.active || this.state.gameOver) {
      return;
    }

    for (const monster of this.monsters) {
      monster.update(deltaSeconds, this.player.object.position, this.world.colliders, {
        damagePlayer: (amount, message) => this.damagePlayer(amount, message),
        launchProjectile: (attacker, direction) => this.launchEnemyShot(attacker, direction),
      });
    }

    const result = this.waveSystem.updateWaveCompletion(deltaSeconds, this.state, this.monsters);
    if (result === 'continue') {
      const spawned = this.waveSystem.updateRespawn(deltaSeconds, this.state, this.monsters);
      spawned.forEach((monster) => this.addMonster(monster));
      return;
    }

    if (result === 'victory') {
      this.state.active = false;
      this.player.controls.unlock();
      this.hud.showOverlay();
      this.hud.setStartButtonText('Next Run');
      this.hud.setTip('You cleared the arena. Press Enter Arena to run again.');
      return;
    }

    this.startWave(this.state.wave + 1);
  }

  /** Updates enemy projectiles while the run is active. */
  private updateProjectiles(deltaSeconds: number): void {
    if (this.isAuthoritativeMultiplayer()) {
      return;
    }

    if (!this.state.active || this.state.gameOver) {
      return;
    }

    this.combat.updateProjectiles(
      deltaSeconds,
      this.projectiles,
      this.player,
      this.monsters,
      this.world.colliders,
      (amount, message) => {
        this.damagePlayer(amount, message);
      },
      (monster) => {
        this.removeMonster(monster);
      },
      () => this.hud.updateHud(createPlayerHudState(this.player)),
      (message) => this.hud.setTip(message),
      (seconds) => {
        this.state.enemyRespawnTimer = seconds;
      },
      this.pickups,
      (pickup) => this.collectPickup(pickup),
    );
  }

  /** Updates floating pickups and respawn timing. */
  private updatePickups(deltaSeconds: number): void {
    if (this.isAuthoritativeMultiplayer()) {
      return;
    }

    for (const pickup of this.pickups) {
      pickup.update(deltaSeconds);
    }

    if (this.state.active && this.pickups.length === 0 && this.state.pickupRespawnTimer <= 0) {
      this.state.pickupRespawnTimer = PICKUP_RESPAWN_DELAY;
    }

    if (this.state.pickupRespawnTimer > 0) {
      this.state.pickupRespawnTimer -= deltaSeconds;
      if (this.state.pickupRespawnTimer <= 0 && this.state.active && !this.state.gameOver) {
        this.spawnPickups();
      }
    }
  }

  /** Starts or resumes the current run and acquires pointer lock. */
  private startRun(): void {
    if (this.isAuthoritativeMultiplayer()) {
      if (this.state.active) {
        this.hud.hideOverlay();
        this.player.controls.lock();
        return;
      }

      this.multiplayerStartHandler?.();
      return;
    }

    this.hud.hideOverlay();

    if (!this.isAuthoritativeMultiplayer() && (this.state.gameOver || this.monsters.length === 0)) {
      this.resetGame();
    }

    this.state.active = true;
    this.player.controls.lock();
  }

  /** Resets the full run state and reinitializes the first wave. */
  private resetGame(): void {
    this.player.reset();
    this.state.active = false;
    this.state.gameOver = false;
    this.state.wave = 0;
    this.state.enemyRespawnTimer = 0;
    this.state.levelComplete = false;
    this.state.levelCompleteTimer = 0;
    this.state.pickupRespawnTimer = 0;

    this.clearMonsters();
    this.clearProjectiles();
    this.clearPickups();
    this.startWave(0);
    this.spawnPickups();

    this.hud.setStartButtonText('Enter Arena');
    this.hud.updateHud(createPlayerHudState(this.player));
    this.hud.showInitialState();
    this.latestSnapshot = this.buildSnapshot();
  }

  /** Clears current combatants and begins the requested wave. */
  private startWave(wave: number): void {
    this.clearMonsters();
    this.clearProjectiles();
    this.waveSystem.startWave(wave, this.state).forEach((monster) => this.addMonster(monster));
    this.hud.setTip(`Wave ${wave + 1}. Clear the arena.`);
  }

  /** Applies damage to the player and handles the game-over transition. */
  private damagePlayer(amount: number, message: string): void {
    if (this.state.gameOver) {
      return;
    }

    const dead = this.player.takeDamage(amount);
    this.hud.flashDamage();
    this.hud.setTip(message);

    if (dead) {
      this.state.gameOver = true;
      this.state.active = false;
      this.player.controls.unlock();
      this.hud.showOverlay();
      this.hud.setStartButtonText('Restart Run');
      this.hud.setTip('You were pulled apart. Restart the run.');
    }

    this.hud.updateHud(createPlayerHudState(this.player));
  }

  /** Spawns an enemy projectile into the world using the monster's projectile config. */
  private launchEnemyShot(monster: Monster, direction: THREE.Vector3): void {
    const sprite = PROJECTILE_SPRITES.enemy;
    const mesh = createBillboard({
      path: sprite.path,
      size: { width: sprite.width, height: sprite.height },
      color: sprite.color,
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
      additive: sprite.additive,
      emissive: sprite.emissive,
      emissiveIntensity: sprite.emissiveIntensity,
    });

    mesh.position.copy(monster.object3D.position).add(new THREE.Vector3(0, 1.1, 0));
    this.world.scene.add(mesh);
    this.projectiles.push(
      new Projectile(
        mesh,
        direction.clone().multiplyScalar(monster.config.projectileSpeed),
        monster.config.projectileTtl,
        12,
        'enemy',
        monster.config.projectileRadius,
      ),
    );
  }

  /** Spawns a player projectile and launches it from the camera's forward direction. */
  private launchPlayerShot(direction: THREE.Vector3): void {
    const sprite = PROJECTILE_SPRITES.player;
    const mesh = createBillboard({
      path: sprite.path,
      size: { width: sprite.width, height: sprite.height },
      color: sprite.color,
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
      additive: sprite.additive,
      emissive: sprite.emissive,
      emissiveIntensity: sprite.emissiveIntensity,
    });

    mesh.position.copy(this.camera.position).add(direction.clone().multiplyScalar(0.85));
    this.world.scene.add(mesh);
    this.projectiles.push(
        new Projectile(
          mesh,
          direction.clone().multiplyScalar(PLAYER_PROJECTILE_SPEED),
          PLAYER_PROJECTILE_TTL,
        PLAYER_PROJECTILE_DAMAGE,
        'player',
        PLAYER_PROJECTILE_RADIUS,
        PLAYER_PROJECTILE_HIT_PADDING,
      ),
    );
  }

  /** Spawns the current map pickups. */
  private spawnPickups(): void {
    this.clearPickups();

    const configs = [
      { type: 'shotgun' as const, color: 0xff7b35, emissive: 0x5a1f00, label: `Shotgun ready: ${SHOTGUN_PICKUP_CHARGES} blasts`, radius: PICKUP_RADIUS },
      { type: 'health' as const, color: 0x46f0a7, emissive: 0x0f5a33, label: 'Armor patch restored 25 health', radius: PICKUP_RADIUS },
    ];

    PICKUP_SPAWN_POINTS.forEach((spawn, index) => {
      const pickup = new Pickup(spawn, configs[index % configs.length]);
      this.pickups.push(pickup);
      this.world.scene.add(pickup.object3D);
    });
  }

  /** Applies a pickup effect to the player and schedules the next respawn. */
  private collectPickup(pickup: Pickup): void {
    if (pickup.type === 'health') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
      this.hud.showPickup('Picked up armor patch.');
    } else {
      this.player.weapon = 'shotgun';
      this.player.shotgunCharges = SHOTGUN_PICKUP_CHARGES;
      this.hud.showPickup(`Shotgun acquired: ${SHOTGUN_PICKUP_CHARGES} shots ready.`);
    }

    this.hud.updateHud(createPlayerHudState(this.player));
    this.state.pickupRespawnTimer = PICKUP_RESPAWN_DELAY;
  }

  /** Adds a monster to the active runtime list and scene. */
  private addMonster(monster: Monster): void {
    this.monsters.push(monster);
    this.world.scene.add(monster.object3D);
  }

  /** Removes and disposes a monster after death. */
  private removeMonster(monster: Monster): void {
    const index = this.monsters.indexOf(monster);
    if (index >= 0) {
      this.monsters.splice(index, 1);
    }

    monster.dispose();
  }

  /** Disposes every active monster. */
  private clearMonsters(): void {
    this.monsters.splice(0).forEach((monster) => monster.dispose());
  }

  /** Disposes every active projectile. */
  private clearProjectiles(): void {
    this.projectiles.splice(0).forEach((projectile) => projectile.dispose());
  }

  /** Disposes every active pickup. */
  private clearPickups(): void {
    this.pickups.splice(0).forEach((pickup) => pickup.dispose());
  }

  /** Keeps the renderer and camera projection in sync with the browser viewport. */
  private handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  /** Builds the current local-authority snapshot from runtime entities. */
  private buildSnapshot(): MatchSnapshot {
    if (this.isAuthoritativeMultiplayer()) {
      return this.latestSnapshot;
    }

    return createLocalMatchSnapshot({
      session: this.state,
      player: this.player,
      monsters: this.monsters,
      projectiles: this.projectiles,
      pickups: this.pickups,
      tick: this.simulationTick,
      matchId: this.matchContext.matchId,
      roomCode: this.matchContext.roomCode,
      playerId: this.matchContext.playerId,
    });
  }

  private sendPlayerInput(): void {
    if (!this.multiplayerClient || !this.multiplayerClient.hasJoinedRoom()) {
      return;
    }

    const controlsLocked = this.player.controls.isLocked;
    const reloadRequested = controlsLocked ? this.input.consumeReloadRequested() : false;
    this.localInputSequence += 1;

    this.camera.getWorldDirection(this.authoritativeForward);
    this.authoritativeForward.normalize();

    const yaw = Math.atan2(-this.authoritativeForward.x, -this.authoritativeForward.z);
    const horizontalLength = Math.hypot(this.authoritativeForward.x, this.authoritativeForward.z);
    const pitch = Math.atan2(this.authoritativeForward.y, horizontalLength);

    this.multiplayerClient.sendPlayerInput({
      type: 'player_input',
      moveX: controlsLocked ? (this.input.keys.KeyD ? 1 : 0) - (this.input.keys.KeyA ? 1 : 0) : 0,
      moveZ: controlsLocked ? (this.input.keys.KeyS ? 1 : 0) - (this.input.keys.KeyW ? 1 : 0) : 0,
      yaw,
      pitch,
      sprint: controlsLocked && (this.input.keys.ShiftLeft || this.input.keys.ShiftRight),
      shooting: controlsLocked && this.input.shooting,
      reloadRequested,
      sequence: this.localInputSequence,
    });
  }

  private applyAuthoritativeLocalPlayer(snapshot: PlayerSnapshot): void {
    this.player.applyAuthoritativeSnapshot(snapshot, !this.player.controls.isLocked);
    this.hud.updateHud(createPlayerHudState(this.player));
  }

  private syncAuthoritativeSessionUi(snapshot: MatchSnapshot): void {
    if (snapshot.session.gameOver) {
      if (this.player.controls.isLocked) {
        this.player.controls.unlock();
      }

      this.hud.showOverlay();
      this.hud.setStartButtonText('Run Ended');
      this.hud.setTip('The squad was wiped out. Rejoin or reconnect for the next run.');
      return;
    }

    if (!snapshot.session.active && snapshot.session.levelComplete) {
      this.hud.showOverlay();
      this.hud.setStartButtonText('Run Cleared');
      this.hud.setTip('Wave complete. Waiting for the next authoritative run state.');
      return;
    }

    if (!snapshot.session.active) {
      this.hud.showOverlay();
      this.hud.setStartButtonText('Enter Arena');
      this.hud.setTip('Press Enter Arena to request the next co-op run.');
      return;
    }

    if (this.player.controls.isLocked) {
      this.hud.hideOverlay();
      return;
    }

    this.hud.showOverlay();
    this.hud.setStartButtonText('Resume Run');
    this.hud.setTip('Run is active. Click Resume Run to re-enter pointer lock.');
  }

  private isAuthoritativeMultiplayer(): boolean {
    return this.multiplayerClient !== null && this.multiplayerActive;
  }

  private clearReplicatedViews(): void {
    this.replicatedMatchView.clear();
    this.replicatedMonsterView.clear();
    this.replicatedPickupView.clear();
    this.replicatedProjectileView.clear();
  }
}
