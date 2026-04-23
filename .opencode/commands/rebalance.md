---
description: Rebalance waves or enemies
agent: build
---
Rebalance Neon Doom Pit according to the requested goal.

First inspect:
- `apps/web/src/config/monsterConfigs.ts`
- `apps/web/src/config/gameConfig.ts`
- `apps/web/src/systems/WaveSystem.ts`

Requirements:
- Prefer config tuning before architectural changes
- Preserve the short arena-run format
- Keep changes easy to iterate on in future sessions
- Summarize the player-facing gameplay effect of the rebalance

Validation:
- Run `pnpm build`
