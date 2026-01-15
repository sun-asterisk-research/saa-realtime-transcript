import { useMemo } from 'react';
import { Token } from '@soniox/speech-to-text-web';

export interface BilingualTokenGroup {
  id: string;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speaker?: string;
  isFinal: boolean;
  isTranslating: boolean;
}

interface UseBilingualTokensOptions {
  mode: 'one_way' | 'two_way';
  targetLanguage?: string;
  languageA?: string;
  languageB?: string;
}

export function useBilingualTokens(tokens: Token[], options: UseBilingualTokensOptions): BilingualTokenGroup[] {
  const { mode, targetLanguage, languageA, languageB } = options;

  return useMemo(() => {
    // Separate original and translation tokens
    const originalTokens = tokens.filter((t) => t.translation_status !== 'translation');
    const translationTokens = tokens.filter((t) => t.translation_status === 'translation');

    // Group tokens by combining originals with their translations
    const groups: BilingualTokenGroup[] = [];

    // Process original tokens and try to find matching translations
    for (let i = 0; i < originalTokens.length; i++) {
      const original = originalTokens[i];
      const translation = translationTokens[i]; // Translations arrive in same sequence

      // Determine source and target languages
      let sourceLanguage = original.language || original.source_language;
      let targetLang: string | undefined;

      if (mode === 'one_way') {
        targetLang = targetLanguage;
      } else if (mode === 'two_way') {
        // In two-way mode, determine target based on detected source
        if (sourceLanguage === languageA) {
          targetLang = languageB;
        } else if (sourceLanguage === languageB) {
          targetLang = languageA;
        } else {
          // If detection unclear, use first available target
          targetLang = languageB || languageA;
        }
      }

      groups.push({
        id: `${i}-${original.text.slice(0, 10)}`,
        originalText: original.text,
        translatedText: translation?.text,
        sourceLanguage,
        targetLanguage: targetLang,
        speaker: original.speaker,
        isFinal: original.is_final,
        isTranslating: !translation && original.is_final, // Translation pending if final but no translation yet
      });
    }

    return groups;
  }, [tokens, mode, targetLanguage, languageA, languageB]);
}
