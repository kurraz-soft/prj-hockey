import Phaser from 'phaser';
import { computeFieldGeometry, type FieldGeometry } from '@/game/geometry';
import { createPaddle, createPuck } from '@/game/entities';

export default class GameScene extends Phaser.Scene {
  private playerPaddle!: Phaser.Physics.Arcade.Image;
  private opponentPaddle!: Phaser.Physics.Arcade.Image;
  private puck!: Phaser.Physics.Arcade.Image;
  private fieldGeom!: FieldGeometry;
  private playerTarget!: Phaser.Math.Vector2;
  private paddleRadius = 40; // matches procedural texture
  private paddlePrevPos!: Phaser.Math.Vector2;
  private paddleVel!: Phaser.Math.Vector2; // px/sec
  private puckStuckMs = 0;
  private readonly minSpeed = 12; // px/s nearly stopped
  private readonly nudgeAfterMs = 2000;
  private readonly resetAfterMs = 5000;
  private readonly frictionRetentionPerSecond = 0.985; // 98.5%/s

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
    this.physics.add.collider(this.puck, this.opponentPaddle);

    // Basic input: move player paddle to pointer (constraints in M3)
    this.playerTarget = new Phaser.Math.Vector2(this.playerPaddle.x, this.playerPaddle.y);
    this.paddlePrevPos = new Phaser.Math.Vector2(this.playerPaddle.x, this.playerPaddle.y);
    this.paddleVel = new Phaser.Math.Vector2();
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.playerTarget.set(pointer.worldX, pointer.worldY);
    });

    // Launch initial motion so the scene feels alive
    this.puck.setVelocity(160, -120);
  }

  update(time: number, delta: number): void {
    // Smooth follow towards target
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

    // Apply friction-like damping to the puck
    this.applyFrictionToPuck(dtSec);

    // Stuck detection and recovery
    const speed = this.puck.body.velocity.length();
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
        this.puck.body.velocity.x += Math.cos(angle) * 60;
        this.puck.body.velocity.y += Math.sin(angle) * 60;
      }
    } else {
      this.puckStuckMs = 0;
    }
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
    this.puck.body.velocity.scale(retention);
    // Clamp tiny velocities to zero to prevent jitter
    if (this.puck.body.velocity.lengthSq() < this.minSpeed * this.minSpeed * 0.25) {
      this.puck.body.velocity.set(0, 0);
    }
  }

  private transferPaddleImpulse = () => {
    // Add a fraction of paddle velocity to puck for satisfying hits
    const impulse = this.paddleVel.clone().scale(0.45);
    // Project slightly onto collision direction to reduce side-spin artifacts
    const dir = new Phaser.Math.Vector2(this.puck.x - this.playerPaddle.x, this.puck.y - this.playerPaddle.y).normalize();
    const along = dir.scale(Phaser.Math.Clamp(impulse.dot(dir), -600, 600));
    this.puck.body.velocity.add(impulse.scale(0.3)).add(along);
    // Limit max speed to keep control
    const maxSpeed = 900;
    if (this.puck.body.velocity.lengthSq() > maxSpeed * maxSpeed) {
      this.puck.body.velocity.setLength(maxSpeed);
    }
  };
}
