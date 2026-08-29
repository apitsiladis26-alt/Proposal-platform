"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function SuccessConfetti() {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#0d9488", "#f5d949", "#f585a0", "#66b4ee"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#0d9488", "#f5d949", "#f585a0", "#66b4ee"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return null;
}
