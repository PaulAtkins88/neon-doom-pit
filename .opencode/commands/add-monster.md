---
description: Add a new monster type
agent: build
---
Add a new monster to Neon Doom Pit.

First inspect:
- `src/entities/monsters/Monster.ts`
- `src/entities/monsters/MonsterFactory.ts`
- `src/entities/monsters/behaviors.ts`
- `src/config/monsterConfigs.ts`
- `src/systems/WaveSystem.ts`

Requirements:
- Implement the monster as a `Monster` subclass under `src/entities/monsters/`
- Add a typed config entry in `src/config/monsterConfigs.ts`
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
