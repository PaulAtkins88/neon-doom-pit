# Repository Guide

- Use `pnpm` for package work; this repo tracks `pnpm-lock.yaml`.
- The browser app lives in `apps/web`: `apps/web/index.html` loads `apps/web/src/main.ts`, which imports `apps/web/src/style.css`.
- There are no repo scripts for test, lint, typecheck, or codegen in `package.json`; `pnpm build` is the main verification step.
- `pnpm dev` starts the browser game locally and `pnpm preview` serves the production build.
- The gameplay runtime is centered on `apps/web/src/core/Game.ts`, with focused files under `apps/web/src/world`, `apps/web/src/entities`, `apps/web/src/systems`, `apps/web/src/config`, and `apps/web/src/utils`.
- Treat `Player`, `Monster`, and `Projectile` as the meaningful `GameObject`-style runtime entities. Static arena geometry should usually stay in the world layer.
- New monster types should extend `apps/web/src/entities/monsters/Monster.ts` and register in `apps/web/src/entities/monsters/MonsterFactory.ts`.
- `apps/web/src/config/monsterConfigs.ts` and `apps/web/src/config/gameConfig.ts` are the first place to look for gameplay tuning.
- Keep changes small and verify the game still boots, renders, and accepts pointer lock after edits.
