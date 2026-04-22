# Repository Guide

- Use `pnpm` for package work; this repo tracks `pnpm-lock.yaml`.
- The app is a single Vite entry: `index.html` loads `src/main.ts`, which imports `src/style.css`.
- There are no repo scripts for test, lint, typecheck, or codegen in `package.json`; `pnpm build` is the main verification step.
- `pnpm dev` starts the browser game locally and `pnpm preview` serves the production build.
- The gameplay runtime is centered on `src/core/Game.ts`, with focused files under `src/world`, `src/entities`, `src/systems`, `src/config`, and `src/utils`.
- Treat `Player`, `Monster`, and `Projectile` as the meaningful `GameObject`-style runtime entities. Static arena geometry should usually stay in the world layer.
- New monster types should extend `src/entities/monsters/Monster.ts` and register in `src/entities/monsters/MonsterFactory.ts`.
- `src/config/monsterConfigs.ts` and `src/config/gameConfig.ts` are the first place to look for gameplay tuning.
- Keep changes small and verify the game still boots, renders, and accepts pointer lock after edits.
