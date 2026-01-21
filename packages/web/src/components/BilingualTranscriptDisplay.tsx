import { Token } from '@soniox/speech-to-text-web';
import { useBilingualTokens } from '@/hooks/useBilingualTokens';
import { cn } from '@/lib/utils';

interface BilingualTranscriptDisplayProps {
  tokens: Token[];
  mode: 'one_way' | 'two_way';
  targetLanguage?: string;
  languageA?: string;
  languageB?: string;
  showSpeaker?: boolean;
  className?: string;
}

export function BilingualTranscriptDisplay({
  tokens,
  mode,
  targetLanguage,
  languageA,
  languageB,
  showSpeaker = false,
  className,
}: BilingualTranscriptDisplayProps) {
  const tokenGroups = useBilingualTokens(tokens, {
    mode,
    targetLanguage,
    languageA,
    languageB,
  });

  if (tokenGroups.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-gray-400', className)}>
        <p>Waiting for transcription...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {tokenGroups.map((group) => (
        <div key={group.id} className="space-y-1">
          {/* Original Language Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-0.5 rounded-full font-medium">
                {group.sourceLanguage?.toUpperCase() || 'AUTO'}
              </span>
              {showSpeaker && group.speaker && (
                <span className="text-gray-600 dark:text-gray-400 text-sm">Speaker {group.speaker}</span>
              )}
              {!group.isFinal && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 italic">(streaming)</span>
              )}
            </div>
            <p className="text-gray-900 dark:text-gray-100">{group.originalText}</p>
          </div>

          {/* Arrow Separator */}
          <div className="text-gray-400 text-sm text-center my-1">↓</div>

          {/* Translated Language Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-r">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">
                {group.targetLanguage?.toUpperCase() || '?'}
              </span>
              {group.isTranslating && (
                <span className="text-xs text-blue-600 dark:text-blue-400 italic">(translating)</span>
              )}
            </div>
            <p className="text-gray-900 dark:text-gray-100">
              {group.translatedText || (
                <span className="italic text-gray-400 dark:text-gray-500">Translating...</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
