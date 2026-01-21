import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationConfig, Context, Token } from '@soniox/speech-to-text-web';
import { getSupabaseClient } from '@/lib/supabase/client';

const END_TOKEN = '<end>';

// RecorderState type compatible with the Soniox SDK
// Using the actual states from the SDK
type RecorderState =
  | 'Init'
  | 'RequestingMedia'
  | 'OpeningWebSocket'
  | 'Running'
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
  status: 'connected' | 'ready' | 'finished' | 'error';
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
  onStarted,
  onFinished,
}: UseProxyTranscribeParameters) {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<RecorderState>('Init');
  const [finalTokens, setFinalTokens] = useState<Token[]>([]);
  const [nonFinalTokens, setNonFinalTokens] = useState<Token[]>([]);
  const [error, setError] = useState<TranscriptionError | null>(null);

  const handleProxyMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ProxyMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'status':
            if (message.status === 'ready') {
              setState('Running');
              onStarted?.();
            } else if (message.status === 'finished') {
              setState('Finished');
              onFinished?.();
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
    [onStarted, onFinished]
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

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
        const mediaRecorder = new MediaRecorder(stream, {
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
    handleProxyMessage,
  ]);

  const stopTranscription = useCallback(() => {
    // Stop recording
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }

    // Stop media stream tracks
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Send stop signal to proxy
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('');
    }

    setState('Init');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
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
  };
}
