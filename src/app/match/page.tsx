'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildZodiacData } from '@/lib/zodiac';
import { calculateBazi } from '@/lib/bazi';

interface PersonInfo {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
}

interface MatchResult {
  score: number;
  zodiacMatch: {
    sunScore: number;
    moonScore: number;
    risingScore: number;
    summary: string;
  };
  baziMatch: {
    score: number;
    wuxingScore: number;
    summary: string;
  };
  overallAnalysis: string;
  strengths: string[];
  challenges: string[];
  tip: string;
}

function getMatchScore(p1: PersonInfo, p2: PersonInfo): MatchResult {
  const z1 = buildZodiacData(p1.year, p1.month, p1.day, p1.hour);
  const z2 = buildZodiacData(p2.year, p2.month, p2.day, p2.hour);
  const b1 = calculateBazi(p1.year, p1.month, p1.day, p1.hour, p1.gender);
  const b2 = calculateBazi(p2.year, p2.month, p2.day, p2.hour, p2.gender);

  // 计算星座匹配度（简化版）
  const sunSigns = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  const compatibilityMap: Record<string, string[]> = {
    '白羊座': ['狮子座','射手座','双子座'],
    '金牛座': ['摩羯座','处女座','巨蟹座'],
    '双子座': ['天秤座','水瓶座','白羊座'],
    '巨蟹座': ['天蝎座','双鱼座','金牛座'],
    '狮子座': ['白羊座','射手座','双子座'],
    '处女座': ['金牛座','摩羯座','天蝎座'],
    '天秤座': ['双子座','水瓶座','狮子座'],
    '天蝎座': ['巨蟹座','双鱼座','处女座'],
    '射手座': ['白羊座','狮子座','水瓶座'],
    '摩羯座': ['金牛座','处女座','天蝎座'],
    '水瓶座': ['双子座','天秤座','射手座'],
    '双鱼座': ['巨蟹座','天蝎座','金牛座'],
  };
  const z1Sun = z1.sun.name;
  const z2Sun = z2.sun.name;
  const compatibleSigns = compatibilityMap[z1Sun] || [];
  const sunScore = compatibleSigns.includes(z2Sun) ? 90
    : compatibleSigns.some(s => z2Sun.includes(s[0])) ? 75 : 60;

  // 月亮匹配（基于五行相似度）
  const waterDiff = Math.abs((b1.wuxing as any).water - (b2.wuxing as any).water);
  const fireDiff = Math.abs((b1.wuxing as any).fire - (b2.wuxing as any).fire);
  const moonCompatible = waterDiff <= 1 ? 85 : fireDiff <= 1 ? 80 : 65;
  const risingScore = Math.floor(Math.random() * 20 + 70);

  // 八字五行匹配（中文key映射英文）
  const wuxingMap: Record<string, keyof typeof b1.wuxing> = {
    '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth',
  };
  const wuxingOverlap = (['金','木','水','火','土'] as const).reduce((acc, w) => {
    const key = wuxingMap[w];
    return acc + Math.abs((b1.wuxing as any)[key] - (b2.wuxing as any)[key]);
  }, 0);
  const wuxingScore = Math.max(0, 100 - wuxingOverlap * 5);
  const baziScore = Math.floor(sunScore * 0.4 + wuxingScore * 0.3 + moonCompatible * 0.2 + risingScore * 0.1);

  const score = Math.floor(baziScore);

  const zodiacSummary = compatibleSigns.includes(z2Sun)
    ? `${z1Sun}与${z2Sun}是非常契合的组合，火花与共鸣并存，相处起来轻松自然。`
    : `${z1Sun}与${z2Sun}组合需要一些磨合期，但正是这种差异让关系更有张力。`;

  const baziSummary = wuxingScore > 75
    ? `你们的八字五行互补较强，能在性格上形成良好的配合，彼此助力明显。`
    : `八字五行各有侧重，需要学会欣赏对方的不同，这在长期关系中是加分项。`;

  const strengths = [
    sunScore > 80 ? `${z1Sun} × ${z2Sun} 星座组合有天然的默契感` : `${z1Sun}与${z2Sun}性格互补，相处有新鲜感`,
    wuxingScore > 70 ? '五行互补，在关键决策上能互相平衡' : '五行差异让彼此有成长空间',
    '双方命盘各有优势，可形成互补',
  ];

  const challenges = [
    sunScore < 75 ? '星座性格差异需要多沟通理解' : '偶尔的沟通方式不同需要注意',
    baziScore < 70 ? '五行侧重不同，需注意相处节奏' : '整体相处较顺畅',
  ];

  const tip = score > 80
    ? '💡 缘分很深，遇到了就别犹豫，大胆往前走！'
    : score > 65
    ? '💡 缘分中上，多了解对方的内心世界会更合拍。'
    : '💡 缘分需要培养，多给彼此一些耐心和空间。';

  return {
    score,
    zodiacMatch: { sunScore, moonScore: moonCompatible, risingScore, summary: zodiacSummary },
    baziMatch: { score: baziScore, wuxingScore, summary: baziSummary },
    overallAnalysis: `${z1Sun}的你与${z2Sun}的TA，在星座层面有${sunScore > 75 ? '不错的' : '一定的'}契合度。${z1.sun.symbol}配${z2.sun.symbol}，一个是火象的直接，一个是${z2Sun}的特质，这样的组合会让生活充满${sunScore > 80 ? '惊喜和活力' : '有趣的化学反应'}。`,
    strengths,
    challenges,
    tip,
  };
}

function PersonInput({
  person,
  onChange,
  label,
  icon,
}: {
  person: PersonInfo;
  onChange: (p: PersonInfo) => void;
  label: string;
  icon: string;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-base">{label}</span>
      </div>

      <div>
        <label className="block text-xs text-[#94A3B8] mb-1">称呼（选填）</label>
        <input
          type="text"
          placeholder="如：我 / TA / 暗恋的人"
          value={person.name}
          onChange={e => onChange({ ...person, name: e.target.value })}
          className="input-field px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-[#94A3B8] mb-1">出生日期</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={person.year} onChange={e => onChange({ ...person, year: Number(e.target.value) })} className="input-field text-center py-2 text-sm">
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={person.month} onChange={e => onChange({ ...person, month: Number(e.target.value) })} className="input-field text-center py-2 text-sm">
            {months.map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
          <select value={person.day} onChange={e => onChange({ ...person, day: Number(e.target.value) })} className="input-field text-center py-2 text-sm">
            {days.map(d => <option key={d} value={d}>{d}日</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#94A3B8] mb-1">出生时辰（小时）</label>
        <select value={person.hour} onChange={e => onChange({ ...person, hour: Number(e.target.value) })} className="input-field py-2 text-sm px-3">
          {hours.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[#94A3B8] mb-1">性别</label>
        <div className="grid grid-cols-2 gap-2">
          {(['male','female'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...person, gender: g })}
              className={`py-2 rounded-[var(--radius-sm)] border text-sm font-medium transition-all ${
                person.gender === g
                  ? 'border-[#6366F1] bg-[rgba(99,102,241,0.1)] text-[#F1F5F9]'
                  : 'border-[#2D2D44] text-[#94A3B8] hover:border-[#818CF8]'
              }`}
            >
              {g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const validScore = Number.isFinite(score) ? score : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - validScore / 100);
  const strokeColor = validScore > 80 ? '#10B981' : validScore > 65 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg width="176" height="176" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r="70" fill="none" stroke="#2D2D44" strokeWidth="8" />
        <circle
          cx="88" cy="88"
          r="70"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${dashOffset}`}
          transform="rotate(-90 88 88)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: strokeColor }}>
          {validScore}
        </span>
        <span className="text-xs text-[#94A3B8]">缘分值</span>
      </div>
    </div>
  );
}

function MatchResultCard({ result, p1, p2 }: { result: MatchResult; p1: PersonInfo; p2: PersonInfo }) {
  const scoreColor = result.score > 80 ? '#10B981' : result.score > 65 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-6 animate-[fadeUp_0.6s_ease-out]">
      {/* Score hero */}
      <div className="text-center">
        <div className="text-sm text-[#94A3B8] mb-4">
          {p1.name || 'TA'} × {p2.name || '你'}
        </div>
        <ScoreRing score={result.score} />
        <div className="mt-4 text-sm text-[#94A3B8]">
          {result.score > 80 ? '✨ 天作之合' : result.score > 65 ? '💫 缘分中上' : '🌊 缘分需要培养'}
        </div>
      </div>

      {/* Overall analysis */}
      <div className="content-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔮</span>
          <span className="font-semibold">AI 综合解读</span>
        </div>
        <p className="text-sm text-[#94A3B8] leading-relaxed">{result.overallAnalysis}</p>
      </div>

      {/* Scores breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="content-card">
          <div className="flex items-center gap-2 mb-3">
            <span>✨</span>
            <span className="font-semibold text-sm">星座匹配</span>
          </div>
          <div className="space-y-2 mb-3">
            <ScoreBar label="太阳星座" score={result.zodiacMatch.sunScore} />
            <ScoreBar label="月亮星座" score={result.zodiacMatch.moonScore} />
            <ScoreBar label="上升星座" score={result.zodiacMatch.risingScore} />
          </div>
          <p className="text-xs text-[#94A3B8]">{result.zodiacMatch.summary}</p>
        </div>

        <div className="content-card">
          <div className="flex items-center gap-2 mb-3">
            <span>🀄</span>
            <span className="font-semibold text-sm">八字契合</span>
          </div>
          <ScoreBar label="五行互补" score={result.baziMatch.wuxingScore} fullWidth />
          <p className="text-xs text-[#94A3B8] mt-3">{result.baziMatch.summary}</p>
        </div>
      </div>

      {/* Strengths & Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="content-card">
          <div className="flex items-center gap-2 mb-3">
            <span>💚</span>
            <span className="font-semibold text-sm">合拍之处</span>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-[#94A3B8] flex gap-2">
                <span className="text-[#10B981] mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="content-card">
          <div className="flex items-center gap-2 mb-3">
            <span>⚠️</span>
            <span className="font-semibold text-sm">需要注意</span>
          </div>
          <ul className="space-y-2">
            {result.challenges.map((s, i) => (
              <li key={i} className="text-sm text-[#94A3B8] flex gap-2">
                <span className="text-[#F59E0B] mt-0.5">!</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tip */}
      <div className="text-center py-4 px-6 bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)] rounded-[var(--radius-lg)]">
        <p className="text-sm text-[#818CF8]">{result.tip}</p>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3">
        <p className="text-xs text-[#475569]">想看更详细的每日运势？解锁完整星盘分析</p>
        <Link href="/" className="btn-primary px-8 py-3 inline-flex">
          开启我的完整星合 →
        </Link>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, fullWidth }: { label: string; score: number; fullWidth?: boolean }) {
  const color = score > 80 ? '#10B981' : score > 65 ? '#F59E0B' : '#EF4444';
  return (
    <div className={fullWidth ? '' : ''}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#94A3B8]">{label}</span>
        <span className="font-semibold" style={{ color }}>{score}分</span>
      </div>
      <div className="h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: 'width 1s ease-out' }}
        />
      </div>
    </div>
  );
}

export default function MatchPage() {
  const [p1, setP1] = useState<PersonInfo>({ name: '', year: 2000, month: 1, day: 1, hour: 12, gender: 'male' });
  const [p2, setP2] = useState<PersonInfo>({ name: '', year: 1998, month: 6, day: 15, hour: 10, gender: 'female' });
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800)); // 模拟AI计算
    const matchResult = getMatchScore(p1, p2);
    setResult(matchResult);
    setLoading(false);
  };

  return (
    <div className="page-bg relative z-[1] min-h-screen pb-8">
      {/* Nav */}
      <nav className="nav-bar">
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">← 返回</Link>
        <div className="nav-logo">✦ 星合</div>
        <Link href="/history" className="btn-secondary px-4 py-2 text-sm">📜 历史</Link>
      </nav>

      <div className="max-w-[680px] mx-auto px-4 pt-28">
        {/* Header */}
        <div className="text-center mb-8 animate-[fadeUp_0.6s_ease-out]">
          <h1 className="text-2xl font-bold mb-2">💘 缘分合盘</h1>
          <p className="text-sm text-[#94A3B8]">输入两个人的出生信息，AI 分析你们的缘分指数</p>
        </div>

        {/* Two person inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-[fadeUp_0.6s_ease-out_0.1s_both]">
          <div className="glass-card p-5">
            <PersonInput person={p1} onChange={setP1} label="你" icon="😊" />
          </div>
          <div className="glass-card p-5">
            <PersonInput person={p2} onChange={setP2} label="TA" icon="🤔" />
          </div>
        </div>

        {/* Submit */}
        <div className="text-center mb-8 animate-[fadeUp_0.6s_ease-out_0.2s_both]">
          <button
            onClick={handleMatch}
            disabled={loading}
            className="btn-primary px-10 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                AI 分析中...
              </span>
            ) : (
              <span>🔮 开启缘分分析</span>
            )}
          </button>
        </div>

        {/* Loading animation */}
        {loading && (
          <div className="text-center py-8 animate-[fadeUp_0.4s_ease-out]">
            <div className="text-4xl mb-3 animate-bounce">💫</div>
            <p className="text-sm text-[#94A3B8]">AI 正在解析你们的星盘...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <MatchResultCard result={result} p1={p1} p2={p2} />
        )}
      </div>

      <footer className="mt-12 pt-6 border-t border-[rgba(45,45,68,0.3)] text-center">
        <p className="text-[#475569] text-xs">星合 © 2026 · 仅供娱乐参考，不构成任何决策依据</p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
