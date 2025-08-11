Minimalist Air Hockey
=====================

A tiny Phaser 3 + Vite + TypeScript air hockey game. v1 is single‑player vs a simple bot; v2 will add multiplayer.

Quick Start
- Prereqs: Node 18+ recommended.
- Install: `npm install`
- Dev: `npm run dev` then open the shown URL.
- Test: `npm test` (unit tests for geometry, rules, AI)
- Build: `npm run build`
- Preview build: `npm run preview`

Controls
- Desktop: move mouse to steer the bottom paddle.
- Mobile: touch to steer.
- Pause: press ESC or click the pause button (top‑right).
- In pause menu: Resume, Restart, or Quit to Menu.

Project Structure
- `src/main.ts` — Phaser config and boot.
- `src/scenes/*` — Boot/Preload/Menu/Game/Hud scenes.
- `src/game/geometry.ts` — field layout helpers.
- `src/game/entities.ts` — paddle/puck factories.
- `src/game/rules.ts` — goal detection logic.
- `src/game/ai.ts` — simple opponent target selection.
- `src/game/sfx.ts` — lightweight WebAudio beeps for hits/goals.

Build & Deploy (M8)
- Vite config uses `base: './'` so built assets work under a subpath (e.g., GitHub Pages project pages).
- Static hosting options:
  - GitHub Pages: enable Pages for the repo and use the provided workflow in `.github/workflows/deploy.yml` (builds on push to `main`).
  - Netlify/Vercel: point to `npm run build`, serve `dist/`.
  - Any static server: serve the `dist/` folder.

GitHub Pages workflow
- The repo includes `.github/workflows/deploy.yml` which:
  - Checks out code
  - Installs deps, builds with Vite
  - Uploads the `dist/` artifact and deploys to Pages
- After the first run, Pages URL typically looks like `https://<user>.github.io/<repo>/`.

TypeScript Notes
- Strict mode is enabled.
- `skipLibCheck` is on to avoid noise from third‑party types.
- App code type‑checks cleanly with `tsc --noEmit`.

Contributing
- Commit once per milestone where possible; Conventional Commits are welcome.
- See `AGENTS.md` for concise contributor guidance.

