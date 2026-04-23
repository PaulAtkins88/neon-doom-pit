import { WebSocketServer } from 'ws';
import { MATCH_TICK_MS, MATCH_TICK_SECONDS, PORT } from './config';
import { RoomDirectory } from './rooms/RoomDirectory';
import { ConnectionRegistry } from './transport/ConnectionRegistry';
import { WsGateway } from './transport/wsGateway';

export interface MultiplayerServer {
  readonly rooms: RoomDirectory;
  readonly socketServer: WebSocketServer;
  close(): Promise<void>;
}

export function bootstrapServer(port = PORT): MultiplayerServer {
  const rooms = new RoomDirectory();
  const connections = new ConnectionRegistry();
  const gateway = new WsGateway(rooms, connections);
  const socketServer = new WebSocketServer({ port });

  socketServer.on('connection', (socket) => {
    gateway.handleConnection(socket);
  });

  const interval = setInterval(() => {
    rooms.tickAll(MATCH_TICK_SECONDS, (room) => {
      gateway.broadcastSnapshot(room);
    });
  }, MATCH_TICK_MS);

  interval.unref?.();

  console.info(`[multiplayer] room server listening on ws://localhost:${port}`);

  return {
    rooms,
    socketServer,
    async close() {
      clearInterval(interval);
      await new Promise<void>((resolve, reject) => {
        socketServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}
