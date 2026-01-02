import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Participant } from '@/lib/supabase/types';

interface UseParticipantsResult {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  leaveSession: (participantId: string) => Promise<void>;
}

export function useParticipants(sessionId: string | undefined, code: string): UseParticipantsResult {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .is('left_at', null)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;
      setParticipants(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const leaveSession = useCallback(
    async (participantId: string) => {
      try {
        const response = await fetch(`/api/sessions/${code}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId }),
        });
        if (!response.ok) {
          throw new Error('Failed to leave session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to leave session');
      }
    },
    [code],
  );

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Subscribe to participant changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch on any change
          fetchParticipants();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchParticipants]);

  return {
    participants,
    isLoading,
    error,
    leaveSession,
  };
}
