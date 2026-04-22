---
description: Refactor without changing gameplay
agent: build
---
Refactor the requested part of Neon Doom Pit while preserving behavior.

Requirements:
- Read the relevant files first
- Do not redesign gameplay unless a bug fix requires it
- Prefer smaller files and clearer responsibilities
- Avoid unnecessary abstractions
- Preserve pointer lock, movement, shooting, enemy, and wave behavior unless explicitly asked otherwise
- Add or update JSDoc where it improves maintainability

Validation:
- Run `pnpm build`

In the summary include:
- structural changes made
- how gameplay behavior was preserved
