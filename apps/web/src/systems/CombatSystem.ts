import * as THREE from 'three';
import { ENEMY_KILL_RESPAWN_DELAY, PLAYER_PROJECTILE_DAMAGE, PLAYER_PROJECTILE_HIT_PADDING, PLAYER_PROJECTILE_RADIUS, PLAYER_PROJECTILE_SPEED, PLAYER_PROJECTILE_TTL, PLAYER_SHOTGUN_PELLETS, PLAYER_SHOTGUN_SPREAD } from '../config/gameConfig';
import type { SessionState } from '../core/GameState';
import { createPlayerHudState } from '../core/matchSnapshot';
import type { Collider } from '../core/contracts';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { Monster } from '../entities/monsters/Monster';
import type { Pickup } from '../entities/Pickup';
import type { HudSystem } from './HudSystem';

/** Resolves player hitscan fire and enemy projectile collisions. */
export class CombatSystem {
  private readonly camera: THREE.PerspectiveCamera;

  /** Creates the combat system around the active camera for raycast shooting. */
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /** Resolves a player shot, including ammo, recoil, HUD messaging, and projectile spawning. */
  shoot(
    player: Player,
    state: SessionState,
    hud: HudSystem,
    launchProjectile: (direction: THREE.Vector3, damage?: number) => void,
  ): void {
    if (!state.active || state.gameOver || !player.canShoot()) {
      return;
    }

    if (player.ammo <= 0) {
      hud.showOutOfAmmo();
      player.beginEmptyReload();
      hud.updateHud(createPlayerHudState(player));
      return;
    }

    player.applyShot();
    hud.flashMuzzle();

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    if (player.weapon === 'shotgun' && player.shotgunCharges > 0) {
      player.shotgunCharges -= 1;
      for (let index = 0; index < PLAYER_SHOTGUN_PELLETS; index += 1) {
        const spreadDirection = direction.clone();
        spreadDirection.x += (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD;
        spreadDirection.y += (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD;
        spreadDirection.z += (Math.random() - 0.5) * PLAYER_SHOTGUN_SPREAD;
        spreadDirection.normalize();
        launchProjectile(spreadDirection, 1);
      }
    } else {
      launchProjectile(direction);
    }

    if (player.weapon === 'shotgun' && player.shotgunCharges <= 0) {
      player.weapon = 'rifle';
      hud.showPickup('Shotgun empty. Switched back to rifle.');
    }

    hud.updateHud(createPlayerHudState(player));
  }

  /** Updates live projectiles and applies damage when they hit their targets. */
  updateProjectiles(
    deltaSeconds: number,
    projectiles: Projectile[],
    player: Player,
    monsters: Monster[],
    colliders: Collider[],
    damagePlayer: (amount: number, message: string) => void,
    onEnemyKilled: (monster: Monster) => void,
    updateHud: () => void,
    setTip: (message: string) => void,
    setRespawnTimer: (seconds: number) => void,
    pickups: Pickup[],
    onPickupCollected: (pickup: Pickup) => void,
  ): void {
    for (let index = projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = projectiles[index];
      const status = projectile.update(deltaSeconds, colliders);

      if (status === 'active') {
        if (projectile.owner === 'enemy' && projectile.hitsTarget(player.object.position, player.radius)) {
          damagePlayer(projectile.damage, 'A firebolt slams into your armor.');
          projectile.dispose();
          projectiles.splice(index, 1);
          continue;
        }

        if (projectile.owner === 'player') {
          const hitMonster = monsters.find((monster) => monster.alive && projectile.hitsTarget(monster.object3D.position, monster.radius));
          if (hitMonster) {
            if (hitMonster.takeDamage(projectile.damage)) {
              player.kills += 1;
              setRespawnTimer(ENEMY_KILL_RESPAWN_DELAY);
              setTip(hitMonster.config.hitMessage);
              onEnemyKilled(hitMonster);
            } else {
              hitMonster.pulseEye(3.5);
            }

            projectile.dispose();
            projectiles.splice(index, 1);
            updateHud();
            continue;
          }
        }

        continue;
      }

      if (status === 'expired') {
        projectile.dispose();
        projectiles.splice(index, 1);
      }
    }

    for (let index = pickups.length - 1; index >= 0; index -= 1) {
      const pickup = pickups[index];
      if (!pickup.hitsTarget(player.object.position, player.radius)) {
        continue;
      }

      onPickupCollected(pickup);
      pickup.dispose();
      pickups.splice(index, 1);
    }
  }
}
