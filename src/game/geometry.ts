export type FieldGeometry = {
  playX: number;
  playY: number;
  playWidth: number;
  playHeight: number;
  cornerRadius: number;
  midY: number;
  goalWidth: number;
  topGoal: { x1: number; x2: number; y: number };
  bottomGoal: { x1: number; x2: number; y: number };
  playerZone: { x: number; y: number; width: number; height: number };
  opponentZone: { x: number; y: number; width: number; height: number };
};

export function computeFieldGeometry(
  canvasWidth: number,
  canvasHeight: number
): FieldGeometry {
  const margin = Math.round(Math.min(canvasWidth, canvasHeight) * 0.05);
  const playX = margin;
  const playY = margin;
  const playWidth = canvasWidth - margin * 2;
  const playHeight = canvasHeight - margin * 2;
  const cornerRadius = Math.round(Math.min(playWidth, playHeight) * 0.06);

  const midY = playY + playHeight / 2;

  const goalWidth = Math.round(playWidth * 0.35);
  const gx1 = playX + (playWidth - goalWidth) / 2;
  const gx2 = gx1 + goalWidth;

  const topGoalY = playY; // visual line on top edge
  const bottomGoalY = playY + playHeight; // visual line on bottom edge

  const playerZone = { x: playX, y: midY, width: playWidth, height: playHeight / 2 };
  const opponentZone = { x: playX, y: playY, width: playWidth, height: playHeight / 2 };

  return {
    playX,
    playY,
    playWidth,
    playHeight,
    cornerRadius,
    midY,
    goalWidth,
    topGoal: { x1: gx1, x2: gx2, y: topGoalY },
    bottomGoal: { x1: gx1, x2: gx2, y: bottomGoalY },
    playerZone,
    opponentZone
  };
}

