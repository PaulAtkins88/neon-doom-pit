import {
  isRoomCode,
  normalizeRoomCode,
  type ClientMessage,
  type ClientCommand,
  type MatchSnapshot,
  type PlayerInputCommand,
  type RoomJoinedEvent,
  type RoomStateEvent,
  type ServerErrorEvent,
  type ServerMessage,
  type SessionToken,
} from '@neon/shared';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  url: string;
}

export interface MultiplayerClientListener {
  onConnectionStateChange?(state: ConnectionState): void;
  onRoomJoined?(event: RoomJoinedEvent): void;
  onRoomState?(event: RoomStateEvent): void;
  onSnapshot?(snapshot: MatchSnapshot): void;
  onError?(error: ServerErrorEvent): void;
}

interface PendingJoinRequest {
  resolve: (event: RoomJoinedEvent) => void;
  reject: (reason?: unknown) => void;
}

function getDefaultServerUrl(): string {
  const explicitUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;

  if (typeof explicitUrl === 'string' && explicitUrl.length > 0) {
    return explicitUrl;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname || 'localhost';
  const port = import.meta.env.VITE_MULTIPLAYER_SERVER_PORT ?? '2567';
  const isDefaultPort = window.location.port.length === 0;
  const shouldReuseOriginPort = isDefaultPort || window.location.port === port;

  if (shouldReuseOriginPort) {
    return `${protocol}://${window.location.host}`;
  }

  return `${protocol}://${host}:${port}`;
}

/** Owns the browser WebSocket lifecycle and typed room protocol messaging. */
export class MultiplayerClient {
  private readonly listeners = new Set<MultiplayerClientListener>();
  private readonly url: string;

  private socket: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private rejectConnectPromise: ((reason?: unknown) => void) | null = null;
  private pendingJoinRequest: PendingJoinRequest | null = null;
  private connectionState: ConnectionState;
  private latestSnapshot: MatchSnapshot | null = null;
  private latestRoomState: RoomStateEvent | null = null;

  constructor(url = getDefaultServerUrl()) {
    this.url = url;
    this.connectionState = {
      status: 'idle',
      url,
    };
  }

  subscribe(listener: MultiplayerClientListener): () => void {
    this.listeners.add(listener);
    listener.onConnectionStateChange?.(this.connectionState);

    if (this.latestRoomState) {
      listener.onRoomState?.(this.latestRoomState);
    }

    if (this.latestSnapshot) {
      listener.onSnapshot?.(this.latestSnapshot);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  getServerUrl(): string {
    return this.url;
  }

  getLatestSnapshot(): MatchSnapshot | null {
    return this.latestSnapshot;
  }

  hasJoinedRoom(): boolean {
    return this.latestRoomState !== null;
  }

  clearRoomState(): void {
    this.latestSnapshot = null;
    this.latestRoomState = null;
  }

  async createRoom(playerName?: string): Promise<RoomJoinedEvent> {
    return this.requestRoomJoin({
      type: 'create_room',
      payload: {
        playerName: normalizePlayerName(playerName),
      },
    });
  }

  async joinRoom(roomCode: string, playerName?: string): Promise<RoomJoinedEvent> {
    if (!isRoomCode(roomCode)) {
      throw new Error('Room code must be 6 characters using A-Z or 2-9.');
    }

    return this.requestRoomJoin({
      type: 'join_room',
      payload: {
        roomCode: normalizeRoomCode(roomCode),
        playerName: normalizePlayerName(playerName),
      },
    });
  }

  async reconnect(roomCode: string, sessionToken: SessionToken): Promise<RoomJoinedEvent> {
    if (!isRoomCode(roomCode)) {
      throw new Error('Room code must be 6 characters using A-Z or 2-9.');
    }

    return this.requestRoomJoin({
      type: 'reconnect',
      payload: {
        roomCode: normalizeRoomCode(roomCode),
        sessionToken,
      },
    });
  }

  sendPlayerInput(command: PlayerInputCommand): void {
    this.sendCommand(command);
  }

  sendSessionStart(): void {
    this.sendCommand({
      type: 'session_start',
    });
  }

  private async requestRoomJoin(message: ClientMessage): Promise<RoomJoinedEvent> {
    await this.ensureConnected();

    if (this.pendingJoinRequest) {
      this.pendingJoinRequest.reject(new Error('Another room request is already in progress.'));
    }

    return await new Promise<RoomJoinedEvent>((resolve, reject) => {
      this.pendingJoinRequest = { resolve, reject };
      this.send(message);
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.updateConnectionState('connecting');
    this.socket = new WebSocket(this.url);

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const socket = this.socket;
      this.rejectConnectPromise = reject;

      if (!socket) {
        this.rejectConnectPromise = null;
        reject(new Error('WebSocket connection was not created.'));
        return;
      }

      socket.addEventListener('open', () => {
        if (this.socket !== socket) {
          return;
        }

        this.connectPromise = null;
        this.rejectConnectPromise = null;
        this.updateConnectionState('connected');
        resolve();
      }, { once: true });

      socket.addEventListener('error', () => {
        if (this.socket !== socket) {
          return;
        }

        this.connectPromise = null;
        this.rejectConnectPromise = null;
        this.updateConnectionState('error');
        reject(new Error(`Unable to connect to multiplayer server at ${this.url}.`));
      }, { once: true });

      socket.addEventListener('close', () => {
        if (this.socket !== socket) {
          return;
        }

        this.rejectConnectPromise?.(new Error('Disconnected from multiplayer server.'));
        this.rejectConnectPromise = null;
        this.socket = null;
        this.connectPromise = null;
        this.clearRoomState();
        this.rejectPendingJoin(new Error('Disconnected from multiplayer server.'));
        this.updateConnectionState('closed');
      });

      socket.addEventListener('message', (event) => {
        if (this.socket !== socket) {
          return;
        }

        this.handleServerMessage(event.data);
      });
    });

    await this.connectPromise;
  }

  private send(message: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Multiplayer server is not connected.');
    }

    this.socket.send(JSON.stringify(message));
  }

  private sendCommand(command: ClientCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.send({
      type: 'command',
      payload: command,
    });
  }

  private handleServerMessage(raw: unknown): void {
    let message: ServerMessage;

    try {
      message = JSON.parse(String(raw)) as ServerMessage;
    } catch {
      this.emitError({
        code: 'invalid_message',
        message: 'Received malformed data from the multiplayer server.',
      });
      return;
    }

    switch (message.type) {
      case 'room_joined':
        this.latestRoomState = message.payload.room;
        this.latestSnapshot = message.payload.snapshot;
        this.pendingJoinRequest?.resolve(message.payload);
        this.pendingJoinRequest = null;
        this.listeners.forEach((listener) => listener.onRoomJoined?.(message.payload));
        break;
      case 'room_state':
        this.latestRoomState = message.payload;
        this.listeners.forEach((listener) => listener.onRoomState?.(message.payload));
        break;
      case 'snapshot':
        if (this.isStaleSnapshot(message.payload)) {
          return;
        }

        this.latestSnapshot = message.payload;
        this.listeners.forEach((listener) => listener.onSnapshot?.(message.payload));
        break;
      case 'error':
        this.rejectPendingJoin(new Error(message.payload.message));
        this.emitError(message.payload);
        break;
    }
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.clearRoomState();
    this.socket?.close();
  }

  private emitError(error: ServerErrorEvent): void {
    this.listeners.forEach((listener) => listener.onError?.(error));
  }

  private rejectPendingJoin(reason: unknown): void {
    this.pendingJoinRequest?.reject(reason);
    this.pendingJoinRequest = null;
  }

  private updateConnectionState(status: ConnectionStatus): void {
    this.connectionState = {
      status,
      url: this.url,
    };

    this.listeners.forEach((listener) => listener.onConnectionStateChange?.(this.connectionState));
  }

  private isStaleSnapshot(snapshot: MatchSnapshot): boolean {
    return this.latestSnapshot !== null
      && this.latestSnapshot.matchId === snapshot.matchId
      && this.latestSnapshot.tick > snapshot.tick;
  }
}

function normalizePlayerName(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 24);
}
