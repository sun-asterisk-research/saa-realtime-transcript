'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SessionContent with SSR disabled
// This is required because useSessionTranscribe imports SonioxClient
// which references 'window' at module load time
const SessionContent = dynamic(() => import('./session-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white">Loading session...</div>
    </div>
  ),
});

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  return <SessionContent code={code} />;
}
