// Tiny WebAudio chime (mock's `chime()`), lazily created after a user gesture.
let actx: AudioContext | null = null;

export function chime(): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    actx = actx || new Ctx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = actx!.createOscillator();
      const g = actx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = actx!.currentTime + i * 0.08;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g);
      g.connect(actx!.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
  } catch {
    /* no-op */
  }
}
