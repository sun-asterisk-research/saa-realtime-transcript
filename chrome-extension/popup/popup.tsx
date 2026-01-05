import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { RecorderState } from '@soniox/speech-to-text-web';
import { MessageType, sendMessage } from '../shared/messaging';
import type { AuthState, ContextSetWithDetails } from '../shared/types';
import './popup.css';

function isActiveState(state: RecorderState): boolean {
  return ['RequestingMedia', 'OpeningWebSocket', 'Running', 'FinishingProcessing'].includes(state);
}

function Popup() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [contexts, setContexts] = useState<ContextSetWithDetails[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [transcriptionState, setTranscriptionState] = useState<RecorderState>('Init');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('en');

  useEffect(() => {
    console.log('Popup mounted, loading state...');
    loadState();

    // Listen for state updates
    chrome.runtime.onMessage.addListener((msg) => {
      console.log('Popup received message:', msg);
      if (msg.type === MessageType.AUTH_SUCCESS) {
        loadState();
        loadContexts();
      } else if (msg.type === MessageType.AUTH_LOGOUT) {
        setAuthState(null);
        setContexts([]);
        setSelectedContextIds([]);
      } else if (msg.type === MessageType.STATE_CHANGED) {
        if (msg.payload?.state?.transcription) {
          setTranscriptionState(msg.payload.state.transcription.state);
        }
      } else if (msg.type === MessageType.CONTEXTS_LOADED) {
        setContexts(msg.payload.contexts || []);
      } else if (msg.type === MessageType.ERROR) {
        setError(msg.payload.error);
      }
    });
  }, []);

  const loadState = async () => {
    try {
      console.log('Loading state from background...');
      const state = await sendMessage({ type: MessageType.GET_STATE });
      console.log('State loaded:', state);
      console.log('Auth state:', state.auth);

      setAuthState(state.auth);
      setSelectedContextIds(state.transcription.selectedContextIds || []);
      setTranscriptionState(state.transcription.state);
      setIsLoading(false);

      if (state.auth?.isAuthenticated) {
        console.log('User is authenticated, loading contexts...');
        loadContexts();
      } else {
        console.log('User is NOT authenticated');
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      setIsLoading(false);
    }
  };

  const loadContexts = async () => {
    try {
      setIsLoading(true);
      await sendMessage({ type: MessageType.FETCH_CONTEXTS });
    } catch (error) {
      console.error('Failed to load contexts:', error);
      setError('Failed to load contexts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await sendMessage({ type: MessageType.AUTH_INIT_LOGIN });
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await sendMessage({ type: MessageType.AUTH_LOGOUT });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleStartTranscription = async () => {
    try {
      setError(null);
      await sendMessage({
        type: MessageType.START_TRANSCRIPTION,
        payload: {
          contextIds: selectedContextIds,
          targetLanguage,
        },
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setError('Failed to start transcription');
    }
  };

  const handleStopTranscription = async () => {
    try {
      await sendMessage({ type: MessageType.STOP_TRANSCRIPTION });
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  };

  const handleContextToggle = (contextId: string) => {
    setSelectedContextIds((prev) => {
      const newIds = prev.includes(contextId)
        ? prev.filter((id) => id !== contextId)
        : [...prev, contextId];

      // Save to background
      sendMessage({
        type: MessageType.CONTEXT_SELECTED,
        payload: { contextIds: newIds },
      }).catch((error) => {
        console.error('Failed to save context selection:', error);
      });

      return newIds;
    });
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!authState?.isAuthenticated) {
    return (
      <div className="popup-container">
        <header>
          <h2>Soniox Meet Transcription</h2>
        </header>
        <div className="content">
          <p>Login to start transcribing Google Meet calls</p>
          <button onClick={handleLogin} className="btn-primary">
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header>
        <h2>Soniox Meet</h2>
        <div className="user-info">
          <span className="user-email">{authState.userEmail}</span>
          <button onClick={handleLogout} className="btn-link">
            Logout
          </button>
        </div>
      </header>

      <section className="status">
        <div className={`status-indicator ${isActiveState(transcriptionState) ? 'active' : ''}`} />
        <span className="status-text">{transcriptionState}</span>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="contexts">
        <h3>Select Contexts</h3>
        {contexts.length === 0 ? (
          <p className="no-contexts">No contexts available</p>
        ) : (
          <ul className="context-list">
            {contexts.map((ctx) => (
              <li key={ctx.id}>
                <label className="context-item">
                  <input
                    type="checkbox"
                    checked={selectedContextIds.includes(ctx.id)}
                    onChange={() => handleContextToggle(ctx.id)}
                    disabled={isActiveState(transcriptionState)}
                  />
                  <span className="context-name">{ctx.name}</span>
                  {ctx.is_public && <span className="badge">Public</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="language">
        <h3>Translation Language</h3>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          disabled={isActiveState(transcriptionState)}
          className="language-select"
        >
          <option value="en">English</option>
          <option value="vi">Vietnamese (Tiếng Việt)</option>
          <option value="ja">Japanese (日本語)</option>
          <option value="ko">Korean (한국어)</option>
          <option value="zh">Chinese (中文)</option>
          <option value="es">Spanish (Español)</option>
          <option value="fr">French (Français)</option>
          <option value="de">German (Deutsch)</option>
        </select>
      </section>

      <section className="controls">
        {isActiveState(transcriptionState) ? (
          <button onClick={handleStopTranscription} className="btn-stop">
            Stop Transcription
          </button>
        ) : (
          <button onClick={handleStartTranscription} className="btn-start">
            Start Transcription
          </button>
        )}
      </section>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
