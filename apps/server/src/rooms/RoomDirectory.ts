import { createRoomCode, isRoomCode, normalizeRoomCode, type RoomCode } from '@neon/shared';
import { ROOM_EXPIRY_TOMBSTONE_MS } from '../config';
import { createServerError } from '../errors';
import { GameRoom } from './GameRoom';

export class RoomDirectory {
  private readonly rooms = new Map<RoomCode, GameRoom>();
  private readonly expiredRooms = new Map<RoomCode, number>();

  createRoom(): GameRoom {
    this.pruneExpiredRoomMarkers(Date.now());
    const roomCode = this.generateUniqueRoomCode();
    const room = new GameRoom(roomCode);
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: RoomCode): GameRoom | undefined {
    return this.prepareRoom(roomCode, this.rooms.get(roomCode), Date.now());
  }

  requireRoom(roomCodeValue: string): GameRoom {
    const now = Date.now();
    const roomCode = this.requireRoomCode(roomCodeValue);
    const room = this.prepareRoom(roomCode, this.rooms.get(roomCode), now);

    if (!room) {
      if (this.isExpiredRoom(roomCode, now)) {
        throw createServerError('room_expired', `Room ${roomCode} is no longer active.`);
      }

      throw createServerError('room_not_found', `Room ${roomCode} was not found.`);
    }

    return room;
  }

  tickAll(deltaSeconds: number, visitRoom?: (room: GameRoom) => void): void {
    const now = Date.now();
    this.pruneExpiredRoomMarkers(now);

    for (const [roomCode, room] of [...this.rooms.entries()]) {
      room.tick(deltaSeconds, now);

      if (room.isDisposable()) {
        this.expireRoom(roomCode, now);
        continue;
      }

      visitRoom?.(room);
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  private requireRoomCode(value: string): RoomCode {
    if (!isRoomCode(value)) {
      throw createServerError('invalid_room_code', 'Room code must be 6 characters using A-Z or 2-9.');
    }

    return normalizeRoomCode(value);
  }

  private generateUniqueRoomCode(): RoomCode {
    let attempts = 0;

    while (attempts < 1000) {
      const roomCode = createRoomCode();

      if (!this.rooms.has(roomCode) && !this.expiredRooms.has(roomCode)) {
        return roomCode;
      }

      attempts += 1;
    }

    throw new Error('Unable to allocate a unique room code.');
  }

  private prepareRoom(roomCode: RoomCode, room: GameRoom | undefined, now: number): GameRoom | undefined {
    this.pruneExpiredRoomMarkers(now);

    if (!room) {
      return undefined;
    }

    room.pruneExpiredSessions(now);

    if (!room.isDisposable()) {
      return room;
    }

    this.expireRoom(roomCode, now);
    return undefined;
  }

  private expireRoom(roomCode: RoomCode, now: number): void {
    this.rooms.delete(roomCode);
    this.expiredRooms.set(roomCode, now + ROOM_EXPIRY_TOMBSTONE_MS);
  }

  private isExpiredRoom(roomCode: RoomCode, now: number): boolean {
    this.pruneExpiredRoomMarkers(now);
    const expiresAt = this.expiredRooms.get(roomCode);
    return expiresAt !== undefined && expiresAt > now;
  }

  private pruneExpiredRoomMarkers(now: number): void {
    for (const [roomCode, expiresAt] of this.expiredRooms) {
      if (expiresAt <= now) {
        this.expiredRooms.delete(roomCode);
      }
    }
  }
}
