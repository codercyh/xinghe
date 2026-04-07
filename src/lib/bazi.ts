// 八字计算核心逻辑
// 使用 lunar-javascript 进行精确排盘

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const WUXING_NAMES: Record<string, string> = {
  metal: '金', wood: '木', water: '水', fire: '火', earth: '土',
};

const WUXING_MAP: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
};

type WuxingKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const SHENG: Record<WuxingKey, WuxingKey> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood'
};
const KE: Record<WuxingKey, WuxingKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood'
};

// 真太阳时
function toTrueSolarTime(hour: number, timezone: string): number {
  const lngMap: Record<string, number> = {
    'Asia/Shanghai': 121.4, 'Asia/Hong_Kong': 114.1, 'Asia/Taipei': 121.5,
    'Asia/Tokyo': 139.7, 'Asia/Singapore': 103.8,
    'America/New_York': -74.0, 'Europe/London': -0.1,
  };
  const lng = lngMap[timezone] ?? 120;
  const total = hour * 60 + (lng - 120) * 4;
  if (total < 0) return 23;
  if (total >= 1440) return 0;
  return Math.floor(total / 60);
}

export interface Pillar { gan: string; zhi: string; }
export interface WuxingCount {
  metal: number; wood: number; water: number; fire: number; earth: number;
}
export interface BaziResult {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
  wuxing: WuxingCount;
  dayMaster: string;
  dayStrength: 'strong' | 'weak' | 'neutral';
  dayun: { summary: string; nextDecade: string };
  lunarInfo: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth: boolean };
}

// 懒加载 lunar-javascript
let _lunarLib: any = null;

async function getLunarLib() {
  if (_lunarLib) return _lunarLib;
  const L = await import('lunar-javascript');
  _lunarLib = L;
  return L;
}

export async function calculateBaziAsync(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female', timezone: string = 'Asia/Shanghai'
): Promise<BaziResult> {
  const L = await getLunarLib();
  const trueHour = toTrueSolarTime(hour, timezone);

  const solar = L.Solar.fromYmd(year, month, day);
  const lunar = solar.toLunar();

  const ec = L.EightChar.fromLunar(lunar);

  const gans = [
    TIAN_GAN[ec.getYearGanIndex()],
    TIAN_GAN[ec.getMonthGanIndex()],
    TIAN_GAN[ec.getDayGanIndex()],
    TIAN_GAN[ec.getHourGanIndex()],
  ];
  const zhis = [
    DI_ZHI[ec.getYearZhiIndex()],
    DI_ZHI[ec.getMonthZhiIndex()],
    DI_ZHI[ec.getDayZhiIndex()],
    DI_ZHI[ec.getHourZhiIndex()],
  ];

  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach(g => {
    const w = WUXING_MAP[g] as WuxingKey;
    if (w && wuxing[w] !== undefined) wuxing[w]++;
  });
  zhis.forEach(z => {
    const w = WUXING_MAP[z] as WuxingKey;
    if (w && wuxing[w] !== undefined) wuxing[w]++;
  });

  const dayGan = gans[2];
  const dayWuxing = (WUXING_MAP[dayGan] ?? 'earth') as WuxingKey;
  let score = (wuxing[dayWuxing] ?? 0) * 1.5;

  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.8;
    if (KE[w] === dayWuxing) score -= count * 0.8;
  });

  const lunarMonth = lunar.getMonth();
  const monthEls: Record<number, WuxingKey> = {
    1: 'water', 2: 'wood', 3: 'wood', 4: 'fire', 5: 'fire', 6: 'earth',
    7: 'earth', 8: 'metal', 9: 'metal', 10: 'water', 11: 'water', 12: 'earth',
  };
  const curEl = monthEls[lunarMonth] ?? 'earth';
  if (curEl === dayWuxing) score += 2;
  else if (SHENG[curEl] === dayWuxing) score += 1;
  else if (KE[curEl] === dayWuxing) score -= 1;

  const dayStrength: 'strong' | 'weak' | 'neutral' =
    score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

  const entries = Object.entries(wuxing) as [WuxingKey, number][];
  const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
  const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
  const xiYong = dayStrength === 'strong'
    ? KE[strongest] ?? weakest
    : SHENG[dayWuxing] ?? weakest;
  const shengUse = dayStrength === 'strong'
    ? (WUXING_MAP[KE[strongest] ?? '') as WuxingKey ?? weakest
    : (WUXING_MAP[SHENG[dayWuxing] ?? '') as WuxingKey ?? weakest;

  const st: Record<string, string> = { strong: '偏旺', weak: '偏弱', neutral: '中和' };
  const summary = `日主 ${dayGan}，五行${st[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong ?? weakest]} / ${WUXING_NAMES[shengUse ?? weakest]}。`;
  const nextDecade = dayStrength === 'strong'
    ? `未来十年以${WUXING_NAMES[xiYong ?? weakest]}为主导，宜顺势而为。`
    : `未来十年有${WUXING_NAMES[shengUse ?? weakest]}相助，机遇较好。`;

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
    lunarInfo: {
      lunarYear: lunar.getYear(),
      lunarMonth: lunar.getMonth(),
      lunarDay: lunar.getDay(),
      isLeapMonth: lunar.isLeapMonth(),
    },
  };
}

// 同步版本（用于缘分合盘，无需农历精度）
export function calculateBazi(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female', timezone: string = 'Asia/Shanghai'
): BaziResult {
  const trueHour = toTrueSolarTime(hour, timezone);

  // 简化算法（公历近似）
  const jdn = Math.floor(Date.UTC(year, month - 1, day) / 86400000) + 2440588;

  // 日柱（60甲子循环，基准：1984-04-16 = 甲子）
  // 甲子表
  const CYCLE = [
    '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
    '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
    '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
    '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
    '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
    '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
  ];
  const BASE_JDN = 2445701; // 1984-04-16 = 甲子
  const cycleIdx = ((jdn - BASE_JDN) % 60 + 60) % 60;
  const dayGanZhi = CYCLE[cycleIdx];
  const dayGan = dayGanZhi[0];
  const dayZhi = dayGanZhi[1];

  // 年柱（简化）
  const yearCycle = ((year - 1984) % 60 + 60) % 60;
  const yearGanIdx = yearCycle % 10;
  const yearZhiIdx = yearCycle % 12;

  // 月柱
  const wugedun: Record<number, number> = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
  const monthZhiIdx = month % 12;
  const monthGanIdx = ((wugedun[yearGanIdx] ?? 2) + month - 1) % 10;

  // 时柱
  const hourZhiIdx = trueHour < 1 ? 0
    : trueHour < 3 ? 1 : trueHour < 5 ? 2 : trueHour < 7 ? 3
    : trueHour < 9 ? 4 : trueHour < 11 ? 5 : trueHour < 13 ? 6
    : trueHour < 15 ? 7 : trueHour < 17 ? 8 : trueHour < 19 ? 9
    : trueHour < 21 ? 10 : 11;
  const wushudun: Record<number, number> = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };
  const hourGanIdx = ((wushudun[yearGanIdx] ?? 0) + hourZhiIdx) % 10;

  const gans = [TIAN_GAN[yearGanIdx], TIAN_GAN[monthGanIdx], dayGan, TIAN_GAN[hourGanIdx]];
  const zhis = [DI_ZHI[yearZhiIdx], DI_ZHI[monthZhiIdx], dayZhi, DI_ZHI[hourZhiIdx]];

  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach(g => {
    const w = WUXING_MAP[g] as WuxingKey;
    if (w && wuxing[w] !== undefined) wuxing[w]++;
  });
  zhis.forEach(z => {
    const w = WUXING_MAP[z] as WuxingKey;
    if (w && wuxing[w] !== undefined) wuxing[w]++;
  });

  const dayWuxing = (WUXING_MAP[dayGan] ?? 'earth') as WuxingKey;
  let score = (wuxing[dayWuxing] ?? 0) * 1.5;
  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.8;
    if (KE[w] === dayWuxing) score -= count * 0.8;
  });

  const dayStrength: 'strong' | 'weak' | 'neutral' =
    score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

  const entries = Object.entries(wuxing) as [WuxingKey, number][];
  const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
  const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
  const xiYong = dayStrength === 'strong' ? KE[strongest] ?? weakest : SHENG[dayWuxing] ?? weakest;
  const shengUse = dayStrength === 'strong'
    ? (WUXING_MAP[KE[strongest] ?? '') as WuxingKey ?? weakest
    : (WUXING_MAP[SHENG[dayWuxing] ?? '') as WuxingKey ?? weakest;

  const st: Record<string, string> = { strong: '偏旺', weak: '偏弱', neutral: '中和' };
  const summary = `日主 ${dayGan}，五行${st[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong ?? weakest]} / ${WUXING_NAMES[shengUse ?? weakest]}。`;
  const nextDecade = dayStrength === 'strong'
    ? `未来十年以${WUXING_NAMES[xiYong ?? weakest]}为主导，宜顺势而为。`
    : `未来十年有${WUXING_NAMES[shengUse ?? weakest]}相助，机遇较好。`;

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
    lunarInfo: { lunarYear: year, lunarMonth: month, lunarDay: day, isLeapMonth: false },
  };
}
