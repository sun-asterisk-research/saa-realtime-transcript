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
  variant?: 'dark' | 'light';
}

export function BilingualTranscriptDisplay({
  tokens,
  mode,
  targetLanguage,
  languageA,
  languageB,
  showSpeaker = false,
  className,
  variant = 'dark',
}: BilingualTranscriptDisplayProps) {
  const tokenGroups = useBilingualTokens(tokens, {
    mode,
    targetLanguage,
    languageA,
    languageB,
  });

  const isDark = variant === 'dark';

  if (tokenGroups.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', isDark ? 'text-white/50' : 'text-text-muted', className)}>
        <p>Waiting for transcription...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {tokenGroups.map((group) => (
        <div key={group.id} className="space-y-2 animate-fadeIn">
          {/* Original Language Section */}
          <div className={cn(
            'border-l-4 border-plum-400 p-3 rounded-r-lg',
            isDark ? 'bg-white/5 backdrop-blur-sm' : 'bg-plum-50'
          )}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                isDark ? 'bg-plum-500/30 text-plum-200' : 'bg-plum-100 text-plum-700 border border-plum-200'
              )}>
                {group.sourceLanguage?.toUpperCase() || 'AUTO'}
              </span>
              {showSpeaker && group.speaker && (
                <span className={cn('text-sm', isDark ? 'text-white/60' : 'text-text-muted')}>
                  Speaker {group.speaker}
                </span>
              )}
              {!group.isFinal && (
                <span className={cn('text-xs italic flex items-center gap-1', isDark ? 'text-plum-300' : 'text-plum-500')}>
                  <span className="w-1.5 h-1.5 bg-plum-400 rounded-full animate-pulse" />
                  streaming
                </span>
              )}
            </div>
            <p className={cn('text-base leading-relaxed', isDark ? 'text-white' : 'text-text-primary')}>
              {group.originalText}
            </p>
          </div>

          {/* Translated Language Section */}
          {(() => {
            const isSameLanguage = group.sourceLanguage?.toLowerCase() === group.targetLanguage?.toLowerCase();

            return (
              <div className={cn(
                'border-l-4 p-3 rounded-r-lg',
                isSameLanguage
                  ? (isDark ? 'border-amber-400 bg-white/5 backdrop-blur-sm' : 'border-amber-400 bg-amber-50')
                  : (isDark ? 'border-emerald-400 bg-white/5 backdrop-blur-sm' : 'border-emerald-400 bg-emerald-50')
              )}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    isSameLanguage
                      ? (isDark ? 'bg-amber-500/30 text-amber-200' : 'bg-amber-100 text-amber-700 border border-amber-200')
                      : (isDark ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                  )}>
                    {group.targetLanguage?.toUpperCase() || '?'}
                  </span>
                  {isSameLanguage ? (
                    <span className={cn('text-xs font-medium', isDark ? 'text-amber-300' : 'text-amber-600')}>
                      same language
                    </span>
                  ) : group.isTranslating && (
                    <span className={cn('text-xs italic flex items-center gap-1', isDark ? 'text-emerald-300' : 'text-emerald-600')}>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      translating
                    </span>
                  )}
                </div>
                <p className={cn('text-base leading-relaxed', isDark ? 'text-white' : 'text-text-primary')}>
                  {group.translatedText ? (
                    group.translatedText
                  ) : isSameLanguage ? (
                    <span className={cn(isDark ? 'text-white/60' : 'text-text-secondary')}>
                      {group.originalText}
                    </span>
                  ) : (
                    <span className={cn('italic flex items-center gap-2', isDark ? 'text-white/40' : 'text-text-muted')}>
                      <span className={cn(
                        'w-4 h-4 border-2 rounded-full animate-spin',
                        isDark ? 'border-white/20 border-t-white/60' : 'border-emerald-200 border-t-emerald-500'
                      )} />
                      Translating...
                    </span>
                  )}
                </p>
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
