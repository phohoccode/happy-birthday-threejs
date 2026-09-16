'use client';

import { useEffect, useRef } from 'react';

type Particle = { x: number; y: number; vx: number; vy: number; rotation: number; vr: number; color: string; size: number; heart: boolean };
const COLORS = ['#f7d774', '#f9a8d4', '#a78bfa', '#fff3d4'];

export function ConfettiCanvas({ burstKey }: { burstKey: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!burstKey || !ref.current) return;
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.35);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);
    const particles: Particle[] = Array.from({ length: window.innerWidth < 700 ? 42 : 76 }, (_, i) => ({
      x: i % 2 ? -10 : window.innerWidth + 10,
      y: window.innerHeight * (0.52 + Math.random() * 0.16),
      vx: (i % 2 ? 1 : -1) * (4 + Math.random() * 8),
      vy: -5 - Math.random() * 11,
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 7,
      heart: i % 9 === 0,
    }));
    let frame = 0;
    let elapsed = 0;
    const draw = () => {
      elapsed += 1;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.vy += 0.28;
        particle.y += particle.vy;
        particle.rotation += particle.vr;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        if (particle.heart) {
          const s = particle.size * 0.6;
          context.beginPath();
          context.moveTo(0, s * 0.45);
          context.bezierCurveTo(-s * 1.25, -s * 0.35, -s * 0.58, -s * 1.15, 0, -s * 0.45);
          context.bezierCurveTo(s * 0.58, -s * 1.15, s * 1.25, -s * 0.35, 0, s * 0.45);
          context.fill();
        } else context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.62);
        context.restore();
      });
      if (elapsed < 175) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [burstKey]);
  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />;
}
