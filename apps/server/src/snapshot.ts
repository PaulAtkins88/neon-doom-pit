import type {
  MatchSnapshot,
  MonsterSnapshot,
  PlayerSnapshot,
  RoomPlayerState,
  RoomStateEvent,
} from '@neon/shared';
import { MAX_PLAYERS_PER_ROOM } from './config';
import type { RoomRecord, SessionRecord } from './types';

export function createRoomState(room: RoomRecord): RoomStateEvent {
  const players: RoomPlayerState[] = room.sessionOrder
    .map((token) => room.sessions.get(token))
    .filter((session): session is SessionRecord => session !== undefined)
    .map((session) => ({
      playerId: session.playerId,
      connected: session.connected,
    }));

  return {
    matchId: room.matchId,
    roomCode: room.roomCode,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    players,
    tick: room.tick,
  };
}

export function createSnapshot(room: RoomRecord): MatchSnapshot {
  const players: PlayerSnapshot[] = room.sessionOrder
    .map((token) => room.sessions.get(token))
    .filter((session): session is SessionRecord => session !== undefined)
    .map((session) => ({
      id: session.playerId,
      entityId: session.entityId,
      position: { ...session.simulation.position },
      yaw: session.simulation.yaw,
      health: session.simulation.health,
      ammo: session.simulation.ammo,
      weapon: session.simulation.weapon,
      shotgunCharges: session.simulation.shotgunCharges,
      kills: session.simulation.kills,
      reloadTimer: session.simulation.reloadTimer,
      fireCooldown: session.simulation.fireCooldown,
    }));

  return {
    matchId: room.matchId,
    roomCode: room.roomCode,
    tick: room.tick,
    session: room.sessionState,
    players,
    monsters: room.monsters.map((monster): MonsterSnapshot => ({
      id: monster.id,
      type: monster.type,
      position: { ...monster.position },
      health: monster.health,
      alive: monster.alive,
    })),
    projectiles: room.projectiles.map((projectile) => ({
      id: projectile.id,
      owner: projectile.owner,
      position: { ...projectile.position },
      velocity: { ...projectile.velocity },
      damage: projectile.damage,
      radius: projectile.radius,
    })),
    pickups: room.pickups.map((pickup) => ({
      id: pickup.id,
      type: pickup.type,
      position: { ...pickup.position },
      active: pickup.active,
    })),
  };
}
