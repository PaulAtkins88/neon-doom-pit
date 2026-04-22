# Claude Project Instructions

## What This Repo Is

Neon Doom Pit is a compact browser FPS prototype built with TypeScript, Vite, and three.js. The codebase was intentionally refactored away from a monolithic `main.js` file into a small layered architecture.

## Important File Map

- `src/core/Game.ts`: central game orchestration
- `src/world/GameWorld.ts`: owns scene, colliders, bounds, spawn points
- `src/world/ArenaFactory.ts`: builds static arena visuals
- `src/entities/Player.ts`: player movement/combat state
- `src/entities/Projectile.ts`: enemy projectiles
- `src/entities/monsters/*`: base monster plus concrete enemy subclasses
- `src/systems/HudSystem.ts`: HUD and overlay DOM logic
- `src/systems/InputSystem.ts`: keyboard/mouse listener setup
- `src/systems/CombatSystem.ts`: hitscan and projectile collision logic
- `src/systems/WaveSystem.ts`: wave construction and progression

## Working Style

- Prefer minimal, local changes
- Preserve gameplay behavior unless asked to redesign it
- Reuse typed config and existing helpers before adding new abstractions
- Use classes when they model runtime entities clearly
- Keep static world decoration outside the entity layer unless it gains gameplay logic

## Monster Design Guidance

- The monster model is class-based, not ECS-based
- `Monster` is the shared base class
- Concrete enemy types should be separate subclasses
- Shared movement or visuals can go in `entities/monsters/behaviors.ts`
- Future status or modifier systems should use the existing effect-hook seam before broader patterns are added

## Verification

Primary validation command:

```bash
pnpm build
```

For gameplay edits also check:

- pointer lock boot flow
- shooting/reload behavior
- enemy attacks and deaths
- wave completion and restart flow

## Avoid

- large generic frameworks
- unnecessary dependencies
- collapsing the refactor back into a single mega-file
- changing core visual feel without a reason
