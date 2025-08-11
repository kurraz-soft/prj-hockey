import Phaser from 'phaser';

export default class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private centerText?: Phaser.GameObjects.Text;
  private unsubscribers: (() => void)[] = [];
  private pauseBtn?: Phaser.GameObjects.Image;
  private overlay?: Phaser.GameObjects.Rectangle;
  private menuGroup?: Phaser.GameObjects.Container;

  constructor() {
    super('Hud');
  }

  create() {
    const scale = this.scale.width / 800;
    const font20 = `${Math.max(16, Math.round(20 * scale))}px`;
    const font32 = `${Math.max(22, Math.round(32 * scale))}px`;

    this.scoreText = this.add.text(16, 12, 'Player 0 : 0 CPU', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: font20,
      color: '#f1f5f9'
    });

    this.timerText = this.add.text(this.scale.width / 2, 12, '3:00', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: font20,
      color: '#f1f5f9'
    }).setOrigin(0.5, 0);

    // Pause button (top-right)
    this.pauseBtn = this.add.image(this.scale.width - 16 - 24, 24 + 12, 'button')
      .setDisplaySize(48, 32)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const pauseTxt = this.add.text(this.pauseBtn.x, this.pauseBtn.y, 'II', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: font20,
      color: '#e5e7eb'
    }).setOrigin(0.5);
    this.pauseBtn.on('pointerdown', () => this.game.events.emit('game:togglePause'));

    // Listen for updates from GameScene
    const onScore = (p: number, o: number) => this.updateScore(p, o);
    const onTimer = (t: number) => this.updateTimer(t);
    const onCountdown = (n: number) => this.showCountdown(n);
    const onOver = (msg: string) => this.showMatchResult(msg);
    const onPaused = (flag: boolean) => this.setPauseOverlay(flag);
    this.game.events.on('score:update', onScore);
    this.game.events.on('timer:update', onTimer);
    this.game.events.on('reset:countdown', onCountdown);
    this.game.events.on('match:over', onOver);
    this.game.events.on('hud:paused', onPaused);
    this.unsubscribers.push(
      () => this.game.events.off('score:update', onScore),
      () => this.game.events.off('timer:update', onTimer),
      () => this.game.events.off('reset:countdown', onCountdown),
      () => this.game.events.off('match:over', onOver),
      () => this.game.events.off('hud:paused', onPaused)
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    });

    // ESC key to toggle pause
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.game.events.emit('game:togglePause');
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

  private setPauseOverlay(show: boolean) {
    if (show) {
      if (!this.overlay) {
        this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.45).setOrigin(0);
      }
      if (!this.menuGroup) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2 - 40;
        const group = this.add.container(0, 0);
        const makeBtn = (y: number, label: string, event: string) => {
          const bg = this.add.image(cx, y, 'button').setDisplaySize(260, 50).setInteractive({ useHandCursor: true }).setOrigin(0.5);
          const txt = this.add.text(cx, y, label, {
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            fontSize: '22px',
            color: '#e5e7eb'
          }).setOrigin(0.5);
          bg.on('pointerdown', () => this.game.events.emit(event));
          group.add([bg, txt]);
        };
        makeBtn(cy, 'Resume', 'game:resume');
        makeBtn(cy + 64, 'Restart', 'game:restart');
        makeBtn(cy + 128, 'Quit', 'game:quit');
        this.menuGroup = group;
      }
      this.overlay.setVisible(true);
      this.menuGroup.setVisible(true);
    } else {
      this.overlay?.setVisible(false);
      this.menuGroup?.setVisible(false);
    }
  }
}
