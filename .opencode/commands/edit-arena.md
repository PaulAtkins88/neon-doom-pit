---
description: Add or modify arena geometry
agent: build
---
Modify the arena layout or visuals in Neon Doom Pit.

First inspect:
- `apps/web/src/world/ArenaFactory.ts`
- `apps/web/src/world/GameWorld.ts`
- `apps/web/src/config/gameConfig.ts`

Requirements:
- Preserve pointer-lock FPS readability and movement flow
- Keep collision data consistent with the visual geometry
- Put static construction in `ArenaFactory` or `GameWorld`
- Avoid turning static geometry into entities unless gameplay requires it
- Preserve the current visual language unless asked to redesign it
- Add or update JSDoc on touched non-trivial code

Validation:
- Run `pnpm build`
