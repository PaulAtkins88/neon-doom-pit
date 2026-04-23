import type { MatchSnapshot, ProjectileSnapshot } from '@neon/shared';
import * as THREE from 'three';
import type { Scene } from 'three';
import { PROJECTILE_SPRITES } from '../config/spriteConfig';
import { createBillboard } from '../render/billboards';

/** Maintains visual replicas of authoritative projectiles from incoming snapshots. */
export class ReplicatedProjectileView {
  private readonly scene: Scene;
  private readonly projectiles = new Map<string, THREE.Object3D>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  applySnapshot(snapshot: MatchSnapshot): void {
    const nextProjectileIds = new Set<string>();

    for (const projectile of snapshot.projectiles) {
      nextProjectileIds.add(projectile.id);
      this.upsertProjectile(projectile);
    }

    for (const [projectileId, object] of this.projectiles) {
      if (nextProjectileIds.has(projectileId)) {
        continue;
      }

      disposeProjectile(object);
      this.projectiles.delete(projectileId);
    }
  }

  clear(): void {
    for (const object of this.projectiles.values()) {
      disposeProjectile(object);
    }

    this.projectiles.clear();
  }

  private upsertProjectile(snapshot: ProjectileSnapshot): void {
    const existing = this.projectiles.get(snapshot.id);

    if (existing) {
      existing.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
      return;
    }

    const sprite = PROJECTILE_SPRITES[snapshot.owner];
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
    mesh.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    this.scene.add(mesh);
    this.projectiles.set(snapshot.id, mesh);
  }
}

function disposeProjectile(object: THREE.Object3D): void {
  object.removeFromParent();

  if (!(object instanceof THREE.Mesh)) {
    return;
  }

  object.geometry.dispose();
  disposeMaterial(object.material);

  for (const child of object.children) {
    if (child instanceof THREE.PointLight) {
      child.dispose();
    }
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}
