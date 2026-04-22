---
description: Diagnose and fix a gameplay bug
agent: build
---
Diagnose and fix the requested gameplay bug.

Start by reading the relevant architecture files and tracing the current flow before editing.

Requirements:
- Identify the likely root cause clearly
- Make the smallest correct fix
- Preserve unrelated gameplay behavior
- Add or update JSDoc if the fix changes non-obvious logic

Validation:
- Run `pnpm build`

In the summary include:
- root cause
- files changed
- how behavior was preserved
