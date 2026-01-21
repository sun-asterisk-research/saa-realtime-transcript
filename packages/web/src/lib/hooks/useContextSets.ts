import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ContextSetWithDetails, ContextSetFormData } from '@/lib/supabase/types';

export function useContextSets(userId?: string, search?: string) {
  const [contextSets, setContextSets] = useState<ContextSetWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const fetchContextSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/context-sets?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch context sets');
      }

      setContextSets(data.contextSets || []);
    } catch (err) {
      console.error('Error fetching context sets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch context sets');
    } finally {
      setIsLoading(false);
    }
  }, [userId, search]);

  useEffect(() => {
    fetchContextSets();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('context_sets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'context_sets' }, (payload: any) => {
        console.log('Context sets changed:', payload);
        fetchContextSets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContextSets, supabase]);

  const createContextSet = useCallback(
    async (data: ContextSetFormData & { userId: string }) => {
      try {
        const response = await fetch('/api/context-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create context set');
        }

        await fetchContextSets();
        return result.contextSet;
      } catch (err) {
        console.error('Error creating context set:', err);
        throw err;
      }
    },
    [fetchContextSets],
  );

  const updateContextSet = useCallback(
    async (id: string, data: Partial<ContextSetFormData> & { userId?: string }) => {
      try {
        const response = await fetch(`/api/context-sets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update context set');
        }

        await fetchContextSets();
        return result.contextSet;
      } catch (err) {
        console.error('Error updating context set:', err);
        throw err;
      }
    },
    [fetchContextSets],
  );

  const deleteContextSet = useCallback(
    async (id: string, userId?: string) => {
      try {
        const params = userId ? `?userId=${userId}` : '';
        const response = await fetch(`/api/context-sets/${id}${params}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete context set');
        }

        await fetchContextSets();
      } catch (err) {
        console.error('Error deleting context set:', err);
        throw err;
      }
    },
    [fetchContextSets],
  );

  return {
    contextSets,
    isLoading,
    error,
    refresh: fetchContextSets,
    createContextSet,
    updateContextSet,
    deleteContextSet,
  };
}
