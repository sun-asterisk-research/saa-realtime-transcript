'use client';

import { useEffect, useRef, use, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { Select } from '@/components/select';
import { FloatingBilingualButton } from '@/components/FloatingBilingualButton';
import { BilingualTranscriptDisplay } from '@/components/BilingualTranscriptDisplay';
import { BilingualTwoColumnLayout } from '@/components/BilingualTwoColumnLayout';
import { useBilingualMode } from '@/contexts/BilingualModeContext';
import type { Token } from '@soniox/speech-to-text-web';

// Generate color for speaker diarization (supports up to 15 speakers)
function getSpeakerColor(speakerId: string): string {
  const colors = [
    'text-blue-400',    // Speaker 1
    'text-green-400',   // Speaker 2
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
    'text-emerald-400', // Speaker 14
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
      <div className="min-h-screen flex items-center justify-center bg-[#092432]">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#092432]">
        <div className="text-red-400 text-2xl">Session not found</div>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#092432]">
        <div className="text-slate-400 text-2xl">Session has ended</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#092432]">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Session: {code}</h1>
          <div className="text-slate-400 text-sm">
            {session.mode === 'one_way' ? 'One-way' : 'Two-way'} Translation
            {session.mode === 'one_way' && ` → ${session.target_language?.toUpperCase()}`}
            {session.mode === 'two_way' && ` (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Selector - only for two-way mode, hidden in bilingual mode */}
          {session.mode === 'two_way' && session.language_a && session.language_b && !isBilingualMode && (
            <Select
              value={displayLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-white text-sm bg-slate-800 border-slate-600 w-20">
              <option value={session.language_a}>{session.language_a.toUpperCase()}</option>
              <option value={session.language_b}>{session.language_b.toUpperCase()}</option>
            </Select>
          )}
          {isBilingualMode && (
            <span className="text-slate-400 text-sm">Bilingual Mode</span>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Transcripts - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 scroll-smooth"
      >
        {isBilingualMode ? (
          <div className="max-w-7xl mx-auto">
            <BilingualTwoColumnLayout
              items={bilingualItems}
              mode={session.mode}
              targetLanguage={session.target_language || undefined}
              languageA={session.language_a || undefined}
              languageB={session.language_b || undefined}
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
                : 'text-blue-400';
              return (
                <div
                  key={t.id}
                  className="text-white animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className={`${textColor} font-medium text-lg`}>
                    {t.participant_name}
                    {enableDiarization && ` (Speaker ${t.speaker_id})`}:{' '}
                  </span>
                  <span className="text-2xl md:text-3xl leading-relaxed">
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
                : 'text-yellow-400';
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
                <div key={id} className="text-yellow-300">
                  <span className={`${textColor} font-medium text-lg`}>
                    {data.participantName}
                    {enableDiarization && ` (Speaker ${data.speakerId})`}:{' '}
                  </span>
                  <span className="text-2xl md:text-3xl leading-relaxed">
                    {displayText}
                  </span>
                  <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
                </div>
              );
            })}

            <div ref={transcriptEndRef} className="h-4" />

            {/* Empty state */}
            {transcripts.length === 0 && streamingTranscripts.size === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-slate-500 text-2xl mb-2">Waiting for participants to speak...</div>
                  <div className="text-slate-600 text-sm">Transcripts will appear here in real-time</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Participant count */}
      <div className="flex-shrink-0 p-3 border-t border-slate-700/50 text-center">
        <span className="text-slate-500 text-sm">
          {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Floating Bilingual Button */}
      <FloatingBilingualButton />
    </div>
  );
}
