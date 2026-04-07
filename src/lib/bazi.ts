// 八字计算核心逻辑（精确版）
// 使用 lunar-javascript 进行农历转换，基于真太阳时计算四柱

import Lunar from 'lunar-javascript';

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

// 各地经度对应的时差（分钟）
// 北京时间是东经120度，真实太阳时需要根据出生地经度修正
function getLongitudeCorrection(longitude: number): number {
  // 每偏东1度，时间快4分钟；每偏西1度，时间慢4分钟
  // 默认使用东经120度（北京标准经度）
  const beijingLongitude = 120;
  return (longitude - beijingLongitude) * 4;
}

// 将北京时间转换为真太阳时
function toTrueSolarTime(
  year: number, month: number, day: number,
  hour: number, minute: number, second: number,
  longitude: number
): { hour: number; minute: number; second: number } {
  const correctionMinutes = getLongitudeCorrection(longitude);

  // 转换为分钟
  let totalMinutes = hour * 60 + minute + correctionMinutes;

  // 处理跨天
  if (totalMinutes < 0) {
    totalMinutes += 1440;
  } else if (totalMinutes >= 1440) {
    totalMinutes -= 1440;
  }

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
    second,
  };
}

// 获取时辰地支索引（时辰对应2小时，一天12时辰）
function getHourZhiIndex(hour: number): number {
  if (hour >= 23 || hour < 1) return 0;  // 子时 23:00-01:00
  if (hour < 3) return 1;              // 丑时 01:00-03:00
  if (hour < 5) return 2;              // 寅时 03:00-05:00
  if (hour < 7) return 3;              // 卯时 05:00-07:00
  if (hour < 9) return 4;              // 辰时 07:00-09:00
  if (hour < 11) return 5;             // 巳时 09:00-11:00
  if (hour < 13) return 6;             // 午时 11:00-13:00
  if (hour < 15) return 7;             // 未时 13:00-15:00
  if (hour < 17) return 8;             // 申时 15:00-17:00
  if (hour < 19) return 9;             // 酉时 17:00-19:00
  if (hour < 21) return 10;            // 戌时 19:00-21:00
  return 11;                           // 亥时 21:00-23:00
}

// 获取时辰天干索引（日干 × 2 + 1 为起始，再加时辰地支索引）
function getHourGanIndex(dayGanIdx: number, hourZhiIdx: number): number {
  // 日干序号：甲=0, 乙=1, ..., 癸=9
  // 时干计算：(日干序号 * 2 + 1) % 10 + 时支索引
  const base = ((dayGanIdx * 2 + 1) % 10 + hourZhiIdx) % 10;
  return base;
}

// 计算月干（年干 + 月支 → 查表）
// 五虎遁：甲己之年丙作首，乙庚之年戊为头
// 丙辛必定寻庚起，丁壬壬位顺行流
// 戊癸之年何方发，甲寅之上好追求
function getMonthGan(yearGanIdx: number, monthZhiIdx: number): number {
  // 月干基数表（按年干）
  const monthGanBase: Record<number, number> = {
    0: 2,  // 甲年：丙寅月（丙=2）
    1: 4,   // 乙年：戊寅月（戊=4）
    4: 6,  // 戊年：甲寅月（甲=0）
    5: 6,  // 己年：甲寅月（甲=0）
    6: 8,  // 庚年：丙寅月（丙=2）
    7: 8,  // 辛年：丙寅月（丙=2）
    8: 0,  // 壬年：戊寅月（戊=4）
    9: 0,  // 癸年：戊寅月（戊=4）
  };
  // 丙=2, 丁=3, 戊=4, 己=5, 庚=6, 辛=7, 壬=8, 癸=9, 甲=0, 乙=1
  // 需要用正确的索引映射
  // 甲=0, 乙=1, 丙=2, 丁=3, 戊=4, 己=5, 庚=6, 辛=7, 壬=8, 癸=9
  // 五虎遁口诀：甲己之年丙作首（甲年/己年 → 丙寅=2）
  // 乙庚之年戊为头（乙年/庚年 → 戊寅=4）
  // 丙辛必定寻庚起（丙年/辛年 → 庚寅=6）
  // 丁壬壬位顺行流（丁年/壬年 → 壬寅=8）
  // 戊癸之年何方发（戊年/癸年 → 甲寅=0）
  const bases: Record<number, number> = { 0: 2, 1: 2, 4: 0, 5: 0, 6: 4, 7: 4, 8: 6, 9: 6 };
  // 甲=0,乙=1,丙=2,丁=3,戊=4,己=5,庚=6,辛=7,壬=8,癸=9
  // 重新映射：甲己(0,5)→丙(2), 乙庚(1,6)→戊(4), 丙辛(2,7)→庚(6), 丁壬(3,8)→壬(8), 戊癸(4,9)→甲(0)
  const correctBases: Record<number, number> = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
  const base = correctBases[yearGanIdx] ?? 0;
  return (base + monthZhiIdx) % 10;
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
  lunarInfo: {
    lunarYear: number;
    lunarMonth: number;
    lunarDay: number;
    isLeapMonth: boolean;
  };
}

export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
  timezone: string = 'Asia/Shanghai'
): BaziResult {
  // 1. 转换为真太阳时（根据经度，默认东经120°）
  const longitudeMap: Record<string, number> = {
    'Asia/Shanghai': 121.4,
    'Asia/Hong_Kong': 114.1,
    'Asia/Taipei': 121.5,
    'Asia/Tokyo': 139.7,
    'Asia/Singapore': 103.8,
    'America/New_York': -74.0,
    'Europe/London': -0.1,
  };
  const longitude = longitudeMap[timezone] ?? 120;
  const trueTime = toTrueSolarTime(year, month, day, hour, 0, 0, longitude);
  const trueHour = trueTime.hour;

  // 2. 使用 lunar-javascript 进行精确农历转换
  const lunarDate = Lunar.fromYmd(year, month, day);
  const lunarYear = lunarDate.getYear();
  const lunarMonth = lunarDate.getMonth();
  const lunarDay = lunarDate.getDay();
  const isLeapMonth = lunarDate.isLeapMonth();

  // 3. 年柱：取农历年的天干地支
  const yearOffset = (lunarYear - 1984 + 100) % 60; // 1984=甲子年，60年一循环
  const yearGanIdx = (yearOffset % 10 + 10) % 10;
  const yearZhiIdx = (yearOffset % 12 + 12) % 12;

  // 4. 月柱：使用 lunar-javascript 的月柱
  const lunarMonthInfo = lunarDate.getMonthInfo();
  const monthZhiIdx = (lunarMonthInfo.monthZhiIndex + 12) % 12;
  const monthGanIdx = (lunarMonthInfo.monthGanIndex + 10) % 10;

  // 5. 日柱：使用 lunar-javascript 的日柱
  const dayGanIdx = (lunarDate.getDayGanIndex() + 10) % 10;
  const dayZhiIdx = (lunarDate.getDayZhiIndex() + 12) % 12;

  // 6. 时柱
  const hourZhiIdx = getHourZhiIndex(trueHour);
  const hourGanIdx = getHourGanIndex(dayGanIdx, hourZhiIdx);

  // 7. 组装四柱
  const gans = [
    TIAN_GAN[(yearGanIdx + 10) % 10],
    TIAN_GAN[(monthGanIdx + 10) % 10],
    TIAN_GAN[(dayGanIdx + 10) % 10],
    TIAN_GAN[(hourGanIdx + 10) % 10],
  ];
  const zhis = [
    DI_ZHI[(yearZhiIdx + 12) % 12],
    DI_ZHI[(monthZhiIdx + 12) % 12],
    DI_ZHI[(dayZhiIdx + 12) % 12],
    DI_ZHI[(hourZhiIdx + 12) % 12],
  ];

  // 8. 五行统计
  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach(g => {
    const w = WUXING_MAP[g];
    if (w) wuxing[w as WuxingKey]++;
  });
  zhis.forEach(z => {
    const w = WUXING_MAP[z];
    if (w) wuxing[w as WuxingKey]++;
  });

  // 9. 日主强弱判断
  const dayGan = gans[2];
  const dayWuxing = WUXING_MAP[dayGan] ?? 'earth';
  let score = wuxing[dayWuxing as WuxingKey] * 1.5; // 日主本身权重

  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.8;
    if (KE[w] === dayWuxing) score -= count * 0.8;
  });

  // 月令加成（农历月令影响）
  const monthElements: Record<number, WuxingKey> = {
    1: 'water', 2: 'wood', 3: 'wood', 4: 'fire', 5: 'fire', 6: 'earth',
    7: 'earth', 8: 'metal', 9: 'metal', 10: 'water', 11: 'water', 12: 'earth',
  };
  const currentMonthElement = monthElements[lunarMonth] ?? 'earth';
  if (currentMonthElement === dayWuxing) score += 2;
  else if (SHENG[currentMonthElement] === dayWuxing) score += 1;
  else if (KE[currentMonthElement] === dayWuxing) score -= 1;

  const dayStrength: 'strong' | 'weak' | 'neutral' =
    score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

  // 10. 喜用神
  const weakest = (Object.entries(wuxing) as [WuxingKey, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const strongest = (Object.entries(wuxing) as [WuxingKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const xiYong = dayStrength === 'strong'
    ? KE[strongest as WuxingKey] ?? strongest
    : SHENG[dayWuxing as WuxingKey] ?? weakest;
  const shengUse = dayStrength === 'strong'
    ? WUXING_MAP[KE[strongest as WuxingKey] ?? ''] ?? strongest
    : WUXING_MAP[SHENG[dayWuxing as WuxingKey] ?? ''] ?? weakest;

  const strengthText: Record<string, string> = {
    strong: '偏旺',
    weak: '偏弱',
    neutral: '中和',
  };

  const summary = `日主 ${dayGan}，五行${strengthText[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong ?? weakest]} / ${WUXING_NAMES[shengUse ?? weakest]}，格局${dayStrength === 'neutral' ? '平和稳定' : dayStrength === 'strong' ? '气势旺盛' : '稍显薄弱'}。`;

  const nextDecade = dayStrength === 'strong'
    ? `未来十年以${WUXING_NAMES[xiYong ?? weakest]}为主导，宜顺势而为，稳中求进。`
    : `未来十年有${WUXING_NAMES[shengUse ?? weakest]}相助，机遇较好，宜积极进取，把握关键节点。`;

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
      lunarYear,
      lunarMonth,
      lunarDay,
      isLeapMonth,
    },
  };
}
