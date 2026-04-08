// 八字精确计算 - API Route
// 算法核心来自 @/lib/bazi-calc（无外部依赖）

import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi } from '@/lib/bazi-calc';
import Lunar from 'lunar-javascript';

export async function POST(req: NextRequest) {
  try {
    const { year, month, day, hour = 12, gender = 'male', timezone = 'Asia/Shanghai' } = await req.json();
    const result = calculateBazi(year, month, day, hour, gender, timezone);

    // 接入 lunar-javascript 获取准确的农历信息
    const lunar = Lunar.Solar.fromYmd(year, month, day);
    const lunarDate = lunar.getLunar();

    // 合并准确的农历信息
    const lunarInfo = {
      lunarYear: lunarDate.getYear(),
      lunarMonth: lunarDate.getMonth(),
      lunarDay: lunarDate.getDay(),
      isLeapMonth: lunarDate.isLeapMonth(),
    };

    return NextResponse.json({ ...result, lunarInfo });
  } catch (err) {
    return NextResponse.json({ error: '八字计算失败' }, { status: 500 });
  }
}
