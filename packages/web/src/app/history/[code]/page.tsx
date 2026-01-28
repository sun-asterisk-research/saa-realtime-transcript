'use client';

import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { BilingualTwoColumnLayout } from '@/components/BilingualTwoColumnLayout';
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
        const sessionRes = await fetch(`/api/sessions/${code}`);
        if (!sessionRes.ok) throw new Error('Session not found');
        const sessionData = await sessionRes.json();
        setSession(sessionData.session);

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

  const historyItems = useMemo(() =>
    transcripts.map((t) => ({
      id: t.id,
      participantName: t.participant_name,
      originalText: t.original_text,
      translatedText: t.translated_text || undefined,
      sourceLanguage: t.source_language || undefined,
      targetLanguage: t.target_language || undefined,
      speaker: t.speaker_id || undefined,
      isStreaming: false,
    })),
    [transcripts]
  );

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

  const handleExport = () => {
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-plum-700 border-t-plum-400 rounded-full animate-spin" />
          <span className="text-white/80 text-xl">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-red-400 text-2xl font-semibold mb-2">{error || 'Session not found'}</h2>
          <p className="text-white/50 mb-6">The session you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 backdrop-blur-sm bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white text-lg font-semibold flex items-center gap-2">
              {session.title || 'Session History'}
              <span className="text-white/40">—</span>
              <span className="font-mono text-plum-300">{code}</span>
            </h1>
            <div className="text-white/60 text-sm">
              {session.mode === 'one_way' ? 'One-way' : 'Two-way'} Translation
              {session.mode === 'one_way' && (
                <span className="text-plum-400 ml-1">→ {session.target_language?.toUpperCase()}</span>
              )}
              {session.mode === 'two_way' && (
                <span className="text-plum-400 ml-1">
                  ({session.language_a?.toUpperCase()} ↔ {session.language_b?.toUpperCase()})
                </span>
              )}
              <span className="text-white/40 ml-2">·</span>
              <span className="text-white/40 ml-2">{formatDate(session.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Export button */}
          {transcripts.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          )}
          {/* Status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-white/60 text-sm font-medium">Ended</span>
          </div>
        </div>
      </div>

      {/* Transcripts - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-smooth custom-scrollbar-dark">
        {transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-white/60 text-2xl font-medium mb-2">No transcripts recorded</h3>
              <p className="text-white/40 text-lg">This session has no transcript data.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <BilingualTwoColumnLayout
              items={historyItems}
              mode={session.mode}
              targetLanguage={session.target_language || undefined}
              languageA={session.language_a || undefined}
              languageB={session.language_b || undefined}
              headerBgClass="bg-plum-950"
            />
          </div>
        )}
      </div>

      {/* Footer - Transcript count */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 backdrop-blur-sm bg-black/20 flex items-center justify-center">
        <span className="text-white/50 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
