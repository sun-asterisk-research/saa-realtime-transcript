'use client';

import { useEffect, useRef, use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { Select } from '@/components/select';

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

export default function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [displayLanguage, setDisplayLanguage] = useState<string>('');

  const { session, isLoading, error } = useSession(code);
  const { transcripts, streamingTranscripts } = useTranscripts(session?.id, code);

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
          {/* Language Selector - only for two-way mode */}
          {session.mode === 'two_way' && session.language_a && session.language_b && (
            <Select
              value={displayLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-white text-sm bg-slate-800 border-slate-600 w-20">
              <option value={session.language_a}>{session.language_a.toUpperCase()}</option>
              <option value={session.language_b}>{session.language_b.toUpperCase()}</option>
            </Select>
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
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Final transcripts */}
          {transcripts.map((t, index) => (
            <div
              key={t.id}
              className="text-white animate-fadeIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-blue-400 font-medium text-lg">{t.participant_name}: </span>
              <span className="text-2xl md:text-3xl leading-relaxed">
                {getDisplayText(t, displayLanguage, session.mode)}
              </span>
            </div>
          ))}

          {/* Streaming transcripts from other participants */}
          {Array.from(streamingTranscripts.entries()).map(([id, data]) => {
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
                <span className="text-yellow-400 font-medium text-lg">{data.participantName}: </span>
                <span className="text-2xl md:text-3xl leading-relaxed">
                  {displayText}
                </span>
                <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
              </div>
            );
          })}

          <div ref={transcriptEndRef} className="h-4" />
        </div>

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

      {/* Footer - Participant count */}
      <div className="flex-shrink-0 p-3 border-t border-slate-700/50 text-center">
        <span className="text-slate-500 text-sm">
          {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
