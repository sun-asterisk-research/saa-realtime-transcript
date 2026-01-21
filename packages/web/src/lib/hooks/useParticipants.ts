import { useEffect, useState, useCallback, useRef } from 'react';
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

  // Use ref to store sessionId for use in subscription callback
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const fetchParticipants = useCallback(async (sid?: string) => {
    const targetSessionId = sid || sessionIdRef.current;
    if (!targetSessionId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', targetSessionId)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Sort: online participants (left_at is null) first, then offline
      const sorted = (data || []).sort((a, b) => {
        const aOnline = a.left_at === null;
        const bOnline = b.left_at === null;
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return 0;
      });

      setParticipants(sorted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchParticipants(sessionId);
    }
  }, [sessionId, fetchParticipants]);

  // Subscribe to participant changes - only depends on sessionId
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up participants subscription for session:', sessionId);

    const handleChange = () => {
      console.log('Participant change detected, refetching...');
      fetchParticipants(sessionId);
    };

    const channel = supabase
      .channel(`participants-realtime-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          console.log('Participant INSERT received:', payload);
          const newRecord = payload.new as { session_id?: string };
          if (newRecord?.session_id === sessionId) {
            handleChange();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          console.log('Participant UPDATE received:', payload);
          const newRecord = payload.new as { session_id?: string };
          if (newRecord?.session_id === sessionId) {
            handleChange();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          console.log('Participant DELETE received:', payload);
          const oldRecord = payload.old as { session_id?: string };
          if (oldRecord?.session_id === sessionId) {
            handleChange();
          }
        },
      )
      .subscribe((status, err) => {
        console.log('Participants subscription status:', status, err);
      });

    return () => {
      console.log('Cleaning up participants subscription');
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
