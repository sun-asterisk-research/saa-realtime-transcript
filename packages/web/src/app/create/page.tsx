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
  const [mode, setMode] = useState<TranslationMode>('one_way');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [languagePair, setLanguagePair] = useState(0);
  const [preferredLanguage, setPreferredLanguage] = useState(''); // For two-way mode
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
      const body: Record<string, any> = {
        hostName,
        title,
        mode,
        isPublic,
        invitedEmails,
        enableSpeakerDiarization: true, // Always enabled
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-plum-400 to-plum-600 blob opacity-60 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-plum-300 blob-2 opacity-40 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-tr from-plum-500 to-plum-700 blob-3 opacity-30 translate-y-1/3" />

      <div className="relative z-10 min-h-screen flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-plum-600 hover:text-plum-700 mb-6 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Create Session</h1>
            <p className="text-text-muted">Set up a new translation session for your meeting</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-plum-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Title */}
              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Session Title <span className="text-plum-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Internal meeting with SONY client"
                  required
                />
              </div>

              {/* Translation Mode */}
              <div>
                <label className="block text-text-primary font-medium mb-2">Translation Mode</label>
                <Select value={mode} onChange={(e) => setMode(e.target.value as TranslationMode)}>
                  <option value="one_way">One-way Translation</option>
                  <option value="two_way">Two-way Translation</option>
                </Select>
                <p className="text-text-muted text-sm mt-2">
                  {mode === 'one_way'
                    ? 'All speech will be translated to a single target language'
                    : 'Speech is translated between two languages automatically'}
                </p>
              </div>

              {mode === 'one_way' ? (
                <div>
                  <label className="block text-text-primary font-medium mb-2">Target Language</label>
                  <Select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
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
                    <label className="block text-text-primary font-medium mb-2">Language Pair</label>
                    <Select
                      value={languagePair}
                      onChange={(e) => {
                        setLanguagePair(Number(e.target.value));
                        setPreferredLanguage(''); // Reset preference when pair changes
                      }}>
                      {LANGUAGE_PAIRS.two_way.map((pair, index) => (
                        <option key={index} value={index}>
                          {pair.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Your Display Language</label>
                    <Select
                      value={preferredLanguage || currentPair.a}
                      onChange={(e) => setPreferredLanguage(e.target.value)}>
                      <option value={currentPair.a}>{currentPair.a.toUpperCase()}</option>
                      <option value={currentPair.b}>{currentPair.b.toUpperCase()}</option>
                    </Select>
                    <p className="text-text-muted text-sm mt-2">All transcripts will be displayed in this language</p>
                  </div>
                </>
              )}

              {/* Privacy Settings */}
              <div>
                <label className="block text-text-primary font-medium mb-3">Privacy</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-plum-50 transition-colors">
                    <div className="relative">
                      <input
                        type="radio"
                        checked={isPublic}
                        onChange={() => setIsPublic(true)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-plum-300 rounded-full peer-checked:border-plum-500 transition-colors flex items-center justify-center">
                        {isPublic && <div className="w-2.5 h-2.5 bg-plum-500 rounded-full" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-primary font-medium">Public</span>
                      <p className="text-text-muted text-sm">Anyone with the code can join</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-plum-50 transition-colors">
                    <div className="relative">
                      <input
                        type="radio"
                        checked={!isPublic}
                        onChange={() => setIsPublic(false)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-plum-300 rounded-full peer-checked:border-plum-500 transition-colors flex items-center justify-center">
                        {!isPublic && <div className="w-2.5 h-2.5 bg-plum-500 rounded-full" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-primary font-medium">Private</span>
                      <p className="text-text-muted text-sm">Only invited users (allows join requests)</p>
                    </div>
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
                  <label className="block text-text-primary font-medium">Context Sets (Optional)</label>
                  <Button type="button" onClick={handleOpenModal} variant="secondary" size="sm">
                    {selectedContextIds.length > 0 ? 'Change' : 'Select'}
                  </Button>
                </div>

                {selectedContextSets.length > 0 ? (
                  <div className="space-y-2 bg-plum-50 rounded-xl p-3 border border-plum-100">
                    {selectedContextSets.map((contextSet) => {
                      const termCount = contextSet.term_count || contextSet.terms?.length || 0;
                      const generalCount = contextSet.general_count || contextSet.general?.length || 0;

                      return (
                        <div
                          key={contextSet.id}
                          className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="text-text-primary text-sm font-medium truncate">{contextSet.name}</div>
                            <div className="text-text-muted text-xs">
                              {termCount > 0 && <span>{termCount} terms</span>}
                              {generalCount > 0 && <span className="ml-2">{generalCount} metadata</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveContext(e, contextSet.id)}
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full text-plum-400 hover:text-plum-600 hover:bg-plum-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm">
                    Add domain-specific terms to improve transcription accuracy.
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !hostName || !title}
                variant="primary"
                size="lg"
                className="w-full">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Session'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Context Selector Modal */}
      <ContextSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectContexts}
        excludeIds={[]}
      />
    </div>
  );
}
