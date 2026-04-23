import type { EntityId, MatchId, PlayerId, RoomCode } from './ids';

export type WeaponType = 'rifle' | 'shotgun';
export type PickupType = 'health' | 'shotgun';
export type ProjectileOwner = 'player' | 'enemy';
export type MonsterKind = 'grunt' | 'spitter' | 'charger' | 'imp';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface SessionSnapshot {
  active: boolean;
  gameOver: boolean;
  wave: number;
  enemyRespawnTimer: number;
  levelComplete: boolean;
  levelCompleteTimer: number;
  pickupRespawnTimer: number;
}

export interface PlayerSnapshot {
  id: PlayerId;
  entityId: EntityId;
  position: Vector3Like;
  yaw: number;
  health: number;
  ammo: number;
  weapon: WeaponType;
  shotgunCharges: number;
  kills: number;
  reloadTimer: number;
  fireCooldown: number;
}

export interface MonsterSnapshot {
  id: EntityId;
  type: MonsterKind;
  position: Vector3Like;
  health: number;
  alive: boolean;
}

export interface ProjectileSnapshot {
  id: EntityId;
  owner: ProjectileOwner;
  position: Vector3Like;
  velocity: Vector3Like;
  damage: number;
  radius: number;
}

export interface PickupSnapshot {
  id: EntityId;
  type: PickupType;
  position: Vector3Like;
  active: boolean;
}

export interface MatchSnapshot {
  matchId: MatchId;
  roomCode: RoomCode | null;
  tick: number;
  session: SessionSnapshot;
  players: PlayerSnapshot[];
  monsters: MonsterSnapshot[];
  projectiles: ProjectileSnapshot[];
  pickups: PickupSnapshot[];
}
