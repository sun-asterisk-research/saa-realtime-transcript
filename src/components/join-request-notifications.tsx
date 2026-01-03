'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { createClientForBrowser } from '@/lib/supabase/client';
import type { JoinRequest } from '@/lib/supabase/types';

interface JoinRequestNotificationsProps {
  sessionId: string;
  sessionCode: string;
}

export function JoinRequestNotifications({ sessionId, sessionCode }: JoinRequestNotificationsProps) {
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch pending join requests
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join-requests`);
      if (response.ok) {
        const data = await response.json();
        const pending = (data.requests || []).filter((r: JoinRequest) => r.status === 'pending');
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    fetchPendingRequests();

    const supabase = createClientForBrowser();
    const channel = supabase
      .channel(`join-requests-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Join request change:', payload);
          fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, sessionCode]);

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
