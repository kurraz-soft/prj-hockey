import type { FieldGeometry } from './geometry';

export type GoalSide = 'player' | 'opponent' | null;

export function detectGoal(
  puckX: number,
  puckY: number,
  puckRadius: number,
  geom: FieldGeometry
): GoalSide {
  const { topGoal, playY, playHeight } = geom;
  const topLine = topGoal.y;
  const bottomLine = playY + playHeight;
  const withinMouth = puckX >= topGoal.x1 && puckX <= topGoal.x2;
  if (!withinMouth) return null;
  if (puckY <= topLine + puckRadius) return 'player';
  if (puckY >= bottomLine - puckRadius) return 'opponent';
  return null;
}

