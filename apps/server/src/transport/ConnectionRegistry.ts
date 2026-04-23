import { WebSocket } from 'ws';
import type { ServerMessage } from '@neon/shared';
import type { ConnectionContext } from '../types';

export class ConnectionRegistry {
  private readonly contextBySocket = new Map<WebSocket, ConnectionContext>();
  private readonly socketByConnection = new Map<string, WebSocket>();

  bind(socket: WebSocket, context: ConnectionContext): WebSocket | undefined {
    this.unbindSocket(socket);
    const replacedSocket = this.unbindSession(context);
    this.contextBySocket.set(socket, context);
    this.socketByConnection.set(toConnectionKey(context), socket);

    return replacedSocket !== socket ? replacedSocket : undefined;
  }

  getContext(socket: WebSocket): ConnectionContext | undefined {
    return this.contextBySocket.get(socket);
  }

  disconnect(socket: WebSocket): ConnectionContext | undefined {
    const context = this.contextBySocket.get(socket);

    if (!context) {
      return undefined;
    }

    this.contextBySocket.delete(socket);
    this.socketByConnection.delete(toConnectionKey(context));
    return context;
  }

  send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }

  broadcast(contexts: Iterable<ConnectionContext>, message: ServerMessage): void {
    const serialized = JSON.stringify(message);

    for (const context of contexts) {
      const socket = this.socketByConnection.get(toConnectionKey(context));
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(serialized);
      }
    }
  }

  private unbindSession(context: ConnectionContext): WebSocket | undefined {
    const existingSocket = this.socketByConnection.get(toConnectionKey(context));

    if (!existingSocket) {
      return undefined;
    }

    this.contextBySocket.delete(existingSocket);
    this.socketByConnection.delete(toConnectionKey(context));
    return existingSocket;
  }

  private unbindSocket(socket: WebSocket): void {
    const existingContext = this.contextBySocket.get(socket);

    if (!existingContext) {
      return;
    }

    this.contextBySocket.delete(socket);
    this.socketByConnection.delete(toConnectionKey(existingContext));
  }
}

function toConnectionKey(context: ConnectionContext): string {
  return `${context.roomCode}:${context.sessionToken}`;
}
