# Agent Guide

This document is written for AI coding agents and editor-integrated assistants working on Neon Doom Pit.

## Goal

Make safe, incremental improvements to a small TypeScript FPS prototype without turning it into an overbuilt engine.

## Prompt Templates

Reusable cross-tool prompt templates live in:

- `docs/prompt-pack.md`

## OpenCode Commands

OpenCode-specific command files live in:

- `.opencode/commands/`

These commands mirror the prompt-pack workflows so common gameplay tasks can be triggered directly in OpenCode.

## Architecture Summary

- `Game` orchestrates the runtime
- `GameWorld` owns static map data and colliders
- `ArenaFactory` builds static scene geometry and lights
- `Player`, `Monster`, and `Projectile` are the core runtime entity types
- `InputSystem`, `HudSystem`, `CombatSystem`, and `WaveSystem` own cross-cutting gameplay orchestration

## Default Expectations For Changes

When implementing a task:

1. Read the relevant files first
2. Reuse existing types and config objects
3. Prefer the smallest correct change
4. Preserve current feel unless the task says otherwise
5. Run `pnpm build` before finishing

## File Placement Rules

Use these defaults when adding code.

- New arena geometry or lighting: `src/world/ArenaFactory.ts` or `src/world/GameWorld.ts`
- New player behavior: `src/entities/Player.ts`
- New monster type: `src/entities/monsters/`
- New shared monster logic: `src/entities/monsters/behaviors.ts`
- New wave rules: `src/systems/WaveSystem.ts`
- New HUD/overlay logic: `src/systems/HudSystem.ts`
- New shooting or damage resolution: `src/systems/CombatSystem.ts`
- New constants/tuning: `src/config/gameConfig.ts` or `src/config/monsterConfigs.ts`
- New shared pure helpers: `src/utils/`

## How To Add A Monster

1. Add a typed config entry in `src/config/monsterConfigs.ts`
2. Create a subclass in `src/entities/monsters/`
3. Override only the methods that actually differ:
   - `resolveMovementDirection`
   - `resolveMovementSpeed`
   - `shouldApplyMove`
   - `updateAttack`
4. Register the subclass in `MonsterFactory.ts`
5. Update `WaveSystem.ts` if the monster should appear in waves

Do not add a full decorator or trait framework unless there is a second concrete use case that clearly needs it.

## How To Add A Weapon

This repo does not yet have a multi-weapon abstraction.

For a first additional weapon:

1. Keep the current player flow working
2. Introduce a small weapon model only if there are now at least two real weapons
3. Keep HUD and reload behavior explicit and readable
4. Put shared damage/hit logic in `CombatSystem`

Avoid building a large inventory framework prematurely.

## How To Add A Pickup Or Interactive Object

If the object has runtime behavior, consider making it a `GameObject`.

Good candidates:

- health pickup
- ammo pickup
- altar trigger with state
- moving hazard

Poor candidates:

- static wall meshes
- decorative floor strips
- purely visual light dressing

## Collision Guidance

- Current collision is simple 2D circle vs axis-aligned collider bounds
- Reuse `Collider` and `circleIntersectsCollider`
- Do not add a physics engine unless explicitly requested or clearly necessary

## Documentation Guidance

- Keep JSDoc focused on responsibilities and behavior
- Document public classes and non-obvious methods
- Avoid noisy comments that restate obvious code

## Verification Checklist

Minimum:

```bash
pnpm build
```

For gameplay changes, also confirm by review or manual run:

- pointer lock still works
- movement still feels correct
- shooting and reload still work
- enemies spawn and attack correctly
- wave clear and restart flows still work

## Anti-Patterns

Avoid these unless the task explicitly justifies them:

- ECS rewrites
- broad service locator patterns
- generic plugin systems
- a status-effect engine with no real users
- turning static scene meshes into entities without gameplay value
- large inheritance trees outside the monster family
