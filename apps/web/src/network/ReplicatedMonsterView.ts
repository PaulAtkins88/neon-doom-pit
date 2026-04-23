import type { EntityId, MatchSnapshot, MonsterSnapshot } from '@neon/shared';
import type { Scene } from 'three';
import { RemoteMonsterAvatar } from '../entities/RemoteMonsterAvatar';

/** Maintains visual replicas of authoritative monsters from incoming snapshots. */
export class ReplicatedMonsterView {
  private readonly monsters = new Map<EntityId, RemoteMonsterAvatar>();

  constructor(private readonly scene: Scene) {}

  applySnapshot(snapshot: MatchSnapshot): void {
    const nextIds = new Set<EntityId>();

    for (const monster of snapshot.monsters) {
      if (!monster.alive) {
        continue;
      }

      nextIds.add(monster.id);
      this.upsertMonster(monster);
    }

    for (const [id, avatar] of this.monsters) {
      if (nextIds.has(id)) {
        continue;
      }

      avatar.dispose();
      this.monsters.delete(id);
    }
  }

  update(): void {
    for (const avatar of this.monsters.values()) {
      avatar.update();
    }
  }

  clear(): void {
    for (const avatar of this.monsters.values()) {
      avatar.dispose();
    }

    this.monsters.clear();
  }

  private upsertMonster(snapshot: MonsterSnapshot): void {
    const existing = this.monsters.get(snapshot.id);

    if (existing) {
      existing.applySnapshot(snapshot);
      return;
    }

    const avatar = new RemoteMonsterAvatar(snapshot);
    this.monsters.set(snapshot.id, avatar);
    this.scene.add(avatar.root);
  }
}
