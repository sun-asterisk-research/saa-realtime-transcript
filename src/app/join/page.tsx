'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { useUser } from '@/lib/hooks/useUser';
import type { Session } from '@/lib/supabase/types';

interface SessionData {
  session: Session;
  canAccess: boolean;
  userInvitationStatus: 'pending' | 'accepted' | 'declined' | null;
  userJoinRequestStatus: 'pending' | 'approved' | 'rejected' | null;
}

export default function JoinSession() {
  const router = useRouter();
  const { user } = useUser();
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleCodeChange = async (code: string) => {
    setSessionCode(code.toUpperCase());
    setError('');
    setSuccess('');
    setSessionData(null);
    setShowRequestForm(false);
    setPreferredLanguage(''); // Reset preference when code changes

    if (code.length >= 6) {
      try {
        const response = await fetch(`/api/sessions/${code.toUpperCase()}`);
        if (response.ok) {
          const data: SessionData = await response.json();
          setSessionData(data);

          // Default to first language for two-way mode
          if (data.session.mode === 'two_way' && data.session.language_a) {
            setPreferredLanguage(data.session.language_a);
          }

          // Determine if user needs to request access
          if (!data.canAccess && !data.session.is_public) {
            // Check if user already has a pending request
            if (data.userJoinRequestStatus === 'pending') {
              setSuccess('You have a pending join request for this session. Please wait for host approval.');
            } else if (data.userJoinRequestStatus === 'rejected') {
              setError('Your previous join request was rejected.');
            } else {
              setShowRequestForm(true);
            }
          }
        } else if (response.status === 404) {
          setError('Session not found');
        }
      } catch {
        // Ignore errors during lookup
      }
    }
  };

  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: user?.email || undefined,
          message: requestMessage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send join request');
      }

      setSuccess(data.message || 'Your request has been sent to the host!');
      setShowRequestForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send join request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          preferredLanguage: preferredLanguage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      // Store participant info in sessionStorage
      sessionStorage.setItem(
        `session_${data.session.code}`,
        JSON.stringify({
          participantId: data.participant.id,
          participantName: data.participant.name,
          isHost: false,
          preferredLanguage: data.participant.preferred_language,
        }),
      );

      router.push(`/session/${data.session.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-slate-400 hover:text-white mb-8 inline-block">
          &larr; Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Join Session</h1>

        {/* Session Code Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-slate-300 mb-2">Session Code</label>
            <Input
              value={sessionCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Enter 6-character code"
              maxLength={6}
              required
              className="text-white uppercase tracking-widest text-center text-xl"
            />
          </div>

          {success && <div className="text-green-400 text-sm bg-green-600/10 border border-green-600/30 rounded p-3">{success}</div>}
          {error && <div className="text-red-400 text-sm bg-red-600/10 border border-red-600/30 rounded p-3">{error}</div>}
        </div>

        {/* Show Session Info for Private Sessions Requiring Request */}
        {showRequestForm && sessionData && (
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">{sessionData.session.title || 'Private Session'}</h3>
            <div className="space-y-1 text-sm text-slate-400 mb-4">
              <div>Host: {sessionData.session.host_name}</div>
              {sessionData.session.description && <div className="text-slate-300 mt-2">{sessionData.session.description}</div>}
              {sessionData.session.scheduled_start_time && (
                <div>
                  Scheduled: {new Date(sessionData.session.scheduled_start_time).toLocaleString()}
                </div>
              )}
            </div>

            <div className="border-t border-slate-600 pt-4">
              <h4 className="text-white mb-3 font-medium">Request to Join</h4>
              <form onSubmit={handleSubmitJoinRequest} className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-2">Your Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Message (Optional)</label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Add a message to the host..."
                    className="w-full px-3 py-2 bg-transparent border border-primary rounded-md text-white placeholder:text-slate-400 min-h-[80px] resize-y"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !name}
                  className="w-full h-12 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                  {isLoading ? 'Sending Request...' : 'Send Join Request'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Regular Join Form (shown when canAccess is true) */}
        {!showRequestForm && sessionData?.canAccess && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 mb-2">Your Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="text-white"
              />
            </div>

            {sessionData.session.mode === 'two_way' && sessionData.session.language_a && sessionData.session.language_b && (
              <div>
                <label className="block text-slate-300 mb-2">Your Display Language</label>
                <Select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="text-white"
                  required>
                  <option value={sessionData.session.language_a}>{sessionData.session.language_a.toUpperCase()}</option>
                  <option value={sessionData.session.language_b}>{sessionData.session.language_b.toUpperCase()}</option>
                </Select>
                <p className="text-slate-500 text-sm mt-1">
                  All transcripts will be displayed in this language
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !sessionCode || !name}
              className="w-full h-12 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
              {isLoading ? 'Joining...' : 'Join Session'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
