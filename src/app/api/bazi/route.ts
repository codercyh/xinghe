import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi } from '@/lib/bazi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour, gender, timezone } = body;

    if (!year || !month || !day || hour === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATE', message: '请提供完整的出生日期和时间' } },
        { status: 400 }
      );
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_GENDER', message: '性别参数无效' } },
        { status: 400 }
      );
    }

    const data = calculateBazi(year, month, day, hour, gender);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器异常，请稍后再试' } },
      { status: 500 }
    );
  }
}
