import { SupabaseClient, User } from '@supabase/supabase-js';
import type { TranscriptData, BroadcastData } from './types.js';
export declare function getSupabaseClient(): SupabaseClient;
/**
 * Verify a Supabase access token and return the user if valid
 */
export declare function verifyAuthToken(token: string): Promise<User | null>;
/**
 * Check if a user is authorized to access a session.
 * A user is authorized if:
 * - The session is public (is_public = true), OR
 * - The user is the session creator, OR
 * - The user has an accepted invitation, OR
 * - The user has an approved join request
 *
 * Uses a single query with filtered relations to minimize round trips.
 */
export declare function isUserAuthorizedForSession(sessionCode: string, userEmail: string, userId: string): Promise<{
    authorized: boolean;
    reason?: string;
}>;
interface Session {
    id: string;
    code: string;
    status: string;
    creator_user_id: string | null;
    is_public: boolean;
}
export declare function getSessionByCode(code: string): Promise<Session | null>;
export declare function saveTranscript(data: TranscriptData): Promise<boolean>;
export declare function broadcastStreaming(sessionCode: string, data: Omit<BroadcastData, 'type' | 'sessionCode'>): Promise<void>;
export {};
//# sourceMappingURL=supabase.d.ts.map