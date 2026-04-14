'use client';

import { useEffect, useRef } from 'react';

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    let animId: number;
    const stars: Array<{
      x: number; y: number; r: number; opacity: number;
      speed: number; twinkleSpeed: number; twinkleDir: 1 | -1;
      color: string;
    }> = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createStars() {
      stars.length = 0;
      const isMobile = window.innerWidth < 768;
      const count = isMobile
        ? Math.floor((canvas.width * canvas.height) / 30000)
        : Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 40;
        stars.push({
          x: Math.cos(angle) * dist + canvas.width / 2,
          y: Math.sin(angle) * dist + canvas.height / 2,
          r: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.08 + 0.02,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
          color: Math.random() > 0.7 ? '#F59E0B' : Math.random() > 0.5 ? '#FCD34D' : '#818CF8',
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.opacity += s.twinkleSpeed * s.twinkleDir;
        if (s.opacity > 0.8 || s.opacity < 0.1) s.twinkleDir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    const handleResize = () => { resize(); createStars(); };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
