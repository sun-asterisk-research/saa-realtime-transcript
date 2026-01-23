'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { useUser } from '@/lib/hooks/useUser';
import { SessionCard } from '@/components/session-card';
import type { Session } from '@/lib/supabase/types';

interface DashboardData {
  mySessions: Session[];
  invitedSessions: Session[];
  recentPastSessions: Session[];
}

export default function Dashboard() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<DashboardData>({
    mySessions: [],
    invitedSessions: [],
    recentPastSessions: [],
  });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'past'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Fetch sessions
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/sessions');
      if (!res.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data: DashboardData = await res.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (sessionCode: string) => {
    // Find the session to check if user is creator
    const session = [...sessions.mySessions, ...sessions.invitedSessions].find(s => s.code === sessionCode);

    if (!session) {
      router.push(`/join?code=${sessionCode}`);
      return;
    }

    // If user is creator or invited, auto-join them
    const isCreator = session.creator_user_id === user?.id;
    const isInvited = sessions.invitedSessions.some(s => s.code === sessionCode);

    if (isCreator || isInvited) {
      try {
        // Fetch user's full name from profile
        let userName = user?.email?.split('@')[0] || 'User';
        try {
          const profileRes = await fetch(`/api/users/search?q=${encodeURIComponent(user?.email || '')}&limit=1`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.users && profileData.users.length > 0) {
              userName = profileData.users[0].full_name;
            }
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }

        // Auto-join the session
        const response = await fetch(`/api/sessions/${sessionCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userName,
            preferredLanguage: session.mode === 'two_way' ? session.language_a : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Store participant info in sessionStorage
          sessionStorage.setItem(
            `session_${sessionCode}`,
            JSON.stringify({
              participantId: data.participant.id,
              participantName: data.participant.name,
              isHost: data.participant.is_host,
              preferredLanguage: data.participant.preferred_language,
            }),
          );
          router.push(`/session/${sessionCode}`);
        } else {
          // If join fails, redirect to join page
          router.push(`/join?code=${sessionCode}`);
        }
      } catch (error) {
        console.error('Failed to auto-join session:', error);
        router.push(`/join?code=${sessionCode}`);
      }
    } else {
      // For public sessions or sessions without access, go to join page
      router.push(`/join?code=${sessionCode}`);
    }
  };

  // Categorize sessions
  const now = new Date();

  const upcomingSessions = [...sessions.mySessions, ...sessions.invitedSessions].filter((s) => {
    return s.scheduled_start_time && new Date(s.scheduled_start_time) > now && s.status !== 'ended';
  }).sort((a, b) => {
    const dateA = a.scheduled_start_time ? new Date(a.scheduled_start_time).getTime() : 0;
    const dateB = b.scheduled_start_time ? new Date(b.scheduled_start_time).getTime() : 0;
    return dateA - dateB;
  });

  const activeSessions = [...sessions.mySessions, ...sessions.invitedSessions].filter((s) => {
    const isActive = s.status === 'active';
    const notScheduledOrStarted = !s.scheduled_start_time || new Date(s.scheduled_start_time) <= now;
    return isActive && notScheduledOrStarted;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pastSessions = sessions.recentPastSessions;

  // Get role for each session
  const getSessionRole = (session: Session): 'creator' | 'invited' | 'past' => {
    if (session.status === 'ended') return 'past';
    if (session.creator_user_id === user?.id) return 'creator';
    return 'invited';
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-50 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-plum-500 to-plum-700 blob-2 opacity-40 translate-x-1/3 translate-y-1/3" />
        <div className="text-text-muted relative z-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-60 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-1/2 right-0 w-48 h-48 bg-plum-300 blob-2 opacity-40 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-tr from-plum-500 to-plum-700 blob-3 opacity-30 translate-y-1/3" />

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-plum-600 hover:text-plum-700 mb-3 text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-text-primary">My Sessions</h1>
          </div>
          <Link href="/create">
            <Button variant="primary">
              Create New Session
            </Button>
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-white text-plum-600 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            Active ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-plum-600 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'past'
                ? 'bg-white text-plum-600 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            Recent Past ({pastSessions.length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16 text-text-muted">
            <div className="w-8 h-8 border-2 border-plum-200 border-t-plum-500 rounded-full animate-spin mx-auto mb-4" />
            Loading sessions...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeTab === 'active' && activeSessions.length === 0 && (
          <div className="text-center py-16 bg-surface-light rounded-2xl border border-border-light">
            <div className="w-16 h-16 bg-plum-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text-muted mb-4">No active sessions</p>
            <Link href="/create">
              <Button variant="primary">
                Create Your First Session
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && activeTab === 'upcoming' && upcomingSessions.length === 0 && (
          <div className="text-center py-16 bg-surface-light rounded-2xl border border-border-light">
            <div className="w-16 h-16 bg-plum-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text-muted">No upcoming scheduled sessions</p>
          </div>
        )}

        {!isLoading && activeTab === 'past' && pastSessions.length === 0 && (
          <div className="text-center py-16 bg-surface-light rounded-2xl border border-border-light">
            <div className="w-16 h-16 bg-plum-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-muted">No recent past sessions (last 7 days)</p>
          </div>
        )}

        {/* Session Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeTab === 'active' &&
              activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  role={getSessionRole(session)}
                  onJoin={() => handleJoinSession(session.code)}
                />
              ))}

            {activeTab === 'upcoming' &&
              upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  role={getSessionRole(session)}
                  onJoin={() => handleJoinSession(session.code)}
                />
              ))}

            {activeTab === 'past' &&
              pastSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  role="past"
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
