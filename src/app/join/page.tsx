'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { useUser } from '@/lib/hooks/useUser';
import { createClientForBrowser } from '@/lib/supabase/client';
import type { Session } from '@/lib/supabase/types';

interface SessionData {
  session: Session;
  canAccess: boolean;
  userInvitationStatus: 'pending' | 'accepted' | 'declined' | null;
  userJoinRequestStatus: 'pending' | 'approved' | 'rejected' | null;
}

function JoinSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      const currentPath = '/join';
      const codeParam = searchParams.get('code');
      const redirectUrl = codeParam ? `${currentPath}?code=${codeParam}` : currentPath;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [user, isUserLoading, router, searchParams]);

  // Pre-fill session code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !sessionCode) {
      handleCodeChange(codeFromUrl);
    }
  }, [searchParams]);

  // Auto-fill user's name from profile
  useEffect(() => {
    if (user && !name) {
      // Fetch user profile to get full name
      const fetchProfile = async () => {
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(user.email || '')}&limit=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.users && data.users.length > 0) {
              setName(data.users[0].full_name);
            } else {
              // Fallback to email username if profile not found
              setName(user.email?.split('@')[0] || '');
            }
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Fallback to email username
          setName(user.email?.split('@')[0] || '');
        }
      };
      fetchProfile();
    }
  }, [user, name]);

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
              // Show form to allow re-requesting
              setShowRequestForm(true);
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

      // Update sessionData to trigger polling
      if (sessionData) {
        setSessionData({
          ...sessionData,
          userJoinRequestStatus: 'pending',
        });
      }

      setSuccess('You have a pending join request for this session. Please wait for host approval.');
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

  // Auto-join session after approval
  const autoJoinSession = useCallback(async () => {
    if (!sessionCode || !name) return;

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
      setIsLoading(false);
    }
  }, [sessionCode, name, preferredLanguage, router]);

  // Re-check session access (used when join request is approved)
  const recheckSessionAccess = useCallback(async () => {
    if (!sessionCode || sessionCode.length < 6) return;

    try {
      const response = await fetch(`/api/sessions/${sessionCode.toUpperCase()}`);
      if (response.ok) {
        const data: SessionData = await response.json();
        setSessionData(data);

        if (data.canAccess) {
          setSuccess('Your join request has been approved! Joining session...');
          setShowRequestForm(false);
          // Auto-join the session
          autoJoinSession();
        } else if (data.userJoinRequestStatus === 'rejected') {
          setError('Your join request was rejected by the host.');
          setSuccess('');
        }
      }
    } catch (err) {
      console.error('Failed to recheck session access:', err);
    }
  }, [sessionCode, autoJoinSession]);

  // Poll for join request status changes (fallback for realtime)
  useEffect(() => {
    if (!sessionData?.session?.id || !user?.email) return;

    // Only poll if user has a pending join request
    if (sessionData.userJoinRequestStatus !== 'pending') return;

    console.log('Setting up polling for join request status');

    // Poll every 3 seconds
    const pollInterval = setInterval(() => {
      recheckSessionAccess();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [sessionData?.session?.id, sessionData?.userJoinRequestStatus, user?.email, recheckSessionAccess]);

  // Subscribe to join request status changes (may not work due to RLS, polling is fallback)
  useEffect(() => {
    if (!sessionData?.session?.id || !user?.email) return;

    // Only subscribe if user has a pending join request
    if (sessionData.userJoinRequestStatus !== 'pending') return;

    console.log('Setting up join request subscription for session:', sessionData.session.id);

    const supabase = createClientForBrowser();
    const channel = supabase
      .channel(`join-request-status-${sessionData.session.id}-${user.email}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
        },
        (payload) => {
          console.log('Join request UPDATE received:', payload);
          const newRecord = payload.new as { session_id?: string; email?: string; status?: string };

          // Check if this update is for our session and user
          if (newRecord?.session_id === sessionData.session.id &&
              newRecord?.email?.toLowerCase() === user.email?.toLowerCase()) {
            console.log('Join request status changed to:', newRecord.status);
            recheckSessionAccess();
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Join request subscription status:', status, err);
      });

    return () => {
      console.log('Cleaning up join request subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionData?.session?.id, sessionData?.userJoinRequestStatus, user?.email, recheckSessionAccess]);

  // Show loading while checking authentication
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
          <span className="text-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-60 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-bl from-plum-300 to-plum-500 blob-2 opacity-50 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-tr from-plum-200 to-plum-400 blob-3 opacity-40 translate-y-1/3" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-plum-600 transition-colors mb-8 group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-plum-100 p-6 md:p-8 animate-fadeIn">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-plum-500 to-plum-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-plum-500/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Join Session</h1>
              <p className="text-text-secondary mt-2">Enter the session code to join</p>
            </div>

            {/* Session Code Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Session Code</label>
                <Input
                  value={sessionCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  required
                  className="uppercase tracking-widest text-center text-xl font-mono"
                />
              </div>

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-3 animate-fadeIn">
                  {sessionData?.userJoinRequestStatus === 'pending' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{success}</span>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3 animate-fadeIn">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Show Session Info for Private Sessions Requiring Request */}
            {showRequestForm && sessionData && (
              <div className="bg-surface-muted rounded-xl p-5 mb-6 border border-plum-100 animate-fadeIn">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-plum-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-plum-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{sessionData.session.title || 'Private Session'}</h3>
                    <p className="text-sm text-text-secondary">Hosted by {sessionData.session.host_name}</p>
                  </div>
                </div>

                {sessionData.session.description && (
                  <p className="text-text-secondary text-sm mb-3 pl-16">{sessionData.session.description}</p>
                )}

                {sessionData.session.scheduled_start_time && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary pl-16">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(sessionData.session.scheduled_start_time).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })}
                    </span>
                  </div>
                )}

                <div className="border-t border-plum-100 mt-4 pt-4">
                  {sessionData.userJoinRequestStatus === 'rejected' && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Your previous request was rejected. You can send a new request with additional details.</span>
                    </div>
                  )}

                  <h4 className="font-medium text-text-primary mb-4">
                    {sessionData.userJoinRequestStatus === 'rejected' ? 'Request Again' : 'Request to Join'}
                  </h4>

                  <form onSubmit={handleSubmitJoinRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Your Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Message (Optional)</label>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Add a message to the host..."
                        className="w-full px-4 py-3 bg-white border-2 border-plum-200 rounded-xl text-text-primary placeholder:text-text-muted min-h-[80px] resize-y focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all"
                        rows={3}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !name}
                      variant="primary"
                      className="w-full h-12"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending Request...
                        </span>
                      ) : sessionData.userJoinRequestStatus === 'rejected' ? (
                        'Send New Request'
                      ) : (
                        'Send Join Request'
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Regular Join Form (shown when canAccess is true) */}
            {!showRequestForm && sessionData?.canAccess && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                {/* Session Info Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800">Session Found</p>
                    <p className="text-sm text-emerald-600">{sessionData.session.title || 'Ready to join'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Your Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {sessionData.session.mode === 'two_way' && sessionData.session.language_a && sessionData.session.language_b && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Your Display Language</label>
                    <Select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      required
                    >
                      <option value={sessionData.session.language_a}>{sessionData.session.language_a.toUpperCase()}</option>
                      <option value={sessionData.session.language_b}>{sessionData.session.language_b.toUpperCase()}</option>
                    </Select>
                    <p className="text-text-muted text-sm mt-2">
                      All transcripts will be displayed in this language
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !sessionCode || !name}
                  variant="primary"
                  className="w-full h-12"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    'Join Session'
                  )}
                </Button>
              </form>
            )}

            {/* Empty state when no session found yet */}
            {!showRequestForm && !sessionData?.canAccess && sessionCode.length < 6 && (
              <div className="text-center py-8 text-text-muted">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <p>Enter a 6-character session code above</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-text-muted mt-6">
            Don&apos;t have a code?{' '}
            <Link href="/create" className="text-plum-600 hover:text-plum-700 font-medium transition-colors">
              Create a new session
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JoinSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-500 rounded-full animate-spin" />
          <span className="text-text-secondary">Loading...</span>
        </div>
      </div>
    }>
      <JoinSessionContent />
    </Suspense>
  );
}
