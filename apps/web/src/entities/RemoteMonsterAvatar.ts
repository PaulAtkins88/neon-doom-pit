import * as THREE from 'three';
import type { MonsterSnapshot } from '@neon/shared';
import { MONSTER_SPRITES } from '../config/spriteConfig';
import { createBillboard } from '../render/billboards';

const POSITION_LERP_ALPHA = 0.24;

/** Visual-only monster replica driven by authoritative snapshots. */
export class RemoteMonsterAvatar {
  readonly root = new THREE.Group();

  private readonly body: THREE.Object3D;
  private readonly eye: THREE.Mesh;
  private targetPosition = new THREE.Vector3();

  constructor(snapshot: MonsterSnapshot) {
    const sprite = MONSTER_SPRITES[snapshot.type];
    this.body = createBillboard({
      path: sprite.path,
      size: { width: sprite.width, height: sprite.height },
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
    });
    this.body.position.y = sprite.height * 0.5;

    this.eye = new THREE.Mesh(
      new THREE.BoxGeometry(snapshot.type === 'imp' ? 0.28 : 0.34, 0.12, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0xffd36f,
        emissive: 0xff7a2f,
        emissiveIntensity: 1.8,
        flatShading: true,
      }),
    );
    this.eye.position.set(0, sprite.eyeOffset[1], sprite.eyeOffset[2]);

    this.root.add(this.body, this.eye);
    this.applySnapshot(snapshot, true);
  }

  applySnapshot(snapshot: MonsterSnapshot, immediate = false): void {
    this.targetPosition.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);

    if (immediate) {
      this.root.position.copy(this.targetPosition);
      return;
    }

    if (!snapshot.alive) {
      this.root.position.copy(this.targetPosition);
    }
  }

  update(): void {
    this.root.position.lerp(this.targetPosition, POSITION_LERP_ALPHA);
  }

  dispose(): void {
    this.root.removeFromParent();
    disposeObject(this.body);
    this.eye.geometry.dispose();
    disposeMaterial(this.eye.material);
  }
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((entry) => {
    const mesh = entry as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}
