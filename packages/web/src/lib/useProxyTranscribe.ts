import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationConfig, Context, Token } from '@soniox/speech-to-text-web';
import { MicVAD } from '@ricky0123/vad-web';
import { getSupabaseClient } from '@/lib/supabase/client';
import { mixAudioStreams } from '@/lib/tabAudioCapture';

const END_TOKEN = '<end>';

// RecorderState type compatible with the Soniox SDK
// Using the actual states from the SDK, plus custom states for pause/resume
type RecorderState =
  | 'Init'
  | 'RequestingMedia'
  | 'OpeningWebSocket'
  | 'Running'
  | 'Paused'
  | 'Resuming'
  | 'FinishingProcessing'
  | 'Finished'
  | 'Error'
  | 'Canceled';

// Message types from proxy server
interface ProxyResult {
  type: 'result';
  tokens: Token[];
}

interface ProxyError {
  type: 'error';
  message: string;
  code?: number;
}

interface ProxyStatus {
  type: 'status';
  status: 'connected' | 'ready' | 'finished' | 'error' | 'paused' | 'idling';
  reason?: string;
}

type ProxyMessage = ProxyResult | ProxyError | ProxyStatus;

// Configuration sent to proxy
interface ProxyConfig {
  type: 'config';
  authToken: string;
  sessionCode: string;
  participantId: string;
  participantName: string;
  model?: string;
  languageHints?: string[];
  enableLanguageIdentification?: boolean;
  enableSpeakerDiarization?: boolean;
  enableEndpointDetection?: boolean;
  translation?: TranslationConfig;
  context?: Context;
}

interface UseProxyTranscribeParameters {
  proxyUrl: string;
  sessionCode: string;
  participantId: string;
  participantName: string;
  translationConfig?: TranslationConfig;
  context?: Context;
  enableSpeakerDiarization?: boolean;
  deviceId?: string;
  tabAudioStream?: MediaStream | null;
  onStarted?: () => void;
  onFinished?: () => void;
}

type TranscriptionError = {
  status: string;
  message: string;
  errorCode: number | undefined;
};

/**
 * Hook for proxy-based transcription.
 * Connects to a proxy server that handles Soniox connection and transcript saving.
 */
export default function useProxyTranscribe({
  proxyUrl,
  sessionCode,
  participantId,
  participantName,
  translationConfig,
  context,
  enableSpeakerDiarization = false,
  deviceId,
  tabAudioStream,
  onStarted,
  onFinished,
}: UseProxyTranscribeParameters) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadRef = useRef<Awaited<ReturnType<typeof MicVAD.new>> | null>(null);
  const vadInitPromiseRef = useRef<Promise<Awaited<ReturnType<typeof MicVAD.new>> | null> | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const isResumingRef = useRef<boolean>(false);
  const pendingAudioRef = useRef<ArrayBuffer[]>([]);
  const vadReadyRef = useRef<boolean>(false);

  const [state, setState] = useState<RecorderState>('Init');
  const [finalTokens, setFinalTokens] = useState<Token[]>([]);
  const [nonFinalTokens, setNonFinalTokens] = useState<Token[]>([]);
  const [error, setError] = useState<TranscriptionError | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Handler for VAD speech detection - defined as ref to avoid recreating VAD
  const handleVADSpeechStart = useCallback(() => {
    console.debug('[ProxyTranscribe] VAD detected speech start');
    if (isPausedRef.current && wsRef.current?.readyState === WebSocket.OPEN && mediaStreamRef.current) {
      console.debug('[ProxyTranscribe] Starting MediaRecorder immediately to capture speech');

      // Clear any old pending audio
      pendingAudioRef.current = [];

      // Start a new MediaRecorder immediately to capture the speech
      const newMediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = newMediaRecorder;

      // Buffer audio chunks until server is ready
      newMediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          if (isResumingRef.current) {
            // Still waiting for server, buffer the audio
            console.debug(`[ProxyTranscribe] Buffering audio chunk (${buffer.byteLength} bytes)`);
            pendingAudioRef.current.push(buffer);
          } else if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Server is ready, send directly
            wsRef.current.send(buffer);
          }
        }
      };

      newMediaRecorder.start(120);

      // Mark that we're resuming
      isResumingRef.current = true;
      setState('Resuming');

      // Send resume command to server - server will recreate Soniox connection
      console.debug('[ProxyTranscribe] Sending resume command to server');
      wsRef.current.send(JSON.stringify({ type: 'resume' }));
    }
    // Pause VAD after speech is detected (will be resumed on next pause)
    if (vadRef.current) {
      console.debug('[ProxyTranscribe] Pausing VAD');
      vadRef.current.pause();
    }
  }, []);

  // Initialize VAD once (lazy loading on first use)
  const initVAD = useCallback(() => {
    // Already initialized
    if (vadRef.current) {
      return Promise.resolve(vadRef.current);
    }

    // Already initializing - return existing promise
    if (vadInitPromiseRef.current) {
      return vadInitPromiseRef.current;
    }

    console.debug('[ProxyTranscribe] Initializing VAD (one-time load)...');
    const initPromise = MicVAD.new({
      // Asset paths for ONNX model and worklet files
      baseAssetPath: '/vad/',
      onnxWASMBasePath: '/vad/',
      // Use v5 model instead of legacy
      model: 'v5',
      positiveSpeechThreshold: 0.5,
      minSpeechMs: 200,
      onSpeechStart: handleVADSpeechStart,
    })
      .then((vad) => {
        vadRef.current = vad;
        vadReadyRef.current = true;
        console.debug('[ProxyTranscribe] VAD initialized successfully');
        return vad;
      })
      .catch((err) => {
        console.error('[ProxyTranscribe] Failed to initialize VAD:', err);
        vadReadyRef.current = false;
        vadInitPromiseRef.current = null; // Allow retry
        return null;
      });

    vadInitPromiseRef.current = initPromise;
    return initPromise;
  }, [handleVADSpeechStart]);

  // Start VAD for speech detection when paused
  const startVAD = useCallback(async () => {
    console.debug('[ProxyTranscribe] Starting VAD for speech detection...');
    const vad = await initVAD();
    if (vad) {
      vad.start();
      console.debug('[ProxyTranscribe] VAD started');
    }
  }, [initVAD]);


  const handleProxyMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ProxyMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'status':
            console.debug(`[ProxyTranscribe] Status: ${message.status}${message.reason ? ` (${message.reason})` : ''}`);
            if (message.status === 'connected') {
              console.debug('[ProxyTranscribe] Connected to proxy server');
            } else if (message.status === 'ready') {
              console.debug('[ProxyTranscribe] Soniox connection ready, transcription started');

              // If we're resuming after pause, send buffered audio
              if (isResumingRef.current) {
                // Send any buffered audio chunks
                if (pendingAudioRef.current.length > 0) {
                  console.debug(`[ProxyTranscribe] Sending ${pendingAudioRef.current.length} buffered audio chunks`);
                  for (const buffer of pendingAudioRef.current) {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(buffer);
                    }
                  }
                  pendingAudioRef.current = [];
                }
                isResumingRef.current = false;
                // MediaRecorder is already running from VAD speech detection
              }

              isPausedRef.current = false;
              setIsPaused(false);
              setState('Running');
              onStarted?.();
            } else if (message.status === 'finished') {
              console.debug('[ProxyTranscribe] Transcription finished');
              setState('Finished');
              onFinished?.();
            } else if (message.status === 'idling') {
              // Server signals connection has been idle - preload VAD in case pause happens
              if (!vadRef.current && !vadInitPromiseRef.current) {
                console.debug('[ProxyTranscribe] Received idling signal, preloading VAD...');
                initVAD();
              }
            } else if (message.status === 'paused') {
              console.debug('[ProxyTranscribe] Soniox connection paused due to inactivity');

              // Only enter paused state if VAD is ready or can be initialized
              // If VAD failed to load, user would be stuck unable to resume
              if (vadReadyRef.current || !vadRef.current) {
                // Stop MediaRecorder to stop sending audio (will be restarted on resume)
                if (mediaRecorderRef.current?.state === 'recording') {
                  console.debug('[ProxyTranscribe] Stopping MediaRecorder');
                  mediaRecorderRef.current.stop();
                  isPausedRef.current = true;
                  setIsPaused(true);
                  setState('Paused');
                }
                // Start VAD to detect when user starts speaking again
                startVAD();
              } else {
                console.warn('[ProxyTranscribe] VAD failed to load, not entering paused state to prevent user from being stuck');
                // Keep MediaRecorder running so user can still send audio
              }
            }
            break;

          case 'result':
            {
              const newFinalTokens: Token[] = [];
              const newNonFinalTokens: Token[] = [];

              for (const token of message.tokens) {
                // Ignore endpoint detection tokens
                if (token.text === END_TOKEN) {
                  continue;
                }

                if (token.is_final) {
                  newFinalTokens.push(token);
                } else {
                  newNonFinalTokens.push(token);
                }
              }

              setFinalTokens((prev) => [...prev, ...newFinalTokens]);
              setNonFinalTokens(newNonFinalTokens);
            }
            break;

          case 'error':
            setError({
              status: 'error',
              message: message.message,
              errorCode: message.code,
            });
            break;
        }
      } catch (e) {
        console.error('[ProxyTranscribe] Error parsing message:', e);
      }
    },
    [onStarted, onFinished, initVAD, startVAD]
  );

  const startTranscription = useCallback(async () => {
    setFinalTokens([]);
    setNonFinalTokens([]);
    setError(null);
    setState('RequestingMedia');

    try {
      // Get auth token from Supabase session
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      if (!authToken) {
        setError({
          status: 'auth_error',
          message: 'Not authenticated. Please log in.',
          errorCode: 401,
        });
        setState('Init');
        return;
      }

      // Get microphone access
      // Echo cancellation and noise suppression are disabled to allow
      // capturing audio from external speakers (e.g., meeting room setup
      // where speaker audio is picked up by the microphone for translation).
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      micStreamRef.current = micStream;

      // Determine the stream to use for recording
      let recordingStream: MediaStream;

      if (tabAudioStream && tabAudioStream.getAudioTracks().length > 0) {
        // Mix microphone and tab audio together
        console.debug('[ProxyTranscribe] Mixing microphone and tab audio streams');
        const { mixedStream, audioContext } = mixAudioStreams(micStream, tabAudioStream);
        audioContextRef.current = audioContext;
        recordingStream = mixedStream;
      } else {
        // Use microphone only
        recordingStream = micStream;
      }

      mediaStreamRef.current = recordingStream;

      // Connect to proxy server
      const ws = new WebSocket(proxyUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState('OpeningWebSocket');

        // Send configuration with auth token
        const config: ProxyConfig = {
          type: 'config',
          authToken,
          sessionCode,
          participantId,
          participantName,
          model: 'stt-rt-preview',
          enableLanguageIdentification: true,
          enableSpeakerDiarization,
          enableEndpointDetection: true,
          translation: translationConfig,
          context,
        };
        ws.send(JSON.stringify(config));

        // Start recording
        const mediaRecorder = new MediaRecorder(recordingStream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            const buffer = await event.data.arrayBuffer();
            ws.send(buffer);
          }
        };

        mediaRecorder.start(120); // Send data every 120ms
      };

      ws.onmessage = handleProxyMessage;

      ws.onerror = (e) => {
        console.error('[ProxyTranscribe] WebSocket error:', e);
        setError({
          status: 'connection_error',
          message: 'WebSocket connection error',
          errorCode: undefined,
        });
        setState('Init');
      };

      ws.onclose = () => {
        setState('Init');
      };
    } catch (e) {
      console.error('[ProxyTranscribe] Error starting transcription:', e);
      setError({
        status: 'error',
        message: e instanceof Error ? e.message : 'Failed to start transcription',
        errorCode: undefined,
      });
      setState('Init');
    }
  }, [
    proxyUrl,
    sessionCode,
    participantId,
    participantName,
    translationConfig,
    context,
    enableSpeakerDiarization,
    tabAudioStream,
    handleProxyMessage,
  ]);

  const stopTranscription = useCallback(() => {
    // Pause VAD but keep it alive for potential next session
    if (vadRef.current) {
      console.debug('[ProxyTranscribe] Pausing VAD (keeping alive for reuse)');
      vadRef.current.pause();
    }

    // Stop recording
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }

    // Stop media stream tracks (both mixed stream and original mic stream)
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close audio context used for mixing
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Send stop signal to proxy
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('');
    }

    isPausedRef.current = false;
    setIsPaused(false);
    setState('Init');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop VAD if running
      if (vadRef.current) {
        vadRef.current.pause();
        vadRef.current.destroy();
        vadRef.current = null;
      }
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    startTranscription,
    stopTranscription,
    state,
    finalTokens,
    nonFinalTokens,
    error,
    isPaused,
  };
}
