import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

function resolvePublicPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

/** Loads and caches a sprite texture with crisp filtering defaults. */
export function getSpriteTexture(path: string): THREE.Texture {
  const cached = textureCache.get(path);
  if (cached) {
    return cached;
  }

  const texture = textureLoader.load(resolvePublicPath(path));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(path, texture);
  return texture;
}
