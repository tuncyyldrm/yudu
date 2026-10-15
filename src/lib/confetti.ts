'use client';

import confetti from 'canvas-confetti';

export function fireConfetti() {
  try {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'],
    });
  } catch {
    // ignore if canvas context is unavailable
  }
}

export function fireSuperConfetti() {
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#a855f7'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // ignore
  }
}
