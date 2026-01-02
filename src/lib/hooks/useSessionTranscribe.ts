import { useCallback, useRef, useEffect } from 'react';
import useTranscribe from '@/lib/useTranscribe';
import { getAPIKey } from '@/lib/utils';
import type { TranslationConfig, Token } from '@soniox/speech-to-text-web';

interface PendingTranscript {
  originalText: string;
  sourceLanguage?: string;
  timestamp: number;
}

interface UseSessionTranscribeParams {
  sessionCode: string;
  participantId: string;
  participantName: string;
  translationConfig?: TranslationConfig;
  onBroadcast?: (data: {
    participantId: string;
    participantName: string;
    text: string;
    translatedText?: string;
    timestamp: number;
  }) => void;
  onFinalTranscript?: (data: {
    originalText: string;
    translatedText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) => void;
}

export function useSessionTranscribe({
  sessionCode,
  participantId,
  participantName,
  translationConfig,
  onBroadcast,
  onFinalTranscript,
}: UseSessionTranscribeParams) {
  const lastBroadcastRef = useRef<string>('');
  const pendingFinalTokensRef = useRef<Token[]>([]);
  const pendingOriginalRef = useRef<PendingTranscript | null>(null);

  const { startTranscription, stopTranscription, state, finalTokens, nonFinalTokens, error } = useTranscribe({
    apiKey: getAPIKey,
    translationConfig,
  });

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

    if (text && onBroadcast) {
      onBroadcast({
        participantId,
        participantName,
        text,
        translatedText: translatedText || undefined,
        timestamp: Date.now(),
      });
    }
  }, [nonFinalTokens, participantId, participantName, onBroadcast]);

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
      // Check if source language === target language (no translation needed)
      const needsTranslation = translationConfig &&
        translationConfig.type === 'one_way' &&
        sourceLanguage !== translationConfig.target_language;

      if (needsTranslation) {
        // Buffer this original, wait for translation batch
        pendingOriginalRef.current = {
          originalText,
          sourceLanguage,
          timestamp: Date.now(),
        };
        return; // Don't save yet
      } else {
        // No translation needed (speaking target language), save directly
        if (onFinalTranscript) {
          onFinalTranscript({
            originalText,
            translatedText: undefined,
            sourceLanguage,
            targetLanguage,
          });
        }
      }
    }
    // Case 2: We have ONLY translation tokens (this is the translation of buffered original)
    else if (!originalText && translatedText) {
      const pending = pendingOriginalRef.current;

      if (onFinalTranscript) {
        onFinalTranscript({
          originalText: pending?.originalText || translatedText,
          translatedText,
          sourceLanguage: pending?.sourceLanguage,
          targetLanguage,
        });
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
        });
      }
    }
  }, [finalTokens, onFinalTranscript, translationConfig]);

  const start = useCallback(() => {
    pendingFinalTokensRef.current = [];
    lastBroadcastRef.current = '';
    pendingOriginalRef.current = null;
    startTranscription();
  }, [startTranscription]);

  const stop = useCallback(() => {
    stopTranscription();
  }, [stopTranscription]);

  // Compute current streaming text for local display (no Supabase needed)
  const streamingOriginal = nonFinalTokens
    .filter((t) => t.translation_status !== 'translation')
    .map((t) => t.text)
    .join('');
  const streamingTranslated = nonFinalTokens
    .filter((t) => t.translation_status === 'translation')
    .map((t) => t.text)
    .join('');

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
  };
}
