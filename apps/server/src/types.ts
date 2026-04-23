import type {
  ClientMessage,
  EntityId,
  MatchId,
  MatchSnapshot,
  MonsterKind,
  PickupType,
  PlayerId,
  PlayerSnapshot,
  ProjectileOwner,
  RoomCode,
  ServerMessage,
  SessionSnapshot,
  SessionToken,
  Vector3Like,
} from '@neon/shared';

export interface PlayerInputState {
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  sprint: boolean;
  shooting: boolean;
  reloadRequested: boolean;
}

export interface PlayerSimulationState {
  position: Vector3Like;
  yaw: number;
  health: number;
  ammo: number;
  weapon: PlayerSnapshot['weapon'];
  shotgunCharges: number;
  kills: number;
  reloadTimer: number;
  fireCooldown: number;
}

export interface SessionRecord {
  token: SessionToken;
  playerId: PlayerId;
  entityId: EntityId;
  playerName: string;
  spawnIndex: number;
  connected: boolean;
  lastSeenAt: number;
  disconnectedAt: number | null;
  lastInputSequence: number;
  input: PlayerInputState;
  simulation: PlayerSimulationState;
}

export interface MonsterSimulationState {
  id: EntityId;
  type: MonsterKind;
  position: Vector3Like;
  health: number;
  radius: number;
  speed: number;
  sightRange: number;
  attackRange: number;
  keepDistance: number;
  meleeDamage: number;
  projectileSpeed: number;
  projectileCooldown: number;
  projectileRadius: number;
  projectileTtl: number;
  attackCooldown: number;
  bob: number;
  alive: boolean;
}

export interface ProjectileSimulationState {
  id: EntityId;
  owner: ProjectileOwner;
  sourceEntityId?: EntityId;
  position: Vector3Like;
  previousPosition: Vector3Like;
  velocity: Vector3Like;
  damage: number;
  radius: number;
  ttl: number;
}

export interface PickupSimulationState {
  id: EntityId;
  type: PickupType;
  position: Vector3Like;
  active: boolean;
}

export interface RoomRecord {
  matchId: MatchId;
  roomCode: RoomCode;
  sessions: Map<SessionToken, SessionRecord>;
  sessionOrder: SessionToken[];
  tick: number;
  snapshot: MatchSnapshot;
  sessionState: SessionSnapshot;
  runRequested: boolean;
  monsterQueue: MonsterKind[];
  monsters: MonsterSimulationState[];
  pickups: PickupSimulationState[];
  projectiles: ProjectileSimulationState[];
}

export interface ConnectionContext {
  roomCode: RoomCode;
  sessionToken: SessionToken;
}

export type RoomJoinedPayload = Extract<ServerMessage, { type: 'room_joined' }>['payload'];
export type RoomCommandMessage = Extract<ClientMessage, { type: 'command' }>;
