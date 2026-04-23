import {
  createEntityId,
  createMatchId,
  createPlayerId,
  createSessionToken,
  type SessionToken,
} from '@neon/shared';
import { DEFAULT_SESSION, MAX_PLAYERS_PER_ROOM, RECONNECT_GRACE_MS, ROOM_EXPIRY_TOMBSTONE_MS } from '../config';
import { createServerError } from '../errors';
import { createSnapshot, createRoomState } from '../snapshot';
import { createDefaultInputState, createInitialPickups, createInitialPlayerSimulation, simulateRoom } from '../simulation';
import type { RoomCommandMessage, RoomJoinedPayload, RoomRecord, SessionRecord } from '../types';
import { clampAxis, normalizePitch, normalizeYaw } from '../world';

export class GameRoom {
  private readonly record: RoomRecord;
  private readonly expiredSessionTokens = new Map<SessionToken, number>();

  constructor(roomCode: RoomRecord['roomCode']) {
    const matchId = createMatchId();

    this.record = {
      matchId,
      roomCode,
      sessions: new Map(),
      sessionOrder: [],
      tick: 0,
      snapshot: {
        matchId,
        roomCode,
        tick: 0,
        session: DEFAULT_SESSION,
        players: [],
        monsters: [],
        projectiles: [],
        pickups: [],
      },
      sessionState: { ...DEFAULT_SESSION },
      runRequested: false,
      monsterQueue: [],
      monsters: [],
      pickups: createInitialPickups(),
      projectiles: [],
    };
  }

  get roomCode(): RoomRecord['roomCode'] {
    return this.record.roomCode;
  }

  get snapshot() {
    return this.record.snapshot;
  }

  getSessionTokens(): ReadonlyArray<SessionToken> {
    return this.record.sessionOrder;
  }

  join(playerName?: string, now = Date.now()): RoomJoinedPayload {
    this.pruneExpiredSessions(now);

    if (this.record.sessions.size >= MAX_PLAYERS_PER_ROOM) {
      throw createServerError('room_full', `Room ${this.record.roomCode} is full.`);
    }

    const sessionToken = createSessionToken();
    const session: SessionRecord = {
      token: sessionToken,
      playerId: createPlayerId(),
      entityId: createEntityId(),
      playerName: normalizePlayerName(playerName, this.record.sessions.size + 1),
      spawnIndex: this.record.sessionOrder.length,
      connected: true,
      lastSeenAt: now,
      disconnectedAt: null,
      lastInputSequence: 0,
      input: createDefaultInputState(),
      simulation: createInitialPlayerSimulation(this.record.sessionOrder.length),
    };

    this.record.sessions.set(sessionToken, session);
    this.record.sessionOrder.push(sessionToken);
    this.record.snapshot = createSnapshot(this.record);

    return this.toRoomJoinedPayload(session, false);
  }

  reconnect(sessionToken: SessionToken, now = Date.now()): RoomJoinedPayload {
    this.pruneExpiredSessions(now);

    const session = this.record.sessions.get(sessionToken);

    if (!session) {
      if (this.hasExpiredSession(sessionToken, now)) {
        throw createServerError('session_expired', `Reconnect window expired for room ${this.record.roomCode}.`);
      }

      throw createServerError('session_not_found', `Reconnect token is not valid for room ${this.record.roomCode}.`);
    }

    session.connected = true;
    session.lastSeenAt = now;
    session.disconnectedAt = null;

    return this.toRoomJoinedPayload(session, true);
  }

  disconnect(sessionToken: SessionToken, now = Date.now()): void {
    const session = this.record.sessions.get(sessionToken);

    if (!session) {
      return;
    }

    session.connected = false;
    session.lastSeenAt = now;
    session.disconnectedAt = now;
  }

  handleCommand(sessionToken: SessionToken, message: RoomCommandMessage, now = Date.now()): void {
    const session = this.record.sessions.get(sessionToken);

    if (!session) {
      if (this.hasExpiredSession(sessionToken, now)) {
        throw createServerError('session_expired', 'Reconnect grace expired for this player slot.');
      }

      throw createServerError('session_not_found', 'Session no longer exists for this connection.');
    }

    session.lastSeenAt = now;

    if (message.payload.type === 'session_start') {
      this.record.runRequested = true;
      return;
    }

    if (message.payload.sequence <= session.lastInputSequence) {
      return;
    }

    session.lastInputSequence = message.payload.sequence;
    session.input = {
      moveX: clampAxis(message.payload.moveX),
      moveZ: clampAxis(message.payload.moveZ),
      yaw: normalizeYaw(message.payload.yaw),
      pitch: normalizePitch(message.payload.pitch),
      sprint: message.payload.sprint,
      shooting: message.payload.shooting,
      reloadRequested: message.payload.reloadRequested,
    };
  }

  tick(deltaSeconds: number, now = Date.now()): void {
    this.pruneExpiredSessions(now);

    if (this.record.sessions.size === 0) {
      this.record.snapshot = createSnapshot(this.record);
      return;
    }

    this.record.tick += 1;
    simulateRoom(this.record, deltaSeconds);
    this.record.snapshot = createSnapshot(this.record);
  }

  createRoomState() {
    return createRoomState(this.record);
  }

  pruneExpiredSessions(now = Date.now()): boolean {
    let removed = false;

    this.pruneExpiredSessionTokens(now);

    for (const token of [...this.record.sessionOrder]) {
      const session = this.record.sessions.get(token);

      if (!session || !isReconnectExpired(session, now)) {
        continue;
      }

      this.record.sessions.delete(token);
      this.record.sessionOrder = this.record.sessionOrder.filter((candidate) => candidate !== token);
      this.expiredSessionTokens.set(token, now + ROOM_EXPIRY_TOMBSTONE_MS);
      removed = true;
    }

    if (removed) {
      this.record.snapshot = createSnapshot(this.record);
    }

    return removed;
  }

  isDisposable(): boolean {
    return this.record.sessions.size === 0;
  }

  hasExpiredSession(sessionToken: SessionToken, now = Date.now()): boolean {
    this.pruneExpiredSessionTokens(now);
    const expiresAt = this.expiredSessionTokens.get(sessionToken);
    return expiresAt !== undefined && expiresAt > now;
  }

  private toRoomJoinedPayload(session: SessionRecord, reconnected: boolean): RoomJoinedPayload {
    return {
      roomCode: this.record.roomCode,
      matchId: this.record.matchId,
      playerId: session.playerId,
      sessionToken: session.token,
      reconnected,
      lastInputSequence: session.lastInputSequence,
      room: this.createRoomState(),
      snapshot: this.record.snapshot,
    };
  }

  private pruneExpiredSessionTokens(now: number): void {
    for (const [sessionToken, expiresAt] of this.expiredSessionTokens) {
      if (expiresAt <= now) {
        this.expiredSessionTokens.delete(sessionToken);
      }
    }
  }
}

function normalizePlayerName(value: string | undefined, slot: number): string {
  const trimmed = value?.trim();

  if (trimmed) {
    return trimmed.slice(0, 24);
  }

  return `Player ${slot}`;
}

function isReconnectExpired(session: SessionRecord, now: number): boolean {
  return !session.connected
    && session.disconnectedAt !== null
    && now - session.disconnectedAt >= RECONNECT_GRACE_MS;
}
