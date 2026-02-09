export interface ClientConfig {
    type: 'config';
    authToken: string;
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
    idleTimeoutMs?: number;
}
export interface ClientResume {
    type: 'resume';
}
export interface TranslationConfig {
    type: 'one_way' | 'two_way';
    target_language?: string;
    language_a?: string;
    language_b?: string;
}
export interface Context {
    terms?: string[];
    general?: Array<{
        key: string;
        value: string;
    }>;
    text?: string;
    translation_terms?: Array<{
        source: string;
        target: string;
    }>;
}
export interface SonioxConfig {
    api_key: string;
    audio_format: string;
    model: string;
    language_hints?: string[];
    enable_language_identification?: boolean;
    enable_speaker_diarization?: boolean;
    enable_endpoint_detection?: boolean;
    max_endpoint_delay_ms?: number;
    translation?: TranslationConfig;
    context?: Context;
}
export interface Token {
    text: string;
    is_final: boolean;
    language?: string;
    speaker?: string;
    translation_status?: 'original' | 'translation';
}
export interface SonioxResult {
    tokens: Token[];
}
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
    status: 'connected' | 'ready' | 'finished' | 'error' | 'paused' | 'idling';
    reason?: string;
}
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
//# sourceMappingURL=types.d.ts.map