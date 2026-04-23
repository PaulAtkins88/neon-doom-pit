---
description: Add a new monster type
agent: build
---
Add a new monster to Neon Doom Pit.

First inspect:
- `apps/web/src/entities/monsters/Monster.ts`
- `apps/web/src/entities/monsters/MonsterFactory.ts`
- `apps/web/src/entities/monsters/behaviors.ts`
- `apps/web/src/config/monsterConfigs.ts`
- `apps/web/src/systems/WaveSystem.ts`

Requirements:
- Implement the monster as a `Monster` subclass under `apps/web/src/entities/monsters/`
- Add a typed config entry in `apps/web/src/config/monsterConfigs.ts`
- Reuse shared helpers where appropriate
- Register the monster in `MonsterFactory.ts`
- Add it to wave spawning only if the request calls for it
- Preserve current game feel unless explicitly asked to change it
- Keep the change pragmatic and small
- Add or update JSDoc on touched non-trivial code

Validation:
- Run `pnpm build`

In the summary include:
- files changed
- monster behavior summary
- whether it was added to normal waves
