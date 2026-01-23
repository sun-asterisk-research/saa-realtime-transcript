'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { FloatingBilingualButton } from '@/components/FloatingBilingualButton';
import { BilingualTranscriptDisplay } from '@/components/BilingualTranscriptDisplay';
import { useBilingualMode } from '@/contexts/BilingualModeContext';
import type { Session, Transcript } from '@/lib/supabase/types';
import type { Token } from '@soniox/speech-to-text-web';

// Helper function to convert database transcripts to tokens for bilingual display
function convertTranscriptToTokens(transcript: Transcript): Token[] {
  const tokens: Token[] = [];

  if (transcript.original_text) {
    tokens.push({
      text: transcript.original_text,
      confidence: 1.0,
      is_final: true,
      translation_status: 'original',
      language: transcript.source_language || undefined,
      speaker: transcript.speaker_id || undefined,
    });
  }

  if (transcript.translated_text) {
    tokens.push({
      text: transcript.translated_text,
      confidence: 1.0,
      is_final: true,
      translation_status: 'translation',
      language: transcript.target_language || undefined,
    });
  }

  return tokens;
}

export default function HistoryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isBilingualMode } = useBilingualMode();

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
          <span className="text-text-secondary">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="bg-white rounded-2xl border border-plum-100 shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">{error || 'Session not found'}</h2>
          <p className="text-text-secondary mb-6">The session you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Link href="/">
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-50 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-gradient-to-bl from-plum-300 to-plum-500 blob-2 opacity-40 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tr from-plum-200 to-plum-400 blob-3 opacity-30 translate-y-1/3" />

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Navigation */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-plum-600 transition-colors group"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-plum-600 transition-colors group"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </div>

          {/* Session Info Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-plum-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                  {session.title || 'Session History'}
                </h1>
                {session.description && (
                  <p className="text-text-secondary">{session.description}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  session.status === 'active'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-gray-100 border border-gray-200 text-gray-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {session.status === 'active' ? 'Active' : 'Ended'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-muted rounded-xl p-4">
                <div className="text-text-muted text-sm mb-1">Session Code</div>
                <div className="font-mono text-lg font-semibold text-plum-600">{session.code}</div>
              </div>
              <div className="bg-surface-muted rounded-xl p-4">
                <div className="text-text-muted text-sm mb-1">Host</div>
                <div className="font-medium text-text-primary">{session.host_name}</div>
              </div>
              <div className="bg-surface-muted rounded-xl p-4">
                <div className="text-text-muted text-sm mb-1">Mode</div>
                <div className="font-medium text-text-primary">
                  {session.mode === 'one_way' ? (
                    <span className="flex items-center gap-2">
                      One-way
                      <span className="text-sm text-plum-600">
                        → {session.target_language?.toUpperCase()}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Two-way
                      <span className="text-sm text-plum-600">
                        {session.language_a?.toUpperCase()} ↔ {session.language_b?.toUpperCase()}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-surface-muted rounded-xl p-4">
                <div className="text-text-muted text-sm mb-1">Created</div>
                <div className="font-medium text-text-primary text-sm">{formatDate(session.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Transcripts Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-plum-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-plum-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-plum-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Transcripts
                <span className="text-sm font-normal text-text-muted">({transcripts.length})</span>
              </h2>
            </div>

            {transcripts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-text-secondary">No transcripts recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transcripts.map((t) => {
                  if (isBilingualMode) {
                    const tokens = convertTranscriptToTokens(t);
                    return (
                      <div key={t.id} className="bg-surface-muted rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-plum-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-plum-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium text-plum-600">{t.participant_name}</span>
                          <span className="text-text-muted text-xs">{formatDate(t.created_at)}</span>
                          {t.speaker_id && (
                            <span className="text-xs text-text-muted bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              Speaker {t.speaker_id}
                            </span>
                          )}
                        </div>

                        <BilingualTranscriptDisplay
                          tokens={tokens}
                          mode={session?.mode || 'one_way'}
                          targetLanguage={session?.target_language || undefined}
                          languageA={session?.language_a || undefined}
                          languageB={session?.language_b || undefined}
                          showSpeaker={false}
                          variant="light"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={t.id} className="bg-surface-muted rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-plum-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-plum-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-medium text-plum-600">{t.participant_name}</span>
                        <span className="text-text-muted text-xs">{formatDate(t.created_at)}</span>
                        {t.source_language && (
                          <span className="text-xs text-white bg-plum-500 px-2 py-0.5 rounded-full">
                            {t.source_language.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Original text */}
                      <div className="text-text-primary mb-2 pl-11">{t.original_text}</div>

                      {/* Translated text */}
                      {t.translated_text && (
                        <div className="bg-white rounded-lg p-3 ml-11 border-l-4 border-emerald-400">
                          <span className="text-emerald-600 text-xs font-medium mr-2">
                            → {t.target_language?.toUpperCase() || 'Translated'}:
                          </span>
                          <span className="text-text-primary">{t.translated_text}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export button */}
            {transcripts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
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
                  variant="outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export as Text
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bilingual Button */}
      <FloatingBilingualButton />
    </div>
  );
}
