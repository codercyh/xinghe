import type { Metadata } from 'next';
import '@/styles/globals.css';
import PageTransition from '@/components/PageTransition';
import { noto, plusJakarta } from '@/lib/fonts';

export const metadata: Metadata = {
  title: '星合 — 你的星座与命运',
  description: 'AI + 星座 + 八字，探索你的星图密码',
  keywords: '星座, 八字, 命理, AI, 星盘, 运势',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${noto.className} ${plusJakarta.className}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
