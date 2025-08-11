import { describe, it, expect } from 'vitest';
import { computeFieldGeometry } from '../../game/geometry';

describe('computeFieldGeometry', () => {
  it('computes play area within margins and correct mid/goal', () => {
    const g = computeFieldGeometry(800, 1600);
    const margin = Math.round(Math.min(800, 1600) * 0.05);
    expect(g.playX).toBe(margin);
    expect(g.playY).toBe(margin);
    expect(g.playWidth).toBe(800 - 2 * margin);
    expect(g.playHeight).toBe(1600 - 2 * margin);
    expect(g.midY).toBe(g.playY + g.playHeight / 2);
    expect(g.goalWidth).toBe(Math.round(g.playWidth * 0.9));
    expect(g.topGoal.x2 - g.topGoal.x1).toBe(g.goalWidth);
    expect(g.topGoal.y).toBe(g.playY);
    expect(g.bottomGoal.y).toBe(g.playY + g.playHeight);
  });

  it('zones split field into halves', () => {
    const g = computeFieldGeometry(600, 1200);
    expect(g.playerZone.y).toBe(g.midY);
    expect(g.playerZone.height).toBe(g.playHeight / 2);
    expect(g.opponentZone.y).toBe(g.playY);
    expect(g.opponentZone.height).toBe(g.playHeight / 2);
  });
});

