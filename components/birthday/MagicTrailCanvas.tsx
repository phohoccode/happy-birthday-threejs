'use client';

import { useEffect, useRef } from 'react';

type TrailParticle = { x: number; y: number; vx: number; vy: number; life: number; size: number };

export function MagicTrailCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const particles: TrailParticle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastSpawn = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const spawn = (x: number, y: number, amount: number) => {
      for (let index = 0; index < amount; index += 1) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * 0.7, vy: -0.15 - Math.random() * 0.45, life: 1, size: 0.8 + Math.random() * 2.2 });
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90);
    };
    const pointer = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 36) return;
      lastSpawn = now;
      spawn(event.clientX, event.clientY, event.pointerType === 'touch' ? 10 : 3);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.028;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }
        context.beginPath();
        context.fillStyle = `rgba(230, 205, 255, ${particle.life * 0.55})`;
        context.shadowBlur = 9;
        context.shadowColor = '#b992ff';
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerdown', pointer, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerdown', pointer);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="magic-trail-canvas" aria-hidden="true" />;
}
