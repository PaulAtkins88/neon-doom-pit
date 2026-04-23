import type { MatchSnapshot } from './match';
import type { MatchId, PlayerId, RoomCode, SessionToken } from './ids';

export interface CreateRoomRequest {
  playerName?: string;
}

export interface JoinRoomRequest {
  roomCode: RoomCode;
  playerName?: string;
  sessionToken?: SessionToken;
}

export interface ReconnectRequest {
  roomCode: RoomCode;
  sessionToken: SessionToken;
}

export interface PlayerInputCommand {
  type: 'player_input';
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  sprint: boolean;
  shooting: boolean;
  reloadRequested: boolean;
  sequence: number;
}

export interface SessionStartCommand {
  type: 'session_start';
}

export type ClientCommand = PlayerInputCommand | SessionStartCommand;

export type ClientMessage =
  | { type: 'create_room'; payload: CreateRoomRequest }
  | { type: 'join_room'; payload: JoinRoomRequest }
  | { type: 'reconnect'; payload: ReconnectRequest }
  | { type: 'command'; payload: ClientCommand };

export interface RoomJoinedEvent {
  roomCode: RoomCode;
  matchId: MatchId;
  playerId: PlayerId;
  sessionToken: SessionToken;
  reconnected: boolean;
  lastInputSequence: number;
  room: RoomStateEvent;
  snapshot: MatchSnapshot;
}

export interface RoomPlayerState {
  playerId: PlayerId;
  connected: boolean;
}

export interface RoomStateEvent {
  matchId: MatchId;
  roomCode: RoomCode;
  maxPlayers: number;
  players: RoomPlayerState[];
  tick: number;
}

export type ServerErrorCode =
  | 'invalid_message'
  | 'invalid_room_code'
  | 'room_not_found'
  | 'room_expired'
  | 'room_full'
  | 'session_not_found'
  | 'session_expired'
  | 'session_replaced'
  | 'not_joined';

export interface ServerErrorEvent {
  code: ServerErrorCode;
  message: string;
}

export type ServerMessage =
  | { type: 'room_joined'; payload: RoomJoinedEvent }
  | { type: 'room_state'; payload: RoomStateEvent }
  | { type: 'snapshot'; payload: MatchSnapshot }
  | { type: 'error'; payload: ServerErrorEvent };
