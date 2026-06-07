# Contributing conventions (humans + AI agents)

## Golden rules
- TypeScript everywhere. No `any` unless justified with a comment.
- Small files: one component/responsibility per file, aim < 200 lines.
- Pure logic (timing, randomness, timeline) lives in `src/practice/` and MUST have unit tests.
- Screens in `app/` are thin: they render state and call into `src/`. No business logic in screens.
- Before committing: `npm run typecheck && npm run lint && npm test` must pass.
- Small PRs. `main` is branch-protected; CI must be green to merge.
- `legacy/` is the OLD app, kept only as a porting reference. Never import from it or edit it.

## Where things live
- Routes/screens: `app/` (Expo Router; a file = a screen)
- Audio engine: `src/audio/`
- Practice logic (pure): `src/practice/`
- State: `src/state/` (Zustand stores)
- Shared UI: `src/ui/`

## Audio rules (learned the hard way)
- Never sequence cues with setTimeout. Schedule on `AudioContext.currentTime` via the engine.
- Always configure the audio session before playing/recording (see src/audio/session.ts).

## Testability rules
- Every element a UI test taps or asserts gets a stable, kebab-case `testID`
  (e.g. `home-screen`, `tab-practice`, `start-practice-button`, `practice-running`).
  Don't rename them casually — Maestro flows in `maestro/flows/` depend on them.
- Mobile UI tests are vendored in-repo (no plugins): see the `mobile-test-setup` and
  `mobile-test-run` skills, or `maestro/README.md`. Run: `scripts/mobile/run-flows.sh ios|android`.
