'use client';

import { useEffect, useRef, use } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import { useTranscripts } from '@/lib/hooks/useTranscripts';

export default function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { session, isLoading, error } = useSession(code);
  const { transcripts, streamingTranscripts } = useTranscripts(session?.id, code);

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
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-sm">Live</span>
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
                {t.translated_text || t.original_text}
              </span>
            </div>
          ))}

          {/* Streaming transcripts from other participants */}
          {Array.from(streamingTranscripts.entries()).map(([id, data]) => (
            <div key={id} className="text-yellow-300">
              <span className="text-yellow-400 font-medium text-lg">{data.participantName}: </span>
              <span className="text-2xl md:text-3xl leading-relaxed">
                {data.translatedText || data.text}
              </span>
              <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
            </div>
          ))}

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
