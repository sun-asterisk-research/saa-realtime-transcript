import { saveTranscript, broadcastStreaming } from './supabase.js';
const END_TOKEN = '<end>';
/**
 * Handles transcript processing:
 * - Broadcasts non-final tokens for streaming display
 * - Saves final tokens to database with translation pairing
 */
export class TranscriptHandler {
    session;
    lastBroadcastKey = '';
    allFinalTokens = [];
    constructor(session) {
        this.session = session;
    }
    /**
     * Process incoming tokens from Soniox
     */
    async processTokens(tokens) {
        // Filter out endpoint detection tokens
        const filteredTokens = tokens.filter((t) => t.text !== END_TOKEN);
        if (filteredTokens.length === 0)
            return;
        // Separate final and non-final tokens
        const finalTokens = filteredTokens.filter((t) => t.is_final);
        const nonFinalTokens = filteredTokens.filter((t) => !t.is_final);
        // Handle non-final tokens (broadcast for streaming)
        if (nonFinalTokens.length > 0) {
            await this.handleNonFinalTokens(nonFinalTokens);
        }
        // Handle final tokens (save to database)
        if (finalTokens.length > 0) {
            await this.handleFinalTokens(finalTokens);
        }
    }
    /**
     * Broadcast non-final tokens for streaming display
     */
    async handleNonFinalTokens(tokens) {
        const originalTokens = tokens.filter((t) => t.translation_status !== 'translation');
        const translatedTokens = tokens.filter((t) => t.translation_status === 'translation');
        const text = originalTokens.map((t) => t.text).join('');
        const translatedText = translatedTokens.map((t) => t.text).join('');
        // Avoid broadcasting identical content
        const broadcastKey = `${text}|${translatedText}`;
        if (broadcastKey === this.lastBroadcastKey)
            return;
        this.lastBroadcastKey = broadcastKey;
        // Get metadata from tokens
        const sourceLanguage = originalTokens[0]?.language;
        const speakerId = originalTokens[0]?.speaker;
        const targetLanguage = this.getTargetLanguage(sourceLanguage);
        if (text) {
            await broadcastStreaming(this.session.sessionCode, {
                participantId: this.session.participantId,
                participantName: this.session.participantName,
                text,
                translatedText: translatedText || undefined,
                sourceLanguage,
                targetLanguage,
                speakerId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle final tokens - save to database
     * Soniox sends original and translation tokens in SEPARATE batches
     * We need to buffer originals and combine with translations
     */
    async handleFinalTokens(tokens) {
        // Add to accumulated final tokens
        this.allFinalTokens.push(...tokens);
        // Get only new tokens since last processing
        const newTokens = this.allFinalTokens.slice(this.session.processedFinalTokenCount);
        if (newTokens.length === 0)
            return;
        this.session.processedFinalTokenCount = this.allFinalTokens.length;
        // Group tokens by translation status
        const originalTokens = newTokens.filter((t) => t.translation_status !== 'translation');
        const translatedTokens = newTokens.filter((t) => t.translation_status === 'translation');
        const originalText = originalTokens.map((t) => t.text).join('');
        const translatedText = translatedTokens.map((t) => t.text).join('');
        const sourceLanguage = originalTokens[0]?.language;
        const speakerId = originalTokens[0]?.speaker;
        // Skip if no tokens at all
        if (originalTokens.length === 0 && translatedTokens.length === 0)
            return;
        const targetLanguage = this.getTargetLanguage(sourceLanguage);
        // Case 1: We have ONLY original tokens (no translation yet)
        if (originalText && !translatedText) {
            const needsTranslation = this.needsTranslation(sourceLanguage);
            if (needsTranslation) {
                // Buffer this original, wait for translation batch
                this.session.pendingOriginal = {
                    originalText,
                    sourceLanguage,
                    speakerId,
                    timestamp: Date.now(),
                };
                return; // Don't save yet
            }
            else {
                // No translation needed, save directly
                await this.saveToDatabase({
                    originalText,
                    translatedText: undefined,
                    sourceLanguage,
                    targetLanguage,
                    speakerId,
                });
            }
        }
        // Case 2: We have ONLY translation tokens (this is the translation of buffered original)
        else if (!originalText && translatedText) {
            const pending = this.session.pendingOriginal;
            await this.saveToDatabase({
                originalText: pending?.originalText || translatedText,
                translatedText,
                sourceLanguage: pending?.sourceLanguage,
                targetLanguage,
                speakerId: pending?.speakerId,
            });
            this.session.pendingOriginal = undefined;
        }
        // Case 3: We have BOTH original and translation in same batch
        else if (originalText && translatedText) {
            await this.saveToDatabase({
                originalText,
                translatedText,
                sourceLanguage,
                targetLanguage,
                speakerId,
            });
        }
    }
    /**
     * Check if translation is needed based on config and source language
     */
    needsTranslation(sourceLanguage) {
        const config = this.session.translationConfig;
        if (!config)
            return false;
        if (config.type === 'one_way') {
            return sourceLanguage !== config.target_language;
        }
        // two_way always translates
        return config.type === 'two_way';
    }
    /**
     * Get target language based on translation config and source language
     */
    getTargetLanguage(sourceLanguage) {
        const config = this.session.translationConfig;
        if (!config)
            return undefined;
        if (config.type === 'one_way') {
            return config.target_language;
        }
        if (config.type === 'two_way' && sourceLanguage) {
            return sourceLanguage === config.language_a ? config.language_b : config.language_a;
        }
        return undefined;
    }
    /**
     * Save transcript to database
     */
    async saveToDatabase(data) {
        await saveTranscript({
            sessionCode: this.session.sessionCode,
            participantId: this.session.participantId,
            participantName: this.session.participantName,
            originalText: data.originalText,
            translatedText: data.translatedText,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            speakerId: data.speakerId,
            isFinal: true,
        });
    }
    /**
     * Reset handler state for new transcription session
     */
    reset() {
        this.lastBroadcastKey = '';
        this.allFinalTokens = [];
        this.session.processedFinalTokenCount = 0;
        this.session.pendingOriginal = undefined;
    }
}
//# sourceMappingURL=transcript-handler.js.map