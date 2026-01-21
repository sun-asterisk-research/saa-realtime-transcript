import { SonioxClient, type Token, type RecorderState, type Context } from '@soniox/speech-to-text-web';
import { webAppAPI } from './web-app-api';

// Wrapper around SonioxClient for extension-specific logic
// Based on useTranscribe.ts from web app

const END_TOKEN = '<end>';

interface SonioxWrapperOptions {
  context?: Context;
  targetLanguage?: string;
  audioStream?: MediaStream;
  onStateChange: (state: RecorderState) => void;
  onTokensUpdate: (finalTokens: Token[], nonFinalTokens: Token[]) => void;
  onError: (error: string) => void;
}

export class SonioxWrapper {
  private client: SonioxClient | null = null;
  private finalTokens: Token[] = [];
  private nonFinalTokens: Token[] = [];

  async start(options: SonioxWrapperOptions): Promise<void> {
    // Initialize client if not exists
    if (!this.client) {
      this.client = new SonioxClient({
        apiKey: async () => {
          // Fetch temporary API key from web app with retry
          console.log('Fetching temporary API key...');
          return await webAppAPI.getTemporaryApiKeyWithRetry();
        },
      });
    }

    // Reset tokens
    this.finalTokens = [];
    this.nonFinalTokens = [];

    console.log('Starting Soniox client...');

    // Build translation config
    const translationConfig = options.targetLanguage
      ? {
          type: 'one_way' as const,
          target_language: options.targetLanguage,
        }
      : undefined;

    // Start transcription with same config as web app
    await this.client.start({
      model: 'stt-rt-preview',
      enableLanguageIdentification: true,
      enableSpeakerDiarization: true,
      enableEndpointDetection: true,
      translation: translationConfig,
      context: options.context,
      stream: options.audioStream, // Use captured audio stream

      onStarted: () => {
        console.log('Soniox transcription started');
      },

      onFinished: () => {
        console.log('Soniox transcription finished');
      },

      onError: (status, message, errorCode) => {
        console.error('Soniox error:', status, message, errorCode);
        options.onError(`${status}: ${message}`);
      },

      onStateChange: ({ newState }) => {
        console.log('Soniox state changed:', newState);
        options.onStateChange(newState);
      },

      // When we receive tokens, sort them into final and non-final
      onPartialResult: (result) => {
        const newFinalTokens: Token[] = [];
        const newNonFinalTokens: Token[] = [];

        for (const token of result.tokens) {
          // Ignore endpoint detection tokens
          if (token.text === END_TOKEN) {
            continue;
          }

          if (token.is_final) {
            newFinalTokens.push(token);
          } else {
            newNonFinalTokens.push(token);
          }
        }

        // Accumulate final tokens
        this.finalTokens.push(...newFinalTokens);
        // Replace non-final tokens (they change as transcription progresses)
        this.nonFinalTokens = newNonFinalTokens;

        // Notify callback with updated tokens
        options.onTokensUpdate(this.finalTokens, this.nonFinalTokens);
      },
    });
  }

  stop(): void {
    if (this.client) {
      console.log('Stopping Soniox client...');
      this.client.stop();
    }
  }

  cancel(): void {
    if (this.client) {
      console.log('Canceling Soniox client...');
      this.client.cancel();
    }
  }

  getState(): RecorderState {
    return this.client?.state || 'Init';
  }

  getFinalTokens(): Token[] {
    return this.finalTokens;
  }

  getNonFinalTokens(): Token[] {
    return this.nonFinalTokens;
  }
}
