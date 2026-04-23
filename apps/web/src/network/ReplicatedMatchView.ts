import type { MatchSnapshot, PlayerId, PlayerSnapshot } from '@neon/shared';
import type { Scene } from 'three';
import { RemotePlayerAvatar } from '../entities/RemotePlayerAvatar';

/** Maintains visual replicas of non-local players from incoming match snapshots. */
export class ReplicatedMatchView {
  private readonly scene: Scene;
  private readonly localPlayerId: () => PlayerId | null;
  private readonly remotePlayers = new Map<PlayerId, RemotePlayerAvatar>();

  constructor(scene: Scene, localPlayerId: () => PlayerId | null) {
    this.scene = scene;
    this.localPlayerId = localPlayerId;
  }

  applySnapshot(snapshot: MatchSnapshot): void {
    const localPlayerId = this.localPlayerId();
    const nextRemoteIds = new Set<PlayerId>();

    for (const player of snapshot.players) {
      if (localPlayerId && player.id === localPlayerId) {
        continue;
      }

      nextRemoteIds.add(player.id);
      this.upsertRemotePlayer(player);
    }

    for (const [playerId, avatar] of this.remotePlayers) {
      if (nextRemoteIds.has(playerId)) {
        continue;
      }

      avatar.dispose();
      this.remotePlayers.delete(playerId);
    }
  }

  update(): void {
    for (const avatar of this.remotePlayers.values()) {
      avatar.update();
    }
  }

  clear(): void {
    for (const avatar of this.remotePlayers.values()) {
      avatar.dispose();
    }

    this.remotePlayers.clear();
  }

  private upsertRemotePlayer(snapshot: PlayerSnapshot): void {
    const existing = this.remotePlayers.get(snapshot.id);

    if (existing) {
      existing.applySnapshot(snapshot);
      return;
    }

    const avatar = new RemotePlayerAvatar(snapshot);
    this.remotePlayers.set(snapshot.id, avatar);
    this.scene.add(avatar.root);
  }
}
