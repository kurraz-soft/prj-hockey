import { describe, it, expect } from 'vitest';
import { computeOpponentTarget } from '../../game/ai';
import { computeFieldGeometry } from '../../game/geometry';

describe('computeOpponentTarget', () => {
  const geom = computeFieldGeometry(800, 1600);
  const paddleRadius = 40;
  const lead = 0.12;

  it('leads puck X and clamps to field', () => {
    const res = computeOpponentTarget({ puckX: 100, puckY: 200, velX: 500, velY: 0, geom, paddleRadius, leadSeconds: lead });
    // expected predicted X
    const expected = 100 + 500 * lead;
    expect(res.x).toBeGreaterThan(100);
    expect(res.x).toBeLessThanOrEqual(geom.playX + geom.playWidth - paddleRadius);
    expect(res.x).toBeCloseTo(expected, 1);
  });

  it('holds defensive line when puck not deep', () => {
    const res = computeOpponentTarget({ puckX: 400, puckY: geom.midY + 10, velX: 0, velY: 0, geom, paddleRadius, leadSeconds: lead });
    expect(res.y).toBeCloseTo(geom.midY - 120, 0);
  });

  it('approaches puck Y when in opponent half, with clamp', () => {
    const res = computeOpponentTarget({ puckX: 400, puckY: geom.playY + 5, velX: 0, velY: 0, geom, paddleRadius, leadSeconds: lead });
    const minY = geom.opponentZone.y + paddleRadius + 10;
    expect(res.y).toBeGreaterThanOrEqual(minY);
    expect(res.y).toBeLessThan(geom.midY);
  });
});

