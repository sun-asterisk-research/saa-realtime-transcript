'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { useUser } from '@/lib/hooks/useUser';

export default function Home() {
  const { user, isAuthenticated, signOut, isLoading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/create');
    } else {
      router.push('/create');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-plum-500 to-plum-700 blob opacity-90 -translate-x-1/3 -translate-y-1/4 animate-float pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-plum-400 to-plum-600 blob-2 opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-plum-600 to-plum-800 blob-3 translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-plum-400 blob opacity-60 pointer-events-none" />

      {/* Auth bar */}
      <div className="absolute top-6 right-6 z-50">
        {isLoading ? (
          <div className="text-text-muted text-sm">Loading...</div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-4 glass px-4 py-2 rounded-full shadow-md">
            <div className="text-right">
              <p className="text-text-primary text-sm font-medium">{user.email}</p>
              <p className="text-text-muted text-xs">{user.user_metadata?.full_name || 'User'}</p>
            </div>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full ring-2 ring-plum-200"
              />
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="h-8 px-3 text-xs font-medium text-plum-600 bg-transparent rounded-md cursor-pointer hover:bg-plum-50 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-white bg-gradient-to-r from-plum-500 to-plum-700 rounded-md shadow-lg cursor-pointer hover:from-plum-600 hover:to-plum-800 transition-all duration-200"
          >
            Sign In
          </a>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="text-center mb-12 animate-slideUp">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-text-primary">Session</span>{' '}
            <span className="text-gradient">Translation</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Real-time speech translation for multi-participant meetings with professional accuracy
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <Button
            onClick={handleCreateClick}
            variant="primary"
            size="lg"
            className="min-w-[220px] shadow-xl">
            {isAuthenticated ? 'Create Session' : 'Sign In to Create'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[220px]"
            onClick={() => router.push('/join')}
          >
            Join Session
          </Button>
        </div>

        <div
          className="mt-12 text-center animate-slideUp"
          style={{ animationDelay: '0.2s' }}>
          <p className="text-text-muted text-sm mb-4">
            Create a session as host or join an existing one with a code
          </p>
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-plum-600 hover:text-plum-700 font-medium transition-colors">
                <span>View My Sessions</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/contexts"
                className="inline-flex items-center gap-2 text-plum-600 hover:text-plum-700 font-medium transition-colors">
                <span>Manage Context Sets</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-plum-50 to-transparent pointer-events-none" />
    </div>
  );
}
