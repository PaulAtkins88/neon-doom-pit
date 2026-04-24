import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { MATCH_TICK_MS, MATCH_TICK_SECONDS, PORT } from './config';
import { RoomDirectory } from './rooms/RoomDirectory';
import { ConnectionRegistry } from './transport/ConnectionRegistry';
import { WsGateway } from './transport/wsGateway';

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
const WEB_DIST_DIR = join(SERVER_DIR, '../../web/dist');

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

export interface MultiplayerServer {
  readonly rooms: RoomDirectory;
  readonly socketServer: WebSocketServer;
  readonly httpServer: ReturnType<typeof createServer>;
  close(): Promise<void>;
}

export function bootstrapServer(port = PORT): MultiplayerServer {
  const rooms = new RoomDirectory();
  const connections = new ConnectionRegistry();
  const gateway = new WsGateway(rooms, connections);
  const httpServer = createServer((request, response) => {
    void handleHttpRequest(request, response);
  });
  const socketServer = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    socketServer.handleUpgrade(request, socket, head, (webSocket) => {
      socketServer.emit('connection', webSocket, request);
    });
  });

  httpServer.listen(port);

  socketServer.on('connection', (socket) => {
    gateway.handleConnection(socket);
  });

  const interval = setInterval(() => {
    rooms.tickAll(MATCH_TICK_SECONDS, (room) => {
      gateway.broadcastSnapshot(room);
    });
  }, MATCH_TICK_MS);

  interval.unref?.();

  console.info(`[multiplayer] app listening on http://localhost:${port}`);

  return {
    rooms,
    socketServer,
    httpServer,
    async close() {
      clearInterval(interval);
      socketServer.close();

      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
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

async function handleHttpRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (url.pathname === '/health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  const filePath = await resolveStaticFilePath(url.pathname);

  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream';

  response.writeHead(200, { 'content-type': contentType });
  createReadStream(filePath).pipe(response);
}

async function resolveStaticFilePath(requestPath: string): Promise<string | null> {
  if (!existsSync(WEB_DIST_DIR)) {
    return null;
  }

  const normalizedPath = normalize(requestPath).replace(/^\/(\.\.(\/|\\|$))+/, '/');
  const candidatePath = normalizedPath === '/' ? 'index.html' : normalizedPath.replace(/^\/+/, '');
  const absolutePath = resolve(WEB_DIST_DIR, candidatePath);

  if (isPathInsideRoot(absolutePath) && await isFile(absolutePath)) {
    return absolutePath;
  }

  if (looksLikeStaticAsset(normalizedPath)) {
    return null;
  }

  const indexPath = join(WEB_DIST_DIR, 'index.html');
  return isPathInsideRoot(indexPath) && await isFile(indexPath) ? indexPath : null;
}

function isPathInsideRoot(filePath: string): boolean {
  const relativePath = relative(WEB_DIST_DIR, filePath);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function looksLikeStaticAsset(requestPath: string): boolean {
  return extname(requestPath) !== '';
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}
