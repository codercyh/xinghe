import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

function escapeXml(s: string){
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSvg(name: string, sign: string){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">\n  <defs>\n    <linearGradient id="g" x1="0" x2="1">\n      <stop offset="0%" stop-color="#6366F1" />\n      <stop offset="100%" stop-color="#EC4899" />\n    </linearGradient>\n    <style>\n      .title { font-family: 'Plus Jakarta Sans', Noto Sans SC, system-ui, -apple-system; font-weight:700; font-size:56px; fill:#fff }\n      .subtitle { font-family: 'Noto Sans SC', system-ui; font-size:28px; fill:#FCD34D }\n      .small { font-family: 'Noto Sans SC'; font-size:20px; fill:#E6EEF8 }\n    </style>\n  </defs>\n  <rect width="100%" height="100%" fill="url(#g)" />\n  <g transform="translate(80,120)">\n    <text class="title">星合</text>\n    <text x="0" y="80" class="small">你的星座与命运</text>\n    <g transform="translate(0,160)">\n      <rect x="-20" y="-20" width="560" height="260" rx="20" fill="rgba(0,0,0,0.18)" />\n      <text x="40" y="60" class="subtitle">${escapeXml(name)} 的星盘</text>\n      <text x="40" y="110" class="small">${escapeXml(sign)}</text>\n    </g>\n  </g>\n</svg>`;
}

const CACHE_DIR = path.join(process.cwd(), '.ogcache');

export async function GET(req: Request){
  try{
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '探索者';
    const sign = url.searchParams.get('sign') || '';

    const svg = buildSvg(name, sign);
    // cache by hash
    const hash = crypto.createHash('sha256').update(svg).digest('hex');
    try{ fs.mkdirSync(CACHE_DIR, { recursive: true }); }catch(e){}
    const outPath = path.join(CACHE_DIR, `${hash}.png`);
    if(fs.existsSync(outPath)){
      const buf = fs.readFileSync(outPath);
      return new Response(buf, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' } });
    }

    // dynamic convert using sharp if available
    let sharp: any = null;
    try{ sharp = require('sharp'); }catch(e){ sharp = null; }

    if(sharp){
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      try{ fs.writeFileSync(outPath, png); }catch(e){}
      return new Response(png, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' } });
    }

    // fallback: return SVG (with image/svg+xml) if sharp missing
    return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
  }catch(err){
    console.error('og/png error', err);
    return new Response('error', { status: 500 });
  }
}
