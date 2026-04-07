import { NextRequest, NextResponse } from 'next/server';
import { buildZodiacData } from '@/lib/zodiac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour, minute, timezone } = body;

    if (!year || !month || !day || hour === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATE', message: '请提供完整的出生日期和时间' } },
        { status: 400 }
      );
    }

    const data = buildZodiacData(year, month, day, hour);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器异常，请稍后再试' } },
      { status: 500 }
    );
  }
}
