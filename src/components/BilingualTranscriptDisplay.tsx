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
      <div className={cn('flex items-center justify-center h-full text-white/50', className)}>
        <p>Waiting for transcription...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {tokenGroups.map((group) => (
        <div key={group.id} className="space-y-2 animate-fadeIn">
          {/* Original Language Section */}
          <div className="bg-white/5 backdrop-blur-sm border-l-4 border-plum-400 p-4 rounded-r-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-plum-500/30 text-plum-200 text-xs px-2.5 py-1 rounded-full font-medium">
                {group.sourceLanguage?.toUpperCase() || 'AUTO'}
              </span>
              {showSpeaker && group.speaker && (
                <span className="text-white/60 text-sm">Speaker {group.speaker}</span>
              )}
              {!group.isFinal && (
                <span className="text-xs text-plum-300 italic flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-plum-400 rounded-full animate-pulse" />
                  streaming
                </span>
              )}
            </div>
            <p className="text-white text-lg leading-relaxed">{group.originalText}</p>
          </div>

          {/* Arrow Separator */}
          <div className="flex justify-center">
            <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Translated Language Section */}
          <div className="bg-white/5 backdrop-blur-sm border-l-4 border-emerald-400 p-4 rounded-r-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
                {group.targetLanguage?.toUpperCase() || '?'}
              </span>
              {group.isTranslating && (
                <span className="text-xs text-emerald-300 italic flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  translating
                </span>
              )}
            </div>
            <p className="text-white text-lg leading-relaxed">
              {group.translatedText || (
                <span className="italic text-white/40 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Translating...
                </span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
