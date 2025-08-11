import Phaser from 'phaser';

export default class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super('Hud');
  }

  create() {
    this.scoreText = this.add.text(16, 12, 'Player 0 : 0 CPU', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#f1f5f9'
    });

    this.timerText = this.add.text(this.scale.width / 2, 12, '3:00', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#f1f5f9'
    }).setOrigin(0.5, 0);

    // Listen for future updates from GameScene
    this.game.events.on('score:update', (p: number, o: number) => this.updateScore(p, o));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('score:update');
    });
  }

  private updateScore(player: number, opponent: number) {
    this.scoreText.setText(`Player ${player} : ${opponent} CPU`);
  }
}

