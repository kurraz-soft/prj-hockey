# Game Design Document (GDD) — Minimalist Air Hockey

## 1. Overview
**Title:** Minimalist Air Hockey  
**Genre:** Arcade / Sports  
**Platform:** Web (Desktop & Mobile)  
**Engine:** Phaser 3  
**Development Goal:** Hobby project for practice and testing AI-assisted development  
**Monetization:** None (non-commercial)

## 2. Game Concept
A simple, minimalistic air hockey game with a top-down view. In **v1**, the player competes against a bot. In **v2**, online multiplayer will be added. The game uses mouse (or touch) controls to move the paddle.

## 3. Visual Style
- **Perspective:** Top-down
- **Field:** Rounded rectangle with a 1:2 width-to-height ratio
- **Design Elements:**
  - Field divided into two halves (center line)
  - Lower half is the **Player Zone**
  - Upper half is the **Opponent Zone**
  - Minimalistic color scheme with optional fill color for the play area
- **Assets:** Procedurally generated if possible (for paddles, puck, and field)

## 4. Core Gameplay
- **Objective:** Score goals by hitting the puck into the opponent's goal.
- **Controls:**
  - **Desktop:** Mouse movement — paddle follows cursor, restricted to Player Zone boundaries
  - **Mobile (portrait):** Touch input — finger position controls paddle in Player Zone
- **Physics:**
  - Puck: Sliding with friction, realistic rebound from paddles and walls
  - Paddle: Direct movement without inertia, bound within Player Zone
- **Match Duration:** 3 minutes by default (configurable)
- **Win Condition:** First to 10 points OR highest score when time expires
- **AI (v1):** Simple bot — follows puck movement with limited reaction speed
- **Multiplayer (v2):**
  - Both players always see their own paddle at the bottom
  - Opponent's paddle is mirrored at the top
  - Real-time synchronization

## 5. Game Rules
- The puck must fully cross the goal line to count as a score.
- The paddle cannot leave the Player Zone.
- If the puck stops moving (due to friction), it will slowly re-accelerate or reset to center.
- Game restarts puck position after each goal.

## 6. User Interface
- **In-game HUD:**
  - Timer (top center)
  - Score display (Player vs Opponent)
- **Menus:**
  - Main Menu (Play vs Bot, Multiplayer [v2], Settings)
  - Pause Menu (Resume, Restart, Quit)
- **Touch Mode Adaptation:** Field fills the screen in portrait orientation

## 7. Technical Details
- **Engine:** Phaser 3 (Canvas/WebGL rendering)
- **Physics:** Arcade Physics (custom friction and bounce tuning)
- **Procedural Assets:**
  - Field outline
  - Paddle and puck textures
- **Responsive Design:** Adjusts to desktop and mobile resolutions
- **Multiplayer Networking (v2):** WebSockets for real-time sync

## 8. Version Roadmap
**v1 — Single Player:**
- Player vs AI
- Basic puck physics
- Score tracking & timer
- Desktop & mobile support

**v2 — Multiplayer:**
- Real-time online play
- Matchmaking or direct connect
- Latency compensation

## 9. Future Ideas (Optional)
- Power-ups (speed boost, puck split)
- Multiple arena styles
- Customizable paddle colors

