import type { RecorderState, Token } from '@soniox/speech-to-text-web';
import type { ExtensionState, UserInfo } from './types';

// Message types between components
export enum MessageType {
  // Auth
  AUTH_INIT_LOGIN = 'AUTH_INIT_LOGIN',
  AUTH_CALLBACK = 'AUTH_CALLBACK',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_CHECK_STATUS = 'AUTH_CHECK_STATUS',

  // State
  GET_STATE = 'GET_STATE',
  STATE_CHANGED = 'STATE_CHANGED',

  // Transcription control
  START_TRANSCRIPTION = 'START_TRANSCRIPTION',
  STOP_TRANSCRIPTION = 'STOP_TRANSCRIPTION',
  TRANSCRIPTION_STATE_CHANGED = 'TRANSCRIPTION_STATE_CHANGED',

  // Captions
  UPDATE_CAPTIONS = 'UPDATE_CAPTIONS',
  CLEAR_CAPTIONS = 'CLEAR_CAPTIONS',

  // Context
  CONTEXT_SELECTED = 'CONTEXT_SELECTED',
  FETCH_CONTEXTS = 'FETCH_CONTEXTS',
  CONTEXTS_LOADED = 'CONTEXTS_LOADED',

  // Mic sync
  MEET_MIC_STATE_CHANGED = 'MEET_MIC_STATE_CHANGED',

  // Tab capture
  REQUEST_TAB_CAPTURE = 'REQUEST_TAB_CAPTURE',
  TAB_CAPTURE_RESPONSE = 'TAB_CAPTURE_RESPONSE',

  // Errors
  ERROR = 'ERROR',
}

// Message payloads
export interface AuthCallbackPayload {
  token: string;
}

export interface AuthSuccessPayload {
  user: UserInfo;
}

export interface StartTranscriptionPayload {
  contextIds?: string[];
  targetLanguage?: string;
}

export interface TranscriptionStateChangedPayload {
  state: RecorderState;
}

export interface UpdateCaptionsPayload {
  tokens: Token[];
}

export interface MeetMicStateChangedPayload {
  isMuted: boolean;
}

export interface TabCaptureResponsePayload {
  streamId?: string;
  error?: string;
}

export interface ErrorPayload {
  error: string;
  details?: string;
}

export interface StateChangedPayload {
  state: ExtensionState;
}

export interface ContextsLoadedPayload {
  contexts: any[];
}

// Message type
export type Message =
  | { type: MessageType.AUTH_INIT_LOGIN }
  | { type: MessageType.AUTH_CALLBACK; payload: AuthCallbackPayload }
  | { type: MessageType.AUTH_SUCCESS; payload: AuthSuccessPayload }
  | { type: MessageType.AUTH_LOGOUT }
  | { type: MessageType.AUTH_CHECK_STATUS }
  | { type: MessageType.GET_STATE }
  | { type: MessageType.STATE_CHANGED; payload: StateChangedPayload }
  | { type: MessageType.START_TRANSCRIPTION; payload?: StartTranscriptionPayload }
  | { type: MessageType.STOP_TRANSCRIPTION }
  | { type: MessageType.TRANSCRIPTION_STATE_CHANGED; payload: TranscriptionStateChangedPayload }
  | { type: MessageType.UPDATE_CAPTIONS; payload: UpdateCaptionsPayload }
  | { type: MessageType.CLEAR_CAPTIONS }
  | { type: MessageType.CONTEXT_SELECTED; payload: { contextIds: string[] } }
  | { type: MessageType.FETCH_CONTEXTS }
  | { type: MessageType.CONTEXTS_LOADED; payload: ContextsLoadedPayload }
  | { type: MessageType.MEET_MIC_STATE_CHANGED; payload: MeetMicStateChangedPayload }
  | { type: MessageType.REQUEST_TAB_CAPTURE }
  | { type: MessageType.TAB_CAPTURE_RESPONSE; payload: TabCaptureResponsePayload }
  | { type: MessageType.ERROR; payload: ErrorPayload };

// Typed message sender
export function sendMessage(message: Message): Promise<any> {
  return chrome.runtime.sendMessage(message);
}

// Typed message listener
export function addMessageListener(
  callback: (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void | boolean | Promise<void>
): void {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const result = callback(msg as Message, sender, sendResponse);
    // Return true to keep the message channel open for async responses
    if (result instanceof Promise) {
      result.then(sendResponse);
      return true;
    }
    return result;
  });
}
