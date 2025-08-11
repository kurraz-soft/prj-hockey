import Phaser from 'phaser';

export default class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private centerText?: Phaser.GameObjects.Text;
  private unsubscribers: (() => void)[] = [];

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

    // Listen for updates from GameScene
    const onScore = (p: number, o: number) => this.updateScore(p, o);
    const onTimer = (t: number) => this.updateTimer(t);
    const onCountdown = (n: number) => this.showCountdown(n);
    const onOver = (msg: string) => this.showMatchResult(msg);
    this.game.events.on('score:update', onScore);
    this.game.events.on('timer:update', onTimer);
    this.game.events.on('reset:countdown', onCountdown);
    this.game.events.on('match:over', onOver);
    this.unsubscribers.push(
      () => this.game.events.off('score:update', onScore),
      () => this.game.events.off('timer:update', onTimer),
      () => this.game.events.off('reset:countdown', onCountdown),
      () => this.game.events.off('match:over', onOver)
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    });
  }

  private updateScore(player: number, opponent: number) {
    this.scoreText.setText(`Player ${player} : ${opponent} CPU`);
  }

  private updateTimer(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = s < 10 ? `0${s}` : `${s}`;
    this.timerText.setText(`${m}:${pad}`);
  }

  private showCountdown(n: number) {
    if (!this.centerText) {
      this.centerText = this.add.text(this.scale.width / 2, 80, '', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: '40px',
        color: '#f8fafc'
      }).setOrigin(0.5, 0);
    }
    if (n > 0) {
      this.centerText.setText(`${n}`);
      this.centerText.setAlpha(1);
      this.tweens.add({ targets: this.centerText, alpha: 0.2, duration: 400, yoyo: true });
    } else {
      this.centerText.setText('');
    }
  }

  private showMatchResult(message: string) {
    if (!this.centerText) {
      this.centerText = this.add.text(this.scale.width / 2, 80, '', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: '40px',
        color: '#f8fafc'
      }).setOrigin(0.5, 0);
    }
    this.centerText.setText(`${message}\nClick/Tap to return to Menu`);
    this.centerText.setAlpha(1);
  }
}
