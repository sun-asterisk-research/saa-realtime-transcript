import { authManager } from './auth-manager';
import { MessageType, addMessageListener } from '../shared/messaging';
import type { ExtensionState } from '../shared/types';

console.log('Service worker started');

// State manager
class StateManager {
  async getState(): Promise<ExtensionState> {
    const storage = await chrome.storage.local.get(['state', 'authState']);
    console.log('[StateManager] Raw storage:', storage);

    // Use stored state if available, otherwise default
    const state = storage.state || this.getDefaultState();

    // If we have authState separately stored (from auth-manager), use it
    if (storage.authState) {
      console.log('[StateManager] Found separate authState, merging...');
      state.auth = storage.authState;
    }

    console.log('[StateManager] Final state:', state);
    return state;
  }

  async setState(updates: Partial<ExtensionState>): Promise<void> {
    const currentState = await this.getState();
    const newState = { ...currentState, ...updates };
    await chrome.storage.local.set({ state: newState });

    // Notify all listeners
    chrome.runtime.sendMessage({
      type: MessageType.STATE_CHANGED,
      payload: { state: newState },
    }).catch(() => {
      // Ignore errors if no listeners
    });
  }

  private getDefaultState(): ExtensionState {
    return {
      auth: {
        isAuthenticated: false,
        sessionToken: null,
        userEmail: null,
        userName: null,
        expiresAt: null,
      },
      transcription: {
        isActive: false,
        state: 'Init',
        selectedContextIds: [],
      },
      meetSync: {
        isMicMuted: false,
        autoSyncEnabled: true,
      },
    };
  }
}

const stateManager = new StateManager();

// Message handlers
addMessageListener((message, sender, sendResponse) => {
  console.log('[ServiceWorker] Received message:', message.type, 'from:', sender.tab ? 'tab' : 'popup');

  switch (message.type) {
    case MessageType.AUTH_INIT_LOGIN:
      console.log('[ServiceWorker] Handling AUTH_INIT_LOGIN');
      authManager.initiateLogin().then(() => {
        console.log('[ServiceWorker] Login initiated');
        sendResponse({ success: true });
      });
      return true;

    case MessageType.AUTH_CALLBACK:
      console.log('[ServiceWorker] Handling AUTH_CALLBACK');
      authManager.handleAuthCallback(message.payload.token).then(() => {
        console.log('[ServiceWorker] Auth callback handled successfully');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[ServiceWorker] Auth callback failed:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case MessageType.AUTH_LOGOUT:
      authManager.logout().then(() => {
        sendResponse({ success: true });
      });
      return true;

    case MessageType.AUTH_CHECK_STATUS:
      authManager.getAuthState().then((authState) => {
        sendResponse({ authState });
      });
      return true;

    case MessageType.GET_STATE:
      console.log('[ServiceWorker] Handling GET_STATE');
      stateManager.getState().then((state) => {
        console.log('[ServiceWorker] Returning state:', state);
        sendResponse(state);
      });
      return true;

    case MessageType.REQUEST_TAB_CAPTURE:
      console.log('[ServiceWorker] Handling REQUEST_TAB_CAPTURE from tab:', sender.tab?.id);

      if (!sender.tab?.id) {
        console.error('[ServiceWorker] No tab ID in sender');
        sendResponse({ error: 'No tab ID' });
        return;
      }

      try {
        chrome.tabCapture.getMediaStreamId({ targetTabId: sender.tab.id }, (streamId) => {
          if (chrome.runtime.lastError) {
            console.error('[ServiceWorker] Tab capture error:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log('[ServiceWorker] Tab capture stream ID obtained:', streamId);
            sendResponse({ streamId });
          }
        });
      } catch (error) {
        console.error('[ServiceWorker] Tab capture exception:', error);
        sendResponse({ error: (error as Error).message });
      }
      return true;

    case MessageType.MEET_MIC_STATE_CHANGED:
      stateManager.setState({
        meetSync: {
          isMicMuted: message.payload.isMuted,
          autoSyncEnabled: true, // Keep existing value
        },
      });
      break;

    case MessageType.TRANSCRIPTION_STATE_CHANGED:
      stateManager.getState().then(async (state) => {
        await stateManager.setState({
          transcription: {
            ...state.transcription,
            state: message.payload.state,
            isActive: message.payload.state === 'Running',
          },
        });
      });
      break;

    case MessageType.FETCH_CONTEXTS:
      // Fetch contexts from web app API
      (async () => {
        try {
          const { webAppAPI } = await import('../lib/web-app-api');
          const contexts = await webAppAPI.getContextSets();

          // Send contexts to popup
          chrome.runtime.sendMessage({
            type: MessageType.CONTEXTS_LOADED,
            payload: { contexts },
          }).catch(() => {
            // Ignore errors if popup is closed
          });

          sendResponse({ success: true, contexts });
        } catch (error) {
          console.error('Failed to fetch contexts:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      return true;

    case MessageType.CONTEXT_SELECTED:
      // Save selected context IDs to state
      stateManager.getState().then(async (state) => {
        await stateManager.setState({
          transcription: {
            ...state.transcription,
            selectedContextIds: message.payload.contextIds,
          },
        });
      });
      break;

    case MessageType.START_TRANSCRIPTION:
      // Forward to active Meet tab
      console.log('[ServiceWorker] Forwarding START_TRANSCRIPTION to Meet tab');
      chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
        if (tabs.length === 0) {
          console.error('[ServiceWorker] No Meet tabs found');
          sendResponse({ success: false, error: 'No Google Meet tab found. Please open a Meet call first.' });
          return;
        }

        const meetTab = tabs[0];
        console.log('[ServiceWorker] Sending to Meet tab:', meetTab.id);

        chrome.tabs.sendMessage(meetTab.id!, {
          type: MessageType.START_TRANSCRIPTION,
          payload: message.payload,
        }).then(() => {
          console.log('[ServiceWorker] START_TRANSCRIPTION sent to Meet tab');
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('[ServiceWorker] Failed to send to Meet tab:', error);
          sendResponse({ success: false, error: error.message });
        });
      });
      return true;

    case MessageType.STOP_TRANSCRIPTION:
      // Forward to active Meet tab
      console.log('[ServiceWorker] Forwarding STOP_TRANSCRIPTION to Meet tab');
      chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
        if (tabs.length === 0) {
          console.error('[ServiceWorker] No Meet tabs found');
          sendResponse({ success: false, error: 'No Google Meet tab found' });
          return;
        }

        const meetTab = tabs[0];
        chrome.tabs.sendMessage(meetTab.id!, {
          type: MessageType.STOP_TRANSCRIPTION,
        }).then(() => {
          console.log('[ServiceWorker] STOP_TRANSCRIPTION sent to Meet tab');
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('[ServiceWorker] Failed to send to Meet tab:', error);
          sendResponse({ success: false, error: error.message });
        });
      });
      return true;
  }
});

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle tab updates - detect when user navigates away from Meet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && !changeInfo.url.includes('meet.google.com')) {
    // User navigated away from Meet - could stop transcription here
    console.log('Navigated away from Meet');
  }
});

// Handle tab removal - cleanup if Meet tab is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab closed:', tabId);
  // Could stop transcription here if the closed tab was a Meet tab
});
