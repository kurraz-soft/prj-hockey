import Phaser from 'phaser';
import { computeFieldGeometry, type FieldGeometry } from '@/game/geometry';

export default class GameScene extends Phaser.Scene {
  private playerPaddle!: Phaser.Physics.Arcade.Image;
  private opponentPaddle!: Phaser.Physics.Arcade.Image;
  private puck!: Phaser.Physics.Arcade.Image;
  private fieldGeom!: FieldGeometry;

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

    this.playerPaddle = this.physics.add.image(cx, bottomY, 'paddle');
    this.playerPaddle.setImmovable(true);

    this.opponentPaddle = this.physics.add.image(cx, topY, 'paddle');
    this.opponentPaddle.setImmovable(true).setTint(0x94a3b8);

    this.puck = this.physics.add.image(cx, this.scale.height / 2, 'puck');
    this.puck.setCollideWorldBounds(true, 1, 1);

    // Groups and collisions (behavior tuning in later milestones)
    this.physics.add.collider(this.puck, this.playerPaddle);
    this.physics.add.collider(this.puck, this.opponentPaddle);

    // Basic input: move player paddle to pointer (constraints in M3)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.playerPaddle.setPosition(pointer.worldX, pointer.worldY);
    });

    // Launch a tiny motion so the scene feels alive (remove/tune later)
    this.puck.setVelocity(40, -30);
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
}
