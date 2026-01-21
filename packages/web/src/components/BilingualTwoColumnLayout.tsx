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
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>Waiting for transcription...</p>
      </div>
    );
  }

  // ONE-WAY MODE: Original | Translated
  if (mode === 'one_way') {
    return (
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Original Language */}
        <div className="border-r border-slate-700 pr-6">
          <div className="sticky top-0 z-20 bg-[#092432] pt-6 pb-4 mb-4 border-b border-slate-500/50 shadow-lg -mt-6">
            <h3 className="text-slate-300 font-semibold text-lg uppercase tracking-wide">
              Original Language
            </h3>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`original-${item.id}`} className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                  </span>
                  {item.sourceLanguage && (
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.sourceLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-white text-2xl">
                  {item.originalText}
                  {item.isStreaming && (
                    <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Translated Language */}
        <div className="pl-6">
          <div className="sticky top-0 z-20 bg-[#092432] pt-6 pb-4 mb-4 border-b border-slate-500/50 shadow-lg -mt-6">
            <h3 className="text-slate-300 font-semibold text-lg uppercase tracking-wide">
              Translated ({targetLanguage?.toUpperCase()})
            </h3>
          </div>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`translated-${item.id}`} className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                    <span className="text-green-500 text-xs ml-1">(translated)</span>
                  </span>
                  {item.targetLanguage && (
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.targetLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-white text-2xl">
                  {item.translatedText || (
                    <span className="italic text-slate-500">
                      {item.isStreaming ? 'Translating...' : 'No translation'}
                    </span>
                  )}
                  {item.isStreaming && item.translatedText && (
                    <span className="inline-block w-2 h-6 bg-yellow-400 ml-1 animate-blink" />
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
      <div className="border-r border-slate-700 pr-6">
        <div className="sticky top-0 z-20 bg-[#092432] pt-6 pb-4 mb-4 border-b border-slate-500/50 shadow-lg -mt-6">
          <h3 className="text-slate-300 font-semibold text-lg uppercase tracking-wide">
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
              <div key={`langA-${item.id}`} className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                    {isTranslated && <span className="text-green-500 text-xs ml-1">(translated)</span>}
                  </span>
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                    {langACode}
                  </span>
                </div>
                <p className="text-white text-2xl">
                  {displayText}
                  {item.isStreaming && (
                    <span className="inline-block w-2 h-6 ml-1 animate-blink bg-yellow-400" />
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Language B */}
      <div className="pl-6">
        <div className="sticky top-0 z-20 bg-[#092432] pt-6 pb-4 mb-4 border-b border-slate-500/50 shadow-lg -mt-6">
          <h3 className="text-slate-300 font-semibold text-lg uppercase tracking-wide">
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
              <div key={`langB-${item.id}`} className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-medium text-sm">
                    {item.participantName}
                    {item.speaker && ` (Speaker ${item.speaker})`}
                    {isTranslated && <span className="text-green-500 text-xs ml-1">(translated)</span>}
                  </span>
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                    {langBCode}
                  </span>
                </div>
                <p className="text-white text-2xl">
                  {displayText}
                  {item.isStreaming && (
                    <span className="inline-block w-2 h-6 ml-1 animate-blink bg-yellow-400" />
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
