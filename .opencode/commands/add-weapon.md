---
description: Add a new weapon
agent: build
---
Add a new weapon to Neon Doom Pit.

First inspect:
- `src/entities/Player.ts`
- `src/systems/CombatSystem.ts`
- `src/systems/HudSystem.ts`
- `src/core/Game.ts`

Requirements:
- Preserve the existing weapon flow unless the request explicitly broadens it
- Only introduce a shared weapon abstraction if there is a real second-weapon need
- Keep the implementation readable and small
- Put hit resolution in the most appropriate place, usually `CombatSystem`
- Keep first-person visuals aligned with the current game style
- Add or update JSDoc on touched non-trivial code

Validation:
- Run `pnpm build`

In the summary include:
- whether a new abstraction was introduced or intentionally avoided
- files changed
- player-facing behavior changes
