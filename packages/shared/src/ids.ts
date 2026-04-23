export type Brand<TValue, TName extends string> = TValue & {
  readonly __brand: TName;
};

export type EntityId = Brand<string, 'EntityId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type MatchId = Brand<string, 'MatchId'>;
export type RoomCode = Brand<string, 'RoomCode'>;
export type SessionToken = Brand<string, 'SessionToken'>;

const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createId<TId extends EntityId | PlayerId | MatchId | SessionToken>(prefix: string): TId {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}` as TId;
}

export function createEntityId(): EntityId {
  return createId<EntityId>('ent');
}

export function createPlayerId(): PlayerId {
  return createId<PlayerId>('player');
}

export function createMatchId(): MatchId {
  return createId<MatchId>('match');
}

export function createSessionToken(): SessionToken {
  return createId<SessionToken>('session');
}

export function createRoomCode(): RoomCode {
  let value = '';

  for (let index = 0; index < 6; index += 1) {
    const characterIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    value += ROOM_CODE_ALPHABET[characterIndex];
  }

  return value as RoomCode;
}

export function normalizeRoomCode(value: string): RoomCode {
  return value.trim().toUpperCase() as RoomCode;
}

export function isRoomCode(value: string): value is RoomCode {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(value));
}
