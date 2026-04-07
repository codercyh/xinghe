//八字精确计算API - 服务端专用
//使用lunar-javascript的CJS版本，绕过客户端打包问题
import { NextRequest, NextResponse } from 'next/server';

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

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

export async function POST(req: NextRequest) {
  try {
    const { year, month, day, hour, gender, timezone } = await req.json();
    const trueHour = toTrueSolarTime(hour ?? 12, timezone ?? 'Asia/Shanghai');

    // 使用 require 在 Node.js 服务端加载 lunar-javascript
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('lunar-javascript');

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

    const wuxing: Record<string, number> = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
    gans.forEach((g: string) => {
      const w = WUXING_MAP[g] as WuxingKey;
      if (w) wuxing[w] = (wuxing[w] ?? 0) + 1;
    });
    zhis.forEach((z: string) => {
      const w = WUXING_MAP[z] as WuxingKey;
      if (w) wuxing[w] = (wuxing[w] ?? 0) + 1;
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

    const dayStrength = score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

    const entries = Object.entries(wuxing) as [WuxingKey, number][];
    const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
    const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
    const xiYong = dayStrength === 'strong' ? KE[strongest] ?? weakest : SHENG[dayWuxing] ?? weakest;
    const shengUse = dayStrength === 'strong'
      ? (WUXING_MAP[KE[strongest] ?? ''] ?? strongest) as WuxingKey
      : (WUXING_MAP[SHENG[dayWuxing] ?? ''] ?? weakest) as WuxingKey;

    const st: Record<string, string> = { strong: '偏旺', weak: '偏弱', neutral: '中和' };

    return NextResponse.json({
      pillars: {
        year: { gan: gans[0], zhi: zhis[0] },
        month: { gan: gans[1], zhi: zhis[1] },
        day: { gan: gans[2], zhi: zhis[2] },
        hour: { gan: gans[3], zhi: zhis[3] },
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
      lunarInfo: {
        lunarYear: lunar.getYear(),
        lunarMonth: lunar.getMonth(),
        lunarDay: lunar.getDay(),
        isLeapMonth: lunar.isLeapMonth(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: '八字计算失败' }, { status: 500 });
  }
}
