export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '探索者';
    const sign = url.searchParams.get('sign') || '';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="100%" stop-color="#EC4899" />
        </linearGradient>
        <style>
          .title { font-family: 'Plus Jakarta Sans', Noto Sans SC, system-ui, -apple-system; font-weight:700; font-size:56px; fill:#fff }
          .subtitle { font-family: 'Noto Sans SC', system-ui; font-size:28px; fill:#FCD34D }
          .small { font-family: 'Noto Sans SC'; font-size:20px; fill:#E6EEF8 }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <g transform="translate(80,120)">
        <text class="title">星合</text>
        <text x="0" y="80" class="small">你的星座与命运</text>
        <g transform="translate(0,160)">
          <rect x="-20" y="-20" width="560" height="260" rx="20" fill="rgba(0,0,0,0.18)" />
          <text x="40" y="60" class="subtitle">${escapeXml(name)} 的星盘</text>
          <text x="40" y="110" class="small">${escapeXml(sign)}</text>
        </g>
      </g>
    </svg>`;

    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
  } catch (err) {
    console.error('og error', err);
    return new Response('error', { status: 500 });
  }
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
