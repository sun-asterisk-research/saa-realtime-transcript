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

// Context set from backend
export interface ContextSetWithDetails {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  terms: Array<{ term: string; sort_order: number }>;
  general: Array<{ key: string; value: string }>;
  translation_terms: Array<{ source: string; target: string; sort_order: number }>;
  text?: string;
  term_count: number;
  general_count: number;
  translation_term_count: number;
}

// Meet Session Types (for collaboration)
export type MeetSessionStatus = 'active' | 'ended';

export interface MeetSession {
  id: string;
  meeting_code: string;
  created_at: string;
  ended_at: string | null;
  status: MeetSessionStatus;
  total_participants: number;
  total_transcripts: number;
}

export interface MeetSessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
}

export interface MeetTranscript {
  id: string;
  session_id: string;
  participant_id: string;
  text: string;
  translated_text: string | null;
  is_final: boolean;
  start_time: string;
  end_time: string | null;
  created_at: string;
}

export interface JoinMeetSessionResponse {
  session: MeetSession;
  participant: MeetSessionParticipant;
}

export interface MeetSessionWithParticipants extends MeetSession {
  participants: MeetSessionParticipant[];
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
