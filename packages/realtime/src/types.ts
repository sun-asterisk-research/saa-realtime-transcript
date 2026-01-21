// Message types from client to proxy server
export interface ClientConfig {
  type: 'config';
  authToken: string; // Supabase access token for authentication
  sessionCode: string;
  participantId: string;
  participantName: string;
  model?: string;
  languageHints?: string[];
  enableLanguageIdentification?: boolean;
  enableSpeakerDiarization?: boolean;
  enableEndpointDetection?: boolean;
  translation?: TranslationConfig;
  context?: Context;
}

export interface TranslationConfig {
  type: 'one_way' | 'two_way';
  target_language?: string; // for one_way
  language_a?: string; // for two_way
  language_b?: string; // for two_way
}

export interface Context {
  terms?: string[];
  general?: Array<{ key: string; value: string }>;
  text?: string;
  translation_terms?: Array<{ source: string; target: string }>;
}

// Soniox API configuration message
export interface SonioxConfig {
  api_key: string;
  audio_format: string;
  model: string;
  language_hints?: string[];
  enable_language_identification?: boolean;
  enable_speaker_diarization?: boolean;
  enable_endpoint_detection?: boolean;
  translation?: TranslationConfig;
  context?: Context;
}

// Soniox token from transcription result
export interface Token {
  text: string;
  is_final: boolean;
  language?: string;
  speaker?: string;
  translation_status?: 'original' | 'translation';
}

// Soniox transcription result
export interface SonioxResult {
  tokens: Token[];
}

// Message from proxy to client
export interface ProxyResult {
  type: 'result';
  tokens: Token[];
}

export interface ProxyError {
  type: 'error';
  message: string;
  code?: number;
}

export interface ProxyStatus {
  type: 'status';
  status: 'connected' | 'ready' | 'finished' | 'error';
}

// Transcript data for database
export interface TranscriptData {
  sessionCode: string;
  participantId: string;
  participantName: string;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speakerId?: string;
  isFinal: boolean;
}

// Broadcast data for streaming
export interface BroadcastData {
  type: 'broadcast';
  sessionCode: string;
  participantId: string;
  participantName: string;
  text: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speakerId?: string;
  timestamp: number;
}

// Client session state
export interface ClientSession {
  sessionCode: string;
  participantId: string;
  participantName: string;
  translationConfig?: TranslationConfig;
  pendingOriginal?: {
    originalText: string;
    sourceLanguage?: string;
    speakerId?: string;
    timestamp: number;
  };
  processedFinalTokenCount: number;
}
