---
description: Add a pickup or interactive object
agent: build
---
Add a new pickup or interactive object to Neon Doom Pit.

First inspect:
- `apps/web/src/entities/GameObject.ts`
- `apps/web/src/world/GameWorld.ts`
- `apps/web/src/core/Game.ts`
- `apps/web/src/systems/HudSystem.ts`

Requirements:
- If it has runtime behavior, model it as a `GameObject`-style entity
- If it is only decorative, keep it in the world layer instead
- Reuse existing collider and update-loop patterns
- Keep the change lightweight and gameplay-focused
- Add or update JSDoc on touched non-trivial code

Validation:
- Run `pnpm build`
