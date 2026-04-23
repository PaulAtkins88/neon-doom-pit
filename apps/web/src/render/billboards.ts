import * as THREE from 'three';
import { getSpriteTexture } from './assets';

export interface BillboardOptions {
  readonly path: string;
  readonly size: { width: number; height: number };
  readonly color?: number;
  readonly emissive?: number;
  readonly emissiveIntensity?: number;
  readonly opacity?: number;
  readonly alphaTest?: number;
  readonly depthWrite?: boolean;
  readonly additive?: boolean;
}

/** Creates a camera-facing cutout plane for world-space sprite rendering. */
export function createBillboard(options: BillboardOptions): THREE.Mesh {
  const texture = getSpriteTexture(options.path);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: options.color ?? 0xffffff,
    transparent: true,
    opacity: options.opacity ?? 1,
    alphaTest: options.alphaTest ?? 0.35,
    depthWrite: options.depthWrite ?? false,
    blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    fog: true,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(options.size.width, options.size.height), material);
  mesh.renderOrder = options.additive ? 2 : 1;

  if (options.emissive) {
    mesh.add(new THREE.PointLight(options.emissive, options.emissiveIntensity ?? 0.9, Math.max(options.size.width, options.size.height) * 3.5, 2));
  }

  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    mesh.quaternion.copy(camera.quaternion);
  };

  return mesh;
}
