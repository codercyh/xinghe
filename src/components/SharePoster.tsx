'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { ZodiacData, BaziData } from '@/types/user';
import { getDailyFortune } from '@/lib/daily-fortune';

interface SharePosterProps {
  birthInfo: { year: number; month: number; day: number; hour: number; gender: 'male' | 'female' };
  zodiacData: ZodiacData;
  baziData: BaziData;
  onClose: () => void;
}

/* ─── 主色板 ─── */
const COLORS = {
  bgDeep: '#0A0A14',
  bgCard: '#13131F',
  border: '#2D2D44',
  primary: '#6366F1',
  gold: '#F59E0B',
  pink: '#EC4899',
  textMain: '#E2E8F0',
  textSub: '#94A3B8',
  textDim: '#475569',
  green: '#10B981',
  blue: '#3B82F6',
  red: '#EF4444',
};

function scoreColor(s: number) {
  return s >= 80 ? COLORS.green : s >= 65 ? COLORS.gold : s >= 50 ? COLORS.blue : COLORS.red;
}

/* ─── 帮助函数：canvas 绘制圆角矩形 ─── */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ─── 帮助函数：canvas 绘制环形进度条 ─── */
function drawScoreRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, score: number,
  label: string, icon: string,
) {
  const color = scoreColor(score);
  const lineWidth = 5;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#1A1A2E';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = color;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${score}`, cx, cy - 2);

  ctx.fillStyle = COLORS.textSub;
  ctx.font = '11px sans-serif';
  ctx.fillText(`${icon} ${label}`, cx, cy + radius + 16);
}

/* ─── 帮助函数：自动换行文本 ─── */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ─── 帮助函数：绘制大号评分环（桌面端综合评分用） ─── */
function drawBigScoreRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, score: number,
  levelText: string,
) {
  const color = scoreColor(score);
  const lineWidth = 8;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#1A1A2E';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = color;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${score}`, cx, cy - 6);

  ctx.fillStyle = COLORS.textSub;
  ctx.font = '13px sans-serif';
  ctx.fillText(levelText, cx, cy + 22);
}

export default function SharePoster({ birthInfo, zodiacData, baziData, onClose }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ─── 绘制星空背景 ─── */
  const drawStarfield = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(0, 0, W, H);

    const seed = birthInfo.year * 1000 + birthInfo.month * 100 + birthInfo.day;
    let rng = seed;
    const nextRng = () => { rng = (rng * 16807 + 0) % 2147483647; return rng / 2147483647; };
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 120; i++) {
      const sx = nextRng() * W;
      const sy = nextRng() * H;
      const sr = nextRng() * 1.5 + 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 500);
    glow.addColorStop(0, 'rgba(99,102,241,0.18)');
    glow.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 500);

    // 右下角也加一个微弱的粉色辉光
    const glow2 = ctx.createRadialGradient(W, H, 0, W, H, 400);
    glow2.addColorStop(0, 'rgba(236,72,153,0.08)');
    glow2.addColorStop(1, 'rgba(236,72,153,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);
  };

  /* ─── 绘制桌面端海报 (横向 1200x800) ─── */
  const generateDesktopPoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);

    const W = 1200;
    const H = 800;
    const PAD = 40;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    drawStarfield(ctx, W, H);

    const fortune = getDailyFortune(
      birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, birthInfo.gender,
    );

    // ── 顶部标题栏 ──
    let y = PAD;
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✦ 星合 XINGHE ✦', PAD, y + 14);

    const now = new Date();
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 生成`, W - PAD, y + 14);

    y += 36;

    // 分隔线
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();

    y += 20;

    // ── 主标题 + 星座三宫 ──
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('我的命运蓝图', PAD, y + 24);

    // 三宫 badges 在标题右侧
    const signs = [
      { label: '太阳', name: zodiacData.sun.name, symbol: zodiacData.sun.symbol, color: COLORS.gold },
      { label: '月亮', name: zodiacData.moon.name, symbol: '☽', color: COLORS.textSub },
      { label: '上升', name: zodiacData.rising.name, symbol: '↑', color: '#818CF8' },
    ];

    const badgeStartX = 340;
    signs.forEach((s, i) => {
      const bx = badgeStartX + i * 160;
      roundRect(ctx, bx, y, 148, 38, 10);
      ctx.fillStyle = 'rgba(24,24,40,0.8)';
      ctx.fill();
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = s.color;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.symbol, bx + 12, y + 24);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${s.label} ${s.name}`, bx + 36, y + 24);
    });

    y += 56;

    // ── 左栏 (八字四柱 + 五行) | 中栏 (今日运势) | 右栏 (金句 + 二维码) ──
    const colY = y;
    const leftW = 420;
    const midW = 380;
    const rightW = W - PAD * 2 - leftW - midW - 24;
    const leftX = PAD;
    const midX = PAD + leftW + 12;
    const rightX = midX + midW + 12;
    const colH = H - colY - PAD;

    // ─── 左栏：八字四柱 ───
    roundRect(ctx, leftX, colY, leftW, colH, 16);
    ctx.fillStyle = 'rgba(24,24,40,0.6)';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    let ly = colY + 20;
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🀄 八字四柱', leftX + 20, ly + 14);

    // 日主标签
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    const GAN_WUXING: Record<string, string> = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const strengthLabel = baziData.dayStrength === 'strong' ? '偏旺' : baziData.dayStrength === 'weak' ? '偏弱' : '中和';
    ctx.fillText(`${baziData.dayMaster}${GAN_WUXING[baziData.dayMaster] || ''}  日主${strengthLabel}`, leftX + leftW - 20, ly + 14);

    ly += 40;

    // 四柱卡片
    const pillarW = (leftW - 60) / 4;
    const pillarH = 90;
    const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
    const pillars = [baziData.pillars.year, baziData.pillars.month, baziData.pillars.day, baziData.pillars.hour];

    pillars.forEach((p, i) => {
      const px = leftX + 16 + i * (pillarW + 8);
      roundRect(ctx, px, ly, pillarW, pillarH, 10);
      ctx.fillStyle = '#0F0F1A';
      ctx.fill();
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = COLORS.textDim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pillarLabels[i], px + pillarW / 2, ly + 18);

      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(p.gan, px + pillarW / 2, ly + 46);

      ctx.fillStyle = COLORS.primary;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(p.zhi, px + pillarW / 2, ly + 74);
    });

    ly += pillarH + 20;

    // 五行分布条
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('五行分布', leftX + 20, ly + 12);
    ly += 26;

    const wuxingItems = [
      { name: '金', count: baziData.wuxing.metal, color: '#D1D5DB', bg: 'rgba(209,213,219,0.35)' },
      { name: '木', count: baziData.wuxing.wood, color: '#4ADE80', bg: 'rgba(74,222,128,0.35)' },
      { name: '水', count: baziData.wuxing.water, color: '#22D3EE', bg: 'rgba(34,211,238,0.35)' },
      { name: '火', count: baziData.wuxing.fire, color: '#F87171', bg: 'rgba(248,113,113,0.35)' },
      { name: '土', count: baziData.wuxing.earth, color: '#A78BFA', bg: 'rgba(167,139,250,0.35)' },
    ];
    const maxW = Math.max(...wuxingItems.map(w => w.count), 1);
    const barStartX = leftX + 50;
    const barMaxW = leftW - 100;

    wuxingItems.forEach((w, i) => {
      const by = ly + i * 22;

      ctx.fillStyle = w.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.name, leftX + 30, by + 10);

      roundRect(ctx, barStartX, by, barMaxW, 13, 6);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();

      const fillW = Math.max((w.count / maxW) * barMaxW, 8);
      roundRect(ctx, barStartX, by, fillW, 13, 6);
      ctx.fillStyle = w.bg;
      ctx.fill();

      ctx.fillStyle = COLORS.textDim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${w.count}`, leftX + leftW - 20, by + 10);
    });

    ly += 110 + 20;

    // 喜用神
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('喜用神', leftX + 20, ly + 12);
    ly += 24;

    ctx.fillStyle = COLORS.textSub;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    const xiStr = baziData.dayun.summary;
    ctx.fillText(xiStr, leftX + 20, ly + 10);

    // ─── 中栏：今日运势 ───
    roundRect(ctx, midX, colY, midW, colH, 16);
    ctx.fillStyle = 'rgba(24,24,40,0.6)';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    let my = colY + 20;
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📅 今日运势', midX + 20, my + 14);

    // 日期
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, midX + midW - 20, my + 14);

    my += 40;

    // 大号综合评分环
    const bigRingCx = midX + midW / 2;
    const bigRingCy = my + 60;
    const levelText = fortune.overall >= 80 ? '大吉' : fortune.overall >= 65 ? '中吉' : fortune.overall >= 50 ? '小吉' : '平';
    drawBigScoreRing(ctx, bigRingCx, bigRingCy, 48, fortune.overall, levelText);

    my += 130;

    // 四个小评分环
    const ringGap = midW / 4;
    const scores = [
      { score: fortune.career, label: '事业', icon: '💼' },
      { score: fortune.love, label: '感情', icon: '💕' },
      { score: fortune.wealth, label: '财运', icon: '💰' },
      { score: fortune.health, label: '健康', icon: '🏃' },
    ];
    scores.forEach((s, i) => {
      drawScoreRing(ctx, midX + ringGap * i + ringGap / 2, my + 30, 26, s.score, s.label, s.icon);
    });

    my += 80;

    // Lucky items
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`幸运色 ${fortune.luckyColor.name}`, midX + midW / 3, my + 16);
    ctx.fillText(`幸运数字 ${fortune.luckyNumber}`, midX + midW * 2 / 3, my + 16);

    my += 30;
    ctx.fillText(`吉方位 ${fortune.luckyDirection}`, midX + midW / 2, my + 16);

    my += 36;

    // 宜忌
    ctx.fillStyle = COLORS.green;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('宜', midX + 20, my + 12);
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '12px sans-serif';
    ctx.fillText(fortune.goodFor.join(' · '), midX + 44, my + 12);

    my += 24;
    ctx.fillStyle = COLORS.red;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('忌', midX + 20, my + 12);
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '12px sans-serif';
    ctx.fillText(fortune.badFor.join(' · '), midX + 44, my + 12);

    my += 36;

    // 金句
    roundRect(ctx, midX + 16, my, midW - 32, 70, 12);
    const quoteGrad = ctx.createLinearGradient(midX, my, midX + midW, my);
    quoteGrad.addColorStop(0, 'rgba(99,102,241,0.12)');
    quoteGrad.addColorStop(1, 'rgba(236,72,153,0.08)');
    ctx.fillStyle = quoteGrad;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'center';
    const quoteLines = wrapText(ctx, `「${fortune.quote}」`, midW - 72);
    quoteLines.forEach((line, i) => {
      ctx.fillText(line, midX + midW / 2, my + 26 + i * 20);
    });

    // ─── 右栏：二维码 + CTA ───
    const actualRightW = W - PAD - rightX;
    roundRect(ctx, rightX, colY, actualRightW, colH, 16);
    ctx.fillStyle = 'rgba(24,24,40,0.6)';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    let ry = colY + colH / 2 - 100;

    // 扫码文字
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    const rCx = rightX + actualRightW / 2;
    ctx.fillText('扫码解锁', rCx, ry);
    ry += 16;
    ctx.fillText('你的命运蓝图', rCx, ry);
    ry += 30;

    // QR placeholder
    const qrSize = 90;
    roundRect(ctx, rCx - qrSize / 2, ry, qrSize, qrSize, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.fillStyle = COLORS.bgDeep;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('星合', rCx, ry + qrSize / 2 - 6);
    ctx.font = '10px sans-serif';
    ctx.fillText('XINGHE', rCx, ry + qrSize / 2 + 10);

    ry += qrSize + 20;

    // URL
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px sans-serif';
    ctx.fillText('121.43.246.140:3000', rCx, ry);

    // ── 生成完毕 ──
    const dataUrl = canvas.toDataURL('image/png');
    setPosterUrl(dataUrl);
    setRendering(false);
  }, [birthInfo, zodiacData, baziData]);

  /* ─── 绘制手机端海报 (竖屏 750x1200) ─── */
  const generateMobilePoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);

    const W = 750;
    const H = 1200;
    const PAD = 36;
    const CW = W - PAD * 2;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    drawStarfield(ctx, W, H);

    const fortune = getDailyFortune(
      birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, birthInfo.gender,
    );

    let y = PAD + 16;

    // ── Brand ──
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ 星合 XINGHE ✦', W / 2, y);
    y += 44;

    // ── Title ──
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('我的命运蓝图', W / 2, y);
    y += 16;

    const now = new Date();
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px sans-serif';
    ctx.fillText(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 生成`, W / 2, y + 14);
    y += 44;

    // ── Zodiac Badge ──
    roundRect(ctx, PAD, y, CW, 90, 14);
    ctx.fillStyle = '#181828';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const signs = [
      { label: '太阳', name: zodiacData.sun.name, symbol: zodiacData.sun.symbol, color: COLORS.gold },
      { label: '月亮', name: zodiacData.moon.name, symbol: '☽', color: COLORS.textSub },
      { label: '上升', name: zodiacData.rising.name, symbol: '↑', color: '#818CF8' },
    ];
    const segW = CW / 3;
    signs.forEach((s, i) => {
      const cx = PAD + segW * i + segW / 2;
      const cy = y + 45;

      ctx.fillStyle = s.color;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.symbol, cx, cy - 10);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${s.label} ${s.name}`, cx, cy + 16);
    });

    y += 90 + 20;

    // ── 八字四柱 + 五行 (并排上下) ──
    // 四柱卡片
    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🀄 八字四柱', PAD + 4, y + 12);

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    const GAN_WX_M: Record<string, string> = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const strLbl = baziData.dayStrength === 'strong' ? '偏旺' : baziData.dayStrength === 'weak' ? '偏弱' : '中和';
    ctx.fillText(`${baziData.dayMaster}${GAN_WX_M[baziData.dayMaster] || ''} · 日主${strLbl}`, PAD + CW - 4, y + 12);

    y += 28;

    const pillarW = (CW - 18) / 4;
    const pillarH = 88;
    const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
    const pillars = [baziData.pillars.year, baziData.pillars.month, baziData.pillars.day, baziData.pillars.hour];

    pillars.forEach((p, i) => {
      const px = PAD + i * (pillarW + 6);
      roundRect(ctx, px, y, pillarW, pillarH, 10);
      ctx.fillStyle = '#0F0F1A';
      ctx.fill();
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = COLORS.textDim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pillarLabels[i], px + pillarW / 2, y + 18);

      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(p.gan, px + pillarW / 2, y + 44);

      ctx.fillStyle = COLORS.primary;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(p.zhi, px + pillarW / 2, y + 72);
    });

    y += pillarH + 16;

    // 五行分布条
    roundRect(ctx, PAD, y, CW, 145, 14);
    ctx.fillStyle = '#181828';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('五行分布', PAD + 16, y + 24);

    const wuxingItems = [
      { name: '金', count: baziData.wuxing.metal, color: '#D1D5DB', bg: 'rgba(209,213,219,0.35)' },
      { name: '木', count: baziData.wuxing.wood, color: '#4ADE80', bg: 'rgba(74,222,128,0.35)' },
      { name: '水', count: baziData.wuxing.water, color: '#22D3EE', bg: 'rgba(34,211,238,0.35)' },
      { name: '火', count: baziData.wuxing.fire, color: '#F87171', bg: 'rgba(248,113,113,0.35)' },
      { name: '土', count: baziData.wuxing.earth, color: '#A78BFA', bg: 'rgba(167,139,250,0.35)' },
    ];
    const maxWx = Math.max(...wuxingItems.map(w => w.count), 1);
    const barStartX = PAD + 46;
    const barMaxW = CW - 80;

    wuxingItems.forEach((w, i) => {
      const by = y + 40 + i * 20;

      ctx.fillStyle = w.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.name, PAD + 26, by + 9);

      roundRect(ctx, barStartX, by, barMaxW, 12, 6);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();

      const fillW = Math.max((w.count / maxWx) * barMaxW, 8);
      roundRect(ctx, barStartX, by, fillW, 12, 6);
      ctx.fillStyle = w.bg;
      ctx.fill();

      ctx.fillStyle = COLORS.textDim;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${w.count}`, PAD + CW - 14, by + 9);
    });

    y += 145 + 20;

    // ── 今日运势 ──
    roundRect(ctx, PAD, y, CW, 160, 14);
    ctx.fillStyle = '#181828';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = COLORS.textMain;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📅 今日运势', PAD + 16, y + 24);

    // 综合评分
    ctx.fillStyle = scoreColor(fortune.overall);
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    const mLevelText = fortune.overall >= 80 ? '大吉' : fortune.overall >= 65 ? '中吉' : fortune.overall >= 50 ? '小吉' : '平';
    ctx.fillText(`${fortune.overall}分 · ${mLevelText}`, PAD + CW - 16, y + 24);

    // 4 score rings
    const ringY = y + 76;
    const ringGap = CW / 4;
    const scores = [
      { score: fortune.career, label: '事业', icon: '💼' },
      { score: fortune.love, label: '感情', icon: '💕' },
      { score: fortune.wealth, label: '财运', icon: '💰' },
      { score: fortune.health, label: '健康', icon: '🏃' },
    ];
    scores.forEach((s, i) => {
      drawScoreRing(ctx, PAD + ringGap * i + ringGap / 2, ringY, 26, s.score, s.label, s.icon);
    });

    // Lucky items
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `幸运色 ${fortune.luckyColor.name}  ·  幸运数字 ${fortune.luckyNumber}  ·  ${fortune.luckyDirection}`,
      W / 2, y + 142,
    );

    y += 160 + 20;

    // ── 金句 ──
    roundRect(ctx, PAD, y, CW, 68, 14);
    const quoteGrad = ctx.createLinearGradient(PAD, y, PAD + CW, y);
    quoteGrad.addColorStop(0, 'rgba(99,102,241,0.12)');
    quoteGrad.addColorStop(1, 'rgba(236,72,153,0.08)');
    ctx.fillStyle = quoteGrad;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'center';
    const quoteLines = wrapText(ctx, `「${fortune.quote}」`, CW - 40);
    quoteLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, y + 28 + i * 18);
    });

    y += 68 + 24;

    // ── Bottom CTA ──
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD + 60, y);
    ctx.lineTo(W - PAD - 60, y);
    ctx.stroke();
    y += 20;

    ctx.fillStyle = COLORS.textSub;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('扫码解锁你的专属命运蓝图', W / 2, y);
    y += 24;

    const qrSize = 80;
    roundRect(ctx, W / 2 - qrSize / 2, y, qrSize, qrSize, 10);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.fillStyle = COLORS.bgDeep;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('星合', W / 2, y + qrSize / 2 - 5);
    ctx.font = '9px sans-serif';
    ctx.fillText('XINGHE', W / 2, y + qrSize / 2 + 9);

    y += qrSize + 14;
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px sans-serif';
    ctx.fillText('121.43.246.140:3000', W / 2, y);

    // ── 生成完毕 ──
    const dataUrl = canvas.toDataURL('image/png');
    setPosterUrl(dataUrl);
    setRendering(false);
  }, [birthInfo, zodiacData, baziData]);

  const generatePoster = useCallback(() => {
    setPosterUrl(null);
    if (isDesktop) {
      generateDesktopPoster();
    } else {
      generateMobilePoster();
    }
  }, [isDesktop, generateDesktopPoster, generateMobilePoster]);

  // Auto-generate on open
  useEffect(() => {
    const timer = setTimeout(() => generatePoster(), 100);
    return () => clearTimeout(timer);
  }, [generatePoster]);

  const handleSave = () => {
    if (!posterUrl) return;
    setSaving(true);
    const link = document.createElement('a');
    link.download = `星合-命运蓝图-${zodiacData.sun.name}.png`;
    link.href = posterUrl;
    link.click();
    setTimeout(() => setSaving(false), 1000);
  };

  const handleShare = async () => {
    if (!posterUrl || !canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, 'image/png'),
      );
      if (blob && navigator.share) {
        const file = new File([blob], '星合-命运蓝图.png', { type: 'image/png' });
        await navigator.share({
          title: '✦ 星合 — 我的命运蓝图',
          text: `我的太阳星座是${zodiacData.sun.name}，快来看看你的命运蓝图！`,
          files: [file],
        });
      }
    } catch {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`
          relative bg-[#13131F] border border-[#2D2D44] rounded-2xl shadow-2xl overflow-hidden
          max-h-[92vh] flex flex-col
          w-full max-w-md
          md:max-w-5xl md:w-[90vw]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2D2D44]">
          <h3 className="text-base font-semibold text-[#E2E8F0]">🎨 分享海报</h3>
          <div className="flex items-center gap-3">
            {posterUrl && (
              <button
                onClick={generatePoster}
                className="text-xs text-[#94A3B8] hover:text-white transition"
              >
                🔄 重新生成
              </button>
            )}
            <button onClick={onClose} className="text-[#94A3B8] hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {rendering ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="text-4xl animate-pulse">✨</div>
              <p className="text-[#94A3B8] text-sm">正在绘制你的命运蓝图...</p>
            </div>
          ) : posterUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl overflow-hidden border border-[#2D2D44] shadow-lg w-full">
                <img
                  src={posterUrl}
                  alt="星合命运蓝图海报"
                  className="w-full h-auto"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-6xl">🖼️</div>
              <p className="text-[#94A3B8] text-sm text-center">
                生成精美海报，一键分享到朋友圈
              </p>
              <button
                onClick={generatePoster}
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                ✨ 生成海报
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {posterUrl && (
          <div className="flex gap-3 px-5 py-4 border-t border-[#2D2D44]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-secondary px-4 py-2.5 text-sm font-medium"
            >
              {saving ? '✅ 已保存' : '💾 保存图片'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 btn-primary px-4 py-2.5 text-sm font-medium"
            >
              📤 分享
            </button>
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
