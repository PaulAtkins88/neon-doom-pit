import * as THREE from 'three';
import { createEntityId, type EntityId } from '@neon/shared';
import type { Disposable } from '../core/contracts';

/**
 * Base runtime object for meaningful game entities.
 * Static decorative meshes stay in the world layer, while interactive objects derive from this class.
 */
export abstract class GameObject implements Disposable {
  readonly id: EntityId;
  readonly object3D: THREE.Object3D;
  alive = true;

  /** Associates an object wrapper with a three.js object for scene and raycast lookups. */
  protected constructor(object3D: THREE.Object3D, id: EntityId = createEntityId()) {
    this.id = id;
    this.object3D = object3D;
    this.object3D.userData.entity = this;
    this.object3D.userData.entityId = id;
  }

  /** Removes the object from the scene graph and marks it as inactive. */
  dispose(): void {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    this.object3D.removeFromParent();
  }
}
