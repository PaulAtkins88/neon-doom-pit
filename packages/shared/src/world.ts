export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WallDefinition {
  x: number;
  z: number;
  w: number;
  d: number;
}

export const ARENA_BOUNDS: ArenaBounds = {
  minX: -26,
  maxX: 26,
  minZ: -40,
  maxZ: 10,
};

export const LEVEL_WALLS: WallDefinition[] = [];

export function createArenaColliders(): Collider[] {
  const colliders: Collider[] = [];
  const width = ARENA_BOUNDS.maxX - ARENA_BOUNDS.minX + 1.4;
  const depth = ARENA_BOUNDS.maxZ - ARENA_BOUNDS.minZ + 1.4;

  addWallCollider(colliders, { x: 0, z: ARENA_BOUNDS.maxZ + 0.7, w: width, d: 1.4 });
  addWallCollider(colliders, { x: 0, z: ARENA_BOUNDS.minZ - 0.7, w: width, d: 1.4 });
  addWallCollider(colliders, { x: ARENA_BOUNDS.minX - 0.7, z: -12, w: 1.4, d: depth });
  addWallCollider(colliders, { x: ARENA_BOUNDS.maxX + 0.7, z: -12, w: 1.4, d: depth });

  [
    [ARENA_BOUNDS.minX, ARENA_BOUNDS.minZ],
    [ARENA_BOUNDS.minX, ARENA_BOUNDS.maxZ],
    [ARENA_BOUNDS.maxX, ARENA_BOUNDS.minZ],
    [ARENA_BOUNDS.maxX, ARENA_BOUNDS.maxZ],
  ].forEach(([x, z]) => {
    addPillarCollider(colliders, x, z, 2.2);
    addPillarCollider(colliders, x, z, 1.1);
  });

  LEVEL_WALLS.forEach((wall) => addWallCollider(colliders, wall));
  addPillarCollider(colliders, -12, -12, 2.5);
  addPillarCollider(colliders, 12, -16, 2.8);
  addPillarCollider(colliders, -11.5, -24, 3.2);
  addPillarCollider(colliders, 11.5, -24, 3.2);

  return colliders;
}

export function circleIntersectsCollider(x: number, z: number, radius: number, collider: Collider): boolean {
  const nearestX = clamp(x, collider.minX, collider.maxX);
  const nearestZ = clamp(z, collider.minZ, collider.maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}

function addWallCollider(colliders: Collider[], wall: WallDefinition): void {
  colliders.push({
    minX: wall.x - wall.w / 2,
    maxX: wall.x + wall.w / 2,
    minZ: wall.z - wall.d / 2,
    maxZ: wall.z + wall.d / 2,
  });
}

function addPillarCollider(colliders: Collider[], x: number, z: number, size: number): void {
  colliders.push({
    minX: x - size / 2,
    maxX: x + size / 2,
    minZ: z - size / 2,
    maxZ: z + size / 2,
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
