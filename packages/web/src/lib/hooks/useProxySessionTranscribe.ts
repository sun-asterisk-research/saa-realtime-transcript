import { useCallback } from 'react';
import useProxyTranscribe from '@/lib/useProxyTranscribe';
import type { TranslationConfig, Context } from '@soniox/speech-to-text-web';

interface UseProxySessionTranscribeParams {
  proxyUrl: string;
  sessionCode: string;
  participantId: string;
  participantName: string;
  translationConfig?: TranslationConfig;
  context?: Context;
  enableSpeakerDiarization?: boolean;
  deviceId?: string;
}

/**
 * Session transcription hook using proxy server.
 * The proxy server handles:
 * - Broadcasting streaming transcripts to other participants
 * - Saving final transcripts to the database
 *
 * This hook only needs to handle local display.
 */
export function useProxySessionTranscribe({
  proxyUrl,
  sessionCode,
  participantId,
  participantName,
  translationConfig,
  context,
  enableSpeakerDiarization = false,
  deviceId,
}: UseProxySessionTranscribeParams) {
  const { startTranscription, stopTranscription, state, finalTokens, nonFinalTokens, error } =
    useProxyTranscribe({
      proxyUrl,
      sessionCode,
      participantId,
      participantName,
      translationConfig,
      context,
      enableSpeakerDiarization,
      deviceId,
    });

  const start = useCallback(() => {
    startTranscription();
  }, [startTranscription]);

  const stop = useCallback(() => {
    stopTranscription();
  }, [stopTranscription]);

  // Compute current streaming text for local display
  const originalTokens = nonFinalTokens.filter((t) => t.translation_status !== 'translation');
  const streamingOriginal = originalTokens.map((t) => t.text).join('');
  const streamingTranslated = nonFinalTokens
    .filter((t) => t.translation_status === 'translation')
    .map((t) => t.text)
    .join('');

  // Get current source language and speaker from streaming tokens
  const currentSourceLanguage = originalTokens[0]?.language;
  const currentSpeakerId = originalTokens[0]?.speaker;

  // Compute current target language
  let currentTargetLanguage: string | undefined;
  if (translationConfig && currentSourceLanguage) {
    if (translationConfig.type === 'one_way') {
      currentTargetLanguage = translationConfig.target_language;
    } else if (translationConfig.type === 'two_way') {
      currentTargetLanguage =
        currentSourceLanguage === translationConfig.language_a
          ? translationConfig.language_b
          : translationConfig.language_a;
    }
  }

  return {
    start,
    stop,
    state,
    finalTokens,
    nonFinalTokens,
    error,
    // For local streaming display
    streamingOriginal,
    streamingTranslated,
    currentSourceLanguage,
    currentTargetLanguage,
    currentSpeakerId,
  };
}
