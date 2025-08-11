let ctx: AudioContext | null = null;

function ensureCtx() {
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function beep(freq: number, durationMs: number, gain = 0.03) {
  const audio = ensureCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(audio.destination);
  const now = audio.currentTime;
  osc.start(now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(1e-4, now + durationMs / 1000);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function playHit() {
  // Short, higher pitch
  beep(560, 60, 0.025);
}

export function playGoal() {
  // Slightly lower, longer
  beep(300, 140, 0.035);
}

