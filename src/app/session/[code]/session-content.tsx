'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { CountdownTimer } from '@/components/countdown-timer';
import { BilingualToggle } from '@/components/BilingualToggle';
import { FloatingBilingualButton } from '@/components/FloatingBilingualButton';
import { BilingualTranscriptDisplay } from '@/components/BilingualTranscriptDisplay';
import { BilingualTwoColumnLayout } from '@/components/BilingualTwoColumnLayout';
import { useBilingualMode } from '@/contexts/BilingualModeContext';
import { useSession } from '@/lib/hooks/useSession';
import { useParticipants } from '@/lib/hooks/useParticipants';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { useSessionTranscribe } from '@/lib/hooks/useSessionTranscribe';
import { useSessionContexts } from '@/lib/hooks/useSessionContexts';
import { ContextManagementPanel } from '@/components/context/ContextManagementPanel';
import { JoinRequestNotifications } from '@/components/join-request-notifications';
import { InviteModal } from '@/components/invite-modal';
import type { TranslationConfig, Token } from '@soniox/speech-to-text-web';

interface ParticipantInfo {
  participantId: string;
  participantName: string;
  isHost: boolean;
  preferredLanguage?: string;
}

// Generate consistent color for each participant
function getParticipantColor(participantName: string): string {
  const colors = [
    'text-plum-500',
    'text-emerald-500',
    'text-violet-500',
    'text-rose-500',
    'text-cyan-500',
    'text-amber-500',
    'text-teal-500',
    'text-indigo-500',
  ];

  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < participantName.length; i++) {
    hash = participantName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Generate color for speaker diarization (supports up to 15 speakers)
function getSpeakerColor(speakerId: string): string {
  const colors = [
    'text-plum-500',     // Speaker 1
    'text-emerald-500',  // Speaker 2
    'text-violet-500',   // Speaker 3
    'text-rose-500',     // Speaker 4
    'text-cyan-500',     // Speaker 5
    'text-amber-500',    // Speaker 6
    'text-teal-500',     // Speaker 7
    'text-indigo-500',   // Speaker 8
    'text-yellow-500',   // Speaker 9
    'text-red-500',      // Speaker 10
    'text-lime-500',     // Speaker 11
    'text-pink-500',     // Speaker 12
    'text-orange-500',   // Speaker 13
    'text-green-500',    // Speaker 14
    'text-fuchsia-500',  // Speaker 15
  ];
  const index = parseInt(speakerId, 10) - 1; // Speaker IDs are 1-based
  return colors[Math.abs(index) % colors.length];
}

// Helper function to get display text based on user's language preference
// Returns { text, isTranslated } to know if we're showing translated version
function getDisplayText(
  transcript: {
    original_text: string;
    translated_text?: string | null;
    source_language?: string | null;
    target_language?: string | null;
  },
  preferredLanguage: string | undefined,
  sessionMode: string
): { text: string; isTranslated: boolean } {
  // For one-way mode, always show translated if available
  if (sessionMode === 'one_way') {
    const hasTranslation = !!transcript.translated_text;
    return {
      text: transcript.translated_text || transcript.original_text,
      isTranslated: hasTranslation,
    };
  }

  // For two-way mode, show based on user's preference
  if (!preferredLanguage) {
    const hasTranslation = !!transcript.translated_text;
    return {
      text: transcript.translated_text || transcript.original_text,
      isTranslated: hasTranslation,
    };
  }

  // If source matches preference, show original
  if (transcript.source_language === preferredLanguage) {
    return {
      text: transcript.original_text,
      isTranslated: false,
    };
  }

  // If target matches preference, show translated
  if (transcript.target_language === preferredLanguage) {
    return {
      text: transcript.translated_text || transcript.original_text,
      isTranslated: !!transcript.translated_text,
    };
  }

  // Fallback: show translated if available
  const hasTranslation = !!transcript.translated_text;
  return {
    text: transcript.translated_text || transcript.original_text,
    isTranslated: hasTranslation,
  };
}

// Helper function to convert database transcripts to tokens for bilingual display
function convertTranscriptToTokens(transcript: {
  original_text: string;
  translated_text?: string | null;
  source_language?: string | null;
  target_language?: string | null;
  speaker_id?: string | null;
}): Token[] {
  const tokens: Token[] = [];

  if (transcript.original_text) {
    tokens.push({
      text: transcript.original_text,
      confidence: 1.0,
      is_final: true,
      translation_status: 'original',
      language: transcript.source_language || undefined,
      speaker: transcript.speaker_id || undefined,
    });
  }

  if (transcript.translated_text) {
    tokens.push({
      text: transcript.translated_text,
      confidence: 1.0,
      is_final: true,
      translation_status: 'translation',
      language: transcript.target_language || undefined,
    });
  }

  return tokens;
}

// Helper to convert streaming transcript to tokens
function convertStreamingToTokens(data: {
  text: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speakerId?: string;
}, isFinal: boolean = false): Token[] {
  const tokens: Token[] = [];

  if (data.text) {
    tokens.push({
      text: data.text,
      confidence: 1.0,
      is_final: isFinal,
      translation_status: 'original',
      language: data.sourceLanguage,
      speaker: data.speakerId,
    });
  }

  if (data.translatedText) {
    tokens.push({
      text: data.translatedText,
      confidence: 1.0,
      is_final: isFinal,
      translation_status: 'translation',
      language: data.targetLanguage,
    });
  }

  return tokens;
}

interface SessionContentProps {
  code: string;
}

export default function SessionContent({ code }: SessionContentProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<string>(''); // Current display preference
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { isBilingualMode } = useBilingualMode();

  const { session, isLoading: sessionLoading, error: sessionError, endSession } = useSession(code);
  const { participants, leaveSession } = useParticipants(session?.id, code);
  const { transcripts, streamingTranscripts, broadcastStreaming, addTranscript } = useTranscripts(session?.id, code);
  const {
    contextSets,
    mergedContext,
    isLoading: contextsLoading,
    addContextSets,
    removeContextSet,
  } = useSessionContexts(session?.id, code);

  // Get translation config based on session settings
  const translationConfig: TranslationConfig | undefined = session
    ? session.mode === 'one_way'
      ? { type: 'one_way', target_language: session.target_language! }
      : { type: 'two_way', language_a: session.language_a!, language_b: session.language_b! }
    : undefined;

  const handleBroadcast = useCallback(
    (data: {
      participantId: string;
      participantName: string;
      text: string;
      translatedText?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      speakerId?: string;
      timestamp: number;
    }) => {
      broadcastStreaming(data);
    },
    [broadcastStreaming],
  );

  const handleFinalTranscript = useCallback(
    async (data: { originalText: string; translatedText?: string; sourceLanguage?: string; targetLanguage?: string; speakerId?: string }) => {
      if (!participantInfo) return;

      try {
        const response = await fetch(`/api/sessions/${code}/transcripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participantInfo.participantId,
            participantName: participantInfo.participantName,
            originalText: data.originalText,
            translatedText: data.translatedText,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            speakerId: data.speakerId,
            isFinal: true,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Manually add transcript to state (don't wait for real-time event)
          addTranscript(result.transcript);
        }
      } catch (err) {
        console.error('Failed to save transcript:', err);
      }
    },
    [code, participantInfo, addTranscript],
  );

  const { start, stop, state, streamingOriginal, streamingTranslated, currentSourceLanguage, currentTargetLanguage, currentSpeakerId } = useSessionTranscribe({
    sessionCode: code,
    participantId: participantInfo?.participantId || '',
    participantName: participantInfo?.participantName || '',
    translationConfig,
    context: mergedContext,
    enableSpeakerDiarization: session?.enable_speaker_diarization || false,
    onBroadcast: handleBroadcast,
    onFinalTranscript: handleFinalTranscript,
  });

  // Compute local streaming display text based on user's preference
  const currentStreamingData = getDisplayText(
    {
      original_text: streamingOriginal,
      translated_text: streamingTranslated || undefined,
      source_language: currentSourceLanguage,
      target_language: currentTargetLanguage,
    },
    displayLanguage,
    session?.mode || 'one_way'
  );
  const currentStreamingText = currentStreamingData.text;
  const isCurrentStreamingTranslated = currentStreamingData.isTranslated;

  // Prepare bilingual layout items
  const bilingualItems = useMemo(() => {
    const items: Array<{
      id: string;
      participantName: string;
      originalText: string;
      translatedText?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      speaker?: string;
      isStreaming?: boolean;
    }> = [];

    // Add final transcripts
    transcripts.forEach((t) => {
      items.push({
        id: t.id,
        participantName: t.participant_name,
        originalText: t.original_text,
        translatedText: t.translated_text || undefined,
        sourceLanguage: t.source_language || undefined,
        targetLanguage: t.target_language || undefined,
        speaker: t.speaker_id || undefined,
        isStreaming: false,
      });
    });

    // Add streaming transcripts from other participants
    Array.from(streamingTranscripts.entries())
      .filter(([id]) => id !== participantInfo?.participantId)
      .forEach(([id, data]) => {
        items.push({
          id: `streaming-${id}`,
          participantName: data.participantName,
          originalText: data.text,
          translatedText: data.translatedText,
          sourceLanguage: data.sourceLanguage,
          targetLanguage: data.targetLanguage,
          speaker: data.speakerId,
          isStreaming: true,
        });
      });

    // Add local streaming
    if (currentStreamingText && isRecording && participantInfo) {
      items.push({
        id: 'local-streaming',
        participantName: participantInfo.participantName,
        originalText: streamingOriginal,
        translatedText: streamingTranslated || undefined,
        sourceLanguage: currentSourceLanguage,
        targetLanguage: currentTargetLanguage,
        speaker: currentSpeakerId || undefined,
        isStreaming: true,
      });
    }

    return items;
  }, [
    transcripts,
    streamingTranscripts,
    participantInfo,
    currentStreamingText,
    isRecording,
    streamingOriginal,
    streamingTranslated,
    currentSourceLanguage,
    currentTargetLanguage,
    currentSpeakerId,
  ]);

  // Load participant info from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`session_${code}`);
    if (stored) {
      const info = JSON.parse(stored);
      setParticipantInfo(info);
      setDisplayLanguage(info.preferredLanguage || '');
    } else {
      router.push(`/join?code=${code}`);
    }
  }, [code, router]);

  // Enumerate audio devices
  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(mics);
        if (mics.length > 0 && !selectedMic) {
          setSelectedMic(mics[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to get audio devices:', err);
      }
    }
    getDevices();
  }, [selectedMic]);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcripts, streamingTranscripts, currentStreamingText]);

  // Initialize and update isScheduled state
  useEffect(() => {
    if (!session?.scheduled_start_time) {
      setIsScheduled(false);
      return;
    }

    const checkScheduled = () => {
      const now = new Date();
      const scheduledTime = new Date(session.scheduled_start_time!);
      setIsScheduled(scheduledTime > now);
    };

    checkScheduled();
  }, [session?.scheduled_start_time]);

  const handleStartStop = useCallback(() => {
    if (isRecording) {
      stop();
      setIsRecording(false);
    } else {
      start();
      setIsRecording(true);
    }
  }, [isRecording, start, stop]);

  const handleLeave = useCallback(async () => {
    if (participantInfo) {
      await leaveSession(participantInfo.participantId);
      sessionStorage.removeItem(`session_${code}`);
      router.push('/');
    }
  }, [participantInfo, leaveSession, code, router]);

  const handleEndSession = useCallback(async () => {
    if (confirm('Are you sure you want to end this session for all participants?')) {
      await endSession();
    }
  }, [endSession]);

  // Handle display language change
  const handleDisplayLanguageChange = useCallback(
    async (newLanguage: string) => {
      setDisplayLanguage(newLanguage);

      // Update sessionStorage
      if (participantInfo) {
        const updatedInfo = { ...participantInfo, preferredLanguage: newLanguage };
        sessionStorage.setItem(`session_${code}`, JSON.stringify(updatedInfo));
        setParticipantInfo(updatedInfo);
      }

      // Update in database (fire and forget)
      if (participantInfo?.participantId) {
        try {
          await fetch(`/api/sessions/${code}/participants/${participantInfo.participantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferredLanguage: newLanguage }),
          });
        } catch (err) {
          console.error('Failed to update display language:', err);
        }
      }
    },
    [code, participantInfo],
  );

  // Handle context change - restart transcription if needed
  const handleContextChange = useCallback(async () => {
    const wasRecording = isRecording;

    if (wasRecording) {
      // Stop transcription
      stop();
      setIsRecording(false);

      // Show confirmation to restart
      const shouldRestart = window.confirm(
        'Context has been updated. Transcription needs to restart with the new context.\n\nRestart transcription now?',
      );

      if (shouldRestart) {
        // Small delay to ensure stop is complete
        setTimeout(() => {
          start();
          setIsRecording(true);
        }, 500);
      }
    }
    // If not recording, just update the context (will be used on next start)
  }, [isRecording, start, stop]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-800 to-plum-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white/80">Loading session...</div>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-plum-800 to-plum-900 p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-white/80 mb-6">Session not found</div>
          <Link href="/">
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-plum-800 to-plum-900 p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-plum-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-plum-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white/80 mb-6">This session has ended</div>
          <div className="space-y-3">
            <Link href={`/history/${code}`}>
              <Button variant="primary" className="w-full">View History</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-white/70 hover:text-white">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Countdown Banner */}
      {isScheduled && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-center flex-shrink-0">
          <div className="text-amber-800 flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Session scheduled to start in</span>
            <CountdownTimer targetTime={session.scheduled_start_time!} onComplete={() => setIsScheduled(false)} />
          </div>
          <p className="text-amber-600 text-sm mt-1">
            Recording will be enabled when the session starts at the scheduled time.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-surface-light p-5 flex flex-col border-r border-plum-100 flex-shrink-0">
          {/* Session Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-text-primary truncate flex-1">
                {session.title || `Session: ${code}`}
              </h2>
              <Link
                href={`/session/${code}/display`}
                target="_blank"
                className="text-sm text-plum-600 hover:text-plum-700 font-medium flex-shrink-0 ml-2">
                Display View
              </Link>
            </div>
            {session.description && (
              <p className="text-sm text-text-muted mb-2">{session.description}</p>
            )}
            <div className="text-sm text-text-secondary bg-white rounded-lg px-3 py-2 border border-plum-100">
              Mode: {session.mode === 'one_way' ? 'One-way' : 'Two-way'}
              {session.mode === 'one_way' && ` → ${session.target_language?.toUpperCase()}`}
              {session.mode === 'two_way' && ` (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
            </div>
          </div>

          {/* Display Language Selector - only for two-way mode, disabled in bilingual mode */}
          {session.mode === 'two_way' && session.language_a && session.language_b && !isBilingualMode && (
            <div className="mb-5">
              <label className="block text-text-secondary mb-2 text-sm font-medium">Display Language</label>
              <Select
                value={displayLanguage}
                onChange={(e) => handleDisplayLanguageChange(e.target.value)}
                className="text-sm">
                <option value={session.language_a}>{session.language_a.toUpperCase()}</option>
                <option value={session.language_b}>{session.language_b.toUpperCase()}</option>
              </Select>
              <p className="text-text-light text-xs mt-1.5">All transcripts shown in this language</p>
            </div>
          )}

          {/* Bilingual Mode Toggle */}
          <div className="mb-5">
            <BilingualToggle />
            {isBilingualMode && (
              <p className="text-text-light text-xs mt-1.5">Showing both original and translated text</p>
            )}
          </div>

          {/* Microphone Selection */}
          <div className="mb-5">
            <label className="block text-text-secondary mb-2 text-sm font-medium">Microphone</label>
            <Select
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              className="text-sm"
              disabled={isRecording || isScheduled}>
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </Select>
          </div>

          {/* Context Management */}
          <ContextManagementPanel
            sessionCode={code}
            sessionId={session.id}
            contextSets={contextSets}
            mergedContext={mergedContext}
            isLoading={contextsLoading}
            disabled={isRecording || isScheduled}
            isHost={participantInfo?.isHost || false}
            onContextChange={handleContextChange}
            onAddContextSets={addContextSets}
            onRemoveContextSet={removeContextSet}
          />

          {/* Recording Status */}
          <div className="mb-5 bg-white rounded-lg p-3 border border-plum-100">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-plum-500 animate-pulse-glow' : 'bg-gray-300'}`} />
              <span className="text-sm text-text-primary font-medium">{isRecording ? 'Recording...' : 'Ready'}</span>
            </div>
            <div className="text-xs text-text-light mt-1">State: {state}</div>
          </div>

          {/* Start/Stop Button */}
          <Button
            onClick={handleStartStop}
            disabled={isScheduled}
            variant={isRecording ? 'danger' : 'success'}
            size="lg"
            className="w-full mb-5 h-14">
            {isRecording ? 'Stop Recording' : isScheduled ? 'Waiting for scheduled time...' : 'Start Recording'}
          </Button>

          {/* Join Request Notifications - only for host */}
          {participantInfo?.isHost && (
            <JoinRequestNotifications sessionId={session.id} sessionCode={code} />
          )}

          {/* Participants */}
          <div className="flex-1 overflow-auto mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-secondary">
                Participants ({participants.filter((p) => !p.left_at).length})
              </h3>
              {participantInfo?.isHost && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="text-xs text-plum-600 hover:text-plum-700 font-medium transition-colors">
                  + Invite
                </button>
              )}
            </div>
            <div className="space-y-2">
              {participants.map((p) => {
                const isOnline = !p.left_at;
                return (
                  <div
                    key={p.id}
                    className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg ${isOnline ? 'bg-white' : 'bg-surface-muted'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={isOnline ? 'text-text-primary' : 'text-text-light'}>{p.name}</span>
                    {p.is_host && <span className="text-xs text-plum-600 font-medium">(Host)</span>}
                    {p.id === participantInfo?.participantId && <span className="text-xs text-text-light">(You)</span>}
                    {!isOnline && <span className="text-xs text-text-light">(Left)</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {participantInfo?.isHost && (
              <Button onClick={handleEndSession} variant="danger" className="w-full">
                End Session
              </Button>
            )}
            <Button onClick={handleLeave} variant="outline" className="w-full">
              Leave Session
            </Button>
          </div>
        </div>

        {/* Right Panel - Transcripts */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-plum-800 to-plum-900 min-h-0">
          {/* Show empty state OR scroll container, not both */}
          {transcripts.length === 0 && streamingTranscripts.size === 0 && !currentStreamingText ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="text-white/60 text-lg">Start recording to see transcripts...</div>
              </div>
            </div>
          ) : isBilingualMode ? (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar-dark">
              <BilingualTwoColumnLayout
                items={bilingualItems}
                mode={session?.mode || 'one_way'}
                targetLanguage={session?.target_language || undefined}
                languageA={session?.language_a || undefined}
                languageB={session?.language_b || undefined}
              />
              <div ref={transcriptEndRef} />
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar-dark">
              <div className="space-y-4">
                {/* Final transcripts from database */}
                {transcripts.map((t) => {
                  const enableDiarization = session?.enable_speaker_diarization && t.speaker_id;
                  const textColor = enableDiarization
                    ? getSpeakerColor(t.speaker_id!)
                    : getParticipantColor(t.participant_name);
                  const displayData = getDisplayText(t, displayLanguage, session?.mode || 'one_way');
                  return (
                    <div key={t.id} className="text-white animate-fadeIn">
                      <span className={`${textColor} font-semibold`}>
                        {t.participant_name}
                        {enableDiarization && ` (Speaker ${t.speaker_id})`}
                        {displayData.isTranslated && ' (translated)'}:{' '}
                      </span>
                      <span className="text-xl leading-relaxed">{displayData.text}</span>
                    </div>
                  );
                })}

                {/* Streaming transcripts from other participants (via Supabase) */}
                {Array.from(streamingTranscripts.entries())
                  .filter(([id]) => id !== participantInfo?.participantId) // Don't show own streaming twice
                  .map(([id, data]) => {
                    const enableDiarization = session?.enable_speaker_diarization && data.speakerId;
                    const textColor = enableDiarization
                      ? getSpeakerColor(data.speakerId!)
                      : getParticipantColor(data.participantName);
                    const displayData = getDisplayText(
                      {
                        original_text: data.text,
                        translated_text: data.translatedText,
                        source_language: data.sourceLanguage,
                        target_language: data.targetLanguage,
                      },
                      displayLanguage,
                      session?.mode || 'one_way'
                    );
                    return (
                      <div key={id} className="text-plum-200 transition-opacity duration-150">
                        <span className={`${textColor} font-semibold`}>
                          {data.participantName}
                          {enableDiarization && ` (Speaker ${data.speakerId})`}
                          {displayData.isTranslated && ' (translated)'}:{' '}
                        </span>
                        <span className="text-xl leading-relaxed">{displayData.text}</span>
                        <span className="inline-block w-2 h-5 bg-plum-400 ml-1.5 animate-blink rounded-sm" />
                      </div>
                    );
                  })}

                {/* LOCAL streaming text - shows immediately while speaking */}
                {currentStreamingText && isRecording && (
                  <div className="text-plum-200">
                    {(() => {
                      const enableDiarization = session?.enable_speaker_diarization && currentSpeakerId;
                      const textColor = enableDiarization
                        ? getSpeakerColor(currentSpeakerId!)
                        : getParticipantColor(participantInfo?.participantName || '');
                      return (
                        <span className={`${textColor} font-semibold`}>
                          {participantInfo?.participantName}
                          {enableDiarization && ` (Speaker ${currentSpeakerId})`}
                          {isCurrentStreamingTranslated && ' (translated)'}:{' '}
                        </span>
                      );
                    })()}
                    <span className="text-xl leading-relaxed">{currentStreamingText}</span>
                    <span className="inline-block w-2 h-5 bg-plum-400 ml-1.5 animate-blink rounded-sm" />
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        sessionCode={code}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Floating Bilingual Button */}
      <FloatingBilingualButton />
    </div>
  );
}
