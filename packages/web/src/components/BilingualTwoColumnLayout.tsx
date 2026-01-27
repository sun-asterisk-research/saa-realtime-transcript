interface TranscriptItem {
  id: string;
  participantName: string;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speaker?: string;
  timestamp?: string;
  isStreaming?: boolean;
}

interface BilingualTwoColumnLayoutProps {
  items: TranscriptItem[];
  mode: 'one_way' | 'two_way';
  targetLanguage?: string;
  languageA?: string;
  languageB?: string;
  headerBgClass?: string;
  unreadFromIndex?: number | null;
}

const LanguageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

// Unread separator component
const UnreadSeparator = () => (
  <div className="flex items-center gap-3 my-4 col-span-2">
    <div className="flex-1 h-px bg-amber-400/60" />
    <span className="text-amber-400 text-xs font-medium px-2">New messages</span>
    <div className="flex-1 h-px bg-amber-400/60" />
  </div>
);

export function BilingualTwoColumnLayout({
  items,
  mode,
  targetLanguage,
  languageA,
  languageB,
  headerBgClass = 'bg-plum-800',
  unreadFromIndex,
}: BilingualTwoColumnLayoutProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        <p>Waiting for transcription...</p>
      </div>
    );
  }

  // ONE-WAY MODE: Original | Translated
  if (mode === 'one_way') {
    return (
      <div>
        {/* Sticky Header Row */}
        <div className={`sticky top-0 z-20 ${headerBgClass} pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6`}>
          <div className="grid grid-cols-2 gap-8">
            <div className="pr-6">
              <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
                <LanguageIcon />
                Original Language
              </h3>
            </div>
            <div className="pl-6">
              <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
                <LanguageIcon />
                Translated ({targetLanguage?.toUpperCase()})
              </h3>
            </div>
          </div>
        </div>

        {/* Transcript Rows - each item is a paired row */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id}>
              {unreadFromIndex !== null && unreadFromIndex !== undefined && index === unreadFromIndex && (
                <UnreadSeparator />
              )}
              <div className="grid grid-cols-2 gap-8">
              {/* Left Cell - Original */}
              <div className="pr-6 border-r border-white/10">
                <div className="text-white animate-fadeIn">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-plum-300 font-medium text-sm">
                      {item.participantName}
                      {item.speaker && ` (Speaker ${item.speaker})`}
                    </span>
                    {item.sourceLanguage && (
                      <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {item.sourceLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-xl leading-relaxed">
                    {item.originalText}
                    {item.isStreaming && (
                      <span className="inline-block w-2 h-5 bg-plum-400 ml-1.5 animate-blink rounded-sm" />
                    )}
                  </p>
                </div>
              </div>

              {/* Right Cell - Translated */}
              <div className="pl-6">
                <div className="text-white animate-fadeIn">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-plum-300 font-medium text-sm">
                      {item.participantName}
                      {item.speaker && ` (Speaker ${item.speaker})`}
                      {item.sourceLanguage?.toLowerCase() === targetLanguage?.toLowerCase() ? (
                        <span className="text-amber-400 text-xs ml-1.5">(same language)</span>
                      ) : (
                        <span className="text-emerald-400 text-xs ml-1.5">(translated)</span>
                      )}
                    </span>
                    {item.targetLanguage && (
                      <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {item.targetLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-xl leading-relaxed">
                    {item.translatedText ? (
                      <>
                        {item.translatedText}
                        {item.isStreaming && (
                          <span className="inline-block w-2 h-5 bg-plum-400 ml-1.5 animate-blink rounded-sm" />
                        )}
                      </>
                    ) : item.sourceLanguage?.toLowerCase() === targetLanguage?.toLowerCase() ? (
                      <span className="text-white/60">{item.originalText}</span>
                    ) : (
                      <span className="italic text-white/40">
                        {item.isStreaming ? 'Translating...' : 'Waiting for translation...'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TWO-WAY MODE: Language A | Language B
  const langACode = languageA?.toUpperCase() || 'LANG A';
  const langBCode = languageB?.toUpperCase() || 'LANG B';

  return (
    <div>
      {/* Sticky Header Row */}
      <div className={`sticky top-0 z-20 ${headerBgClass} pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6`}>
        <div className="grid grid-cols-2 gap-8">
          <div className="pr-6">
            <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
              <LanguageIcon />
              {langACode}
            </h3>
          </div>
          <div className="pl-6">
            <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
              <LanguageIcon />
              {langBCode}
            </h3>
          </div>
        </div>
      </div>

      {/* Transcript Rows - each item is a paired row */}
      <div className="space-y-4">
        {items.map((item, index) => {
          // Language A logic
          const isOriginalA = item.sourceLanguage === languageA;
          const isTranslatedA = item.targetLanguage === languageA && !isOriginalA;
          const displayTextA = isOriginalA ? item.originalText : item.translatedText;

          // Language B logic
          const isOriginalB = item.sourceLanguage === languageB;
          const isTranslatedB = item.targetLanguage === languageB && !isOriginalB;
          const displayTextB = isOriginalB ? item.originalText : item.translatedText;

          // Skip items where neither language has text
          if (!displayTextA && !displayTextB) return null;

          return (
            <div key={item.id}>
              {unreadFromIndex !== null && unreadFromIndex !== undefined && index === unreadFromIndex && (
                <UnreadSeparator />
              )}
              <div className="grid grid-cols-2 gap-8">
              {/* Left Cell - Language A */}
              <div className="pr-6 border-r border-white/10">
                {displayTextA ? (
                  <div className="text-white animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-plum-300 font-medium text-sm">
                        {item.participantName}
                        {item.speaker && ` (Speaker ${item.speaker})`}
                        {isTranslatedA && <span className="text-emerald-400 text-xs ml-1.5">(translated)</span>}
                      </span>
                      <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {langACode}
                      </span>
                    </div>
                    <p className="text-white text-xl leading-relaxed">
                      {displayTextA}
                      {item.isStreaming && (
                        <span className="inline-block w-2 h-5 ml-1.5 animate-blink bg-plum-400 rounded-sm" />
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-white/30 italic text-sm pt-1">
                    {item.isStreaming ? 'Translating...' : 'Waiting for translation...'}
                  </div>
                )}
              </div>

              {/* Right Cell - Language B */}
              <div className="pl-6">
                {displayTextB ? (
                  <div className="text-white animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-plum-300 font-medium text-sm">
                        {item.participantName}
                        {item.speaker && ` (Speaker ${item.speaker})`}
                        {isTranslatedB && <span className="text-emerald-400 text-xs ml-1.5">(translated)</span>}
                      </span>
                      <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {langBCode}
                      </span>
                    </div>
                    <p className="text-white text-xl leading-relaxed">
                      {displayTextB}
                      {item.isStreaming && (
                        <span className="inline-block w-2 h-5 ml-1.5 animate-blink bg-plum-400 rounded-sm" />
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-white/30 italic text-sm pt-1">
                    {item.isStreaming ? 'Translating...' : 'Waiting for translation...'}
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
