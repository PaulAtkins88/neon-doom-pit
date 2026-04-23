export type Brand<TValue, TName extends string> = TValue & {
  readonly __brand: TName;
};

export type EntityId = Brand<string, 'EntityId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type MatchId = Brand<string, 'MatchId'>;
export type RoomCode = Brand<string, 'RoomCode'>;
export type SessionToken = Brand<string, 'SessionToken'>;

const cryptoApi = globalThis.crypto;
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createId<TId extends EntityId | PlayerId | MatchId | SessionToken>(prefix: string): TId {
  return `${prefix}_${createSecureToken(8)}` as TId;
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
  return createSecureCode(6) as RoomCode;
}

export function normalizeRoomCode(value: string): RoomCode {
  return value.trim().toUpperCase() as RoomCode;
}

export function isRoomCode(value: string): value is RoomCode {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(value));
}

function createSecureToken(length: number): string {
  if (!cryptoApi) {
    throw new Error('Secure random generator is unavailable in this runtime.');
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  cryptoApi.getRandomValues(bytes);

  let token = '';

  for (const byte of bytes) {
    token += alphabet[byte % alphabet.length];
  }

  return token;
}

function createSecureCode(length: number): string {
  if (!cryptoApi) {
    throw new Error('Secure random generator is unavailable in this runtime.');
  }

  const bytes = new Uint8Array(length);
  cryptoApi.getRandomValues(bytes);

  let value = '';

  for (const byte of bytes) {
    value += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length];
  }

  return value;
}
