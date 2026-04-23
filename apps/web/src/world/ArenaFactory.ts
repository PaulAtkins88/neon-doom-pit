import * as THREE from 'three';
import { PROP_SPRITES } from '../config/spriteConfig';
import { ARENA_BOUNDS, LEVEL_WALLS } from '../config/gameConfig';
import type { Collider, WallDefinition } from '../core/contracts';
import { createBillboard } from '../render/billboards';

export interface ArenaBuildResult {
  colliders: Collider[];
}

/** Creates a collision wall and adds its bounds to the arena collider list. */
function createWall(scene: THREE.Scene, colliders: Collider[], wall: WallDefinition, color = 0x4d2a1f): void {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(wall.w, 4.5, wall.d),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0.05 }),
  );

  mesh.position.set(wall.x, 2.25, wall.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  colliders.push({
    minX: wall.x - wall.w / 2,
    maxX: wall.x + wall.w / 2,
    minZ: wall.z - wall.d / 2,
    maxZ: wall.z + wall.d / 2,
  });
}

/** Creates a square pillar that blocks movement. */
function createPillar(scene: THREE.Scene, colliders: Collider[], x: number, z: number, size: number, color: number): void {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, 5, size),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }),
  );

  mesh.position.set(x, 2.5, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  colliders.push({
    minX: x - size / 2,
    maxX: x + size / 2,
    minZ: z - size / 2,
    maxZ: z + size / 2,
  });
}

/** Builds the four perimeter walls and their corner markers. */
function createArenaBoundaryWalls(scene: THREE.Scene, colliders: Collider[]): void {
  const width = ARENA_BOUNDS.maxX - ARENA_BOUNDS.minX + 1.4;
  const depth = ARENA_BOUNDS.maxZ - ARENA_BOUNDS.minZ + 1.4;

  createWall(scene, colliders, { x: 0, z: ARENA_BOUNDS.maxZ + 0.7, w: width, d: 1.4 }, 0x2b0e22);
  createWall(scene, colliders, { x: 0, z: ARENA_BOUNDS.minZ - 0.7, w: width, d: 1.4 }, 0x2b0e22);
  createWall(scene, colliders, { x: ARENA_BOUNDS.minX - 0.7, z: -12, w: 1.4, d: depth }, 0x2b0e22);
  createWall(scene, colliders, { x: ARENA_BOUNDS.maxX + 0.7, z: -12, w: 1.4, d: depth }, 0x2b0e22);

  [
    [ARENA_BOUNDS.minX, ARENA_BOUNDS.minZ],
    [ARENA_BOUNDS.minX, ARENA_BOUNDS.maxZ],
    [ARENA_BOUNDS.maxX, ARENA_BOUNDS.minZ],
    [ARENA_BOUNDS.maxX, ARENA_BOUNDS.maxZ],
  ].forEach(([x, z]) => {
    createPillar(scene, colliders, x, z, 2.2, 0x4b1f35);
    createPillar(scene, colliders, x, z, 1.1, 0xff7a2f);
  });
}

/** Adds the exit arch and glowing sigil beyond the altar. */
function createExitMarker(scene: THREE.Scene): void {
  const arch = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x5b1b31, emissive: 0x19060d, flatShading: true, roughness: 0.9 });
  const glowMaterial = new THREE.MeshStandardMaterial({ color: 0xff7a2f, emissive: 0xff7a2f, emissiveIntensity: 1.8, flatShading: true });

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.4, 0.9), baseMaterial);
  left.position.set(-3.2, 2.2, -23.5);

  const right = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.4, 0.9), baseMaterial);
  right.position.set(3.2, 2.2, -23.5);

  const top = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.9, 1.1), baseMaterial);
  top.position.set(0, 4.45, -23.5);

  const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), glowMaterial);
  sigil.position.set(0, 2.1, -23.2);

  const exitLight = new THREE.PointLight(0xff7a2f, 12, 18, 2);
  exitLight.position.set(0, 3.2, -23.2);

  arch.add(left, right, top, sigil, exitLight);
  scene.add(arch);
}

/** Adds the emissive floor strips that guide the player toward the altar. */
function createGuidingPath(scene: THREE.Scene): void {
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc561,
    emissive: 0xff7a2f,
    emissiveIntensity: 2,
    flatShading: true,
    roughness: 0.25,
    metalness: 0.05,
  });

  const pathSegments = [
    { x: 0, z: 5.5, w: 1.0, d: 2.4 },
    { x: 0, z: 2.5, w: 1.0, d: 2.4 },
    { x: 0, z: -0.5, w: 1.0, d: 2.4 },
    { x: 0, z: -3.5, w: 1.0, d: 2.4 },
    { x: 0, z: -6.5, w: 1.0, d: 2.4 },
    { x: 0, z: -9.5, w: 1.0, d: 2.4 },
    { x: 0, z: -12.5, w: 1.0, d: 2.4 },
    { x: 0, z: -15.3, w: 1.2, d: 2.8 },
    { x: 0, z: -18.3, w: 1.2, d: 2.8 },
    { x: 0, z: -21.3, w: 1.4, d: 3.0 },
  ];

  pathSegments.forEach(({ x, z, w, d }) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), pathMaterial);
    strip.position.set(x, 0.035, z);
    strip.receiveShadow = true;
    scene.add(strip);
  });

  [
    { x: -2.2, z: -5.5 },
    { x: 2.2, z: -5.5 },
    { x: -2.2, z: -11.5 },
    { x: 2.2, z: -11.5 },
    { x: -2.2, z: -17.5 },
    { x: 2.2, z: -17.5 },
  ].forEach(({ x, z }) => {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.9), pathMaterial);
    marker.position.set(x, 0.03, z);
    marker.rotation.y = Math.PI / 2;
    scene.add(marker);
  });
}

/** Adds a few lightweight billboard props to break up the arena silhouette. */
function createDecorProps(scene: THREE.Scene): void {
  const props = [
    { x: -18.5, z: 3.5, sprite: PROP_SPRITES.debrisGrey, scale: 1.0 },
    { x: 18.0, z: 2.0, sprite: PROP_SPRITES.debrisBrown, scale: 1.05 },
    { x: -17.5, z: -14.5, sprite: PROP_SPRITES.debrisBrown, scale: 0.95 },
    { x: 17.5, z: -12.5, sprite: PROP_SPRITES.debrisGrey, scale: 0.9 },
    { x: -8.5, z: -28.5, sprite: PROP_SPRITES.debrisGrey, scale: 1.05 },
    { x: 9.0, z: -29.5, sprite: PROP_SPRITES.debrisBrown, scale: 1.1 },
  ];

  props.forEach(({ x, z, sprite, scale }) => {
    const mesh = createBillboard({
      path: sprite.path,
      size: { width: sprite.width * scale, height: sprite.height * scale },
      alphaTest: sprite.alphaTest,
      depthWrite: sprite.depthWrite,
    });
    mesh.position.set(x, (sprite.height * scale) / 2, z);
    scene.add(mesh);
  });
}

/**
 * Builds the complete static arena.
 * This is intentionally render-focused and leaves gameplay state to higher-level systems.
 */
export function buildArena(scene: THREE.Scene): ArenaBuildResult {
  const colliders: Collider[] = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 50, 26, 25),
    new THREE.MeshStandardMaterial({ color: 0x2b1f1d, flatShading: true, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -15);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 50),
    new THREE.MeshStandardMaterial({ color: 0x1c1013, side: THREE.DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 7, -15);
  scene.add(ceiling);

  const grid = new THREE.GridHelper(52, 26, 0xff8c3f, 0x5e241b);
  grid.position.set(0, 0.02, -15);
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.opacity = 0.24;
    material.transparent = true;
  });
  scene.add(grid);

  LEVEL_WALLS.forEach((wall, index) => {
    createWall(scene, colliders, wall, index % 2 === 0 ? 0x603327 : 0x44211d);
  });

  createArenaBoundaryWalls(scene, colliders);
  createExitMarker(scene);
  createGuidingPath(scene);
  createDecorProps(scene);
  createPillar(scene, colliders, -12, -12, 2.5, 0x7d5536);
  createPillar(scene, colliders, 12, -16, 2.8, 0x774130);
  createPillar(scene, colliders, -11.5, -24, 3.2, 0x623126);
  createPillar(scene, colliders, 11.5, -24, 3.2, 0x623126);

  const altar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 3.1, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xb8561a, emissive: 0x3f1400, flatShading: true }),
  );
  altar.position.set(0, 0.7, -21.0);
  altar.castShadow = true;
  altar.receiveShadow = true;
  scene.add(altar);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.MeshStandardMaterial({ color: 0xffd36f, emissive: 0xff7a2f, emissiveIntensity: 1.8, flatShading: true }),
  );
  crystal.position.set(0, 3.6, -21.0);
  crystal.castShadow = true;
  scene.add(crystal);

  scene.add(new THREE.AmbientLight(0xffb870, 0.55));

  const sun = new THREE.DirectionalLight(0xffddb3, 1.4);
  sun.position.set(8, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  scene.add(sun);

  const lavaGlow = new THREE.PointLight(0xff6520, 22, 40, 2);
  lavaGlow.position.set(0, 3.5, -21.0);
  scene.add(lavaGlow);

  const entranceGlow = new THREE.PointLight(0xffc561, 8, 18, 2);
  entranceGlow.position.set(0, 3.2, 7);
  scene.add(entranceGlow);

  return { colliders };
}
