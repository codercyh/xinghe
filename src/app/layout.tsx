import type { Metadata } from 'next';
import '@/styles/globals.css';
import PageTransition from '@/components/PageTransition';

export const metadata: Metadata = {
  title: '星合 — 你的星座与命运',
  description: 'AI + 星座 + 八字，探索你的星图密码',
  keywords: '星座, 八字, 命理, AI, 星盘, 运势',
  openGraph: {
    title: '星合 — 你的星座与命运',
    description: 'AI + 星座 + 八字，探索你的星图密码',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com',
    siteName: '星合',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'}/og-default.png`,
        width: 1200,
        height: 630,
        alt: '星合 — 星盘海报',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '星合 — 你的星座与命运',
    description: 'AI + 星座 + 八字，探索你的星图密码',
    images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'}/og-default.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
      </head>
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
