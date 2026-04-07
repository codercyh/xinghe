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

    // Use streaming response for SSE
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('MiniMax API error:', response.status, data);
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: `AI 服务异常 (${response.status})：${data.error?.message ?? '请稍后再试'}` } },
        { status: 502 }
      );
    }

    // SSE streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let fullContent = '';
        let buffer = '';

        const push = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer.length > 0) {
                try {
                  const line = buffer.trim();
                  if (line.startsWith('data:')) {
                    const jsonStr = line.slice(5).trim();
                    if (jsonStr && jsonStr !== '[DONE]') {
                      const data = JSON.parse(jsonStr);
                      const delta = data.choices?.[0]?.delta?.content ?? '';
                      if (delta) {
                        fullContent += delta;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`));
                      }
                    }
                  }
                } catch {}
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`));
              controller.close();
              return;
            }

            buffer += new TextDecoder().decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const data = JSON.parse(jsonStr);
                const delta = data.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`));
                }
              } catch {
                // skip malformed JSON
              }
            }
            push();
          } catch {
            controller.close();
          }
        };

        push();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: '服务器异常，请稍后再试' } },
      { status: 500 }
    );
  }
}
