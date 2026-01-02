'use client';

import { useEffect, useRef, use } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import { useTranscripts } from '@/lib/hooks/useTranscripts';

export default function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { session, isLoading, error } = useSession(code);
  const { transcripts, streamingTranscripts } = useTranscripts(session?.id, code);

  // Auto-scroll to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen bg-[#092432] p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-medium">Session: {code}</h1>
          <div className="text-slate-400 text-sm">
            {session.mode === 'one_way' ? 'One-way' : 'Two-way'} Translation
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>

      {/* Transcripts */}
      <div className="space-y-6">
        {/* Final transcripts */}
        {transcripts.map((t) => (
          <div key={t.id} className="text-white">
            <span className="text-blue-400 font-medium text-xl">{t.participant_name}: </span>
            <span className="text-3xl leading-relaxed">{t.translated_text || t.original_text}</span>
          </div>
        ))}

        {/* Streaming transcripts */}
        {Array.from(streamingTranscripts.entries()).map(([id, data]) => (
          <div key={id} className="text-white/70">
            <span className="text-blue-400/70 font-medium text-xl">{data.participantName}: </span>
            <span className="text-3xl leading-relaxed">{data.translatedText || data.text}</span>
          </div>
        ))}

        <div ref={transcriptEndRef} />
      </div>

      {/* Empty state */}
      {transcripts.length === 0 && streamingTranscripts.size === 0 && (
        <div className="text-center text-slate-500 text-xl mt-20">Waiting for participants to speak...</div>
      )}
    </div>
  );
}
