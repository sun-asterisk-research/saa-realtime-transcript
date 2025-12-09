import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAA 2025 CEO Talk - Realtime Transcript',
  description: 'Real-time speech-to-text transcription and translation for Sun Asterisk Annual 2025 CEO Talk',
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
