import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // Ensure a predictable background while loading
    this.cameras.main.setBackgroundColor('#0b1220');
    // Start Preload immediately; READY event fires before scenes are active
    this.scene.start('Preload');
  }
}
