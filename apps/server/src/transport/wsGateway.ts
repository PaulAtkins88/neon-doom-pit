import { WebSocket, type RawData } from 'ws';
import { createServerError, toServerErrorEvent } from '../errors';
import { parseClientMessage } from '../protocol';
import { RoomDirectory } from '../rooms/RoomDirectory';
import type { ConnectionContext } from '../types';
import { ConnectionRegistry } from './ConnectionRegistry';
import type { GameRoom } from '../rooms/GameRoom';

export class WsGateway {
  constructor(
    private readonly rooms: RoomDirectory,
    private readonly connections: ConnectionRegistry,
  ) {}

  handleConnection(socket: WebSocket): void {
    socket.on('message', (payload) => {
      this.handleIncomingMessage(socket, payload);
    });

    socket.on('close', () => {
      this.handleClose(socket);
    });
  }

  broadcastSnapshot(room: GameRoom): void {
    this.connections.broadcast(this.getRoomConnections(room), {
      type: 'snapshot',
      payload: room.snapshot,
    });
  }

  private handleIncomingMessage(socket: WebSocket, payload: RawData): void {
    try {
      const message = parseClientMessage(payload);

      switch (message.type) {
        case 'create_room': {
          const room = this.rooms.createRoom();
          const joined = room.join(message.payload.playerName);
          this.bindSocket(socket, {
            roomCode: joined.roomCode,
            sessionToken: joined.sessionToken,
          });
          this.broadcastRoomState(room);
          this.connections.send(socket, {
            type: 'room_joined',
            payload: joined,
          });
          break;
        }
        case 'join_room': {
          if (message.payload.sessionToken) {
            this.handleReconnect(socket, message.payload.roomCode, message.payload.sessionToken);
            break;
          }

          const room = this.rooms.requireRoom(message.payload.roomCode);
          const joined = room.join(message.payload.playerName);
          this.bindSocket(socket, {
            roomCode: joined.roomCode,
            sessionToken: joined.sessionToken,
          });
          this.broadcastRoomState(room);
          this.connections.send(socket, {
            type: 'room_joined',
            payload: joined,
          });
          break;
        }
        case 'reconnect':
          this.handleReconnect(socket, message.payload.roomCode, message.payload.sessionToken);
          break;
        case 'command': {
          const context = this.connections.getContext(socket);

          if (!context) {
            throw createServerError('not_joined', 'Join a room before sending commands.');
          }

          const room = this.rooms.requireRoom(context.roomCode);
          room.handleCommand(context.sessionToken, message);
          break;
        }
      }
    } catch (error) {
      this.connections.send(socket, {
        type: 'error',
        payload: toServerErrorEvent(error),
      });
    }
  }

  private handleReconnect(socket: WebSocket, roomCode: string, sessionToken: ConnectionContext['sessionToken']): void {
    const room = this.rooms.requireRoom(roomCode);
    const joined = room.reconnect(sessionToken);

    this.bindSocket(socket, {
      roomCode: joined.roomCode,
      sessionToken: joined.sessionToken,
    });
    this.broadcastRoomState(room);
    this.connections.send(socket, {
      type: 'room_joined',
      payload: joined,
    });
  }

  private handleClose(socket: WebSocket): void {
    const context = this.connections.disconnect(socket);

    if (!context) {
      return;
    }

    const room = this.rooms.getRoom(context.roomCode);

    if (!room) {
      return;
    }

    room.disconnect(context.sessionToken);
    this.broadcastRoomState(room);
  }

  private bindSocket(socket: WebSocket, context: ConnectionContext): void {
    const replacedSocket = this.connections.bind(socket, context);

    if (!replacedSocket) {
      return;
    }

    this.connections.send(replacedSocket, {
      type: 'error',
      payload: {
        code: 'session_replaced',
        message: 'This player session was resumed from another connection.',
      },
    });
    replacedSocket.close();
  }

  private broadcastRoomState(room: GameRoom): void {
    this.connections.broadcast(this.getRoomConnections(room), {
      type: 'room_state',
      payload: room.createRoomState(),
    });
  }

  private getRoomConnections(room: GameRoom): ConnectionContext[] {
    return room.getSessionTokens().map((sessionToken) => ({
      roomCode: room.roomCode,
      sessionToken,
    }));
  }
}
