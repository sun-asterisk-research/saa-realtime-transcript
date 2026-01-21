'use client';

import { Button } from '@/components/button';
import useTranscribe from '@/lib/useTranscribe';
import getAPIKey from '@/lib/utils';
import { isActiveState } from '@soniox/speech-to-text-web';

export default function Transcribe() {
  const { state, finalTokens, nonFinalTokens, startTranscription, stopTranscription } = useTranscribe({
    apiKey: getAPIKey,
  });

  const allTokens = [...finalTokens, ...nonFinalTokens];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Show current transcription */}
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {allTokens.map((token, idx) => {
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
          ✋ Stop transcription
        </Button>
      ) : (
        <Button onClick={startTranscription}>🎙️ Start transcription</Button>
      )}
    </div>
  );
}
