# Neon Doom Pit

![Neon Doom Pit title screen](public/neon-doom-pit-title.png)

Neon Doom Pit is a small browser FPS prototype built with Vite, TypeScript, and three.js. The game keeps a deliberately compact scope: one arena, short wave-based combat, pointer-lock controls, hitscan shooting, simple enemy AI, and a HUD/overlay flow that fits fast iteration.

It started as a quick experiment in what a simple prompt to a coding agent could produce, then turned into a small game worth polishing and sharing.

## Stack

- TypeScript
- Vite
- three.js
- `PointerLockControls`
- `pnpm`

## Public Repo Notes

- Code license: MIT
- Included sprite assets: derived from Kenney packs and kept in `public/sprites/`
- Kenney asset license: CC0 / public domain

## Play Online

- GitHub Pages: `https://paulatkins88.github.io/neon-doom-pit/`

The Pages build deploys automatically from `main` via GitHub Actions.

## Scripts

- `pnpm dev`: run the local development server
- `pnpm build`: production build and main verification command
- `pnpm preview`: preview the production build locally

## Gameplay Summary

- Click the overlay button or canvas to enter pointer lock
- Move with `W`, `A`, `S`, `D`
- Hold `Shift` to sprint
- Click to fire
- Press `R` to reload
- Survive three waves to clear the arena

## Architecture

The codebase is intentionally split into a few small layers rather than a large engine.

### Entry

- `src/main.ts`
  - boots the game runtime

### Core

- `src/core/Game.ts`
  - top-level coordinator for boot, loop, input wiring, wave flow, and restart/game-over transitions
- `src/core/GameState.ts`
  - mutable run/session state used by the loop
- `src/core/contracts.ts`
  - shared interfaces like `Collider` and `Damageable`

### World

- `src/world/GameWorld.ts`
  - owns the scene, arena bounds, colliders, and spawn point data
- `src/world/ArenaFactory.ts`
  - builds static arena geometry, lighting, altar, exit marker, guide path, and decorative sprite props

### Render

- `src/render/assets.ts`
  - shared texture loading and caching for sprite assets
- `src/render/billboards.ts`
  - camera-facing billboard helper for pickups, projectiles, monsters, and props

### Entities

- `src/entities/GameObject.ts`
  - base class for meaningful runtime objects
- `src/entities/Actor.ts`
  - base class for damageable objects with health and radius
- `src/entities/Player.ts`
  - player movement, combat state, reloads, and first-person gun mesh
- `src/entities/Pickup.ts`
  - floating pickup entity and collision logic
- `src/entities/Projectile.ts`
  - projectile lifetime and hit logic
- `src/entities/monsters/Monster.ts`
  - shared enemy behavior base
- `src/entities/monsters/*.ts`
  - concrete monster subclasses for each enemy type
- `src/entities/monsters/MonsterFactory.ts`
  - typed factory for monster creation

### Systems

- `src/systems/InputSystem.ts`
  - browser input listeners and tracked key state
- `src/systems/HudSystem.ts`
  - DOM/HUD/overlay updates and flashes
- `src/systems/CombatSystem.ts`
  - hitscan shooting and projectile collision resolution
- `src/systems/WaveSystem.ts`
  - wave composition, respawns, and victory transition timing

### Config and Utilities

- `src/config/gameConfig.ts`
  - arena and player constants
- `src/config/monsterConfigs.ts`
  - typed monster stats and visuals
- `src/config/spriteConfig.ts`
  - sprite file paths, sizing, and billboard tuning for pickups, monsters, props, and projectiles
- `src/utils/math.ts`
  - small math/collision helpers

## Design Rules

- Keep the architecture pragmatic. This is not a general-purpose engine.
- Treat meaningful runtime actors as `GameObject`-style entities.
- Prefer composition and focused helpers before introducing broad abstraction layers.
- Preserve game feel unless a change is necessary for correctness or maintainability.
- Keep static decorative geometry in the world layer unless it gains interactive behavior.
- Prefer typed config and small subclass overrides over large conditional blocks.

## Monster Extension Pattern

Current monster design is intentionally extension-friendly without overengineering.

- Shared base behavior lives in `Monster`
- Type-specific behavior lives in subclasses such as `GruntMonster` and `SpitterMonster`
- Shared reusable movement/visual helpers live in `entities/monsters/behaviors.ts`
- Future status effects can use `MonsterEffectHook`

When adding a new enemy type:

1. Add its typed config in `src/config/monsterConfigs.ts`
2. Create a subclass in `src/entities/monsters/`
3. Override only the movement/attack behavior that actually differs
4. Register it in `MonsterFactory.ts`
5. Add it to `WaveSystem` if it should spawn in normal waves

## Recommended Workflow

1. Read the relevant runtime files first
2. Keep edits small and local
3. Reuse existing config/constants and factory patterns
4. Prefer `pnpm build` after non-trivial changes
5. For gameplay changes, manually test with `pnpm dev` when practical

## Agent Prompt Pack

Reusable prompt templates for OpenCode, Claude, Copilot Chat, or custom slash commands live in:

- `docs/prompt-pack.md`

## OpenCode Commands

OpenCode command files live in:

- `.opencode/commands/`

Included commands:

- `/add-monster`
- `/add-weapon`
- `/rebalance`
- `/add-pickup`
- `/edit-arena`
- `/fix-gameplay`
- `/refactor-safe`
- `/add-monster-effect`
- `/sync-docs`
- `/plan-feature`

## Verification Expectations

Minimum:

- `pnpm build`

For gameplay-heavy changes, also verify manually:

- game boots
- pointer lock works
- player can move and shoot
- HUD updates correctly
- enemies spawn, attack, and die
- wave progression still completes

## Asset Credits

Included sprites in `public/sprites/` were derived from open-license Kenney packs during development, primarily `Space Shooter Redux` and `Particle Pack`.

- Kenney: https://kenney.nl/assets/space-shooter-redux
- Kenney: https://kenney.nl/assets/particle-pack

Those Kenney packs are distributed under CC0, which makes them a good fit for a public demo repository.

## Future Work Ideas

- weapon abstraction for multiple guns
- pickups and power-ups as additional `GameObject` types
- richer monster effects using `MonsterEffectHook`
- multiple arenas or encounter layouts via additional world builders
