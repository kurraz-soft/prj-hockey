import Phaser from 'phaser';
import BootScene from '@/scenes/BootScene';
import PreloadScene from '@/scenes/PreloadScene';
import MenuScene from '@/scenes/MenuScene';
import GameScene from '@/scenes/GameScene';
import HudScene from '@/scenes/HudScene';

const BASE_WIDTH = 800;
const BASE_HEIGHT = 1600; // 1:2 width-to-height ratio

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b1220',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HudScene]
});

// Responsive refresh on window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export {};
