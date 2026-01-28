'use client';

import { useEffect, useRef, use, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { Select } from '@/components/select';
import { FloatingBilingualButton } from '@/components/FloatingBilingualButton';
import { BilingualTwoColumnLayout } from '@/components/BilingualTwoColumnLayout';
import { useBilingualMode } from '@/contexts/BilingualModeContext';
import type { Token } from '@soniox/speech-to-text-web';

// Generate color for speaker diarization (supports up to 15 speakers)
function getSpeakerColor(speakerId: string): string {
  const colors = [
    'text-plum-400',    // Speaker 1
    'text-emerald-400', // Speaker 2
    'text-purple-400',  // Speaker 3
    'text-pink-400',    // Speaker 4
    'text-cyan-400',    // Speaker 5
    'text-orange-400',  // Speaker 6
    'text-teal-400',    // Speaker 7
    'text-indigo-400',  // Speaker 8
    'text-yellow-400',  // Speaker 9
    'text-red-400',     // Speaker 10
    'text-lime-400',    // Speaker 11
    'text-rose-400',    // Speaker 12
    'text-amber-400',   // Speaker 13
    'text-sky-400',     // Speaker 14
    'text-fuchsia-400', // Speaker 15
  ];
  const index = parseInt(speakerId, 10) - 1; // Speaker IDs are 1-based
  return colors[Math.abs(index) % colors.length];
}

// Helper function to get display text based on language preference
function getDisplayText(
  transcript: {
    original_text: string;
    translated_text?: string | null;
    source_language?: string | null;
    target_language?: string | null;
  },
  preferredLanguage: string | undefined,
  sessionMode: string
): string {
  // For one-way mode, always show translated if available
  if (sessionMode === 'one_way') {
    return transcript.translated_text || transcript.original_text;
  }

  // For two-way mode, show based on preference
  if (!preferredLanguage) {
    return transcript.translated_text || transcript.original_text;
  }

  // If source matches preference, show original
  if (transcript.source_language === preferredLanguage) {
    return transcript.original_text;
  }

  // If target matches preference, show translated
  if (transcript.target_language === preferredLanguage) {
    return transcript.translated_text || transcript.original_text;
  }

  // Fallback
  return transcript.translated_text || transcript.original_text;
}

// Helper function to convert database transcripts to tokens for bilingual display
function convertTranscriptToTokens(transcript: {
  original_text: string;
  translated_text?: string | null;
  source_language?: string | null;
  target_language?: string | null;
  speaker_id?: string | null;
}): Token[] {
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

// Helper to convert streaming transcript to tokens
function convertStreamingToTokens(data: {
  text: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speakerId?: string;
}): Token[] {
  const tokens: Token[] = [];

  if (data.text) {
    tokens.push({
      text: data.text,
      confidence: 1.0,
      is_final: false,
      translation_status: 'original',
      language: data.sourceLanguage,
      speaker: data.speakerId,
    });
  }

  if (data.translatedText) {
    tokens.push({
      text: data.translatedText,
      confidence: 1.0,
      is_final: false,
      translation_status: 'translation',
      language: data.targetLanguage,
    });
  }

  return tokens;
}

export default function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [displayLanguage, setDisplayLanguage] = useState<string>('');
  const { isBilingualMode, toggleBilingualMode } = useBilingualMode();

  const { session, isLoading, error } = useSession(code);
  const { transcripts, streamingTranscripts } = useTranscripts(session?.id, code);

  // Prepare bilingual layout items
  const bilingualItems = useMemo(() => {
    const items: Array<{
      id: string;
      participantName: string;
      originalText: string;
      translatedText?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      speaker?: string;
      isStreaming?: boolean;
    }> = [];

    // Add final transcripts
    transcripts.forEach((t) => {
      items.push({
        id: t.id,
        participantName: t.participant_name,
        originalText: t.original_text,
        translatedText: t.translated_text || undefined,
        sourceLanguage: t.source_language || undefined,
        targetLanguage: t.target_language || undefined,
        speaker: t.speaker_id || undefined,
        isStreaming: false,
      });
    });

    // Add streaming transcripts
    Array.from(streamingTranscripts.entries()).forEach(([id, data]) => {
      items.push({
        id: `streaming-${id}`,
        participantName: data.participantName,
        originalText: data.text,
        translatedText: data.translatedText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        speaker: data.speakerId,
        isStreaming: true,
      });
    });

    return items;
  }, [transcripts, streamingTranscripts]);

  // Check URL parameter for bilingual mode
  useEffect(() => {
    const bilingualParam = searchParams.get('bilingual');
    if (bilingualParam === 'true' && !isBilingualMode) {
      toggleBilingualMode();
    }
  }, [searchParams]);

  // Initialize display language from URL param, localStorage, or default
  useEffect(() => {
    if (!session) return;

    const urlLang = searchParams.get('lang');
    const storedLang = localStorage.getItem(`display_lang_${code}`);

    if (urlLang && session.mode === 'two_way') {
      // Validate URL param against session languages
      if (urlLang === session.language_a || urlLang === session.language_b) {
        setDisplayLanguage(urlLang);
        localStorage.setItem(`display_lang_${code}`, urlLang);
        return;
      }
    }

    if (storedLang && session.mode === 'two_way') {
      // Validate stored lang
      if (storedLang === session.language_a || storedLang === session.language_b) {
        setDisplayLanguage(storedLang);
        return;
      }
    }

    // Default to first language
    if (session.mode === 'two_way' && session.language_a) {
      setDisplayLanguage(session.language_a);
    }
  }, [session, searchParams, code]);

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setDisplayLanguage(newLang);
    localStorage.setItem(`display_lang_${code}`, newLang);
  };

  // Auto-scroll to bottom smoothly when content changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcripts, streamingTranscripts]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-plum-700 border-t-plum-400 rounded-full animate-spin" />
          <span className="text-white/80 text-xl">Loading...</span>
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
          <h2 className="text-red-400 text-2xl font-semibold">Session not found</h2>
        </div>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
        <div className="text-center">
          <div className="w-20 h-20 bg-plum-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-plum-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-plum-300 text-2xl font-semibold">Session has ended</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-plum-950 via-plum-900 to-plum-950">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 backdrop-blur-sm bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo/Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-plum-500 to-plum-700 rounded-xl flex items-center justify-center shadow-lg shadow-plum-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white text-lg font-semibold flex items-center gap-2">
              Session: <span className="font-mono text-plum-300">{code}</span>
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Selector - only for two-way mode, hidden in bilingual mode */}
          {session.mode === 'two_way' && session.language_a && session.language_b && !isBilingualMode && (
            <select
              value={displayLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-plum-500 focus:border-transparent"
            >
              <option value={session.language_a} className="bg-plum-900 text-white">{session.language_a.toUpperCase()}</option>
              <option value={session.language_b} className="bg-plum-900 text-white">{session.language_b.toUpperCase()}</option>
            </select>
          )}
          {isBilingualMode && (
            <span className="px-3 py-1.5 rounded-full bg-plum-500/30 border border-plum-500/50 text-plum-200 text-sm font-medium">
              Bilingual Mode
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            <span className="text-emerald-300 text-sm font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Transcripts - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 pb-6 scroll-smooth"
      >
        {isBilingualMode ? (
          <div className="max-w-7xl mx-auto">
            <BilingualTwoColumnLayout
              items={bilingualItems}
              mode={session.mode}
              targetLanguage={session.target_language || undefined}
              languageA={session.language_a || undefined}
              languageB={session.language_b || undefined}
              headerBgClass="bg-plum-950"
            />
            <div ref={transcriptEndRef} className="h-4" />
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Final transcripts */}
            {transcripts.map((t, index) => {
              const enableDiarization = session.enable_speaker_diarization && t.speaker_id;
              const textColor = enableDiarization
                ? getSpeakerColor(t.speaker_id!)
                : 'text-plum-400';
              return (
                <div
                  key={t.id}
                  className="text-white animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className={`${textColor} font-semibold text-lg`}>
                    {t.participant_name}
                    {enableDiarization && ` (Speaker ${t.speaker_id})`}:{' '}
                  </span>
                  <span className="text-2xl md:text-3xl leading-relaxed text-white/95">
                    {getDisplayText(t, displayLanguage, session.mode)}
                  </span>
                </div>
              );
            })}

            {/* Streaming transcripts from other participants */}
            {Array.from(streamingTranscripts.entries()).map(([id, data]) => {
              const enableDiarization = session.enable_speaker_diarization && data.speakerId;
              const textColor = enableDiarization
                ? getSpeakerColor(data.speakerId!)
                : 'text-amber-400';
              const displayText = getDisplayText(
                {
                  original_text: data.text,
                  translated_text: data.translatedText,
                  source_language: data.sourceLanguage,
                  target_language: data.targetLanguage,
                },
                displayLanguage,
                session.mode
              );
              return (
                <div key={id} className="text-amber-100">
                  <span className={`${textColor} font-semibold text-lg`}>
                    {data.participantName}
                    {enableDiarization && ` (Speaker ${data.speakerId})`}:{' '}
                  </span>
                  <span className="text-2xl md:text-3xl leading-relaxed">
                    {displayText}
                  </span>
                  <span className="inline-block w-2 h-6 bg-amber-400 ml-1 animate-blink rounded-sm" />
                </div>
              );
            })}

            <div ref={transcriptEndRef} className="h-4" />

            {/* Empty state */}
            {transcripts.length === 0 && streamingTranscripts.size === 0 && (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-white/60 text-2xl font-medium mb-2">Waiting for participants to speak...</h3>
                  <p className="text-white/40 text-lg">Transcripts will appear here in real-time</p>
                </div>
              </div>
            )}
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

      {/* Floating Bilingual Button */}
      <FloatingBilingualButton />
    </div>
  );
}
