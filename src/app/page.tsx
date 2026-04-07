'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserStore } from '@/store/userStore';
import type { BirthInfo } from '@/types/user';

const schema = z.object({
  year: z.number().min(1940).max(2030),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  second: z.number().min(0).max(59),
  gender: z.enum(['male', 'female']),
  timezone: z.string(),
});

type FormData = z.infer<typeof schema>;

// ===== Star Canvas Background =====
function StarCanvas() {
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

// ===== Loading Page =====
function LoadingPage({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef<'converge' | 'explode'>('converge');
  const progressRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; startX: number; startY: number;
    r: number; color: string; explodeVx: number; explodeVy: number; opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 300;
    canvas.height = 300;

    // Init particles
    particlesRef.current = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 40;
      const x = Math.cos(angle) * dist + 150;
      const y = Math.sin(angle) * dist + 150;
      particlesRef.current.push({
        x, y, startX: x, startY: y, r: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#F59E0B' : '#6366F1',
        explodeVx: (Math.random() - 0.5) * 4,
        explodeVy: (Math.random() - 0.5) * 4,
        opacity: 1,
      });
    }

    let pct = 0;
    const fillProgress = () => {
      if (pct < 85) {
        pct += Math.random() * 3 + 1;
        pct = Math.min(85, pct);
        setProgress(pct);
        setTimeout(fillProgress, 80 + Math.random() * 60);
      } else {
        // Start animation after a delay
        setTimeout(() => {
          phaseRef.current = 'converge';
          setTimeout(() => {
            phaseRef.current = 'explode';
          }, 1800);
          setTimeout(() => {
            setProgress(100);
            setTimeout(onComplete, 300);
          }, 2500);
        }, 200);
      }
    };
    setTimeout(fillProgress, 300);

    function draw() {
      ctx!.clearRect(0, 0, 300, 300);
      const cx = 150, cy = 150;

      if (phaseRef.current === 'converge') {
        particlesRef.current.forEach(p => {
          p.x += (cx - p.x) * 0.04;
          p.y += (cy - p.y) * 0.04;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.globalAlpha = 0.9;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        });
        const grd = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 30);
        grd.addColorStop(0, 'rgba(99,102,241,0.3)');
        grd.addColorStop(1, 'rgba(99,102,241,0)');
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx!.fill();
      } else {
        particlesRef.current.forEach(p => {
          p.x += p.explodeVx;
          p.y += p.explodeVy;
          p.opacity -= 0.02;
          if (p.opacity <= 0) return;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.globalAlpha = Math.max(0, p.opacity);
          ctx!.fill();
          ctx!.globalAlpha = 1;
        });
        const grd = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 60);
        grd.addColorStop(0, 'rgba(245,158,11,0.6)');
        grd.addColorStop(0.5, 'rgba(99,102,241,0.3)');
        grd.addColorStop(1, 'rgba(99,102,241,0)');
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0A0A14] gap-6">
      <canvas ref={canvasRef} className="rounded-full" width={300} height={300} />
      <p className="text-[#94A3B8] text-lg font-light">
        正在解析你的星图
        <span className="dot-anim">
          <span>.</span><span style={{ animationDelay: '0.2s' }}>.</span>
          <span style={{ animationDelay: '0.4s' }}>.</span>
        </span>
      </p>
      <div className="w-60 flex flex-col items-center gap-2">
        <div className="progress-track w-full">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[#475569] text-sm">{Math.round(progress)}%</span>
      </div>
      <style>{`
        .dot-anim span { animation: blink 1.4s infinite; display:inline-block; }
        @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
      `}</style>
    </div>
  );
}

// ===== Home Page =====
export default function HomePage() {
  const router = useRouter();
  const { setBirthInfo, setIsLoading, isLoading } = useUserStore();
  const [showSeconds, setShowSeconds] = useState(false);
  const [pageState, setPageState] = useState<'home' | 'loading'>('home');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: 2000,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      gender: 'male',
      timezone: 'Asia/Shanghai',
    },
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  const gender = watch('gender');

  const onSubmit = async (data: FormData) => {
    setPageState('loading');
    setIsLoading(true);

    const birthInfo: BirthInfo = {
      ...data,
      second: showSeconds ? data.second : 0,
    };

    // Store in Zustand
    setBirthInfo(birthInfo);

    // Also store in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xinghe_birthInfo', JSON.stringify(birthInfo));
    }
  };

  const handleLoadingComplete = () => {
    setPageState('home');
    router.push('/result');
  };

  return (
    <>
      {pageState === 'loading' && <LoadingPage onComplete={handleLoadingComplete} />}

      <div className="page-bg relative z-[1] flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8">
        {/* Nav */}
        <nav className="nav-bar">
          <div className="nav-logo">✦ 星合</div>
          <div className="flex gap-2">
            <Link href="/history" className="btn-secondary px-4 py-2 text-sm">📜 历史</Link>
            <Link href="/about" className="btn-secondary px-4 py-2 text-sm">关于</Link>
          </div>
        </nav>

        {/* Hero */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-[6px] gradient-text mb-3 text-center animate-[fadeUp_0.8s_ease-out]">
          <span className="text-[#F59E0B] animate-[twinkle_2s_ease-in-out_infinite_alternate] inline-block">✦</span>
          {' '}星合{' '}
          <span className="text-[#F59E0B] animate-[twinkle_2s_ease-in-out_infinite_alternate] inline-block">✦</span>
        </h1>
        <p className="text-[#94A3B8] text-base md:text-lg font-light mb-10 animate-[fadeUp_0.8s_ease-out_0.15s_both]">
          你的星座与命运，由星星告诉你
        </p>

        {/* Input Card */}
        <div className="glass-card p-6 md:p-8 w-full max-w-[520px] animate-[fadeUp_0.8s_ease-out_0.3s_both]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Birth Date */}
            <div>
              <label className="block text-[#94A3B8] text-sm mb-2 font-medium">出生日期</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#475569] text-xs text-center mb-1">年</label>
                  <select {...register('year', { valueAsNumber: true })} className="input-field text-center py-2.5">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] text-xs text-center mb-1">月</label>
                  <select {...register('month', { valueAsNumber: true })} className="input-field text-center py-2.5">
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] text-xs text-center mb-1">日</label>
                  <select {...register('day', { valueAsNumber: true })} className="input-field text-center py-2.5">
                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-[#94A3B8] text-sm mb-2 font-medium">出生时间</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] text-xs text-center mb-1">时</label>
                  <select {...register('hour', { valueAsNumber: true })} className="input-field text-center py-2.5">
                    {hours.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}时</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] text-xs text-center mb-1">分</label>
                  <select {...register('minute', { valueAsNumber: true })} className="input-field text-center py-2.5">
                    {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}分</option>)}
                  </select>
                </div>
              </div>

              {/* Seconds toggle */}
              <button
                type="button"
                onClick={() => setShowSeconds(s => !s)}
                className="mt-2 text-[#818CF8] text-sm bg-none border-none cursor-pointer flex items-center gap-1"
              >
                <span>{showSeconds ? '−' : '+'}</span>
                {showSeconds ? '收起秒数' : '精确到秒（可选）'}
              </button>

              {showSeconds && (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <div>
                    <label className="block text-[#475569] text-xs text-center mb-1">秒</label>
                    <select {...register('second', { valueAsNumber: true })} className="input-field text-center py-2.5">
                      {seconds.map(s => <option key={s} value={s}>{String(s).padStart(2,'0')}秒</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[#94A3B8] text-sm mb-2 font-medium">性别</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('gender', 'male')}
                  className={`py-3 rounded-[var(--radius-md)] border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    gender === 'male'
                      ? 'border-[#6366F1] bg-[rgba(99,102,241,0.1)] text-[#F1F5F9] shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'border-[#2D2D44] text-[#94A3B8] hover:border-[#818CF8]'
                  }`}
                >
                  <span>♂</span> 男
                </button>
                <button
                  type="button"
                  onClick={() => setValue('gender', 'female')}
                  className={`py-3 rounded-[var(--radius-md)] border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    gender === 'female'
                      ? 'border-[#6366F1] bg-[rgba(99,102,241,0.1)] text-[#F1F5F9] shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'border-[#2D2D44] text-[#94A3B8] hover:border-[#818CF8]'
                  }`}
                >
                  <span>♀</span> 女
                </button>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-[#94A3B8] text-sm mb-2 font-medium">时区</label>
              <select {...register('timezone')} className="input-field py-2.5 px-3 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:12px]">
                <option value="Asia/Shanghai">🇨🇳 中国（GMT+8）</option>
                <option value="Asia/Hong_Kong">🇭🇰 香港（GMT+8）</option>
                <option value="Asia/Taipei">🇹🇼 台北（GMT+8）</option>
                <option value="Asia/Tokyo">🇯🇵 日本（GMT+9）</option>
                <option value="Asia/Singapore">🇸🇬 新加坡（GMT+8）</option>
                <option value="America/New_York">🇺🇸 纽约（GMT-5）</option>
                <option value="Europe/London">🇬🇧 伦敦（GMT+0）</option>
              </select>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-4 text-base mt-2">
              <span className="animate-[twinkle_1.5s_ease-in-out_infinite_alternate]">✦</span>
              开启星合
            </button>
          </form>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-[#475569] text-sm animate-[fadeUp_0.8s_ease-out_0.5s_both]">
          已有 <strong className="text-[#F59E0B]">12,847</strong> 人解锁自己的星合 ✦
        </p>

        {/* Star canvas */}
        <StarCanvas />

        {/* Global animation styles */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes twinkle {
            from { opacity: 0.5; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    </>
  );
}
