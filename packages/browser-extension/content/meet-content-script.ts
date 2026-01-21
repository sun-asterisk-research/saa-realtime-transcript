import { MeetDetector, MicButtonMonitor } from './meet-detector';
import { CaptionInjector } from './caption-injector';
import { MeetAudioCapture } from './audio-capture';
import { SonioxWrapper } from '../lib/soniox-wrapper';
import { SessionManager } from '../lib/session-manager';
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
  private sessionManager: SessionManager;
  private autoSyncEnabled: boolean = true;
  private isTranscribing: boolean = false;
  private initialized: boolean = false;
  private meetingCode: string | null = null;
  private currentTranscriptStartTime: Date | null = null;

  constructor() {
    this.detector = new MeetDetector();
    this.micMonitor = new MicButtonMonitor();
    this.captionInjector = new CaptionInjector();
    this.audioCapture = new MeetAudioCapture();
    this.sonioxWrapper = new SonioxWrapper();
    this.sessionManager = new SessionManager();
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

        // Auto-start transcription if mic is unmuted
        const initialMuted = this.micMonitor.isMuted;
        if (!initialMuted) {
          console.log('Mic is unmuted - auto-starting transcription');
          setTimeout(() => {
            this.startTranscription();
          }, 1000); // Delay to ensure everything is ready
        }
      } else {
        console.warn('Mic button not found - auto-sync disabled');
        this.autoSyncEnabled = false;
      }

      // Hide native captions
      this.captionInjector.hideNativeCaptions();

      // Detect meeting code and join session
      this.meetingCode = this.detector.getMeetingCode();
      if (this.meetingCode) {
        console.log('Detected meeting code:', this.meetingCode);

        const userInfo = this.detector.getCurrentUserInfo();
        if (userInfo) {
          console.log('Detected user info:', userInfo);

          try {
            await this.sessionManager.joinSession(
              this.meetingCode,
              userInfo.displayName,
              userInfo.email
            );
            console.log('Successfully joined Meet session');
          } catch (error) {
            console.error('Failed to join Meet session:', error);
            // Continue anyway - transcription still works locally
          }
        } else {
          console.warn('Could not detect user info - session sync disabled');
        }
      } else {
        console.warn('Could not detect meeting code - session sync disabled');
      }

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

  private async startTranscription(options?: { contextIds?: string[]; targetLanguage?: string }): Promise<void> {
    if (this.isTranscribing) {
      console.log('Already transcribing');
      return;
    }

    try {
      // If no options provided, load from storage
      if (!options) {
        const state = await sendMessage({ type: MessageType.GET_STATE });
        options = {
          contextIds: state.transcription?.selectedContextIds || [],
          targetLanguage: 'en', // Default to English for translation
        };
      }

      console.log('Starting transcription...', options);

      // Initialize transcript start time
      this.currentTranscriptStartTime = new Date();

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
          console.log('[TokensUpdate] Received:', {
            finalCount: finalTokens.length,
            nonFinalCount: nonFinalTokens.length,
            targetLanguage: options?.targetLanguage,
          });

          // Translation display logic:
          // - Non-final tokens: ALWAYS show original (Vietnamese) - màu xanh lá
          // - Final tokens: Show translated (English) if available, otherwise show original (Vietnamese) - màu vàng

          let displayFinalTokens: Token[];
          let displayNonFinalTokens: Token[];

          if (!options?.targetLanguage || options.targetLanguage === 'vi') {
            // No translation - show all tokens as-is
            console.log('[TokensUpdate] No translation enabled, showing all tokens');
            displayFinalTokens = finalTokens;
            displayNonFinalTokens = nonFinalTokens;
          } else {
            // Translation enabled (Vietnamese → English)
            // Follow web app logic:
            // - transcriptionTokens: translation_status !== 'translation' (Vietnamese original)
            // - translationTokens: translation_status === 'translation' (English translation)

            // FINAL: Show ONLY English translation (like web app)
            const translatedFinalTokens = finalTokens.filter(token => {
              return token.translation_status === 'translation';
            });

            const originalFinalTokens = finalTokens.filter(token => {
              return token.translation_status !== 'translation';
            });

            // Prefer translated (English), fallback to original (Vietnamese) if translation not ready yet
            if (translatedFinalTokens.length > 0) {
              displayFinalTokens = translatedFinalTokens;
              console.log('[TokensUpdate] Showing translated tokens (English):', translatedFinalTokens.length);
            } else if (originalFinalTokens.length > 0) {
              displayFinalTokens = originalFinalTokens;
              console.log('[TokensUpdate] No translations yet, showing original tokens (Vietnamese):', originalFinalTokens.length);
            } else {
              displayFinalTokens = [];
              console.log('[TokensUpdate] No final tokens to display');
            }

            // NON-FINAL: Show ONLY Vietnamese original (while speaking)
            const originalNonFinalTokens = nonFinalTokens.filter(token => {
              return token.translation_status !== 'translation';
            });

            displayNonFinalTokens = originalNonFinalTokens;
            console.log('[TokensUpdate] Showing non-final original tokens (Vietnamese):', originalNonFinalTokens.length);

            console.log('[TokensUpdate] Token breakdown:', {
              totalFinal: finalTokens.length,
              translatedFinal: translatedFinalTokens.length,
              originalFinal: originalFinalTokens.length,
              displayingFinal: displayFinalTokens.length,
              totalNonFinal: nonFinalTokens.length,
              originalNonFinal: originalNonFinalTokens.length,
              displayingNonFinal: displayNonFinalTokens.length,
            });
          }

          const filteredFinalTokens = displayFinalTokens;
          const filteredNonFinalTokens = displayNonFinalTokens;

          console.log('[TokensUpdate] Updating captions with:', {
            finalTokens: filteredFinalTokens.length,
            nonFinalTokens: filteredNonFinalTokens.length,
            sampleTokens: [...filteredFinalTokens, ...filteredNonFinalTokens].slice(0, 3),
          });

          // Update local captions
          this.captionInjector.updateCaptions([...filteredFinalTokens, ...filteredNonFinalTokens]);

          // Upload final transcripts to session
          if (this.sessionManager.isInSession() && filteredFinalTokens.length > 0) {
            // Extract original text
            const originalText = finalTokens
              .filter(t => !t.translation_status || t.translation_status !== 'translated')
              .map(t => t.text)
              .join('');

            // Extract translated text (only translated tokens)
            const translatedText = finalTokens
              .filter(t => t.translation_status === 'translated')
              .map(t => t.text)
              .join('');

            // Set start time if not set
            if (!this.currentTranscriptStartTime) {
              this.currentTranscriptStartTime = new Date();
            }

            // Upload to session
            this.sessionManager.queueTranscript(
              originalText || filteredFinalTokens.map(t => t.text).join(''),
              translatedText || undefined,
              true, // is_final
              this.currentTranscriptStartTime,
              new Date() // end time
            );

            console.log('[SessionManager] Queued transcript:', {
              originalLength: originalText.length,
              translatedLength: translatedText.length,
            });

            // Reset start time for next segment
            this.currentTranscriptStartTime = new Date();
          }
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
      this.currentTranscriptStartTime = null; // Reset start time
      this.isTranscribing = false;
      console.log('Transcription stopped');
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }

  private async cleanup(): Promise<void> {
    console.log('Cleaning up extension...');

    // Stop transcription if active
    if (this.isTranscribing) {
      this.stopTranscription();
    }

    // Leave session (will flush remaining transcripts)
    if (this.sessionManager.isInSession()) {
      await this.sessionManager.leaveSession();
    }

    console.log('Cleanup complete');
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

// Cleanup on page unload (user leaves meeting or closes tab)
window.addEventListener('beforeunload', () => {
  console.log('[ContentScript] Page unloading, cleaning up...');
  meetScript['cleanup'](); // Call private cleanup method
});
