import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ContextSetWithDetails, Context } from '@/lib/supabase/types';

export function useSessionContexts(sessionId?: string, sessionCode?: string) {
  const [contextSets, setContextSets] = useState<ContextSetWithDetails[]>([]);
  const [mergedContext, setMergedContext] = useState<Context | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const fetchSessionContexts = useCallback(async () => {
    if (!sessionCode) {
      setContextSets([]);
      setMergedContext(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions/${sessionCode}/contexts`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session contexts');
      }

      setContextSets(data.contextSets || []);
      setMergedContext(data.mergedContext);
    } catch (err) {
      console.error('Error fetching session contexts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session contexts');
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    fetchSessionContexts();

    if (!sessionId) return;

    // Subscribe to realtime changes on session_context_sets
    const channel = supabase
      .channel('session_context_sets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_context_sets' }, (payload: any) => {
        console.log('Session context sets changed:', payload);
        // Only refresh if this change affects our session
        if (payload.new && 'session_id' in payload.new && payload.new.session_id === sessionId) {
          fetchSessionContexts();
        } else if (payload.old && 'session_id' in payload.old && payload.old.session_id === sessionId) {
          fetchSessionContexts();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessionContexts, sessionId, supabase]);

  const addContextSets = useCallback(
    async (contextSetIds: string[]) => {
      if (!sessionCode) {
        throw new Error('No session code provided');
      }

      try {
        const response = await fetch(`/api/sessions/${sessionCode}/contexts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contextSetIds }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to add context sets');
        }

        await fetchSessionContexts();
      } catch (err) {
        console.error('Error adding context sets:', err);
        throw err;
      }
    },
    [sessionCode, fetchSessionContexts],
  );

  const removeContextSet = useCallback(
    async (contextSetId: string) => {
      if (!sessionCode) {
        throw new Error('No session code provided');
      }

      try {
        const response = await fetch(`/api/sessions/${sessionCode}/contexts/${contextSetId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to remove context set');
        }

        await fetchSessionContexts();
      } catch (err) {
        console.error('Error removing context set:', err);
        throw err;
      }
    },
    [sessionCode, fetchSessionContexts],
  );

  return {
    contextSets,
    mergedContext,
    isLoading,
    error,
    refresh: fetchSessionContexts,
    addContextSets,
    removeContextSet,
  };
}
