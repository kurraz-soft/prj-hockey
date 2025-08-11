# Repository Guidelines

## Project Structure & Module Organization
- Root: `docs/` (GDD, PLAN), `AGENTS.md` (this guide).
- Planned app (Vite + TS): `index.html`, `vite.config.ts`, `tsconfig.json`, `src/` (code), `public/` (static).
- Source layout: `src/main.ts` (bootstrap), `src/scenes/*Scene.ts` (Phaser scenes), `src/game/` (entities, config, helpers), `src/types/` (ambient types). Use `@/` alias for `src`.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Preview the built app locally.
- `npm run test`: Run unit tests (Vitest) once added.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Indent 2 spaces, LF line endings.
- Naming: `PascalCase` for classes/scenes, `camelCase` for vars/functions, `UPPER_SNAKE` for constants, `kebab-case` for file names except Scenes (e.g., `GameScene.ts`).
- Imports: prefer `@/path` over relative chains.
- Lint/format: ESLint + Prettier (TS rules). Run auto-fix before committing.

## Testing Guidelines
- Framework: Vitest for unit tests under `src/**/__tests__/*.test.ts`.
- Scope: Pure logic in `src/game/` should have unit coverage; scene smoke tests are optional.
- Running: `npm run test` (add `--watch` for TDD). Aim for meaningful tests over raw coverage.

## Commit & Pull Request Guidelines
- Commits: Use Conventional Commits, e.g., `feat: add puck friction`, `fix: clamp paddle to zone`, `chore: configure vite aliases`.
- PRs: One focused change per PR. Include: purpose, screenshots/GIFs if UI, steps to test, and references to issues.
- Checks: Ensure build and tests pass locally. Run lint/format.

## Security & Configuration Tips
- Do not commit secrets. This is a static client; keep server keys out of the repo.
- Keep asset sizes small for mobile. Avoid heavy dependencies.
- Configuration lives in `src/game/config.ts` (e.g., match length, friction) once created.

## Agent-Specific Instructions
- Align with `docs/PLAN.md` milestones. Prefer small, reviewable patches.
- When adding files, keep paths consistent with the structure above and update PLAN or README if structure changes.
