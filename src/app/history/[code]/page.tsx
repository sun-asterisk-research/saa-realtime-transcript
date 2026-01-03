'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import type { Session, Transcript } from '@/lib/supabase/types';

export default function HistoryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch session
        const sessionRes = await fetch(`/api/sessions/${code}`);
        if (!sessionRes.ok) throw new Error('Session not found');
        const sessionData = await sessionRes.json();
        setSession(sessionData.session);

        // Fetch transcripts
        const transcriptsRes = await fetch(`/api/sessions/${code}/transcripts`);
        if (!transcriptsRes.ok) throw new Error('Failed to load transcripts');
        const transcriptsData = await transcriptsRes.json();
        setTranscripts(transcriptsData.transcripts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading history...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="text-red-400 mb-4">{error || 'Session not found'}</div>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <Link href="/" className="text-slate-400 hover:text-white">
              &larr; Back to Home
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {session.title || 'Session History'}
          </h1>

          <div className="text-slate-400 space-y-1">
            {session.description && (
              <div className="text-slate-300 mb-2">{session.description}</div>
            )}
            <div>Code: <span className="font-mono text-white">{session.code}</span></div>
            <div>Host: {session.host_name}</div>
            <div>
              Mode: {session.mode === 'one_way' ? 'One-way' : 'Two-way'}
              {session.mode === 'one_way' && ` → ${session.target_language?.toUpperCase()}`}
              {session.mode === 'two_way' &&
                ` (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
            </div>
            <div>Created: {formatDate(session.created_at)}</div>
            {session.ended_at && <div>Ended: {formatDate(session.ended_at)}</div>}
            <div
              className={`inline-block px-2 py-1 rounded text-sm ${
                session.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'
              }`}>
              {session.status === 'active' ? 'Active' : 'Ended'}
            </div>
          </div>
        </div>

        {/* Transcripts */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Transcripts ({transcripts.length})</h2>

          {transcripts.length === 0 ? (
            <div className="text-slate-500 text-center py-8">No transcripts recorded</div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((t) => (
                <div key={t.id} className="border-b border-slate-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400 font-medium">{t.participant_name}</span>
                    <span className="text-slate-500 text-xs">{formatDate(t.created_at)}</span>
                    {t.source_language && (
                      <span className="text-xs text-slate-500 bg-slate-700 px-1 rounded">
                        {t.source_language.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Original text */}
                  <div className="text-slate-300 mb-1">{t.original_text}</div>

                  {/* Translated text */}
                  {t.translated_text && (
                    <div className="text-white text-lg bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-500 text-xs mr-2">
                        → {t.target_language?.toUpperCase() || 'Translated'}:
                      </span>
                      {t.translated_text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export button (optional feature) */}
        <div className="mt-6 text-center">
          <Button
            onClick={() => {
              const text = transcripts
                .map(
                  (t) =>
                    `[${formatDate(t.created_at)}] ${t.participant_name}: ${t.original_text}${t.translated_text ? `\n→ ${t.translated_text}` : ''}`,
                )
                .join('\n\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `session-${code}-transcripts.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-slate-400 border-slate-600 hover:bg-slate-800">
            Export as Text
          </Button>
        </div>
      </div>
    </div>
  );
}
