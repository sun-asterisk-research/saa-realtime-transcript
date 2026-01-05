import type { RecorderState, Context, Token } from '@soniox/speech-to-text-web';

// Auth state stored in chrome.storage
export interface AuthState {
  isAuthenticated: boolean;
  sessionToken: string | null;
  userEmail: string | null;
  userName: string | null;
  expiresAt: number | null;
}

// Extension state stored in chrome.storage
export interface ExtensionState {
  auth: AuthState;
  transcription: {
    isActive: boolean;
    state: RecorderState;
    selectedContextIds: string[];
  };
  meetSync: {
    isMicMuted: boolean;
    autoSyncEnabled: boolean;
  };
}

// User info from backend
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

// Context set from backend (simplified for extension)
export interface ContextSetWithDetails {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
}

// API responses
export interface ValidateTokenResponse {
  valid: boolean;
  user?: UserInfo;
}

export interface TemporaryApiKeyResponse {
  apiKey: string;
}

export interface ContextSetsResponse {
  contextSets: ContextSetWithDetails[];
}

export interface SessionContextsResponse {
  contextSets: ContextSetWithDetails[];
  mergedContext: Context;
}
