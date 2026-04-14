// 八字精确计算 - API Route
import { NextRequest, NextResponse } from 'next/server';
import { calculateBaziWithInterpretation } from '@/lib/bazi-calc';

export async function POST(req: NextRequest) {
  try {
    const { year, month, day, hour = 12, gender = 'male', timezone = 'Asia/Shanghai' } = await req.json();
    const { result, interpretation } = calculateBaziWithInterpretation(year, month, day, hour, gender, timezone);
    return NextResponse.json({ result, interpretation });
  } catch (err) {
    return NextResponse.json({ error: '八字计算失败' }, { status: 500 });
  }
}
