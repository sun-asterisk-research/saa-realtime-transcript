'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase/client';
import type { JoinRequest } from '@/lib/supabase/types';

interface JoinRequestNotificationsProps {
  sessionId: string;
  sessionCode: string;
}

export function JoinRequestNotifications({ sessionId, sessionCode }: JoinRequestNotificationsProps) {
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch pending join requests - stable function with no dependencies
  const fetchPendingRequests = useCallback(async (code: string) => {
    try {
      console.log('Fetching join requests for session:', code);
      const response = await fetch(`/api/sessions/${code}/join-requests`);
      if (response.ok) {
        const data = await response.json();
        const pending = (data.requests || []).filter((r: JoinRequest) => r.status === 'pending');
        console.log('Pending join requests:', pending.length);
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
    }
  }, []);

  // Initial fetch and polling fallback
  useEffect(() => {
    fetchPendingRequests(sessionCode);

    // Poll every 5 seconds as fallback for realtime
    const pollInterval = setInterval(() => {
      fetchPendingRequests(sessionCode);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [sessionCode, fetchPendingRequests]);

  // Subscribe to realtime changes (may not work due to RLS, polling is fallback)
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up join requests subscription for session:', sessionId);

    const channel = supabase
      .channel(`join-requests-realtime-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'join_requests',
        },
        (payload) => {
          console.log('Join request INSERT:', payload);
          const newRecord = payload.new as { session_id?: string };
          if (newRecord?.session_id === sessionId) {
            console.log('New join request for our session, refetching...');
            fetchPendingRequests(sessionCode);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
        },
        (payload) => {
          console.log('Join request UPDATE:', payload);
          const newRecord = payload.new as { session_id?: string };
          if (newRecord?.session_id === sessionId) {
            console.log('Join request updated for our session, refetching...');
            fetchPendingRequests(sessionCode);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Join requests subscription status:', status, err);
      });

    return () => {
      console.log('Cleaning up join requests subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, sessionCode, fetchPendingRequests]);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      // Remove from pending list
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      // Remove from pending list
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      <h3 className="text-sm font-medium text-slate-300 mb-2">
        Join Requests ({pendingRequests.length})
      </h3>
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 space-y-2"
        >
          <div className="text-white font-medium text-sm">{request.name}</div>
          {request.email && (
            <div className="text-slate-400 text-xs">{request.email}</div>
          )}
          {request.message && (
            <div className="text-slate-300 text-sm italic">"{request.message}"</div>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => handleApprove(request.id)}
              disabled={isProcessing === request.id}
              className="flex-1 bg-green-600 border-green-600 hover:bg-green-700 text-white text-sm py-1 h-8"
            >
              {isProcessing === request.id ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              onClick={() => handleReject(request.id)}
              disabled={isProcessing === request.id}
              className="flex-1 bg-red-600 border-red-600 hover:bg-red-700 text-white text-sm py-1 h-8"
            >
              {isProcessing === request.id ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
