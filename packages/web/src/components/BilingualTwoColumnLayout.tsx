import { Token } from '@soniox/speech-to-text-web';

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
}

export function BilingualTwoColumnLayout({
  items,
  mode,
  targetLanguage,
  languageA,
  languageB,
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
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Original Language */}
        <div className="border-r border-white/10 pr-6">
          <div className="sticky top-0 z-20 bg-gradient-to-b from-plum-800 to-plum-800/95 pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6 backdrop-blur-sm">
            <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Original Language
            </h3>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`original-${item.id}`} className="text-white animate-fadeIn">
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
            ))}
          </div>
        </div>

        {/* Right Column - Translated Language */}
        <div className="pl-6">
          <div className="sticky top-0 z-20 bg-gradient-to-b from-plum-800 to-plum-800/95 pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6 backdrop-blur-sm">
            <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Translated ({targetLanguage?.toUpperCase()})
            </h3>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`translated-${item.id}`} className="text-white animate-fadeIn">
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
            ))}
          </div>
        </div>
      </div>
    );
  }

  // TWO-WAY MODE: Language A | Language B
  const langACode = languageA?.toUpperCase() || 'LANG A';
  const langBCode = languageB?.toUpperCase() || 'LANG B';

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left Column - Language A */}
      <div className="border-r border-white/10 pr-6">
        <div className="sticky top-0 z-20 bg-gradient-to-b from-plum-800 to-plum-800/95 pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6 backdrop-blur-sm">
          <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {langACode}
          </h3>
        </div>
        <div className="space-y-4">
          {items.map((item) => {
            // Determine if this text belongs to language A
            const isOriginalA = item.sourceLanguage === languageA;
            const isTranslatedA = item.targetLanguage === languageA;
            const isTranslated = isTranslatedA && !isOriginalA;

            // Get the text to display
            const displayText = isOriginalA ? item.originalText : item.translatedText;

            if (!displayText) return null;

            return (
              <div key={`langA-${item.id}`} className="text-white animate-fadeIn">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-plum-300 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                    {isTranslated && <span className="text-emerald-400 text-xs ml-1.5">(translated)</span>}
                  </span>
                  <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                    {langACode}
                  </span>
                </div>
                <p className="text-white text-xl leading-relaxed">
                  {displayText}
                  {item.isStreaming && (
                    <span className="inline-block w-2 h-5 ml-1.5 animate-blink bg-plum-400 rounded-sm" />
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Language B */}
      <div className="pl-6">
        <div className="sticky top-0 z-20 bg-gradient-to-b from-plum-800 to-plum-800/95 pt-6 pb-4 mb-4 border-b border-white/10 shadow-lg -mt-6 backdrop-blur-sm">
          <h3 className="text-plum-200 font-semibold text-lg uppercase tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {langBCode}
          </h3>
        </div>
        <div className="space-y-4">
          {items.map((item) => {
            // Determine if this text belongs to language B
            const isOriginalB = item.sourceLanguage === languageB;
            const isTranslatedB = item.targetLanguage === languageB;
            const isTranslated = isTranslatedB && !isOriginalB;

            // Get the text to display
            const displayText = isOriginalB ? item.originalText : item.translatedText;

            if (!displayText) return null;

            return (
              <div key={`langB-${item.id}`} className="text-white animate-fadeIn">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-plum-300 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                    {isTranslated && <span className="text-emerald-400 text-xs ml-1.5">(translated)</span>}
                  </span>
                  <span className="bg-white/10 text-plum-200 text-xs px-2 py-0.5 rounded-full font-medium">
                    {langBCode}
                  </span>
                </div>
                <p className="text-white text-xl leading-relaxed">
                  {displayText}
                  {item.isStreaming && (
                    <span className="inline-block w-2 h-5 ml-1.5 animate-blink bg-plum-400 rounded-sm" />
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
