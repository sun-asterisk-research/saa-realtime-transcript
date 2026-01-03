'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { ContextSelectorModal } from '@/components/context/ContextSelectorModal';
import { EmailChipInput } from '@/components/email-chip-input';
import { useUser } from '@/lib/hooks/useUser';
import { useContextSets } from '@/lib/hooks/useContextSets';
import { LANGUAGE_PAIRS, type TranslationMode } from '@/lib/supabase/types';

export default function CreateSession() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [hostName, setHostName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<TranslationMode>('one_way');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [languagePair, setLanguagePair] = useState(0);
  const [preferredLanguage, setPreferredLanguage] = useState(''); // For two-way mode
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all context sets to show selected ones
  const { contextSets } = useContextSets(user?.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/create');
    }
  }, [user, isUserLoading, router]);

  // Auto-fill name from Google account when user is logged in
  useEffect(() => {
    if (user && !hostName) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setHostName(name);
    }
  }, [user, hostName]);

  // Get current language pair for two-way mode
  const currentPair = LANGUAGE_PAIRS.two_way[languagePair];

  // Get selected context sets for display
  const selectedContextSets = contextSets.filter((cs) => selectedContextIds.includes(cs.id));

  const handleOpenModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setIsModalOpen(true);
  };

  const handleSelectContexts = (ids: string[]) => {
    setSelectedContextIds(ids);
    setIsModalOpen(false);
  };

  const handleRemoveContext = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setSelectedContextIds((prev) => prev.filter((i) => i !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate scheduled start time if provided
      if (scheduledStartTime) {
        const scheduledDate = new Date(scheduledStartTime);
        if (scheduledDate <= new Date()) {
          setError('Scheduled start time must be in the future');
          setIsLoading(false);
          return;
        }
      }

      const body: Record<string, any> = {
        hostName,
        title,
        description: description || undefined,
        mode,
        scheduledStartTime: scheduledStartTime || undefined,
        isPublic,
        invitedEmails,
      };

      if (mode === 'one_way') {
        body.targetLanguage = targetLanguage;
      } else {
        const pair = LANGUAGE_PAIRS.two_way[languagePair];
        body.languageA = pair.a;
        body.languageB = pair.b;
        body.preferredLanguage = preferredLanguage || pair.a; // Default to first language
      }

      // Add context sets if any selected
      if (selectedContextIds.length > 0) {
        body.contextSetIds = selectedContextIds;
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
          {/* Session Title */}
          <div>
            <label className="block text-slate-300 mb-2">
              Session Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Internal meeting with SONY client"
              required
              className="text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this session..."
              className="w-full px-3 py-2 bg-transparent border border-primary rounded-md text-white placeholder:text-slate-400 min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Your Name */}
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

          {/* Translation Mode */}
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

          {/* Scheduled Start Time */}
          <div>
            <label className="block text-slate-300 mb-2">Schedule for Later (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledStartTime}
              onChange={(e) => setScheduledStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-primary rounded-md text-white"
            />
            <p className="text-slate-500 text-sm mt-1">
              Leave empty to start immediately. Invited users can join before scheduled time.
            </p>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-slate-300 mb-2">Privacy</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="text-blue-600"
                />
                <span>Public - Anyone with code can join</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="text-blue-600"
                />
                <span>Private - Only invited users (allows join requests)</span>
              </label>
            </div>
          </div>

          {/* Invite Participants */}
          {!isPublic && (
            <EmailChipInput
              value={invitedEmails}
              onChange={setInvitedEmails}
              label="Invite Participants (Optional)"
              placeholder="Search by name or email..."
            />
          )}

          {/* Context Sets Selection (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-300">Context Sets (Optional)</label>
              <Button
                type="button"
                onClick={handleOpenModal}
                className="text-xs h-7 px-2 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
                {selectedContextIds.length > 0 ? 'Change' : 'Select'}
              </Button>
            </div>

            {selectedContextSets.length > 0 ? (
              <div className="space-y-2 bg-slate-700/30 rounded-md p-3">
                {selectedContextSets.map((contextSet) => {
                  const termCount = contextSet.term_count || contextSet.terms?.length || 0;
                  const generalCount = contextSet.general_count || contextSet.general?.length || 0;

                  return (
                    <div key={contextSet.id} className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{contextSet.name}</div>
                        <div className="text-slate-500 text-xs">
                          {termCount > 0 && <span>{termCount} terms</span>}
                          {generalCount > 0 && <span className="ml-2">{generalCount} metadata</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveContext(e, contextSet.id)}
                        className="ml-2 text-red-400 hover:text-red-300">
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                No context sets selected. Add domain-specific terms to improve transcription accuracy.
              </p>
            )}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading || !hostName || !title}
            className="w-full h-12 bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </form>

        {/* Context Selector Modal */}
        <ContextSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectContexts}
          excludeIds={[]}
        />
      </div>
    </div>
  );
}
