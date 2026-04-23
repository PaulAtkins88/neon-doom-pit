import * as THREE from 'three';
import { PICKUP_SPRITES } from '../config/spriteConfig';
import { createBillboard } from '../render/billboards';
import { GameObject } from './GameObject';

export type PickupType = 'health' | 'shotgun';

interface PickupConfig {
  readonly type: PickupType;
  readonly color: number;
  readonly emissive: number;
  readonly label: string;
  readonly radius: number;
}

/** Floating arena pickup with a small sphere collider. */
export class Pickup extends GameObject {
  readonly type: PickupType;
  readonly radius: number;
  readonly label: string;
  private bob = Math.random() * Math.PI * 2;
  private readonly baseY: number;

  constructor(position: THREE.Vector3, config: PickupConfig) {
    const sprite = PICKUP_SPRITES[config.type];
    const root = new THREE.Group();
    const glow = createBillboard({
      path: 'sprites/projectiles/bolt.png',
      size: { width: 1.25, height: 1.25 },
      color: config.color,
      alphaTest: 0.08,
      depthWrite: false,
      additive: true,
      opacity: 0.82,
    });
    glow.position.z = -0.01;

    const icon = createBillboard({
      path: sprite.path,
      size: { width: sprite.width, height: sprite.height },
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
    });
    icon.position.y = 0.02;

    root.add(glow, icon);
    root.position.copy(position).add(new THREE.Vector3(0, 0.8, 0));
    super(root);

    this.type = config.type;
    this.radius = config.radius;
    this.label = config.label;
    this.baseY = root.position.y;
  }

  update(deltaSeconds: number): void {
    this.bob += deltaSeconds * 2.4;
    this.object3D.position.y = this.baseY + Math.sin(this.bob) * 0.12;
  }

  hitsTarget(targetPosition: THREE.Vector3, targetRadius: number): boolean {
    const dx = this.object3D.position.x - targetPosition.x;
    const dy = this.object3D.position.y - targetPosition.y;
    const dz = this.object3D.position.z - targetPosition.z;
    const combinedRadius = this.radius + targetRadius;
    return dx * dx + dy * dy + dz * dz <= combinedRadius * combinedRadius;
  }
}
