import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Transcript } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface StreamingTranscript {
  participantId: string;
  participantName: string;
  text: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  timestamp: number;
}

interface UseTranscriptsResult {
  transcripts: Transcript[];
  streamingTranscripts: Map<string, StreamingTranscript>;
  isLoading: boolean;
  error: string | null;
  broadcastStreaming: (data: StreamingTranscript) => void;
  addTranscript: (transcript: Transcript) => void;
}

export function useTranscripts(sessionId: string | undefined, code: string): UseTranscriptsResult {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [streamingTranscripts, setStreamingTranscripts] = useState<Map<string, StreamingTranscript>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchTranscripts = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${code}/transcripts`);
      if (!response.ok) throw new Error('Failed to fetch transcripts');
      const data = await response.json();
      setTranscripts(data.transcripts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcripts');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const broadcastStreaming = useCallback(
    (data: StreamingTranscript) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'streaming',
          payload: data,
        });
      }
    },
    [],
  );

  const addTranscript = useCallback((transcript: Transcript) => {
    setTranscripts((prev) => [...prev, transcript]);
    // Clear streaming transcript for this participant
    if (transcript.participant_id) {
      setStreamingTranscripts((prev) => {
        const next = new Map(prev);
        next.delete(transcript.participant_id!);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  // Subscribe to transcript changes and streaming broadcasts
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`transcripts:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcripts',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newTranscript = payload.new as Transcript;
          if (newTranscript.is_final) {
            setTranscripts((prev) => [...prev, newTranscript]);
            // Clear streaming transcript for this participant
            // Use participant_id as key to match with streaming map
            setStreamingTranscripts((prev) => {
              const next = new Map(prev);
              // Try to delete using participant_id first (should match streaming key)
              if (newTranscript.participant_id) {
                next.delete(newTranscript.participant_id);
              }
              return next;
            });
          }
        },
      )
      .on('broadcast', { event: 'streaming' }, ({ payload }) => {
        const data = payload as StreamingTranscript;
        setStreamingTranscripts((prev) => {
          const next = new Map(prev);
          next.set(data.participantId, data);
          return next;
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  return {
    transcripts,
    streamingTranscripts,
    isLoading,
    error,
    broadcastStreaming,
    addTranscript,
  };
}
