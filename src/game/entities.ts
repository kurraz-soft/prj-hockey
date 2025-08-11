import Phaser from 'phaser';

export function createPaddle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey = 'paddle',
  tint?: number
) {
  const paddle = scene.physics.add.image(x, y, textureKey);
  if (tint !== undefined) paddle.setTint(tint);
  paddle.setImmovable(true);
  // Body as a circle matching the texture (80x80 texture -> radius 40)
  paddle.setCircle(40);
  return paddle;
}

export function createPuck(scene: Phaser.Scene, x: number, y: number, textureKey = 'puck') {
  const puck = scene.physics.add.image(x, y, textureKey);
  puck.setCollideWorldBounds(true, 1, 1);
  // Body circle matches texture (40px radius for 80px diameter puck texture is 20)
  puck.setCircle(20);
  return puck;
}

