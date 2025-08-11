import Phaser from 'phaser';
import { computeFieldGeometry, type FieldGeometry } from '@/game/geometry';
import { createPaddle, createPuck } from '@/game/entities';
import { playHit, playGoal } from '@/game/sfx';
import { detectGoal } from '@/game/rules';
import { computeOpponentTarget } from '@/game/ai';

export default class GameScene extends Phaser.Scene {
  private playerPaddle!: Phaser.Physics.Arcade.Image;
  private opponentPaddle!: Phaser.Physics.Arcade.Image;
  private puck!: Phaser.Physics.Arcade.Image;
  private fieldGeom!: FieldGeometry;
  private playerTarget!: Phaser.Math.Vector2;
  private opponentTarget!: Phaser.Math.Vector2;
  private paddleRadius = 40; // matches procedural texture
  private paddlePrevPos!: Phaser.Math.Vector2;
  private paddleVel!: Phaser.Math.Vector2; // px/sec
  private opponentPrevPos!: Phaser.Math.Vector2;
  private opponentVel!: Phaser.Math.Vector2; // px/sec
  private puckStuckMs = 0;
  private readonly minSpeed = 12; // px/s nearly stopped
  private readonly nudgeAfterMs = 2000;
  private readonly resetAfterMs = 5000;
  private readonly frictionRetentionPerSecond = 0.985; // 98.5%/s
  // M5 state
  private playerScore = 0;
  private opponentScore = 0;
  private scoreLimit = 10;
  private matchLengthSec = 3 * 60; // 3 minutes
  private timeLeftSec = this.matchLengthSec;
  private playing = true; // countdown pauses timer
  private inReset = false;
  private countdownEvent?: Phaser.Time.TimerEvent;
  // M6 AI settings
  private readonly aiMaxSpeed = 520; // px/s
  private readonly aiLeadSeconds = 0.12; // predict puck X
  // M7 Pause
  private paused = false;

  constructor() {
    super('Game');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1220');

    // Compute and draw field
    this.fieldGeom = computeFieldGeometry(this.scale.width, this.scale.height);
    this.drawField();

    // Physics world inside the play area (rectangular approximation)
    this.physics.world.setBounds(
      this.fieldGeom.playX,
      this.fieldGeom.playY,
      this.fieldGeom.playWidth,
      this.fieldGeom.playHeight
    );

    // Entities (procedural textures from PreloadScene)
    const cx = this.scale.width / 2;
    const bottomY = this.fieldGeom.playY + this.fieldGeom.playHeight - 100;
    const topY = this.fieldGeom.playY + 100;

    this.playerPaddle = createPaddle(this, cx, bottomY);
    this.opponentPaddle = createPaddle(this, cx, topY, 'paddle', 0x94a3b8);
    this.puck = createPuck(this, cx, this.scale.height / 2);
    this.puck.setBounce(0.98);

    // Groups and collisions (behavior tuning in later milestones)
    this.physics.add.collider(this.puck, this.playerPaddle, this.transferPaddleImpulse, undefined, this);
    this.physics.add.collider(this.puck, this.opponentPaddle, this.transferOpponentImpulse, undefined, this);

    // Basic input: move player paddle to pointer (constraints in M3)
    this.playerTarget = new Phaser.Math.Vector2(this.playerPaddle.x, this.playerPaddle.y);
    this.opponentTarget = new Phaser.Math.Vector2(this.opponentPaddle.x, this.opponentPaddle.y);
    this.paddlePrevPos = new Phaser.Math.Vector2(this.playerPaddle.x, this.playerPaddle.y);
    this.paddleVel = new Phaser.Math.Vector2();
    this.opponentPrevPos = new Phaser.Math.Vector2(this.opponentPaddle.x, this.opponentPaddle.y);
    this.opponentVel = new Phaser.Math.Vector2();
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.playerTarget.set(pointer.worldX, pointer.worldY);
    });

    // Pause/Resume/Restart events from HUD
    this.game.events.on('game:togglePause', () => this.togglePause());
    this.game.events.on('game:pause', () => this.setPaused(true));
    this.game.events.on('game:resume', () => this.setPaused(false));
    this.game.events.on('game:restart', () => this.restartMatch());
    this.game.events.on('game:quit', () => this.quitToMenu());

    // Initialize HUD
    this.game.events.emit('score:update', this.playerScore, this.opponentScore);
    this.game.events.emit('timer:update', this.timeLeftSec);

    // Start with a 3..2..1 countdown before first serve
    // Randomize initial serve direction (up or down)
    const initialDirY = Math.random() < 0.5 ? -1 : 1;
    this.startCountdownAndServe(initialDirY);
  }

  update(time: number, delta: number): void {
    // Pause gameplay effects during manual pause, reset, or after match end
    if (this.paused) {
      return;
    }

    // Lock paddles during reset countdown (3..2..1)
    if (this.inReset) {
      return;
    }

    if (!this.playing) {
      // Allow paddles to still move toward targets even when not playing
      this.followPointer(delta);
      this.updateOpponentAI(delta);
      return;
    }

    // Timer countdown (pause during resets)
    if (!this.inReset) {
      const before = Math.ceil(this.timeLeftSec);
      this.timeLeftSec = Math.max(0, this.timeLeftSec - delta / 1000);
      const after = Math.ceil(this.timeLeftSec);
      if (after !== before) {
        this.game.events.emit('timer:update', after);
      }
      if (this.timeLeftSec <= 0) {
        this.endMatch();
        return;
      }
    }

    // Smooth follow towards target
    const dtSec = this.followPointer(delta);
    this.updateOpponentAI(delta);

    // Apply friction-like damping to the puck
    this.applyFrictionToPuck(dtSec);

    // Stuck detection and recovery
    const speed = (this.puck.body as Phaser.Physics.Arcade.Body).velocity.length();
    if (speed < this.minSpeed) {
      this.puckStuckMs += delta;
      if (this.puckStuckMs > this.resetAfterMs) {
        // Hard reset to center
        this.puck.setPosition(this.scale.width / 2, this.scale.height / 2);
        const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
        this.puck.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);
        this.puckStuckMs = 0;
      } else if (this.puckStuckMs > this.nudgeAfterMs) {
        // Soft nudge
        const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
        (this.puck.body as Phaser.Physics.Arcade.Body).velocity.x += Math.cos(angle) * 60;
        (this.puck.body as Phaser.Physics.Arcade.Body).velocity.y += Math.sin(angle) * 60;
      }
    } else {
      this.puckStuckMs = 0;
    }

    // Goal detection using "fully crossed line" (center passes line by >= puck radius)
    this.checkGoal();
  }

  // Returns dtSec
  private followPointer(delta: number): number {
    const lerp = 0.25; // smoothing factor per frame
    const targetX = Phaser.Math.Clamp(
      this.playerTarget.x,
      this.fieldGeom.playX + this.paddleRadius,
      this.fieldGeom.playX + this.fieldGeom.playWidth - this.paddleRadius
    );
    const targetY = Phaser.Math.Clamp(
      this.playerTarget.y,
      this.fieldGeom.midY + this.paddleRadius,
      this.fieldGeom.playY + this.fieldGeom.playHeight - this.paddleRadius
    );
    const nx = Phaser.Math.Linear(this.playerPaddle.x, targetX, lerp);
    const ny = Phaser.Math.Linear(this.playerPaddle.y, targetY, lerp);
    this.playerPaddle.setPosition(nx, ny);
    // Derive paddle instantaneous velocity (px/sec)
    const dtSec = Math.max(delta, 1) / 1000;
    this.paddleVel.set(
      (this.playerPaddle.x - this.paddlePrevPos.x) / dtSec,
      (this.playerPaddle.y - this.paddlePrevPos.y) / dtSec
    );
    this.paddlePrevPos.set(this.playerPaddle.x, this.playerPaddle.y);
    return dtSec;
  }

  private drawField() {
    const g = this.add.graphics();
    const {
      playX,
      playY,
      playWidth,
      playHeight,
      cornerRadius,
      midY,
      topGoal,
      bottomGoal
    } = this.fieldGeom;

    // Fill
    g.fillStyle(0x0f172a, 1); // subtle navy
    g.fillRoundedRect(playX, playY, playWidth, playHeight, cornerRadius);

    // Border
    g.lineStyle(3, 0x38bdf8, 0.9); // cyan border
    g.strokeRoundedRect(playX + 1.5, playY + 1.5, playWidth - 3, playHeight - 3, cornerRadius);

    // Center line
    g.lineStyle(2, 0x334155, 1);
    g.beginPath();
    g.moveTo(playX + 12, midY);
    g.lineTo(playX + playWidth - 12, midY);
    g.strokePath();

    // Goal lines (short segments centered on top and bottom edges)
    g.lineStyle(4, 0xf59e0b, 1); // amber
    g.beginPath();
    g.moveTo(topGoal.x1, topGoal.y);
    g.lineTo(topGoal.x2, topGoal.y);
    g.moveTo(bottomGoal.x1, bottomGoal.y);
    g.lineTo(bottomGoal.x2, bottomGoal.y);
    g.strokePath();
  }

  private applyFrictionToPuck(dtSec: number) {
    const retention = Math.pow(this.frictionRetentionPerSecond, dtSec);
    (this.puck.body as Phaser.Physics.Arcade.Body).velocity.scale(retention);
    // Clamp tiny velocities to zero to prevent jitter
    if ((this.puck.body as Phaser.Physics.Arcade.Body).velocity.lengthSq() < this.minSpeed * this.minSpeed * 0.25) {
      (this.puck.body as Phaser.Physics.Arcade.Body).velocity.set(0, 0);
    }
  }

  private transferPaddleImpulse = () => {
    // Add a fraction of paddle velocity to puck for satisfying hits
    const impulse = this.paddleVel.clone().scale(0.45);
    // Project slightly onto collision direction to reduce side-spin artifacts
    const dir = new Phaser.Math.Vector2(this.puck.x - this.playerPaddle.x, this.puck.y - this.playerPaddle.y).normalize();
    const along = dir.scale(Phaser.Math.Clamp(impulse.dot(dir), -600, 600));
    (this.puck.body as Phaser.Physics.Arcade.Body).velocity.add(impulse.scale(0.3)).add(along);
    // Limit max speed to keep control
    const maxSpeed = 900;
    if ((this.puck.body as Phaser.Physics.Arcade.Body).velocity.lengthSq() > maxSpeed * maxSpeed) {
      (this.puck.body as Phaser.Physics.Arcade.Body).velocity.setLength(maxSpeed);
    }
    playHit();
  };

  private checkGoal() {
    const puckBody = this.puck.body as Phaser.Physics.Arcade.Body;
    const side = detectGoal(this.puck.x, this.puck.y, puckBody.halfWidth, this.fieldGeom);
    if (side) this.handleGoal(side);
  }

  private handleGoal(scoredBy: 'player' | 'opponent') {
    if (this.inReset) return;
    if (scoredBy === 'player') this.playerScore += 1; else this.opponentScore += 1;
    this.game.events.emit('score:update', this.playerScore, this.opponentScore);
    playGoal();

    // Check score-limit win
    if (this.playerScore >= this.scoreLimit || this.opponentScore >= this.scoreLimit) {
      this.endMatch();
      return;
    }

    // Reset puck and start short countdown; pause timer
    const dirY = scoredBy === 'player' ? 1 : -1; // opponent conceded -> serve up; player conceded -> serve down
    this.startCountdownAndServe(dirY);
  }

  // Starts a 3..2..1 countdown, locks paddles, then serves from center
  private startCountdownAndServe(dirY: 1 | -1) {
    this.inReset = true;
    this.puck.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.puck.setVelocity(0, 0);
    let remaining = 3;
    this.game.events.emit('reset:countdown', remaining);
    this.countdownEvent?.remove(false);
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        remaining -= 1;
        this.game.events.emit('reset:countdown', remaining);
        if (remaining <= 0) {
          const angle = Phaser.Math.FloatBetween(-Math.PI / 6, Math.PI / 6);
          const speed = 180;
          this.puck.setVelocity(Math.sin(angle) * speed, dirY * Math.cos(angle) * speed);
          this.inReset = false;
        }
      }
    });
  }

  private endMatch() {
    this.playing = false;
    this.inReset = false;
    this.countdownEvent?.remove(false);
    this.puck.setVelocity(0, 0);
    const result = this.playerScore === this.opponentScore
      ? 'Draw!'
      : this.playerScore > this.opponentScore
      ? 'You Win!'
      : 'You Lose!';
    this.game.events.emit('match:over', result);

    // Simple restart/quit handlers
    const onPointer = () => {
      // Restart to Menu for now
      this.input.off('pointerdown', onPointer);
      this.scene.stop('Hud');
      this.scene.start('Menu');
    };
    this.input.on('pointerdown', onPointer);
  }

  // --- AI Bot (M6) ---
  private updateOpponentAI(deltaMs: number) {
    const dt = Math.max(deltaMs, 1) / 1000;
    const body = this.puck.body as Phaser.Physics.Arcade.Body;
    const target = computeOpponentTarget({
      puckX: this.puck.x,
      puckY: this.puck.y,
      velX: body.velocity.x,
      velY: body.velocity.y,
      geom: this.fieldGeom,
      paddleRadius: this.paddleRadius,
      leadSeconds: this.aiLeadSeconds
    });
    this.opponentTarget.set(target.x, target.y);

    // Move with capped speed
    const dx = this.opponentTarget.x - this.opponentPaddle.x;
    const dy = this.opponentTarget.y - this.opponentPaddle.y;
    const dist = Math.hypot(dx, dy);
    const maxStep = this.aiMaxSpeed * dt;
    if (dist > 0) {
      if (dist > maxStep) {
        const nx = dx / dist;
        const ny = dy / dist;
        this.opponentPaddle.setPosition(this.opponentPaddle.x + nx * maxStep, this.opponentPaddle.y + ny * maxStep);
      } else {
        this.opponentPaddle.setPosition(this.opponentTarget.x, this.opponentTarget.y);
      }
    }

    // Clamp to opponent zone (safety)
    const xClamped = Phaser.Math.Clamp(
      this.opponentPaddle.x,
      this.fieldGeom.playX + this.paddleRadius,
      this.fieldGeom.playX + this.fieldGeom.playWidth - this.paddleRadius
    );
    const yClamped = Phaser.Math.Clamp(
      this.opponentPaddle.y,
      this.fieldGeom.opponentZone.y + this.paddleRadius,
      this.fieldGeom.midY - this.paddleRadius
    );
    if (xClamped !== this.opponentPaddle.x || yClamped !== this.opponentPaddle.y) {
      this.opponentPaddle.setPosition(xClamped, yClamped);
    }

    // Update opponent instantaneous velocity
    this.opponentVel.set(
      (this.opponentPaddle.x - this.opponentPrevPos.x) / dt,
      (this.opponentPaddle.y - this.opponentPrevPos.y) / dt
    );
    this.opponentPrevPos.set(this.opponentPaddle.x, this.opponentPaddle.y);
  }

  private transferOpponentImpulse = () => {
    const impulse = this.opponentVel.clone().scale(0.45);
    const dir = new Phaser.Math.Vector2(this.puck.x - this.opponentPaddle.x, this.puck.y - this.opponentPaddle.y).normalize();
    const along = dir.scale(Phaser.Math.Clamp(impulse.dot(dir), -600, 600));
    (this.puck.body as Phaser.Physics.Arcade.Body).velocity.add(impulse.scale(0.3)).add(along);
    const maxSpeed = 900;
    if ((this.puck.body as Phaser.Physics.Arcade.Body).velocity.lengthSq() > maxSpeed * maxSpeed) {
      (this.puck.body as Phaser.Physics.Arcade.Body).velocity.setLength(maxSpeed);
    }
    playHit();
  };

  private togglePause() { this.setPaused(!this.paused); }
  private setPaused(flag: boolean) {
    if (this.paused === flag) return;
    this.paused = flag;
    this.physics.world.isPaused = flag;
    this.game.events.emit('hud:paused', this.paused);
  }

  private restartMatch() {
    // Reset state
    this.playerScore = 0;
    this.opponentScore = 0;
    this.timeLeftSec = this.matchLengthSec;
    this.playing = true;
    this.inReset = false;
    // Ensure pause overlay closes and physics resume
    this.setPaused(false);
    this.puckStuckMs = 0;
    // Reset positions
    const cx = this.scale.width / 2;
    const bottomY = this.fieldGeom.playY + this.fieldGeom.playHeight - 100;
    const topY = this.fieldGeom.playY + 100;
    this.playerPaddle.setPosition(cx, bottomY);
    this.opponentPaddle.setPosition(cx, topY);
    this.puck.setPosition(cx, this.scale.height / 2);
    this.puck.setVelocity(160, -120);
    // HUD
    this.game.events.emit('score:update', this.playerScore, this.opponentScore);
    this.game.events.emit('timer:update', this.timeLeftSec);
  }

  private quitToMenu() {
    this.scene.stop('Hud');
    this.scene.start('Menu');
  }
}
