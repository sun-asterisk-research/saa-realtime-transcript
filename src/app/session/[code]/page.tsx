'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { useSession } from '@/lib/hooks/useSession';
import { useParticipants } from '@/lib/hooks/useParticipants';
import { useTranscripts } from '@/lib/hooks/useTranscripts';
import { useSessionTranscribe } from '@/lib/hooks/useSessionTranscribe';
import type { TranslationConfig } from '@soniox/speech-to-text-web';

interface ParticipantInfo {
  participantId: string;
  participantName: string;
  isHost: boolean;
}

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  const { session, isLoading: sessionLoading, error: sessionError, endSession } = useSession(code);
  const { participants, leaveSession } = useParticipants(session?.id, code);
  const { transcripts, streamingTranscripts, broadcastStreaming } = useTranscripts(session?.id, code);

  // Get translation config based on session settings
  const translationConfig: TranslationConfig | undefined = session
    ? session.mode === 'one_way'
      ? { type: 'one_way', target_language: session.target_language! }
      : { type: 'two_way', language_a: session.language_a!, language_b: session.language_b! }
    : undefined;

  const handleBroadcast = useCallback(
    (data: { participantId: string; participantName: string; text: string; translatedText?: string; timestamp: number }) => {
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

  const { start, stop, state, streamingOriginal, streamingTranslated } = useSessionTranscribe({
    sessionCode: code,
    participantId: participantInfo?.participantId || '',
    participantName: participantInfo?.participantName || '',
    translationConfig,
    onBroadcast: handleBroadcast,
    onFinalTranscript: handleFinalTranscript,
  });

  // For one-way mode: prefer translated text for display
  const currentStreamingText = session?.mode === 'one_way'
    ? (streamingTranslated || streamingOriginal)
    : streamingOriginal;

  // Load participant info from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`session_${code}`);
    if (stored) {
      setParticipantInfo(JSON.parse(stored));
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

  // Auto-scroll to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, streamingTranscripts]);

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

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-slate-800 p-4 flex flex-col border-r border-slate-700">
        {/* Session Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Session: {code}</h2>
            <Link href={`/session/${code}/display`} target="_blank" className="text-sm text-blue-400 hover:text-blue-300">
              Display View
            </Link>
          </div>
          <div className="text-sm text-slate-400">
            Mode: {session.mode === 'one_way' ? 'One-way' : 'Two-way'}
            {session.mode === 'one_way' && ` → ${session.target_language?.toUpperCase()}`}
            {session.mode === 'two_way' && ` (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
          </div>
        </div>

        {/* Microphone Selection */}
        <div className="mb-6">
          <label className="block text-slate-300 mb-2 text-sm">Microphone</label>
          <Select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="text-white text-sm"
            disabled={isRecording}>
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </Select>
        </div>

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
          className={`w-full h-12 mb-4 ${
            isRecording ? 'bg-red-600 border-red-600 hover:bg-red-700' : 'bg-green-600 border-green-600 hover:bg-green-700'
          } text-white`}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>

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
      <div className="flex-1 flex flex-col bg-[#092432]">
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Final transcripts from database */}
            {transcripts.map((t) => (
              <div key={t.id} className="text-white">
                <span className="text-blue-400 font-medium">{t.participant_name}: </span>
                <span className="text-2xl">{t.translated_text || t.original_text}</span>
              </div>
            ))}

            {/* Streaming transcripts from other participants (via Supabase) */}
            {Array.from(streamingTranscripts.entries()).map(([id, data]) => (
              <div key={id} className="text-white/70">
                <span className="text-blue-400/70 font-medium">{data.participantName}: </span>
                <span className="text-2xl">{data.translatedText || data.text}</span>
              </div>
            ))}

            {/* LOCAL streaming text - shows immediately while speaking */}
            {currentStreamingText && isRecording && (
              <div className="text-yellow-300 animate-pulse">
                <span className="text-yellow-400 font-medium">{participantInfo?.participantName}: </span>
                <span className="text-2xl">{currentStreamingText}</span>
                <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
