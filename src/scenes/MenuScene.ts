import Phaser from 'phaser';

type MenuItem = {
  label: string;
  hint?: string;
  key: string;
  enabled?: boolean;
  onSelect: () => void;
};

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const centerX = this.scale.width / 2;
    const title = this.add.text(centerX, 160, 'Minimalist Air Hockey', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '36px',
      color: '#e2e8f0'
    }).setOrigin(0.5, 0.5);

    const items: MenuItem[] = [
      {
        label: 'Play vs Bot',
        key: 'play',
        enabled: true,
        onSelect: () => {
          this.scene.start('Game');
          this.scene.launch('Hud');
        }
      },
      {
        label: 'Multiplayer',
        hint: 'coming soon',
        key: 'mp',
        enabled: false,
        onSelect: () => {}
      },
      {
        label: 'Settings',
        key: 'settings',
        enabled: true,
        onSelect: () => {
          // Stub; future implementation
          this.tweens.add({ targets: title, alpha: 0.8, yoyo: true, duration: 120, repeat: 0 });
        }
      }
    ];

    const startY = 280;
    const gap = 64;
    items.forEach((item, i) => this.renderMenuItem(centerX, startY + i * gap, item));
  }

  private renderMenuItem(x: number, y: number, item: MenuItem) {
    const bg = this.add.image(x, y, 'button').setOrigin(0.5);
    bg.setTint(item.enabled !== false ? 0xffffff : 0x808080);
    bg.setInteractive({ useHandCursor: item.enabled !== false });

    const label = item.hint ? `${item.label}  (${item.hint})` : item.label;
    const txt = this.add.text(x, y, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: item.enabled !== false ? '#e5e7eb' : '#9ca3af'
    }).setOrigin(0.5);

    if (item.enabled !== false) {
      bg.on('pointerover', () => bg.setTint(0x334155));
      bg.on('pointerout', () => bg.setTint(0xffffff));
      bg.on('pointerdown', () => item.onSelect());
    }
  }
}

