import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_MESSAGES', message: '消息格式错误' } },
        { status: 400 }
      );
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI 服务暂未配置' } },
        { status: 503 }
      );
    }

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    const status = response.status;
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('MiniMax API error:', status, data);
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: `AI 服务异常 (${status})：${data.error?.message ?? '请稍后再试'}` } },
        { status: 502 }
      );
    }

    const reply = data.choices?.[0]?.message?.content ?? '';
    if (!reply) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: 'AI 返回内容为空，请稍后再试' } },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器异常，请稍后再试' } },
      { status: 500 }
    );
  }
}
