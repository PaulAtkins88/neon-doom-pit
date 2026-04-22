# Prompt Pack

This prompt pack is designed for future agent-driven work on Neon Doom Pit. Each template is written so it can be pasted directly into OpenCode, Claude, Copilot Chat, or adapted into a slash-command workflow.

Use these prompts as starting points, not rigid scripts.

## Shared Rules Block

Paste this block before task-specific instructions when the tool does not already have repo context.

```text
You are working in the Neon Doom Pit repository.

Important repo constraints:
- Use pnpm, not npm or yarn
- Main verification command is pnpm build
- Preserve gameplay feel unless the task explicitly changes it
- Keep the architecture pragmatic; do not build a large engine
- Meaningful runtime entities are Player, Monster, and Projectile
- Static arena geometry usually stays in the world layer
- Core orchestration lives in src/core/Game.ts
- Static world construction lives in src/world/*
- Runtime entities live in src/entities/*
- Cross-cutting gameplay systems live in src/systems/*
- Gameplay tuning belongs in src/config/*

Implementation expectations:
- Read the relevant files first
- Make the smallest clean change that solves the task
- Reuse existing patterns before creating new abstractions
- Add or update JSDoc when touching non-trivial code
- Run pnpm build before finishing
```

## 1. Add A New Monster

```text
Read the current monster architecture first, especially:
- src/entities/monsters/Monster.ts
- src/entities/monsters/MonsterFactory.ts
- src/entities/monsters/behaviors.ts
- src/config/monsterConfigs.ts
- src/systems/WaveSystem.ts

Add a new monster type called <MONSTER_NAME>.

Requirements:
- Implement it as a Monster subclass
- Add a typed config entry in src/config/monsterConfigs.ts
- Reuse shared movement/attack helpers where appropriate
- Register it in MonsterFactory.ts
- Add it to WaveSystem only if the design calls for natural spawning
- Preserve the current game feel and code style
- Keep the implementation small and understandable

Deliverables:
- code changes
- short summary of behavior and file changes
- confirmation that pnpm build passes
```

Suggested slash alias:

```text
/add-monster <MONSTER_NAME> <BEHAVIOR_SUMMARY>
```

## 2. Add A New Weapon

```text
Read the current player and combat flow first, especially:
- src/entities/Player.ts
- src/systems/CombatSystem.ts
- src/systems/HudSystem.ts
- src/core/Game.ts

Add a new weapon called <WEAPON_NAME>.

Requirements:
- Preserve the existing weapon flow unless the task requires a broader weapon system
- Only introduce a shared weapon abstraction if there are now at least two real weapon implementations that benefit from it
- Keep HUD messaging and reload behavior readable
- Put hit resolution and shot behavior in the most appropriate place, usually CombatSystem
- Keep the first-person presentation aligned with the existing visual style

Also:
- explain whether a new abstraction was justified or intentionally avoided
- run pnpm build before finishing
```

Suggested slash alias:

```text
/add-weapon <WEAPON_NAME> <ROLE>
```

## 3. Rebalance Waves Or Enemies

```text
Read the current balance and progression first, especially:
- src/config/monsterConfigs.ts
- src/config/gameConfig.ts
- src/systems/WaveSystem.ts

Rebalance the game according to this goal:
<BALANCE_GOAL>

Constraints:
- Prefer tuning config values before changing architecture
- Preserve the short arena-run structure
- Keep changes easy to iterate on in future sessions
- Summarize what changed in terms of player-facing effect

Run pnpm build before finishing.
```

Suggested slash alias:

```text
/rebalance <BALANCE_GOAL>
```

## 4. Add A Pickup Or Interactive Object

```text
Read the current runtime architecture first, especially:
- src/entities/GameObject.ts
- src/world/GameWorld.ts
- src/core/Game.ts
- src/systems/CombatSystem.ts
- src/systems/HudSystem.ts

Add a new interactive object called <OBJECT_NAME>.

Requirements:
- If it has runtime behavior, model it as a GameObject-style entity
- If it is only decorative, keep it in the world layer instead
- Reuse current collider and update-loop patterns
- Keep the implementation lightweight and gameplay-focused

Examples:
- health pickup
- ammo pickup
- hazard
- altar trigger

Run pnpm build before finishing.
```

Suggested slash alias:

```text
/add-pickup <OBJECT_NAME> <EFFECT>
```

## 5. Add Or Change Arena Geometry

```text
Read the current world-building flow first, especially:
- src/world/ArenaFactory.ts
- src/world/GameWorld.ts
- src/config/gameConfig.ts

Modify the arena with this goal:
<WORLD_CHANGE>

Requirements:
- Preserve pointer-lock FPS readability and movement flow
- Keep collision data consistent with visuals
- Put static scene construction in ArenaFactory or GameWorld
- Avoid turning static geometry into runtime entities unless gameplay requires it
- Keep the visual language consistent with Neon Doom Pit

Run pnpm build before finishing.
```

Suggested slash alias:

```text
/edit-arena <WORLD_CHANGE>
```

## 6. Refactor Without Changing Gameplay

```text
Read the relevant files first and refactor the implementation while preserving behavior.

Task:
<REFACTOR_GOAL>

Constraints:
- No unnecessary new abstractions
- No gameplay redesign
- Preserve current HUD, pointer-lock, movement, shooting, enemy, and wave behavior unless a bug fix requires change
- Prefer smaller files and clearer responsibilities
- Add JSDoc where it improves maintainability

Before finishing:
- explain the structural change
- call out any intentional behavior-preserving decisions
- run pnpm build
```

Suggested slash alias:

```text
/refactor-safe <REFACTOR_GOAL>
```

## 7. Fix A Gameplay Bug

```text
Diagnose and fix this gameplay bug:
<BUG_DESCRIPTION>

Start by reading the relevant architecture files and tracing the current flow before editing.

Expectations:
- identify the likely root cause clearly
- make the smallest correct fix
- preserve unrelated gameplay behavior
- add or update JSDoc if the fix changes non-obvious logic
- run pnpm build before finishing

In the final summary, include:
- root cause
- files changed
- how the fix preserves existing behavior
```

Suggested slash alias:

```text
/fix-gameplay <BUG_DESCRIPTION>
```

## 8. Add A Status Effect Or Monster Modifier

```text
Read the monster architecture first, especially:
- src/entities/monsters/Monster.ts
- src/entities/monsters/behaviors.ts
- src/config/monsterConfigs.ts

Add this monster modifier or status effect:
<EFFECT_NAME>

Constraints:
- Prefer using the existing MonsterEffectHook seam first
- Do not build a large status-effect framework unless the task genuinely needs it
- Keep the design open for extension but simple to read today
- Document the extension point clearly

Run pnpm build before finishing.
```

Suggested slash alias:

```text
/add-monster-effect <EFFECT_NAME>
```

## 9. Documentation Maintenance Prompt

```text
Update the repository documentation to match the current code.

Check:
- README.md
- AGENTS.md
- docs/agent-guide.md
- .github/copilot-instructions.md
- .claude/CLAUDE.md
- JSDoc on touched classes and methods

Requirements:
- fix stale architecture references
- keep instructions aligned with the real file structure
- keep docs concise and practical
- run pnpm build if code files were touched
```

Suggested slash alias:

```text
/sync-docs
```

## 10. Feature Planning Prompt

```text
Plan a feature for Neon Doom Pit before implementation.

Feature goal:
<FEATURE_GOAL>

First:
- inspect the current architecture and identify the files likely involved
- propose the smallest clean implementation plan
- identify whether the work belongs in world, entities, systems, config, or a small combination
- call out risks to gameplay feel or extensibility

Do not implement yet unless explicitly asked.
```

Suggested slash alias:

```text
/plan-feature <FEATURE_GOAL>
```

## Suggested Future Slash Commands

If you later create a custom slash-command system for this repo, these are the highest-value commands to add first.

- `/add-monster`
- `/add-weapon`
- `/rebalance`
- `/add-pickup`
- `/edit-arena`
- `/fix-gameplay`
- `/refactor-safe`
- `/sync-docs`
- `/plan-feature`
