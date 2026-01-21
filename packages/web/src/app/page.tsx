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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      {/* Auth bar */}
      <div className="absolute top-4 right-4">
        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading...</div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-sm">{user.email}</p>
              <p className="text-slate-500 text-xs">{user.user_metadata?.full_name || 'User'}</p>
            </div>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            <Button onClick={handleSignOut} className="text-sm">
              Sign Out
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button className="text-sm">Sign In</Button>
          </Link>
        )}
      </div>

      {/* Main content */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Session Translation</h1>
        <p className="text-slate-400 text-lg max-w-md">
          Real-time speech translation for multi-participant meetings
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleCreateClick}
          className="min-w-[200px] h-12 text-base bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
        >
          {isAuthenticated ? 'Create Session' : 'Sign In to Create Session'}
        </Button>
        <Link href="/join">
          <Button className="min-w-[200px] h-12 text-base">Join Session</Button>
        </Link>
      </div>

      <div className="mt-8 text-slate-500 text-sm text-center">
        <p>Create a session as host or join an existing one with a code</p>
        {isAuthenticated && (
          <div className="mt-4 space-y-2">
            <p>
              <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 font-medium">
                View My Sessions →
              </Link>
            </p>
            <p>
              <Link href="/contexts" className="text-blue-400 hover:text-blue-300">
                Manage Context Sets →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
