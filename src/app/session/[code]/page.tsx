'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SessionContent with SSR disabled
// This is required because useSessionTranscribe imports SonioxClient
// which references 'window' at module load time
const SessionContent = dynamic(() => import('./session-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
        <span className="text-text-secondary">Loading session...</span>
      </div>
    </div>
  ),
});

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  return <SessionContent code={code} />;
}
