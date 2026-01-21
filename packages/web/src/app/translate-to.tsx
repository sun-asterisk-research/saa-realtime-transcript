'use client';

import { Button } from '@/components/button';
import useTranscribe from '@/lib/useTranscribe';
import getAPIKey from '@/lib/utils';
import { isActiveState, type Context } from '@soniox/speech-to-text-web';

// Context for Sun Asterisk Vietnam
const sunAsteriskContext: Context = {
  general: [
    { key: 'domain', value: 'Technology' },
    { key: 'topic', value: 'Software development and IT consulting' },
    { key: 'organization', value: 'Sun Asterisk Vietnam' },
    { key: 'country', value: 'Vietnam' },
    { key: 'industry', value: 'Digital transformation and software outsourcing' },
  ],
  text: 'Sun Asterisk là công ty công nghệ hàng đầu tại Việt Nam, chuyên về phát triển phần mềm, chuyển đổi số và tư vấn IT. Công ty có trụ sở chính tại Hà Nội và các văn phòng tại TP. Hồ Chí Minh, Đà Nẵng. Sun Asterisk cung cấp các dịch vụ như phát triển ứng dụng web, mobile, AI/ML, và các giải pháp cloud. Công ty hợp tác với nhiều đối tác Nhật Bản và quốc tế.',
  terms: [
    'Sun Asterisk',
    'Sun*',
    'Awesome Ars Academia',
    'xLab',
    'Viblo',
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'chuyển đổi số',
    'digital transformation',
    'offshore development',
    'outsourcing',
    'agile',
    'scrum',
    'DevOps',
    'CI/CD',
    'microservices',
    'cloud computing',
    'AWS',
    'Azure',
    'GCP',
  ],
  translation_terms: [
    { source: 'Sun Asterisk', target: 'Sun Asterisk' },
    { source: 'Sun*', target: 'Sun Asterisk' },
    { source: 'chuyển đổi số', target: 'digital transformation' },
    { source: 'phát triển phần mềm', target: 'software development' },
    { source: 'Hà Nội', target: 'Hanoi' },
    { source: 'TP. Hồ Chí Minh', target: 'Ho Chi Minh City' },
    { source: 'Đà Nẵng', target: 'Da Nang' },
    { source: 'công nghệ thông tin', target: 'information technology' },
    { source: 'trí tuệ nhân tạo', target: 'artificial intelligence' },
    { source: 'học máy', target: 'machine learning' },
  ],
};

export default function TranslateTo() {
  const { state, finalTokens, nonFinalTokens, startTranscription, stopTranscription } = useTranscribe({
    apiKey: getAPIKey,
    // Translate everything to English
    translationConfig: {
      type: 'one_way',
      target_language: 'en',
    },
    context: sunAsteriskContext,
  });

  const allTokens = [...finalTokens, ...nonFinalTokens];

  const transcriptionTokens = allTokens.filter((token) => token.translation_status !== 'translation');
  const translationTokens = allTokens.filter((token) => token.translation_status === 'translation');

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Show current transcription */}
      <div>Transcription</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {transcriptionTokens.map((token, idx) => {
          return (
            <span key={idx} className={token.is_final ? 'text-black' : 'text-gray-500'}>
              {token.text}
            </span>
          );
        })}
      </div>

      {/* Show translation */}
      <div>Translation</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {translationTokens.map((token, idx) => {
          return (
            <span key={idx} className={token.is_final ? 'text-black' : 'text-gray-500'}>
              {token.text}
            </span>
          );
        })}
      </div>

      {state === 'Error' ? <div className="text-red-500">Error occurred</div> : null}

      {isActiveState(state) ? (
        <Button onClick={stopTranscription} disabled={state === 'FinishingProcessing'}>
          ✋ Stop translation
        </Button>
      ) : (
        <Button onClick={startTranscription}>🎙️ Start translation</Button>
      )}
    </div>
  );
}
