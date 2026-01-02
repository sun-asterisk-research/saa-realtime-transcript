import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sun Asterisk Realtime Translation',
  description: 'Realtime translation app for Sun Asterisk meeting',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
