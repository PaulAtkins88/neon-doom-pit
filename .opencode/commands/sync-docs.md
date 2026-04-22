---
description: Update docs to match the codebase
agent: build
---
Update the repository documentation so it matches the current codebase.

Check these files as relevant:
- `README.md`
- `AGENTS.md`
- `docs/agent-guide.md`
- `docs/prompt-pack.md`
- `.github/copilot-instructions.md`
- `.claude/CLAUDE.md`
- JSDoc on touched classes and methods

Requirements:
- Fix stale architecture references
- Keep instructions aligned with the real file structure
- Keep docs concise and practical

Validation:
- If code files were touched, run `pnpm build`
