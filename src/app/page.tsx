'use client';

import Link from 'next/link';
import { Button } from '@/components/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Session Translation</h1>
        <p className="text-slate-400 text-lg max-w-md">
          Real-time speech translation for multi-participant meetings
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/create">
          <Button className="min-w-[200px] h-12 text-base bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            Create Session
          </Button>
        </Link>
        <Link href="/join">
          <Button className="min-w-[200px] h-12 text-base">Join Session</Button>
        </Link>
      </div>

      <div className="mt-8 text-slate-500 text-sm">
        <p>Create a session as host or join an existing one with a code</p>
      </div>
    </div>
  );
}
