// 八字精确计算 - API Route
// 算法核心来自 @/lib/bazi-calc（无外部依赖）

import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi } from '@/lib/bazi-calc';

export async function POST(req: NextRequest) {
  try {
    const { year, month, day, hour = 12, gender = 'male', timezone = 'Asia/Shanghai' } = await req.json();
    const result = calculateBazi(year, month, day, hour, gender, timezone);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: '八字计算失败' }, { status: 500 });
  }
}
