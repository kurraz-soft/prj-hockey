import type { FieldGeometry } from './geometry';

export type AITargetParams = {
  puckX: number;
  puckY: number;
  velX: number;
  velY: number;
  geom: FieldGeometry;
  paddleRadius: number;
  leadSeconds: number;
};

export function computeOpponentTarget({ puckX, puckY, velX, geom, paddleRadius, leadSeconds }: AITargetParams) {
  const predictedX = puckX + velX * leadSeconds;
  const desiredX = clamp(
    predictedX,
    geom.playX + paddleRadius,
    geom.playX + geom.playWidth - paddleRadius
  );

  const defLine = geom.midY - 120;
  let desiredY = defLine;
  if (puckY < geom.midY - 40) {
    desiredY = clamp(
      puckY,
      geom.opponentZone.y + paddleRadius + 10,
      geom.midY - paddleRadius - 40
    );
  }

  return { x: desiredX, y: desiredY };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

