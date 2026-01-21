import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session, Participant } from '@/lib/supabase/types';

interface UseSessionResult {
  session: Session | null;
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  endSession: () => Promise<void>;
}

export function useSession(code: string): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${code}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      const data = await response.json();
      setSession(data.session);
      setParticipants(data.participants);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const endSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
      if (!response.ok) {
        throw new Error('Failed to end session');
      }
      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [code]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Subscribe to session changes
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(payload.new as Session);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  return {
    session,
    participants,
    isLoading,
    error,
    refetch: fetchSession,
    endSession,
  };
}
