import type { Token, ClientSession } from './types.js';
/**
 * Handles transcript processing:
 * - Broadcasts non-final tokens for streaming display
 * - Saves final tokens to database with translation pairing
 */
export declare class TranscriptHandler {
    private session;
    private lastBroadcastKey;
    private allFinalTokens;
    constructor(session: ClientSession);
    /**
     * Process incoming tokens from Soniox
     */
    processTokens(tokens: Token[]): Promise<void>;
    /**
     * Broadcast non-final tokens for streaming display
     */
    private handleNonFinalTokens;
    /**
     * Handle final tokens - save to database
     * Soniox sends original and translation tokens in SEPARATE batches
     * We need to buffer originals and combine with translations
     */
    private handleFinalTokens;
    /**
     * Check if translation is needed based on config and source language
     */
    private needsTranslation;
    /**
     * Get target language based on translation config and source language
     */
    private getTargetLanguage;
    /**
     * Save transcript to database
     */
    private saveToDatabase;
    /**
     * Reset handler state for new transcription session
     */
    reset(): void;
}
//# sourceMappingURL=transcript-handler.d.ts.map