# Contributing

Thanks for taking a look at Neon Doom Pit.

This repository is intentionally small and opinionated. Contributions are welcome, but changes should stay focused and easy to review.

## Before You Open a PR

- Read `README.md` first
- Check the current browser architecture in `apps/web/src/core`, `apps/web/src/world`, `apps/web/src/entities`, and `apps/web/src/systems`
- Keep the change small and localized
- Run `pnpm build`

## What Fits Best

- bug fixes
- small gameplay tuning
- documentation improvements
- asset swaps that match the existing style

## What To Avoid

- large refactors without a clear payoff
- adding new frameworks or heavy dependencies
- changing the core feel of the game without a strong reason

## Pull Requests

- Use a short, specific title
- Explain the gameplay or maintenance reason for the change
- Mention if you verified the game manually in `pnpm dev`
