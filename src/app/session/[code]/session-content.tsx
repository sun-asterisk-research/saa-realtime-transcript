'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { CountdownTimer } from '@/components/countdown-timer';
import { useSession } from '@/lib/hooks/useSession';
import { useParticipants } from '@/lib/hooks/useParticipants';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { useSessionTranscribe } from '@/lib/hooks/useSessionTranscribe';
import { useSessionContexts } from '@/lib/hooks/useSessionContexts';
import { ContextManagementPanel } from '@/components/context/ContextManagementPanel';
import { JoinRequestNotifications } from '@/components/join-request-notifications';
import type { TranslationConfig } from '@soniox/speech-to-text-web';

interface ParticipantInfo {
  participantId: string;
  participantName: string;
  isHost: boolean;
  preferredLanguage?: string;
}

// Helper function to get display text based on user's language preference
function getDisplayText(
  transcript: {
    original_text: string;
    translated_text?: string | null;
    source_language?: string | null;
    target_language?: string | null;
  },
  preferredLanguage: string | undefined,
  sessionMode: string
): string {
  // For one-way mode, always show translated if available
  if (sessionMode === 'one_way') {
    return transcript.translated_text || transcript.original_text;
  }

  // For two-way mode, show based on user's preference
  if (!preferredLanguage) {
    return transcript.translated_text || transcript.original_text;
  }

  // If source matches preference, show original
  if (transcript.source_language === preferredLanguage) {
    return transcript.original_text;
  }

  // If target matches preference, show translated
  if (transcript.target_language === preferredLanguage) {
    return transcript.translated_text || transcript.original_text;
  }

  // Fallback: show translated if available
  return transcript.translated_text || transcript.original_text;
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

  const { session, isLoading: sessionLoading, error: sessionError, endSession } = useSession(code);
  const { participants, leaveSession } = useParticipants(session?.id, code);
  const { transcripts, streamingTranscripts, broadcastStreaming } = useTranscripts(session?.id, code);
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
      timestamp: number;
    }) => {
      broadcastStreaming(data);
    },
    [broadcastStreaming],
  );

  const handleFinalTranscript = useCallback(
    async (data: { originalText: string; translatedText?: string; sourceLanguage?: string; targetLanguage?: string }) => {
      if (!participantInfo) return;

      try {
        await fetch(`/api/sessions/${code}/transcripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participantInfo.participantId,
            participantName: participantInfo.participantName,
            originalText: data.originalText,
            translatedText: data.translatedText,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            isFinal: true,
          }),
        });
      } catch (err) {
        console.error('Failed to save transcript:', err);
      }
    },
    [code, participantInfo],
  );

  const { start, stop, state, streamingOriginal, streamingTranslated, currentSourceLanguage, currentTargetLanguage } = useSessionTranscribe({
    sessionCode: code,
    participantId: participantInfo?.participantId || '',
    participantName: participantInfo?.participantName || '',
    translationConfig,
    context: mergedContext,
    onBroadcast: handleBroadcast,
    onFinalTranscript: handleFinalTranscript,
  });

  // Compute local streaming display text based on user's preference
  const currentStreamingText = getDisplayText(
    {
      original_text: streamingOriginal,
      translated_text: streamingTranslated || undefined,
      source_language: currentSourceLanguage,
      target_language: currentTargetLanguage,
    },
    displayLanguage,
    session?.mode || 'one_way'
  );

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
        '⚠️ Context has been updated. Transcription needs to restart with the new context.\n\nRestart transcription now?',
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading session...</div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="text-red-400 mb-4">Session not found</div>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="text-slate-400 mb-4">This session has ended</div>
        <Link href={`/history/${code}`}>
          <Button className="mb-2">View History</Button>
        </Link>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  // Check if session is scheduled and not yet started
  const isScheduled = !!(session.scheduled_start_time && new Date(session.scheduled_start_time) > new Date());

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Countdown Banner */}
      {isScheduled && (
        <div className="bg-yellow-600/20 border-b border-yellow-600 p-4 text-center flex-shrink-0">
          <div className="text-yellow-300 flex items-center justify-center gap-3">
            <span className="font-medium">Session scheduled to start in</span>
            <CountdownTimer targetTime={session.scheduled_start_time!} />
          </div>
          <p className="text-yellow-400/80 text-sm mt-1">
            Recording will be enabled when the session starts at the scheduled time.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-slate-800 p-4 flex flex-col border-r border-slate-700 flex-shrink-0">
          {/* Session Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">
                {session.title || `Session: ${code}`}
              </h2>
              <Link href={`/session/${code}/display`} target="_blank" className="text-sm text-blue-400 hover:text-blue-300">
                Display View
              </Link>
            </div>
            {session.description && (
              <p className="text-sm text-slate-400 mb-2">{session.description}</p>
            )}
            <div className="text-sm text-slate-400">
              Mode: {session.mode === 'one_way' ? 'One-way' : 'Two-way'}
              {session.mode === 'one_way' && ` → ${session.target_language?.toUpperCase()}`}
              {session.mode === 'two_way' && ` (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
            </div>
          </div>

        {/* Display Language Selector - only for two-way mode */}
        {session.mode === 'two_way' && session.language_a && session.language_b && (
          <div className="mb-6">
            <label className="block text-slate-300 mb-2 text-sm">Display Language</label>
            <Select
              value={displayLanguage}
              onChange={(e) => handleDisplayLanguageChange(e.target.value)}
              className="text-white text-sm">
              <option value={session.language_a}>{session.language_a.toUpperCase()}</option>
              <option value={session.language_b}>{session.language_b.toUpperCase()}</option>
            </Select>
            <p className="text-slate-500 text-xs mt-1">All transcripts shown in this language</p>
          </div>
        )}

        {/* Microphone Selection */}
        <div className="mb-6">
          <label className="block text-slate-300 mb-2 text-sm">Microphone</label>
          <Select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="text-white text-sm"
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
          onContextChange={handleContextChange}
          onAddContextSets={addContextSets}
          onRemoveContextSet={removeContextSet}
        />

        {/* Recording Status */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-300">{isRecording ? 'Recording...' : 'Ready'}</span>
          </div>
          <div className="text-xs text-slate-500">State: {state}</div>
        </div>

        {/* Start/Stop Button */}
        <Button
          onClick={handleStartStop}
          disabled={isScheduled}
          className={`w-full h-12 mb-4 ${
            isRecording ? 'bg-red-600 border-red-600 hover:bg-red-700' : 'bg-green-600 border-green-600 hover:bg-green-700'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}>
          {isRecording ? 'Stop Recording' : isScheduled ? 'Waiting for scheduled time...' : 'Start Recording'}
        </Button>

        {/* Join Request Notifications - only for host */}
        {participantInfo?.isHost && (
          <JoinRequestNotifications sessionId={session.id} sessionCode={code} />
        )}

        {/* Participants */}
        <div className="flex-1 overflow-auto mb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Participants ({participants.length})</h3>
          <div className="space-y-1">
            {participants.map((p) => (
              <div key={p.id} className="text-sm text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {p.name}
                {p.is_host && <span className="text-xs text-blue-400">(Host)</span>}
                {p.id === participantInfo?.participantId && <span className="text-xs text-slate-500">(You)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {participantInfo?.isHost && (
            <Button onClick={handleEndSession} className="w-full text-red-400 border-red-400 hover:bg-red-900/20">
              End Session
            </Button>
          )}
          <Button onClick={handleLeave} className="w-full">
            Leave Session
          </Button>
        </div>
      </div>

      {/* Right Panel - Transcripts */}
      <div className="flex-1 flex flex-col bg-[#092432] min-h-0">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
        >
          <div className="space-y-4">
            {/* Final transcripts from database */}
            {transcripts.map((t) => (
              <div key={t.id} className="text-white animate-fadeIn">
                <span className="text-blue-400 font-medium">{t.participant_name}: </span>
                <span className="text-2xl">
                  {getDisplayText(t, displayLanguage, session?.mode || 'one_way')}
                </span>
              </div>
            ))}

            {/* Streaming transcripts from other participants (via Supabase) */}
            {Array.from(streamingTranscripts.entries())
              .filter(([id]) => id !== participantInfo?.participantId) // Don't show own streaming twice
              .map(([id, data]) => {
                const displayText = getDisplayText(
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
                  <div key={id} className="text-yellow-300 transition-opacity duration-150">
                    <span className="text-yellow-400 font-medium">{data.participantName}: </span>
                    <span className="text-2xl">{displayText}</span>
                    <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
                  </div>
                );
              })}

            {/* LOCAL streaming text - shows immediately while speaking */}
            {currentStreamingText && isRecording && (
              <div className="text-yellow-300">
                <span className="text-yellow-400 font-medium">{participantInfo?.participantName}: </span>
                <span className="text-2xl">{currentStreamingText}</span>
                <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Empty state */}
        {transcripts.length === 0 && streamingTranscripts.size === 0 && !currentStreamingText && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-500 text-xl">Start recording to see transcripts...</div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
