import { MeetDetector, MicButtonMonitor } from './meet-detector';
import { CaptionInjector } from './caption-injector';
import { MeetAudioCapture } from './audio-capture';
import { SonioxWrapper } from '../lib/soniox-wrapper';
import { MessageType, addMessageListener, sendMessage } from '../shared/messaging';
import { AUTH_CALLBACK_PATH } from '../shared/constants';
import { fetchAndMergeContexts } from '../lib/context-utils';
import type { Token, Context } from '@soniox/speech-to-text-web';

console.log('Soniox Meet Content Script loaded');

class MeetContentScript {
  private detector: MeetDetector;
  private micMonitor: MicButtonMonitor;
  private captionInjector: CaptionInjector;
  private audioCapture: MeetAudioCapture;
  private sonioxWrapper: SonioxWrapper;
  private autoSyncEnabled: boolean = true;
  private isTranscribing: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.detector = new MeetDetector();
    this.micMonitor = new MicButtonMonitor();
    this.captionInjector = new CaptionInjector();
    this.audioCapture = new MeetAudioCapture();
    this.sonioxWrapper = new SonioxWrapper();
  }

  async initialize(): Promise<void> {
    // Check if this is the auth callback page
    if (window.location.pathname.includes(AUTH_CALLBACK_PATH)) {
      this.handleAuthCallback();
      return;
    }

    // Check if this is a Meet page
    if (!this.detector.isMeetPage()) {
      console.log('Not a Meet page, skipping initialization');
      return;
    }

    if (this.initialized) {
      console.log('Already initialized');
      return;
    }

    console.log('Initializing Soniox Meet Extension on Meet page...');

    try {
      // Wait for Meet UI to load
      await this.detector.waitForMeetUI();

      // Find mic button
      const micButton = await this.micMonitor.findMicButton();
      if (micButton) {
        // Start monitoring mic button state
        this.micMonitor.startMonitoring((isMuted) => {
          this.handleMicStateChange(isMuted);
        });
      } else {
        console.warn('Mic button not found - auto-sync disabled');
        this.autoSyncEnabled = false;
      }

      // Hide native captions
      this.captionInjector.hideNativeCaptions();

      // Setup message listeners
      this.setupMessageListeners();

      this.initialized = true;
      console.log('Soniox Meet Extension initialized successfully');
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }

  private handleMicStateChange(isMuted: boolean): void {
    console.log('Meet mic state changed:', isMuted ? 'MUTED' : 'UNMUTED');

    // Notify background script
    sendMessage({
      type: MessageType.MEET_MIC_STATE_CHANGED,
      payload: { isMuted },
    }).catch((error) => {
      console.error('Failed to send mic state change:', error);
    });

    // Auto-sync transcription if enabled
    if (this.autoSyncEnabled) {
      if (isMuted) {
        // Mic muted → stop transcription
        if (this.isTranscribing) {
          console.log('Auto-stopping transcription (mic muted)');
          this.stopTranscription();
        }
      } else {
        // Mic unmuted → start transcription
        if (!this.isTranscribing) {
          console.log('Auto-starting transcription (mic unmuted)');
          this.startTranscription();
        }
      }
    }
  }

  private setupMessageListeners(): void {
    addMessageListener((message, sender, sendResponse) => {
      switch (message.type) {
        case MessageType.START_TRANSCRIPTION:
          this.startTranscription(message.payload);
          sendResponse({ success: true });
          break;

        case MessageType.STOP_TRANSCRIPTION:
          this.stopTranscription();
          sendResponse({ success: true });
          break;

        case MessageType.UPDATE_CAPTIONS:
          this.captionInjector.updateCaptions(message.payload.tokens);
          break;

        case MessageType.CLEAR_CAPTIONS:
          this.captionInjector.clearCaptions();
          break;
      }
    });

    console.log('Message listeners setup complete');
  }

  private async startTranscription(options?: { contextIds?: string[] }): Promise<void> {
    if (this.isTranscribing) {
      console.log('Already transcribing');
      return;
    }

    try {
      console.log('Starting transcription...', options);

      // Capture audio from Meet tab
      const audioStream = await this.audioCapture.captureTabAudio();
      console.log('Audio stream captured');

      // Fetch and merge contexts based on contextIds
      let context: Context | undefined;
      if (options?.contextIds && options.contextIds.length > 0) {
        context = await fetchAndMergeContexts(options.contextIds);
        console.log('Using context:', context);
      }

      // Start Soniox transcription
      await this.sonioxWrapper.start({
        context,
        targetLanguage: options?.targetLanguage || 'en',
        audioStream,
        onStateChange: (state) => {
          console.log('Transcription state:', state);
          sendMessage({
            type: MessageType.TRANSCRIPTION_STATE_CHANGED,
            payload: { state },
          }).catch((error) => {
            console.error('Failed to send state change:', error);
          });
        },
        onTokensUpdate: (finalTokens: Token[], nonFinalTokens: Token[]) => {
          // Filter translation tokens (if translation is enabled)
          const allTokens = [...finalTokens, ...nonFinalTokens];

          // For now, show all tokens
          // TODO: Filter by translation_status when translation is enabled
          this.captionInjector.updateCaptions(allTokens);
        },
        onError: (error) => {
          console.error('Transcription error:', error);
          sendMessage({
            type: MessageType.ERROR,
            payload: { error },
          }).catch(() => {});
          this.isTranscribing = false;
        },
      });

      this.isTranscribing = true;
      console.log('Transcription started');
    } catch (error) {
      console.error('Failed to start transcription:', error);
      sendMessage({
        type: MessageType.ERROR,
        payload: { error: `Failed to start: ${(error as Error).message}` },
      }).catch(() => {});
    }
  }

  private stopTranscription(): void {
    if (!this.isTranscribing) {
      console.log('Not transcribing');
      return;
    }

    console.log('Stopping transcription...');

    try {
      this.sonioxWrapper.stop();
      this.audioCapture.stopCapture();
      this.captionInjector.clearCaptions();
      this.isTranscribing = false;
      console.log('Transcription stopped');
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }

  private handleAuthCallback(): void {
    console.log('[ContentScript] Auth callback page detected');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('[ContentScript] Token from URL:', token ? token.substring(0, 20) + '...' : 'null');

    if (token) {
      console.log('[ContentScript] Sending token to background...');
      sendMessage({
        type: MessageType.AUTH_CALLBACK,
        payload: { token },
      }).then(() => {
        console.log('[ContentScript] Token sent successfully');
      }).catch(error => {
        console.error('[ContentScript] Failed to send token:', error);
      });
    } else {
      console.error('[ContentScript] No token found in URL');
    }
  }
}

// Listen for postMessage from auth callback page
console.log('[ContentScript] Setting up postMessage listener on:', window.location.href);
window.addEventListener('message', (event) => {
  console.log('[ContentScript] Received postMessage event:', event.data);

  // Only accept messages from same origin
  if (event.source !== window) {
    console.log('[ContentScript] Ignoring message - not from window');
    return;
  }

  if (event.data.type === 'SONIOX_EXTENSION_AUTH') {
    console.log('[ContentScript] Received token via postMessage');
    const token = event.data.token;

    if (token) {
      console.log('[ContentScript] Sending token to background via postMessage...', token.substring(0, 20) + '...');
      sendMessage({
        type: MessageType.AUTH_CALLBACK,
        payload: { token },
      }).then(() => {
        console.log('[ContentScript] Token sent successfully via postMessage');
      }).catch(error => {
        console.error('[ContentScript] Failed to send token via postMessage:', error);
      });
    }
  } else {
    console.log('[ContentScript] Ignoring message - wrong type:', event.data.type);
  }
});
console.log('[ContentScript] postMessage listener setup complete');

// Initialize content script
const meetScript = new MeetContentScript();
meetScript.initialize();
