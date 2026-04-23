# Copilot Instructions For Neon Doom Pit

This repository is a small TypeScript three.js FPS prototype. Optimize for maintainability and gameplay fidelity, not framework cleverness.

## Project Shape

- Browser entry point: `apps/web/src/main.ts`
- Main coordinator: `apps/web/src/core/Game.ts`
- Static world construction: `apps/web/src/world/*`
- Runtime entities: `apps/web/src/entities/*`
- Gameplay orchestration systems: `apps/web/src/systems/*`
- Shared constants: `apps/web/src/config/*`
- Multiplayer contracts: `packages/shared/src/*`

## Rules

- Use `pnpm`, never `npm` or `yarn`
- Keep changes small and understandable
- Preserve existing gameplay feel unless explicitly asked to change it
- Do not introduce unnecessary dependencies
- Keep decorative, non-interactive meshes in the world layer
- Use `GameObject`-style classes for meaningful runtime entities only
- Prefer typed config + focused subclasses over large switch-heavy monoliths

## Extension Patterns

- New monsters should extend `Monster` and be registered in `MonsterFactory.ts`
- New player-facing HUD interactions should go through `HudSystem`
- New wave/progression rules should usually live in `WaveSystem`
- New scene geometry should usually be added in `ArenaFactory` or `GameWorld`
- New collision rules should reuse `Collider` and helpers in `apps/web/src/utils/math.ts`

## Verification

After non-trivial edits, run:

```bash
pnpm build
```

For gameplay edits, prefer an additional manual run with `pnpm dev`.

## Avoid

- building an ECS
- adding a physics engine without a clear need
- moving too much logic into one file
- inventing generic abstractions before there is a second real use case
