import { describe, it, expect } from 'vitest';
import { computeFieldGeometry } from '../../game/geometry';
import { detectGoal } from '../../game/rules';

describe('detectGoal', () => {
  const g = computeFieldGeometry(800, 1600);
  const mouthX = (g.topGoal.x1 + g.topGoal.x2) / 2;
  const r = 20;

  it('returns player when puck crosses top line within mouth', () => {
    const side = detectGoal(mouthX, g.topGoal.y - 1 + r, r, g);
    expect(side).toBe('player');
  });

  it('returns opponent when puck crosses bottom line within mouth', () => {
    const bottomY = g.playY + g.playHeight;
    const side = detectGoal(mouthX, bottomY + 1 - r, r, g);
    expect(side).toBe('opponent');
  });

  it('returns null when outside mouth', () => {
    const side = detectGoal(g.playX - 10, g.topGoal.y, r, g);
    expect(side).toBeNull();
  });
});

