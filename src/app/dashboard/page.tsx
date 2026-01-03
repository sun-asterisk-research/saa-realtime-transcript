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

  const handleJoinSession = (code: string) => {
    router.push(`/session/${code}`);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white mb-2 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white">My Sessions</h1>
          </div>
          <Link href="/create">
            <Button className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
              Create New Session
            </Button>
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-500 text-white font-medium'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Active ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-4 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-blue-500 text-white font-medium'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-4 transition-colors ${
              activeTab === 'past'
                ? 'border-b-2 border-blue-500 text-white font-medium'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Recent Past ({pastSessions.length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-slate-400">
            Loading sessions...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeTab === 'active' && activeSessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No active sessions</p>
            <Link href="/create">
              <Button className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                Create Your First Session
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && activeTab === 'upcoming' && upcomingSessions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No upcoming scheduled sessions</p>
          </div>
        )}

        {!isLoading && activeTab === 'past' && pastSessions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No recent past sessions (last 7 days)</p>
          </div>
        )}

        {/* Session Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
