'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { LANGUAGE_PAIRS, type TranslationMode } from '@/lib/supabase/types';

export default function CreateSession() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [mode, setMode] = useState<TranslationMode>('one_way');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [languagePair, setLanguagePair] = useState(0);
  const [preferredLanguage, setPreferredLanguage] = useState(''); // For two-way mode
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current language pair for two-way mode
  const currentPair = LANGUAGE_PAIRS.two_way[languagePair];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const body: Record<string, string> = {
        hostName,
        mode,
      };

      if (mode === 'one_way') {
        body.targetLanguage = targetLanguage;
      } else {
        const pair = LANGUAGE_PAIRS.two_way[languagePair];
        body.languageA = pair.a;
        body.languageB = pair.b;
        body.preferredLanguage = preferredLanguage || pair.a; // Default to first language
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Store participant info in sessionStorage
      sessionStorage.setItem(
        `session_${data.session.code}`,
        JSON.stringify({
          participantId: data.participant.id,
          participantName: data.participant.name,
          isHost: true,
          preferredLanguage: data.participant.preferred_language,
        }),
      );

      router.push(`/session/${data.session.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
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

        <h1 className="text-3xl font-bold text-white mb-8">Create Session</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 mb-2">Your Name</label>
            <Input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Enter your name"
              required
              className="text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2">Translation Mode</label>
            <Select value={mode} onChange={(e) => setMode(e.target.value as TranslationMode)} className="text-white">
              <option value="one_way">One-way Translation</option>
              <option value="two_way">Two-way Translation</option>
            </Select>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'one_way'
                ? 'All speech will be translated to a single target language'
                : 'Speech is translated between two languages automatically'}
            </p>
          </div>

          {mode === 'one_way' ? (
            <div>
              <label className="block text-slate-300 mb-2">Target Language</label>
              <Select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="text-white">
                {LANGUAGE_PAIRS.one_way.map((lang) => (
                  <option key={lang.target} value={lang.target}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-300 mb-2">Language Pair</label>
                <Select
                  value={languagePair}
                  onChange={(e) => {
                    setLanguagePair(Number(e.target.value));
                    setPreferredLanguage(''); // Reset preference when pair changes
                  }}
                  className="text-white">
                  {LANGUAGE_PAIRS.two_way.map((pair, index) => (
                    <option key={index} value={index}>
                      {pair.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Your Display Language</label>
                <Select
                  value={preferredLanguage || currentPair.a}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="text-white">
                  <option value={currentPair.a}>{currentPair.a.toUpperCase()}</option>
                  <option value={currentPair.b}>{currentPair.b.toUpperCase()}</option>
                </Select>
                <p className="text-slate-500 text-sm mt-1">
                  All transcripts will be displayed in this language
                </p>
              </div>
            </>
          )}

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading || !hostName}
            className="w-full h-12 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </form>
      </div>
    </div>
  );
}
