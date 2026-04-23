import type { MatchId, PlayerId, RoomCode, SessionToken } from '@neon/shared';

const STORAGE_KEY = 'neon-doom-pit.multiplayer-session';

export interface StoredRoomSession {
  matchId: MatchId;
  playerId: PlayerId;
  roomCode: RoomCode;
  sessionToken: SessionToken;
  playerName: string;
}

/** Loads the last successful room session so reconnect can be offered on the next page load. */
export function loadStoredRoomSession(): StoredRoomSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof StoredRoomSession, string>>;

    if (
      typeof parsed.matchId !== 'string'
      || typeof parsed.playerId !== 'string'
      || typeof parsed.roomCode !== 'string'
      || typeof parsed.sessionToken !== 'string'
      || typeof parsed.playerName !== 'string'
    ) {
      return null;
    }

    return {
      matchId: parsed.matchId as MatchId,
      playerId: parsed.playerId as PlayerId,
      roomCode: parsed.roomCode as RoomCode,
      sessionToken: parsed.sessionToken as SessionToken,
      playerName: parsed.playerName,
    };
  } catch {
    return null;
  }
}

export function saveStoredRoomSession(session: StoredRoomSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredRoomSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
