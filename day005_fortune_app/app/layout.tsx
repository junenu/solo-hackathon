import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Day5 - 今日の運勢占い',
  description: '毎日違う運勢とラッキーアイテムを表示する占いアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}