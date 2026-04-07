// 八字计算核心逻辑

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const WUXING_NAMES: Record<string, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

// 天干地支对应五行
const WUXING_MAP: Record<string, string> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
};

// 五行相生相克
type WuxingKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const SHENG: Record<WuxingKey, WuxingKey> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const KE: Record<WuxingKey, WuxingKey> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

function getGanZhiIndex(type: 'gan' | 'zhi', year: number, month: number, day: number, hour: number): number[] {
  // 基于公历转儒略日计算
  const utcDate = Date.UTC(year, month - 1, day, hour, 0, 0);
  const julianDay = Math.floor((utcDate / 86400000) + 2440587.5);

  // 日柱索引（基于甲子循环，简化算法）
  const dayGanIdx = (julianDay - 4) % 10;
  const dayZhiIdx = (julianDay - 4) % 12;

  // 年柱（简化：1984=甲子年）
  const yearDiff = year - 1984;
  const yearGanIdx = ((yearDiff % 10) + 10) % 10;
  const yearZhiIdx = ((yearDiff % 12) + 12) % 12;

  // 月柱（简化：月干与年干相关）
  const monthCycle = (year * 12 + month) % 60;
  const monthZhiIdx = (month + 1) % 12;
  // 月干计算简化公式
  const monthGanBase = (yearGanIdx % 5) * 2;
  const monthGanIdx = (monthGanBase + month - 1) % 10;

  // 时柱（日干 × 2 + 1 为起始，再加时支）
  const hourBase = (dayGanIdx * 2 + 1) % 10;
  const hourGanIdx = (hourBase + Math.floor(hour / 2)) % 10;
  const hourZhiIdx = Math.floor(hour / 2) % 12;

  return [
    (yearGanIdx + 10) % 10,
    (monthGanIdx + 10) % 10,
    (dayGanIdx + 10) % 10,
    (hourGanIdx + 10) % 10,
  ].concat([
    (yearZhiIdx + 12) % 12,
    (monthZhiIdx + 12) % 12,
    (dayZhiIdx + 12) % 12,
    (hourZhiIdx + 12) % 12,
  ]);
}

export interface Pillar {
  gan: string;
  zhi: string;
}

export interface WuxingCount {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

export interface BaziResult {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  wuxing: WuxingCount;
  dayMaster: string;
  dayStrength: 'strong' | 'weak' | 'neutral';
  dayun: {
    summary: string;
    nextDecade: string;
  };
}

export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female'
): BaziResult {
  const ganIndices = [];
  const zhiIndices = [];

  // 基于公历转儒略日计算
  const utcDate = Date.UTC(year, month - 1, day, hour, 0, 0);
  const julianDay = Math.floor((utcDate / 86400000) + 2440587.5);

  // 日柱索引
  const dayGanIdx = ((julianDay - 4) % 10 + 10) % 10;
  const dayZhiIdx = ((julianDay - 4) % 12 + 12) % 12;

  // 年柱（1984=甲子年）
  const yearDiff = year - 1984;
  const yearGanIdx = ((yearDiff % 10) + 10) % 10;
  const yearZhiIdx = ((yearDiff % 12) + 12) % 12;

  // 月柱
  const monthZhiIdx = ((month + 1) % 12 + 12) % 12;
  const monthGanBase = (yearGanIdx % 5) * 2;
  const monthGanIdx = ((monthGanBase + month - 1) % 10 + 10) % 10;

  // 时柱
  const hourBase = ((dayGanIdx * 2) % 10 + 10) % 10;
  const hourGanIdx = ((hourBase + Math.floor(hour / 2)) % 10 + 10) % 10;
  const hourZhiIdx = (Math.floor(hour / 2) % 12 + 12) % 12;

  const gans = [yearGanIdx, monthGanIdx, dayGanIdx, hourGanIdx].map(i => TIAN_GAN[(i + 10) % 10]);
  const zhis = [yearZhiIdx, monthZhiIdx, dayZhiIdx, hourZhiIdx].map(i => DI_ZHI[(i + 12) % 12]);

  // 五行统计
  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach(g => { const w = WUXING_MAP[g]; if (w) wuxing[w as keyof WuxingCount]++; });
  zhis.forEach(z => { const w = WUXING_MAP[z]; if (w) wuxing[w as keyof WuxingCount]++; });

  // 日主强弱判断
  const dayGan = gans[2];
  const dayWuxing = WUXING_MAP[dayGan] ?? 'earth';
  let score = wuxing[dayWuxing as keyof WuxingCount] * 1;

  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.5; // 相生
    if (KE[w] === dayWuxing) score -= count * 0.5; // 相克
  });

  const dayStrength: 'strong' | 'weak' | 'neutral' =
    score > 5 ? 'strong' : score < 4 ? 'weak' : 'neutral';

  // 喜用神
  const weakest = (Object.entries(wuxing) as [WuxingKey, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const strongest = (Object.entries(wuxing) as [WuxingKey, number][]).sort((a, b) => b[1] - a[1])[0][0];

  const xiYong = dayStrength === 'strong' ? KE[strongest] ?? strongest : SHENG[dayWuxing as WuxingKey] ?? weakest;
  const shengUse = dayStrength === 'strong' ? WUXING_MAP[KE[strongest] ?? ''] ?? strongest : WUXING_MAP[SHENG[dayWuxing as WuxingKey] ?? ''] ?? weakest;

  const strengthText: Record<string, string> = {
    strong: '偏旺',
    weak: '偏弱',
    neutral: '中和',
  };

  const summary = `日主 ${dayGan}，五行${strengthText[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong]} / ${WUXING_NAMES[shengUse]}，整体格局清朗。`;

  const nextDecade = dayStrength === 'strong'
    ? `未来十年运势以${WUXING_NAMES[xiYong]}为主导，宜稳中求进。`
    : `未来十年运势有${WUXING_NAMES[shengUse]}相助，机遇较好，宜积极进取。`;

  return {
    pillars: {
      year: { gan: gans[0], zhi: zhis[0] },
      month: { gan: gans[1], zhi: zhis[1] },
      day: { gan: gans[2], zhi: zhis[2] },
      hour: { gan: gans[3], zhi: zhis[3] },
    },
    wuxing,
    dayMaster: dayGan,
    dayStrength,
    dayun: { summary, nextDecade },
  };
}
