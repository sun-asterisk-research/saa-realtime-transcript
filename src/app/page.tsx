'use client';

import dynamic from 'next/dynamic';

const LiveTranscript = dynamic(() => import('./live-transcript'), { ssr: false });

export default function Home() {
  return <LiveTranscript />;
}
