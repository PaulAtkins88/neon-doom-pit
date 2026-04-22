import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import {
  PLAYER_EMPTY_FIRE_COOLDOWN,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_MAX_AMMO,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  PLAYER_RELOAD_DURATION,
  PLAYER_SPEED,
  PLAYER_SPAWN_POSITION,
  PLAYER_SPRINT_SPEED,
} from '../config/gameConfig';
import type { Collider } from '../core/contracts';
import { circleIntersectsCollider } from '../utils/math';

export class Player {
  readonly controls: PointerLockControls;
  readonly camera: THREE.PerspectiveCamera;
  readonly gun: THREE.Group;
  readonly radius = PLAYER_RADIUS;
  readonly speed = PLAYER_SPEED;
  readonly sprintSpeed = PLAYER_SPRINT_SPEED;
  readonly maxHealth = PLAYER_MAX_HEALTH;
  readonly maxAmmo = PLAYER_MAX_AMMO;

  health = PLAYER_MAX_HEALTH;
  ammo = PLAYER_MAX_AMMO;
  weapon = 'rifle';
  shotgunCharges = 0;
  kills = 0;
  reloadTimer = 0;
  fireCooldown = 0;
  hurtTimer = 0;
  private reloadCompleted = false;

  private readonly upAxis = new THREE.Vector3(0, 1, 0);
  private readonly forwardVector = new THREE.Vector3();
  private readonly rightVector = new THREE.Vector3();
  private readonly moveVector = new THREE.Vector3();

  /**
   * Creates the player controller around the camera and pointer-lock controls.
   * The player owns movement state, combat state, and the first-person gun mesh.
   */
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.controls = new PointerLockControls(this.camera, document.body);
    this.gun = this.createGun();
    this.camera.add(this.gun);
    this.reset();
  }

  /** The three.js object moved by pointer-lock controls. */
  get object(): THREE.Object3D {
    return this.controls.object;
  }

  /** Restores the player to a fresh run state at the arena spawn point. */
  reset(): void {
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.weapon = 'rifle';
    this.shotgunCharges = 0;
    this.kills = 0;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.hurtTimer = 0;
    this.reloadCompleted = false;
    this.object.position.copy(PLAYER_SPAWN_POSITION);
    this.gun.rotation.set(0, 0, 0);
  }

  /** Returns whether the player can fire right now. */
  canShoot(): boolean {
    return this.fireCooldown <= 0 && this.reloadTimer <= 0;
  }

  /** Consumes ammo and applies the regular firing cooldown and recoil pose. */
  applyShot(): void {
    this.ammo -= 1;
    this.fireCooldown = PLAYER_FIRE_COOLDOWN;
    this.gun.rotation.z = -0.18;
  }

  /** Starts the automatic reload triggered by firing on an empty chamber. */
  beginEmptyReload(): void {
    this.reloadTimer = PLAYER_RELOAD_DURATION;
    this.fireCooldown = PLAYER_EMPTY_FIRE_COOLDOWN;
    this.reloadCompleted = false;
  }

  /** Starts a manual reload when one is legal and useful. */
  beginManualReload(): boolean {
    if (this.reloadTimer > 0 || this.ammo >= this.maxAmmo) {
      return false;
    }

    this.reloadTimer = PLAYER_RELOAD_DURATION;
    this.reloadCompleted = false;
    return true;
  }

  /** Refills the weapon and marks the reload as completed for HUD messaging. */
  completeReload(): void {
    this.ammo = this.maxAmmo;
    this.reloadCompleted = true;
  }

  /** Consumes the one-frame reload completion flag used by the game loop. */
  consumeReloadCompletion(): boolean {
    if (!this.reloadCompleted) {
      return false;
    }

    this.reloadCompleted = false;
    return true;
  }

  /** Applies incoming damage and returns true if the player dies. */
  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.hurtTimer = 0.18;
    if (this.health < 0) {
      this.health = 0;
    }
    return this.health <= 0;
  }

  /**
   * Updates movement, weapon sway, cooldowns, and reload timing.
   * Collision stays intentionally simple and collider-based to match the prototype feel.
   */
  update(deltaSeconds: number, keyState: Record<string, boolean>, colliders: Collider[]): void {
    const move = new THREE.Vector3(
      (keyState.KeyD ? 1 : 0) - (keyState.KeyA ? 1 : 0),
      0,
      (keyState.KeyS ? 1 : 0) - (keyState.KeyW ? 1 : 0),
    );

    if (move.lengthSq() > 0) {
      move.normalize();
      this.controls.getDirection(this.forwardVector);
      this.forwardVector.y = 0;
      this.forwardVector.normalize();
      this.rightVector.crossVectors(this.forwardVector, this.upAxis).normalize();

      this.moveVector.set(0, 0, 0);
      this.moveVector.addScaledVector(this.forwardVector, -move.z);
      this.moveVector.addScaledVector(this.rightVector, move.x);

      if (this.moveVector.lengthSq() > 0) {
        this.moveVector.normalize();
        const speed = keyState.ShiftLeft || keyState.ShiftRight ? this.sprintSpeed : this.speed;
        this.tryMove(this.moveVector.x * speed * deltaSeconds, this.moveVector.z * speed * deltaSeconds, colliders);
      }
    }

    const sway = Math.sin(performance.now() * 0.012) * (move.lengthSq() > 0 ? 0.02 : 0.008);
    this.gun.position.y = -0.36 + sway;

    if (this.fireCooldown > 0) {
      this.fireCooldown -= deltaSeconds;
    }

    if (this.reloadTimer > 0) {
      this.reloadTimer -= deltaSeconds;
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    }

    this.gun.rotation.z = THREE.MathUtils.lerp(this.gun.rotation.z, 0, 0.16);
  }

  /** Attempts a movement step while respecting arena colliders. */
  private tryMove(deltaX: number, deltaZ: number, colliders: Collider[]): void {
    const nextX = this.object.position.x + deltaX;
    const nextZ = this.object.position.z + deltaZ;

    const blocked = colliders.some((collider) => circleIntersectsCollider(nextX, nextZ, this.radius, collider));
    if (!blocked) {
      this.object.position.x = nextX;
      this.object.position.z = nextZ;
    }
  }

  /** Builds the stylized first-person weapon model attached to the camera. */
  private createGun(): THREE.Group {
    const gun = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.92), new THREE.MeshStandardMaterial({ color: 0x272a33, flatShading: true, roughness: 0.68 }));
    body.position.set(0.25, -0.28, -0.55);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.48, 10), new THREE.MeshStandardMaterial({ color: 0x9d5d2b, flatShading: true }));
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.34, -0.24, -1.02);

    const sight = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), new THREE.MeshStandardMaterial({ color: 0xffd36f, emissive: 0xbb5a12, flatShading: true }));
    sight.position.set(0.22, -0.12, -0.9);

    gun.add(body, barrel, sight);
    gun.position.set(0.44, -0.36, -0.72);
    return gun;
  }
}
