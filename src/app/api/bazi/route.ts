import { NextRequest, NextResponse } from 'next/server';

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

    // 八字计算在客户端进行（前端 JS 兼容 lunar-javascript CJS）
    // 此 API 路由目前作为占位，后续可扩展服务端验证
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_CALCULATION', message: '八字计算在客户端进行，请调用前端 calculateBazi 函数' } },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器异常，请稍后再试' } },
      { status: 500 }
    );
  }
}
