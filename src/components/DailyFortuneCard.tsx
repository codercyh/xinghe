'use client';

import { useEffect, useState } from 'react';
import { getDailyFortune, type DailyFortune } from '@/lib/daily-fortune';

interface DailyFortuneCardProps {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
  sunSign: string;
  sunSymbol: string;
}

function ScoreRing({ score, label, icon, size = 56 }: { score: number; label: string; icon: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const color = score >= 80 ? '#10B981' : score >= 65 ? '#F59E0B' : score >= 50 ? '#3B82F6' : '#EF4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#1A1A2E" strokeWidth="4"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${dashOffset}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs">{icon}</span>
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-[#94A3B8]">{label}</span>
    </div>
  );
}

export default function DailyFortuneCard({
  year, month, day, hour, gender, sunSign, sunSymbol,
}: DailyFortuneCardProps) {
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const f = getDailyFortune(year, month, day, hour, gender);
    setFortune(f);
  }, [year, month, day, hour, gender]);

  if (!fortune) return null;

  const overallColor = fortune.overall >= 80 ? '#10B981'
    : fortune.overall >= 65 ? '#F59E0B'
    : fortune.overall >= 50 ? '#3B82F6'
    : '#EF4444';

  const overallLabel = fortune.overall >= 80 ? '大吉'
    : fortune.overall >= 65 ? '中吉'
    : fortune.overall >= 50 ? '平'
    : '宜静';

  return (
    <div className="content-card overflow-hidden animate-[fadeUp_0.6s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-lg shadow-lg">
            ☀️
          </div>
          <div>
            <h3 className="font-semibold text-base">今日运势</h3>
            <div className="text-xs text-[#475569]">{fortune.dateKey} · {sunSign}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: overallColor }}>
            {fortune.overall}
          </div>
          <div
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: overallColor,
              background: `${overallColor}15`,
              border: `1px solid ${overallColor}30`,
            }}
          >
            {overallLabel}
          </div>
        </div>
      </div>

      {/* 四维评分 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <ScoreRing score={fortune.career} label="事业" icon="💼" />
        <ScoreRing score={fortune.love} label="感情" icon="💕" />
        <ScoreRing score={fortune.wealth} label="财运" icon="💰" />
        <ScoreRing score={fortune.health} label="健康" icon="❤️" />
      </div>

      {/* 今日金句 */}
      <div className="bg-gradient-to-r from-[rgba(99,102,241,0.08)] to-[rgba(245,158,11,0.06)] rounded-xl p-3 mb-4 border border-[rgba(99,102,241,0.12)]">
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">✨</span>
          <p className="text-sm text-[#CBD5E1] leading-relaxed italic">
            「{fortune.quote}」
          </p>
        </div>
      </div>

      {/* 幸运元素 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#13131F] rounded-lg p-2.5 text-center">
          <div className="text-xs text-[#475569] mb-1">幸运色</div>
          <div className="flex items-center justify-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full border border-[rgba(255,255,255,0.1)]"
              style={{ background: fortune.luckyColor.hex }}
            />
            <span className="text-xs font-medium" style={{ color: fortune.luckyColor.hex }}>
              {fortune.luckyColor.name}
            </span>
          </div>
        </div>
        <div className="bg-[#13131F] rounded-lg p-2.5 text-center">
          <div className="text-xs text-[#475569] mb-1">幸运数字</div>
          <span className="text-base font-bold text-[#F59E0B]">{fortune.luckyNumber}</span>
        </div>
        <div className="bg-[#13131F] rounded-lg p-2.5 text-center">
          <div className="text-xs text-[#475569] mb-1">吉方位</div>
          <span className="text-base font-bold text-[#818CF8]">{fortune.luckyDirection}</span>
        </div>
      </div>

      {/* 宜忌 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 bg-[rgba(16,185,129,0.06)] rounded-lg p-2 border border-[rgba(16,185,129,0.12)]">
          <span className="text-xs text-[#10B981] font-bold shrink-0">宜</span>
          <div className="flex flex-wrap gap-1">
            {fortune.goodFor.map(g => (
              <span key={g} className="text-xs text-[#10B981] px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.1)]">{g}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(239,68,68,0.06)] rounded-lg p-2 border border-[rgba(239,68,68,0.12)]">
          <span className="text-xs text-[#EF4444] font-bold shrink-0">忌</span>
          <div className="flex flex-wrap gap-1">
            {fortune.badFor.map(b => (
              <span key={b} className="text-xs text-[#EF4444] px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.1)]">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 展开详情 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-xs text-[#818CF8] py-2 hover:text-[#A78BFA] transition-colors"
      >
        {expanded ? '收起详情 ▲' : '查看详细运势 ▼'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-[fadeUp_0.3s_ease-out] text-sm text-[#94A3B8] leading-relaxed">
          {fortune.summary.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}
