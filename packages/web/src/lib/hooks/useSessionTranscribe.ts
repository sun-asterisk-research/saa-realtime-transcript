import { useCallback, useRef, useEffect } from 'react';
import useTranscribe from '@/lib/useTranscribe';
import { getAPIKey } from '@/lib/utils';
import type { TranslationConfig, Token, Context } from '@soniox/speech-to-text-web';

interface PendingTranscript {
  originalText: string;
  sourceLanguage?: string;
  speakerId?: string;
  timestamp: number;
}

interface UseSessionTranscribeParams {
  sessionCode: string;
  participantId: string;
  participantName: string;
  translationConfig?: TranslationConfig;
  context?: Context;
  enableSpeakerDiarization?: boolean;
  onBroadcast?: (data: {
    participantId: string;
    participantName: string;
    text: string;
    translatedText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    speakerId?: string;
    timestamp: number;
  }) => void;
  onFinalTranscript?: (data: {
    originalText: string;
    translatedText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    speakerId?: string;
  }) => void;
}

export function useSessionTranscribe({
  sessionCode,
  participantId,
  participantName,
  translationConfig,
  context,
  enableSpeakerDiarization = false,
  onBroadcast,
  onFinalTranscript,
}: UseSessionTranscribeParams) {
  const lastBroadcastRef = useRef<string>('');
  const pendingFinalTokensRef = useRef<Token[]>([]);
  const pendingOriginalRef = useRef<PendingTranscript | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOutRef = useRef<boolean>(false);

  const { startTranscription, stopTranscription, state, finalTokens, nonFinalTokens, error } = useTranscribe({
    apiKey: getAPIKey,
    translationConfig,
    context,
    enableSpeakerDiarization,
  });

  // Function to update transcript translation via PATCH API
  const updateTranscriptTranslation = useCallback(
    async (data: {
      participantId: string;
      originalText: string;
      translatedText: string;
      targetLanguage?: string;
    }) => {
      try {
        await fetch(`/api/sessions/${sessionCode}/transcripts`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.error('Failed to update translation:', err);
      }
    },
    [sessionCode]
  );

  // Handle non-final tokens - broadcast for streaming display
  useEffect(() => {
    if (nonFinalTokens.length === 0) return;

    // Separate original and translated tokens
    const originalTokens = nonFinalTokens.filter((t) => t.translation_status !== 'translation');
    const translatedTokens = nonFinalTokens.filter((t) => t.translation_status === 'translation');

    const text = originalTokens.map((t) => t.text).join('');
    const translatedText = translatedTokens.map((t) => t.text).join('');

    // Avoid broadcasting identical content
    const broadcastKey = `${text}|${translatedText}`;
    if (broadcastKey === lastBroadcastRef.current) return;
    lastBroadcastRef.current = broadcastKey;

    // Get source language and speaker from original tokens
    const sourceLanguage = originalTokens[0]?.language;
    const speakerId = originalTokens[0]?.speaker;

    // Determine target language based on translation config
    let targetLanguage: string | undefined;
    if (translationConfig) {
      if (translationConfig.type === 'one_way') {
        targetLanguage = translationConfig.target_language;
      } else if (translationConfig.type === 'two_way' && sourceLanguage) {
        targetLanguage =
          sourceLanguage === translationConfig.language_a
            ? translationConfig.language_b
            : translationConfig.language_a;
      }
    }

    if (text && onBroadcast) {
      onBroadcast({
        participantId,
        participantName,
        text,
        translatedText: translatedText || undefined,
        sourceLanguage,
        targetLanguage,
        speakerId,
        timestamp: Date.now(),
      });
    }
  }, [nonFinalTokens, participantId, participantName, onBroadcast, translationConfig]);

  // Handle final tokens - save to database
  // Soniox sends original and translation tokens in SEPARATE batches
  // We need to buffer originals and combine with translations
  useEffect(() => {
    if (finalTokens.length === 0) return;

    // Get only new final tokens
    const newTokens = finalTokens.slice(pendingFinalTokensRef.current.length);
    if (newTokens.length === 0) return;

    pendingFinalTokensRef.current = finalTokens;

    // Group tokens by translation status
    const originalTokens = newTokens.filter((t) => t.translation_status !== 'translation');
    const translatedTokens = newTokens.filter((t) => t.translation_status === 'translation');

    const originalText = originalTokens.map((t) => t.text).join('');
    const translatedText = translatedTokens.map((t) => t.text).join('');
    const sourceLanguage = originalTokens[0]?.language;
    const speakerId = originalTokens[0]?.speaker;

    // Skip if no tokens at all
    if (originalTokens.length === 0 && translatedTokens.length === 0) return;

    // Determine target language
    let targetLanguage: string | undefined;
    if (translationConfig) {
      if (translationConfig.type === 'one_way') {
        targetLanguage = translationConfig.target_language;
      } else if (translationConfig.type === 'two_way') {
        targetLanguage =
          sourceLanguage === translationConfig.language_a
            ? translationConfig.language_b
            : translationConfig.language_a;
      }
    }

    // Case 1: We have ONLY original tokens (no translation yet)
    if (originalText && !translatedText) {
      // Check if translation is needed:
      // - one_way: only if speaking different language than target
      // - two_way: always (translates to the other language in pair)
      const needsTranslation = translationConfig && (
        (translationConfig.type === 'one_way' && sourceLanguage !== translationConfig.target_language) ||
        translationConfig.type === 'two_way'
      );

      if (needsTranslation) {
        // Clear any existing timeout
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
        }

        // Buffer this original, wait for translation batch
        pendingOriginalRef.current = {
          originalText,
          sourceLanguage,
          speakerId,
          timestamp: Date.now(),
        };

        // Set 3-second timeout to save original without translation
        pendingTimeoutRef.current = setTimeout(() => {
          console.warn('Translation timeout - saving original only');

          // Mark that we've timed out
          hasTimedOutRef.current = true;

          // Save original without translation
          if (onFinalTranscript) {
            onFinalTranscript({
              originalText,
              translatedText: undefined,
              sourceLanguage,
              targetLanguage,
              speakerId,
            });
          }

          // Keep pendingOriginalRef for late translation update
          pendingTimeoutRef.current = null;
        }, 3000); // 3 seconds

        return; // Don't save yet
      } else {
        // No translation needed (speaking target language), save directly
        if (onFinalTranscript) {
          onFinalTranscript({
            originalText,
            translatedText: undefined,
            sourceLanguage,
            targetLanguage,
            speakerId,
          });
        }
      }
    }
    // Case 2: We have ONLY translation tokens (this is the translation of buffered original)
    else if (!originalText && translatedText) {
      const pending = pendingOriginalRef.current;

      // Clear timeout if still pending
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      // Check if we already saved original due to timeout
      if (hasTimedOutRef.current) {
        // Translation arrived late - update existing record via PATCH
        console.log('Late translation arrived - updating existing transcript');
        updateTranscriptTranslation({
          participantId,
          originalText: pending?.originalText || '',
          translatedText,
          targetLanguage,
        }); // Fire-and-forget, UPDATE event will trigger UI refresh

        // Reset flag
        hasTimedOutRef.current = false;
      } else {
        // Normal flow - save together
        if (onFinalTranscript) {
          onFinalTranscript({
            originalText: pending?.originalText || translatedText,
            translatedText,
            sourceLanguage: pending?.sourceLanguage,
            targetLanguage,
            speakerId: pending?.speakerId,
          });
        }
      }

      pendingOriginalRef.current = null;
    }
    // Case 3: We have BOTH original and translation in same batch
    else if (originalText && translatedText) {
      if (onFinalTranscript) {
        onFinalTranscript({
          originalText,
          translatedText,
          sourceLanguage,
          targetLanguage,
          speakerId,
        });
      }
    }
  }, [finalTokens, onFinalTranscript, translationConfig]);

  const start = useCallback(() => {
    pendingFinalTokensRef.current = [];
    lastBroadcastRef.current = '';
    pendingOriginalRef.current = null;
    hasTimedOutRef.current = false;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    startTranscription();
  }, [startTranscription]);

  const stop = useCallback(() => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    hasTimedOutRef.current = false;
    pendingOriginalRef.current = null;
    stopTranscription();
  }, [stopTranscription]);

  // Compute current streaming text for local display (no Supabase needed)
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
    isPaused: false, // Direct mode doesn't have server-side pause
    // For local streaming display
    streamingOriginal,
    streamingTranslated,
    currentSourceLanguage,
    currentTargetLanguage,
    currentSpeakerId,
  };
}
