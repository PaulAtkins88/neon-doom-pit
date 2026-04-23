---
description: Add a monster modifier or status effect
agent: build
---
Add a monster modifier or status effect to Neon Doom Pit.

First inspect:
- `apps/web/src/entities/monsters/Monster.ts`
- `apps/web/src/entities/monsters/behaviors.ts`
- `apps/web/src/config/monsterConfigs.ts`

Requirements:
- Prefer the existing `MonsterEffectHook` seam first
- Do not build a large effect framework unless the request genuinely needs it
- Keep the design open for future extension but simple to read today
- Document the extension point clearly with JSDoc where appropriate

Validation:
- Run `pnpm build`
