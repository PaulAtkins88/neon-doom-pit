import * as THREE from 'three';
import type { PlayerSnapshot } from '@neon/shared';
import { PLAYER_SPAWN_POSITION } from '../config/gameConfig';
import type { Disposable } from '../core/contracts';

const POSITION_LERP_ALPHA = 0.22;
const YAW_LERP_ALPHA = 0.22;

/** Visual-only remote player avatar driven entirely by replicated snapshots. */
export class RemotePlayerAvatar implements Disposable {
  readonly root = new THREE.Group();

  private readonly body: THREE.Mesh;
  private readonly head: THREE.Mesh;
  private readonly visor: THREE.Mesh;
  private readonly weapon: THREE.Mesh;
  private targetPosition = new THREE.Vector3();
  private targetYaw = 0;

  constructor(snapshot: PlayerSnapshot) {
    this.body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.38, 0.9, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d3550, flatShading: true, roughness: 0.72 }),
    );
    this.body.castShadow = true;
    this.body.position.y = 0.95;

    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd8c9b5, flatShading: true, roughness: 0.92 }),
    );
    this.head.castShadow = true;
    this.head.position.set(0, 1.78, 0);

    this.visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xffd36f, emissive: 0xa24918, emissiveIntensity: 0.9, flatShading: true }),
    );
    this.visor.position.set(0, 1.78, 0.21);

    this.weapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x9d5d2b, flatShading: true, roughness: 0.64 }),
    );
    this.weapon.castShadow = true;
    this.weapon.position.set(0.34, 1.25, 0.24);
    this.weapon.rotation.x = -0.1;

    this.root.add(this.body, this.head, this.visor, this.weapon);
    this.applySnapshot(snapshot, true);
  }

  applySnapshot(snapshot: PlayerSnapshot, immediate = false): void {
    this.targetPosition.set(snapshot.position.x, snapshot.position.y - PLAYER_SPAWN_POSITION.y, snapshot.position.z);
    this.targetYaw = snapshot.yaw;

    if (immediate) {
      this.root.position.copy(this.targetPosition);
      this.root.rotation.y = this.targetYaw;
    }
  }

  update(): void {
    this.root.position.lerp(this.targetPosition, POSITION_LERP_ALPHA);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, YAW_LERP_ALPHA);
  }

  dispose(): void {
    this.root.removeFromParent();
    this.body.geometry.dispose();
    disposeMaterial(this.body.material);
    this.head.geometry.dispose();
    disposeMaterial(this.head.material);
    this.visor.geometry.dispose();
    disposeMaterial(this.visor.material);
    this.weapon.geometry.dispose();
    disposeMaterial(this.weapon.material);
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}
