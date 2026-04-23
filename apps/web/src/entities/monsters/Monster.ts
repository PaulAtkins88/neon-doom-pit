import * as THREE from 'three';
import type { MonsterConfig, MonsterKind } from '../../config/monsterConfigs';
import { MONSTER_SPRITES } from '../../config/spriteConfig';
import type { Collider } from '../../core/contracts';
import { createBillboard } from '../../render/billboards';
import { Actor } from '../Actor';
import { pulseEye, tryMoveWithColliders } from './behaviors';

export interface MonsterAttackContext {
  damagePlayer: (amount: number, message: string) => void;
  launchProjectile: (monster: Monster, direction: THREE.Vector3) => void;
}

/** Optional extension hooks for future status effects or decorators. */
export interface MonsterEffectHook {
  onUpdate?(monster: Monster, deltaSeconds: number): void;
  onDamageTaken?(monster: Monster, amount: number): void;
}

/**
 * Base enemy implementation shared by all monsters.
 * Subclasses override only the pieces that vary: movement rules and attack rules.
 */
export abstract class Monster extends Actor {
  readonly type: MonsterKind;
  readonly config: MonsterConfig;
  readonly speed: number;
  readonly eye: THREE.Mesh;
  readonly baseEyeIntensity = 1.8;

  protected attackCooldown: number;
  protected bob: number;
  private readonly baseY: number;
  private readonly effects: MonsterEffectHook[];

  /** Creates a monster mesh, stats, and optional effect hooks. */
  protected constructor(type: MonsterKind, config: MonsterConfig, position: THREE.Vector3, effects: MonsterEffectHook[] = []) {
    const mesh = new THREE.Group();
    const sprite = MONSTER_SPRITES[type];
    const body = createBillboard({
      path: sprite.path,
      size: { width: sprite.width, height: sprite.height },
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
    });
    body.position.y = sprite.height * 0.5;

    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(type === 'imp' ? 0.28 : 0.34, 0.12, 0.12),
      new THREE.MeshStandardMaterial({
        color: config.eyeColor,
        emissive: config.eyeEmissive,
        emissiveIntensity: 1.8,
        flatShading: true,
      }),
    );
    eye.position.set(...sprite.eyeOffset);
    eye.castShadow = true;
    eye.receiveShadow = true;

    const aura = new THREE.PointLight(config.auraColor, 1.8, 8, 2);
    aura.position.set(0, 1.1, 0.2);

    mesh.add(body, eye, aura);
    mesh.position.copy(position);

    super(mesh, config.radius, config.health);

    this.type = type;
    this.config = config;
    this.speed = config.speed + Math.random() * config.speedJitter;
    this.attackCooldown = config.attackCooldown;
    this.bob = Math.random() * Math.PI * 2;
    this.baseY = position.y;
    this.eye = eye;
    this.effects = effects;
  }

  /** Updates movement, idle bobbing, and attack execution for this frame. */
  update(deltaSeconds: number, playerPosition: THREE.Vector3, colliders: Collider[], attackContext: MonsterAttackContext): void {
    if (!this.alive) {
      return;
    }

    this.effects.forEach((effect) => effect.onUpdate?.(this, deltaSeconds));

    const toPlayer = playerPosition.clone().sub(this.object3D.position);
    const distance = toPlayer.length();
    toPlayer.y = 0;

    if (toPlayer.lengthSq() > 0.001) {
      toPlayer.normalize();
      this.updateMovement(deltaSeconds, toPlayer, distance, colliders);
    }

    this.bob += deltaSeconds * 5;
    this.object3D.position.y = this.baseY + Math.sin(this.bob) * 0.08;
    this.attackCooldown -= deltaSeconds;

    this.updateAttack(distance, playerPosition, attackContext);
  }

  /** Runs effect hooks before delegating to standard actor damage handling. */
  override takeDamage(amount: number): boolean {
    this.effects.forEach((effect) => effect.onDamageTaken?.(this, amount));
    return super.takeDamage(amount);
  }

  /** Triggers a short emissive flash on the eye mesh. */
  pulseEye(intensity: number): void {
    pulseEye(this.eye, () => this.alive, this.baseEyeIntensity, intensity);
  }

  /** Moves the monster according to subclass-defined movement rules. */
  protected updateMovement(deltaSeconds: number, toPlayer: THREE.Vector3, distance: number, colliders: Collider[]): void {
    const direction = this.resolveMovementDirection(toPlayer.clone(), distance);
    const speed = this.resolveMovementSpeed(distance);
    const proposed = tryMoveWithColliders(this.object3D.position, direction, speed, deltaSeconds, this.radius, colliders);

    if (!proposed) {
      return;
    }

    if (this.shouldApplyMove(distance)) {
      this.object3D.position.copy(proposed);
    }
  }

  /** Allows subclasses to change direction, such as ranged enemies backing away. */
  protected resolveMovementDirection(toPlayer: THREE.Vector3, distance: number): THREE.Vector3 {
    void distance;
    return toPlayer;
  }

  /** Allows subclasses to change speed, such as chargers surging into combat. */
  protected resolveMovementSpeed(distance: number): number {
    void distance;
    return this.speed;
  }

  /** Allows subclasses to decide when a proposed move should actually be applied. */
  protected shouldApplyMove(distance: number): boolean {
    return distance > this.config.attackRange;
  }

  /** Executes the subclass-specific attack behavior. */
  protected abstract updateAttack(distance: number, playerPosition: THREE.Vector3, attackContext: MonsterAttackContext): void;
}
