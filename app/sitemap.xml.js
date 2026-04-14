export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  const pages = ['/', '/about', '/history', '/match'];
  const urls = pages.map(p => `${baseUrl}${p}`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) => `<url><loc>${u}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
    )
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
