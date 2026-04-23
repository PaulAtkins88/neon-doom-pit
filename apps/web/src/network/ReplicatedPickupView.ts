import * as THREE from 'three';
import type { EntityId, MatchSnapshot, PickupSnapshot } from '@neon/shared';
import type { Scene } from 'three';
import { PICKUP_RADIUS, SHOTGUN_PICKUP_CHARGES } from '../config/gameConfig';
import { Pickup } from '../entities/Pickup';

const PICKUP_CONFIGS = {
  shotgun: {
    type: 'shotgun' as const,
    color: 0xff7b35,
    emissive: 0x5a1f00,
    label: `Shotgun ready: ${SHOTGUN_PICKUP_CHARGES} blasts`,
    radius: PICKUP_RADIUS,
  },
  health: {
    type: 'health' as const,
    color: 0x46f0a7,
    emissive: 0x0f5a33,
    label: 'Armor patch restored 25 health',
    radius: PICKUP_RADIUS,
  },
};

/** Maintains visual replicas of authoritative pickups from incoming snapshots. */
export class ReplicatedPickupView {
  private readonly pickups = new Map<EntityId, Pickup>();

  constructor(private readonly scene: Scene) {}

  applySnapshot(snapshot: MatchSnapshot): void {
    const nextIds = new Set<EntityId>();

    for (const pickup of snapshot.pickups) {
      if (!pickup.active) {
        continue;
      }

      nextIds.add(pickup.id);
      this.upsertPickup(pickup);
    }

    for (const [id, pickup] of this.pickups) {
      if (nextIds.has(id)) {
        continue;
      }

      pickup.dispose();
      this.pickups.delete(id);
    }
  }

  update(deltaSeconds: number): void {
    for (const pickup of this.pickups.values()) {
      pickup.update(deltaSeconds);
    }
  }

  clear(): void {
    for (const pickup of this.pickups.values()) {
      pickup.dispose();
    }

    this.pickups.clear();
  }

  private upsertPickup(snapshot: PickupSnapshot): void {
    const existing = this.pickups.get(snapshot.id);
    if (existing) {
      existing.object3D.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
      return;
    }

    const pickup = new Pickup(
      new THREE.Vector3(snapshot.position.x, snapshot.position.y - 0.8, snapshot.position.z),
      PICKUP_CONFIGS[snapshot.type],
    );
    pickup.object3D.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    this.pickups.set(snapshot.id, pickup);
    this.scene.add(pickup.object3D);
  }
}
