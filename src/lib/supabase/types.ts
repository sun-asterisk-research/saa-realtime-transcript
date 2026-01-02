export type TranslationMode = 'one_way' | 'two_way';
export type SessionStatus = 'active' | 'ended';

export interface Session {
  id: string;
  code: string;
  host_name: string;
  mode: TranslationMode;
  target_language: string | null;
  language_a: string | null;
  language_b: string | null;
  status: SessionStatus;
  created_at: string;
  ended_at: string | null;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  preferred_language: string | null;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
}

export interface Transcript {
  id: string;
  session_id: string;
  participant_id: string | null;
  participant_name: string;
  original_text: string;
  translated_text: string | null;
  source_language: string | null;
  target_language: string | null;
  is_final: boolean;
  sequence_number: number;
  created_at: string;
}

// Context Management Types
export interface ContextSet {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  text: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextSetTerm {
  id: string;
  context_set_id: string;
  term: string;
  sort_order: number;
  created_at: string;
}

export interface ContextSetGeneral {
  id: string;
  context_set_id: string;
  key: string;
  value: string;
  created_at: string;
}

export interface ContextSetTranslationTerm {
  id: string;
  context_set_id: string;
  source: string;
  target: string;
  sort_order: number;
  created_at: string;
}

export interface SessionContextSet {
  id: string;
  session_id: string;
  context_set_id: string;
  sort_order: number;
  added_at: string;
}

// Enriched types for display
export interface ContextSetWithDetails extends ContextSet {
  terms: ContextSetTerm[];
  general: ContextSetGeneral[];
  translation_terms: ContextSetTranslationTerm[];
  term_count?: number;
  general_count?: number;
  translation_term_count?: number;
}

// Form input types
export interface ContextSetFormData {
  name: string;
  description?: string;
  text?: string;
  is_public: boolean;
  terms: string[];
  general: Array<{ key: string; value: string }>;
  translation_terms: Array<{ source: string; target: string }>;
}

// Soniox Context type (matches SDK structure)
export interface Context {
  terms?: string[];
  general?: Array<{ key: string; value: string }>;
  text?: string;
  translation_terms?: Array<{ source: string; target: string }>;
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'ended_at' | 'status'> & {
          id?: string;
          created_at?: string;
          ended_at?: string | null;
          status?: SessionStatus;
        };
        Update: Partial<Session>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'joined_at' | 'left_at' | 'is_host'> & {
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          is_host?: boolean;
        };
        Update: Partial<Participant>;
      };
      transcripts: {
        Row: Transcript;
        Insert: Omit<Transcript, 'id' | 'created_at' | 'sequence_number'> & {
          id?: string;
          created_at?: string;
          sequence_number?: number;
        };
        Update: Partial<Transcript>;
      };
      context_sets: {
        Row: ContextSet;
        Insert: Omit<ContextSet, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ContextSet, 'id' | 'created_at' | 'updated_at'>>;
      };
      context_set_terms: {
        Row: ContextSetTerm;
        Insert: Omit<ContextSetTerm, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ContextSetTerm, 'id' | 'created_at'>>;
      };
      context_set_general: {
        Row: ContextSetGeneral;
        Insert: Omit<ContextSetGeneral, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ContextSetGeneral, 'id' | 'created_at'>>;
      };
      context_set_translation_terms: {
        Row: ContextSetTranslationTerm;
        Insert: Omit<ContextSetTranslationTerm, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ContextSetTranslationTerm, 'id' | 'created_at'>>;
      };
      session_context_sets: {
        Row: SessionContextSet;
        Insert: Omit<SessionContextSet, 'id' | 'added_at'> & {
          id?: string;
          added_at?: string;
        };
        Update: Partial<Omit<SessionContextSet, 'id' | 'added_at'>>;
      };
    };
  };
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
] as const;

export const LANGUAGE_PAIRS = {
  one_way: [
    { label: 'To English', target: 'en' },
    { label: 'To Vietnamese', target: 'vi' },
    { label: 'To Japanese', target: 'ja' },
  ],
  two_way: [
    { label: 'English ↔ Vietnamese', a: 'en', b: 'vi' },
    { label: 'Japanese ↔ Vietnamese', a: 'ja', b: 'vi' },
    { label: 'Japanese ↔ English', a: 'ja', b: 'en' },
  ],
} as const;
