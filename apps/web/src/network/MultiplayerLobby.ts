import type { RoomJoinedEvent, RoomStateEvent, ServerErrorEvent } from '@neon/shared';
import { Game } from '../core/Game';
import { MultiplayerClient, type ConnectionState } from './MultiplayerClient';
import { clearStoredRoomSession, loadStoredRoomSession, saveStoredRoomSession, type StoredRoomSession } from './sessionStorage';

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

/** Owns the room create/join/reconnect flow without coupling it to gameplay state. */
export class MultiplayerLobby {
  private readonly createRoomButton = getRequiredElement<HTMLButtonElement>('#createRoomButton');
  private readonly joinRoomButton = getRequiredElement<HTMLButtonElement>('#joinRoomButton');
  private readonly reconnectButton = getRequiredElement<HTMLButtonElement>('#reconnectButton');
  private readonly startButton = getRequiredElement<HTMLButtonElement>('#startButton');
  private readonly playerNameInput = getRequiredElement<HTMLInputElement>('#playerNameInput');
  private readonly roomCodeInput = getRequiredElement<HTMLInputElement>('#roomCodeInput');
  private readonly sessionStatus = getRequiredElement<HTMLElement>('#sessionStatus');
  private readonly roomMeta = getRequiredElement<HTMLElement>('#roomMeta');
  private readonly tip = getRequiredElement<HTMLElement>('#tip');

  private readonly client: MultiplayerClient;
  private readonly game: Game;

  private connectionState: ConnectionState;
  private currentRoom: RoomJoinedEvent | null = null;
  private latestRoomState: RoomStateEvent | null = null;
  private busy = false;
  private sessionReplaced = false;
  private statusMessage: string | null = null;
  private storedSession: StoredRoomSession | null;

  constructor(game: Game, client = new MultiplayerClient()) {
    this.game = game;
    this.client = client;
    this.game.setMultiplayerClient(client);
    this.game.setMultiplayerStartHandler(() => {
      this.client.sendSessionStart();
      this.tip.textContent = 'Requested a new co-op run from the room server.';
      this.renderStatus();
    });
    this.connectionState = {
      status: 'idle',
      url: client.getServerUrl(),
    };
    this.storedSession = loadStoredRoomSession();
  }

  initialize(): void {
    this.playerNameInput.value = this.storedSession?.playerName ?? '';
    this.roomCodeInput.value = this.storedSession?.roomCode ?? '';
    this.roomCodeInput.addEventListener('input', () => {
      this.roomCodeInput.value = this.roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    });

    this.createRoomButton.addEventListener('click', () => {
      void this.runRoomAction(async () => {
        const joined = await this.client.createRoom(this.playerNameInput.value);
        this.applyRoomJoined(joined);
      });
    });

    this.joinRoomButton.addEventListener('click', () => {
      void this.runRoomAction(async () => {
        const joined = await this.client.joinRoom(this.roomCodeInput.value, this.playerNameInput.value);
        this.applyRoomJoined(joined);
      });
    });

    this.reconnectButton.addEventListener('click', () => {
      const storedSession = this.storedSession;

      if (!storedSession) {
        return;
      }

      void this.runRoomAction(async () => {
        const joined = await this.client.reconnect(storedSession.roomCode, storedSession.sessionToken);
        this.applyRoomJoined(joined);
      });
    });

    this.client.subscribe({
      onConnectionStateChange: (state) => {
        this.connectionState = state;
        if (state.status === 'closed') {
          this.statusMessage = null;
          this.currentRoom = null;
          this.latestRoomState = null;

          if (this.sessionReplaced) {
            this.game.setMultiplayerStartHandler(null);
          } else {
            this.game.handleMultiplayerDisconnected();
            this.game.setMultiplayerStartHandler(() => {
              const storedSession = this.storedSession;

              if (!storedSession) {
                return;
              }

              void this.runRoomAction(async () => {
                const joined = await this.client.reconnect(storedSession.roomCode, storedSession.sessionToken);
                this.applyRoomJoined(joined);
              });
            });
            this.tip.textContent = this.storedSession
              ? `Disconnected from room ${this.storedSession.roomCode}. Use reconnect to resume.`
              : 'Disconnected from the room server.';
          }
        }
        this.renderStatus();
      },
      onRoomJoined: (event) => {
        this.statusMessage = null;
        this.currentRoom = event;
        this.latestRoomState = event.room;
        this.renderStatus();
      },
      onRoomState: (roomState) => {
        this.latestRoomState = roomState;
        this.renderStatus();
      },
      onSnapshot: (snapshot) => {
        this.game.applyReplicatedSnapshot(snapshot);
      },
      onError: (error) => {
        this.handleServerError(error);
      },
    });

    this.tip.textContent = 'Create or join a co-op room before entering the arena.';
    this.renderStatus();
  }

  private async runRoomAction(action: () => Promise<void>): Promise<void> {
    if (this.busy) {
      return;
    }

    this.busy = true;
    this.statusMessage = null;
    this.renderStatus();

    try {
      await action();
    } catch (error) {
      this.statusMessage = error instanceof Error ? error.message : 'Room action failed.';
    } finally {
      this.busy = false;
      this.renderStatus();
    }
  }

  private applyRoomJoined(joined: RoomJoinedEvent): void {
    const playerName = this.playerNameInput.value.trim() || this.storedSession?.playerName || 'Player';

    this.sessionReplaced = false;
    this.statusMessage = null;
    this.currentRoom = joined;
    this.latestRoomState = joined.room;
    this.roomCodeInput.value = joined.roomCode;

    this.storedSession = {
      matchId: joined.matchId,
      playerId: joined.playerId,
      roomCode: joined.roomCode,
      sessionToken: joined.sessionToken,
      playerName,
    };
    saveStoredRoomSession(this.storedSession);

    this.game.setMatchContext({
      matchId: joined.matchId,
      playerId: joined.playerId,
      roomCode: joined.roomCode,
    });
    this.game.syncLocalInputSequence(joined.lastInputSequence);
    this.game.applyReplicatedSnapshot(joined.snapshot);
    this.game.setMultiplayerStartHandler(() => {
      this.client.sendSessionStart();
      this.tip.textContent = 'Requested a new co-op run from the room server.';
      this.renderStatus();
    });

    this.tip.textContent = joined.reconnected
      ? `Reconnected to room ${joined.roomCode}. Enter the arena when ready.`
      : `Room ${joined.roomCode} linked. Enter the arena when ready.`;

    this.renderStatus();
  }

  private handleServerError(error: ServerErrorEvent): void {
    this.statusMessage = error.message;

    if (error.code === 'session_not_found' || error.code === 'session_expired' || error.code === 'room_expired') {
      this.sessionReplaced = false;
      this.client.clearRoomState();
      clearStoredRoomSession();
      this.storedSession = null;
      this.currentRoom = null;
      this.latestRoomState = null;
      this.game.handleMultiplayerDisconnected('Enter Arena', 'Saved room session expired. Create or join a room again.');
      this.game.setMultiplayerStartHandler(null);
      this.tip.textContent = 'Saved room session expired. Create or join a room again.';
    }

    if (error.code === 'session_replaced') {
      this.sessionReplaced = true;
      this.client.clearRoomState();
      this.currentRoom = null;
      this.latestRoomState = null;
      this.game.handleMultiplayerDisconnected('Reconnect', 'This room session was resumed from another browser or tab.');
      this.game.setMultiplayerStartHandler(null);
      this.tip.textContent = 'This room session was resumed from another browser or tab.';
    }

    this.renderStatus();
  }

  private renderStatus(): void {
    const roomReady = this.currentRoom !== null && this.connectionState.status === 'connected';
    const hasJoinedRoom = this.currentRoom !== null;
    const canReconnect = this.storedSession !== null && !roomReady && !this.sessionReplaced;
    const disconnectedReconnectMode = this.connectionState.status === 'closed' && this.storedSession !== null && !this.sessionReplaced;

    this.startButton.disabled = !(roomReady || disconnectedReconnectMode);
    this.createRoomButton.disabled = this.busy || hasJoinedRoom;
    this.joinRoomButton.disabled = this.busy || hasJoinedRoom;
    this.playerNameInput.disabled = this.busy || hasJoinedRoom;
    this.roomCodeInput.disabled = this.busy || hasJoinedRoom;
    this.reconnectButton.disabled = this.busy;
    this.reconnectButton.classList.toggle('hidden', !canReconnect);

    if (this.busy) {
      this.sessionStatus.textContent = 'Contacting the room server...';
    } else if (roomReady && this.currentRoom) {
      this.sessionStatus.textContent = `Connected to room ${this.currentRoom.roomCode}.`;
    } else if (this.statusMessage) {
      this.sessionStatus.textContent = this.statusMessage;
    } else {
      this.sessionStatus.textContent = describeConnectionState(this.connectionState);
    }

    if (this.latestRoomState) {
      const connectedPlayers = this.latestRoomState.players.filter((player) => player.connected).length;
      const tick = this.client.getLatestSnapshot()?.tick ?? this.latestRoomState.tick;
      this.roomMeta.textContent = `Room ${this.latestRoomState.roomCode} · ${connectedPlayers}/${this.latestRoomState.maxPlayers} connected · sync tick ${tick}`;
    } else if (canReconnect && this.storedSession) {
      this.roomMeta.textContent = `Saved reconnect available for room ${this.storedSession.roomCode}.`;
    } else {
      this.roomMeta.textContent = `Server target: ${this.client.getServerUrl()}`;
    }

    this.reconnectButton.textContent = this.storedSession
      ? `Reconnect ${this.storedSession.roomCode}`
      : 'Reconnect';
  }
}

function describeConnectionState(state: ConnectionState): string {
  switch (state.status) {
    case 'idle':
      return 'Create a room or join with a 6-character code.';
    case 'connecting':
      return 'Connecting to the room server...';
    case 'connected':
      return 'Connected to the room server. Choose a room action.';
    case 'closed':
      return 'Room server connection closed. Reconnect or create a new room.';
    case 'error':
      return 'Unable to reach the room server. Check that the backend is running.';
  }
}
