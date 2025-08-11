import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Procedural textures to avoid asset pipeline for v1
    this.createCircleTexture('paddle', 40, 0x2dd4bf); // teal
    this.createCircleTexture('puck', 20, 0xf59e0b); // amber
    this.createRoundedRect('button', 280, 48, 10, 0x1f2937); // slate
  }

  create() {
    console.log('OK');
    this.scene.start('Menu');
  }

  private createCircleTexture(key: string, radius: number, color: number) {
    const size = radius * 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.lineStyle(2, 0xffffff, 0.15);
    g.strokeCircle(radius, radius, radius - 1);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createRoundedRect(key: string, w: number, h: number, r: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, r);
    g.lineStyle(2, 0xffffff, 0.08);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, r);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}

