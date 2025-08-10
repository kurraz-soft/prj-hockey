# Implementation Plan — Minimalist Air Hockey

This document translates the GDD into an actionable, stepwise plan. It is organized by milestones (v1 single‑player, v2 multiplayer) and detailed tasks in execution order.

## Goals & Success Criteria
- v1 (single player): Playable on desktop and mobile; puck physics with friction and bounce; AI bot; scoring and timer; restart flow; minimal UI.
- v2 (multiplayer): Real‑time online play; mirrored paddles; basic matchmaking/direct connect; latency compensation.

## Tech Stack
- Engine: Phaser 3 (Canvas/WebGL)
- Physics: Arcade Physics (custom friction/bounce tuning)
- Language: TypeScript (strict)
- Build: Vite + NPM scripts
- Target: Web (desktop + mobile portrait)

## Project Structure (proposed)
- `index.html` — boot entry
- `vite.config.ts` — Vite config with path aliases
- `tsconfig.json` — root TS config (strict, aliases)
- `src/main.ts` — Phaser game config/launch
- `src/scenes/BootScene.ts` — minimal boot
- `src/scenes/PreloadScene.ts` — procedural asset prep (or loading)
- `src/scenes/MenuScene.ts` — main menu
- `src/scenes/GameScene.ts` — core gameplay
- `src/scenes/HudScene.ts` — timer/score HUD (overlay)
- `src/game/` — field, puck, paddle, AI, config, helpers
- `src/types/` — ambient types if needed (optional)
- `public/` — static assets if any (optional)

## Milestones & Steps (v1)

M0 — Scaffolding & Infrastructure
1) Initialize Vite (vanilla-ts) in this repo; add Phaser 3 dependency.
2) Configure TypeScript: strict mode, path alias `@ -> src` in `tsconfig.json` and Vite aliases.
3) Add `dev`, `build`, `preview` NPM scripts; set up ESLint/Prettier (optional, TS-aware).
4) Create `index.html` with root container; wire `src/main.ts` to start Phaser.
5) Configure Phaser scaling: `FIT` within parent; responsive resize handler.

M1 — Scenes & Flow
5) Implement `BootScene` (config init) and `PreloadScene` (procedural textures or preload fonts/sfx if any).
6) Implement `MenuScene` with options: Play vs Bot (enabled), Multiplayer (disabled/coming soon), Settings (stub).
7) Implement `HudScene` for timer and score overlay; runs in parallel with `GameScene`.
8) Implement `GameScene` skeleton: create field, paddles, puck, inputs, and physics groups.

M2 — Field Rendering (Procedural)
9) Draw rounded‑rect arena using `Phaser.GameObjects.Graphics` with 1:2 width:height ratio.
10) Draw center line; visually mark goal lines; optional subtle fill for play area.
11) Compute and cache geometry: arena bounds, midline, goal mouth extents, player/opponent zones.

M3 — Entities & Input
12) Create paddle factory: circular texture (procedural), body size, color.
13) Create puck factory: circular texture (procedural), body size, color.
14) Implement pointer/touch controller: paddle follows cursor/finger with smoothing.
15) Enforce Player Zone constraint: clamp paddle position to lower half; no escape.
16) Mobile portrait adaptation: full-screen fit, larger touch target, optional input smoothing.

M4 — Physics & Interaction
17) Configure Arcade Physics: puck dynamic body with bounce; global/world bounds with rounded‑edge approximation via inner rect; custom friction via linear drag or manual damping per tick.
18) Paddle behavior: kinematic/immovable body; set position from input; derive velocity each frame to produce realistic puck impulse.
19) Collision handling: puck vs paddles vs walls; tune restitution to feel snappy but controllable.
20) Stuck detection: if puck speed < threshold for N seconds, nudge or reset to center with small random impulse.

M5 — Scoring, Timer, Rules
21) Goal detection: puck center fully crosses goal line between posts; increment score; briefly pause and reset puck at center.
22) Timer: 3:00 countdown; pause on menus/goal resets; resume on play.
23) Win condition: first to 10 or highest score at time end; show result overlay; options to Restart or Quit to Menu.
24) Configuration: expose match length, score limit, friction, paddle size in a config module.

M6 — AI Bot (v1)
25) Implement simple AI: follows puck X with max speed and reaction delay; clamp to Opponent Zone; predictive offset to avoid jitter.
26) Difficulty tuning: speed, reaction time, aim bias; ensure winnable but not trivial.

M7 — Polish & QA
27) HUD polish: clear typography for timer and scores; responsive sizing.
28) Pause menu overlay during game; keyboard `Esc` and mobile button.
29) Audio (optional): minimal hit and goal sounds.
30) Performance pass: ensure 60 FPS on mid‑tier mobile; reduce overdraw, minimize allocations.
31) Manual test matrix: desktop (mouse), mobile (touch), resize/orientation, edge cases (puck stuck, rapid goals, pause/resume).

M8 — Build & Deploy
32) Production build via Vite; verify asset paths; host via static (e.g., GitHub Pages/Netlify).
33) Basic README with run/build instructions and controls; include TypeScript and Vite notes.

## Milestones & Steps (v2 Multiplayer)

N0 — Networking Foundation
34) Choose stack: Node.js + WebSocket (ws) server (TypeScript); static client hosting.
35) Protocol design: room create/join, ready state, input messages, state snapshots, clock sync.
36) Mirroring model: each client sees their paddle at bottom; transform coordinates server‑side for opponent.

N1 — Authoritative Simulation
37) Server authoritative for puck and scores; clients send paddle intents (position/velocity); server resolves collisions and broadcasts state.
38) Tick rate and interpolation: client renders with interpolation/extrapolation; input prediction for local paddle.
39) Latency compensation: clamp max correction; smooth reconciliation; timestamped messages.

N2 — Game Flow Online
40) Lobby/room management: quick play (random match) and private code join.
41) Start, pause, goal reset, and match end events; simple rematch flow.
42) Basic anti‑cheat: sanity checks on paddle inputs and bounds.

N3 — Stabilization
43) Network QA with simulated lag/jitter/packet loss; tune snapshot and delta strategies.
44) Error handling and reconnect logic; timeouts and safe match termination.

## Implementation Notes & Decisions
- Ratio handling: maintain field 1:2 width:height inside available viewport using letterboxing; scale paddles/puck proportionally.
- Physics tuning: prefer manual linear damping on puck to emulate friction; ensure minimum floor speed before nudge/reset.
- Paddle collisions: compute paddle instantaneous velocity each frame (delta position) and use it to bias puck impulse for satisfying hits.
- Input: apply low‑pass filter to pointer/touch to avoid jitter; cap max paddle speed.
- Reset flow: short countdown (e.g., 3…2…1) after goals; freeze paddles until puck drops.
- Accessibility: color‑contrast friendly palette; optional color‑blind friendly mode for paddles.

## Acceptance Checklist (v1)
- Play vs AI with responsive controls (mouse + touch)
- Puck rebounds and slows with believable friction
- Score and timer always visible; match ends correctly
- Goals detect only on full cross; automatic resets
- No paddle exit from own zone; AI constrained to top zone
- Stable 60 FPS on desktop; smooth on common mobile devices

## Tasks by Role (if solo, sequential)
- Engine/bootstrap: steps 1–4
- UX/scenes: steps 5–8, 27–29
- Gameplay: steps 9–26
- QA/perf: steps 30–31
- Release: steps 32–33
- Multiplayer: steps 34–44

## Next Action
- M0 step 1: scaffold project and add Phaser.
