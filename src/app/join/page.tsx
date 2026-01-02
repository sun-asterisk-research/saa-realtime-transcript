'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
interface SessionInfo {
  mode: string;
  language_a: string | null;
  language_b: string | null;
}

export default function JoinSession() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const handleCodeChange = async (code: string) => {
    setSessionCode(code.toUpperCase());
    setError('');
    setSessionInfo(null);
    setPreferredLanguage(''); // Reset preference when code changes

    if (code.length >= 6) {
      try {
        const response = await fetch(`/api/sessions/${code.toUpperCase()}`);
        if (response.ok) {
          const data = await response.json();
          setSessionInfo({
            mode: data.session.mode,
            language_a: data.session.language_a,
            language_b: data.session.language_b,
          });
          // Default to first language for two-way mode
          if (data.session.mode === 'two_way' && data.session.language_a) {
            setPreferredLanguage(data.session.language_a);
          }
        }
      } catch {
        // Ignore errors during lookup
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {sessionInfo?.mode === 'two_way' && sessionInfo.language_a && sessionInfo.language_b && (
            <div>
              <label className="block text-slate-300 mb-2">Your Display Language</label>
              <Select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="text-white"
                required>
                <option value={sessionInfo.language_a}>{sessionInfo.language_a.toUpperCase()}</option>
                <option value={sessionInfo.language_b}>{sessionInfo.language_b.toUpperCase()}</option>
              </Select>
              <p className="text-slate-500 text-sm mt-1">
                All transcripts will be displayed in this language
              </p>
            </div>
          )}

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading || !sessionCode || !name}
            className="w-full h-12 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            {isLoading ? 'Joining...' : 'Join Session'}
          </Button>
        </form>
      </div>
    </div>
  );
}
