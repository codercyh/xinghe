// 八字纯算法核心 - server/client 共用
// 不依赖任何外部库

// ===== 类型定义 =====
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

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const CYCLE = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];

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
const WUXING_NAMES: Record<string, string> = {
  metal: '金', wood: '木', water: '水', fire: '火', earth: '土',
};

// 公历转JDN（经验证精确）
export function gToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5)
    + 365 * y2 + Math.floor(y2 / 4)
    - Math.floor(y2 / 100) + Math.floor(y2 / 400)
    - 32045;
}

// 真太阳时
export function toTrueSolarTime(hour: number, timezone: string): number {
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

// 60甲子查表算日柱
export function getDayGanZhi(jdn: number): { gan: string; zhi: string } {
  const BASE_JDN = 2451528;
  const cycleIdx = ((jdn - BASE_JDN) % 60 + 60) % 60;
  const gz = CYCLE[cycleIdx];
  return { gan: gz[0], zhi: gz[1] };
}

// 算年柱（60年循环）
export function getYearGanZhi(year: number): { gan: string; zhi: string } {
  const cycle = ((year - 1984) % 60 + 60) % 60;
  const gan = TIAN_GAN[cycle % 10];
  const zhi = DI_ZHI[cycle % 12];
  return { gan, zhi };
}

// 算月柱（五虎遁）
export function getMonthGanZhi(yearGanIdx: number, month: number): { gan: string; zhi: string } {
  const wugedun: Record<number, number> = {
    0: 2, 5: 2,
    1: 4, 6: 4,
    2: 6, 7: 6,
    3: 8, 8: 8,
    4: 0, 9: 0,
  };
  const zhi = DI_ZHI[month % 12];
  const gan = TIAN_GAN[((wugedun[yearGanIdx] ?? 2) + month - 1) % 10];
  return { gan, zhi };
}

// 算时柱（五鼠遁）
export function getHourGanZhi(dayGanIdx: number, hour: number): { gan: string; zhi: string } {
  const hourZhiIdx = hour === 0 ? 0
    : hour < 3 ? 1 : hour < 5 ? 2 : hour < 7 ? 3
    : hour < 9 ? 4 : hour < 11 ? 5 : hour < 13 ? 6
    : hour < 15 ? 7 : hour < 17 ? 8 : hour < 19 ? 9
    : hour < 21 ? 10 : 11;
  const zhi = DI_ZHI[hourZhiIdx];
  const wushudun: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const gan = TIAN_GAN[((wushudun[dayGanIdx] ?? 0) + hourZhiIdx) % 10];
  return { gan, zhi };
}

// 完整八字计算（同步）
export function calculateBazi(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female' = 'male', timezone: string = 'Asia/Shanghai'
): BaziResult {
  const trueHour = toTrueSolarTime(hour, timezone);
  const jdn = gToJDN(year, month, day);

  const dayGZ = getDayGanZhi(jdn);
  const dayGanIdx = TIAN_GAN.indexOf(dayGZ.gan);

  const yearGZ = getYearGanZhi(year);
  const yearGanIdx = TIAN_GAN.indexOf(yearGZ.gan);

  const monthGZ = getMonthGanZhi(yearGanIdx, month);
  const hourGZ = getHourGanZhi(dayGanIdx, trueHour);

  const gans = [yearGZ.gan, monthGZ.gan, dayGZ.gan, hourGZ.gan];
  const zhis = [yearGZ.zhi, monthGZ.zhi, dayGZ.zhi, hourGZ.zhi];

  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach((g) => {
    const w = WUXING_MAP[g] as WuxingKey;
    if (w) wuxing[w]++;
  });
  zhis.forEach((z) => {
    const w = WUXING_MAP[z] as WuxingKey;
    if (w) wuxing[w]++;
  });

  const dayGan = dayGZ.gan;
  const dayWuxing = (WUXING_MAP[dayGan] ?? 'earth') as WuxingKey;
  let score = (wuxing[dayWuxing] ?? 0) * 1.5;

  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.8;
    if (KE[w] === dayWuxing) score -= count * 0.8;
  });

  const monthEls: Record<number, WuxingKey> = {
    1: 'water', 2: 'wood', 3: 'wood', 4: 'fire', 5: 'fire', 6: 'earth',
    7: 'earth', 8: 'metal', 9: 'metal', 10: 'water', 11: 'water', 12: 'earth',
  };
  const curEl = monthEls[month] ?? 'earth';
  if (curEl === dayWuxing) score += 2;
  else if (SHENG[curEl] === dayWuxing) score += 1;
  else if (KE[curEl] === dayWuxing) score -= 1;

  const dayStrength = score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

  const entries = Object.entries(wuxing) as [WuxingKey, number][];
  const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
  const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
  const xiYong = dayStrength === 'strong' ? KE[strongest] ?? weakest : SHENG[dayWuxing] ?? weakest;
  const keStrong = KE[strongest] ?? weakest;
  const shengDay = SHENG[dayWuxing] ?? weakest;
  const shengUse = dayStrength === 'strong' ? keStrong : shengDay;

  const st: Record<string, string> = { strong: '偏旺', weak: '偏弱', neutral: '中和' };

  return {
    pillars: {
      year: { gan: yearGZ.gan, zhi: yearGZ.zhi },
      month: { gan: monthGZ.gan, zhi: monthGZ.zhi },
      day: { gan: dayGZ.gan, zhi: dayGZ.zhi },
      hour: { gan: hourGZ.gan, zhi: hourGZ.zhi },
    },
    wuxing,
    dayMaster: dayGan,
    dayStrength,
    dayun: {
      summary: `日主 ${dayGan}，五行${st[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong ?? weakest]} / ${WUXING_NAMES[shengUse ?? weakest]}。`,
      nextDecade: dayStrength === 'strong'
        ? `未来十年以${WUXING_NAMES[xiYong ?? weakest]}为主导，宜顺势而为。`
        : `未来十年有${WUXING_NAMES[shengUse ?? weakest]}相助，机遇较好。`,
    },
    // 注意：移除 lunar-javascript 依赖后，农历信息暂时返回公历日期
    // 如需真实农历转换，可接入专用农历库
    lunarInfo: { lunarYear: year, lunarMonth: month, lunarDay: day, isLeapMonth: false },
  };
}
