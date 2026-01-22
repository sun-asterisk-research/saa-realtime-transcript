import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { TranscriptData, BroadcastData } from './types.js';
import { env } from './env.js';
import { createLogger } from './logger.js';

const log = createLogger('supabase');

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Verify a Supabase access token and return the user if valid
 */
export async function verifyAuthToken(token: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    log.error({ err: error }, 'Token verification failed');
    return null;
  }

  return data.user;
}

interface SessionWithAccess {
  id: string;
  status: string;
  creator_user_id: string | null;
  is_public: boolean;
  session_invitations: { id: string }[];
  join_requests: { id: string }[];
}

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
export async function isUserAuthorizedForSession(
  sessionCode: string,
  userEmail: string,
  userId: string
): Promise<{ authorized: boolean; reason?: string }> {
  const supabase = getSupabaseClient();

  // Fetch session with filtered invitations and join requests in a single query
  // Filters are applied to relations so only matching records are returned
  const { data: session, error } = await supabase
    .from('sessions')
    .select(
      `
      id,
      status,
      creator_user_id,
      is_public,
      session_invitations!left(id),
      join_requests!left(id)
    `
    )
    .eq('code', sessionCode.toUpperCase())
    .eq('session_invitations.email', userEmail)
    .eq('session_invitations.status', 'accepted')
    .eq('join_requests.email', userEmail)
    .eq('join_requests.status', 'approved')
    .single();

  if (error || !session) {
    if (error?.code === 'PGRST116') {
      return { authorized: false, reason: 'Session not found' };
    }
    log.error({ sessionCode, err: error }, 'Session authorization check failed');
    return { authorized: false, reason: 'Failed to verify session access' };
  }

  const typedSession = session as unknown as SessionWithAccess;

  // Check if session has ended
  if (typedSession.status === 'ended') {
    return { authorized: false, reason: 'Session has ended' };
  }

  // Public sessions allow anyone
  if (typedSession.is_public) {
    return { authorized: true };
  }

  // Session creator is always authorized
  if (typedSession.creator_user_id === userId) {
    return { authorized: true };
  }

  // Check if user has accepted invitation (filtered at DB level)
  if (typedSession.session_invitations?.length > 0) {
    return { authorized: true };
  }

  // Check if user has approved join request (filtered at DB level)
  if (typedSession.join_requests?.length > 0) {
    return { authorized: true };
  }

  return { authorized: false, reason: 'Not authorized for this session' };
}

interface Session {
  id: string;
  code: string;
  status: string;
  creator_user_id: string | null;
  is_public: boolean;
}

// Cache for session lookups
const sessionCache = new Map<string, { session: Session; timestamp: number }>();
const SESSION_CACHE_TTL = 60000; // 1 minute

export async function getSessionByCode(code: string): Promise<Session | null> {
  const cached = sessionCache.get(code);
  if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL) {
    return cached.session;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, code, status, creator_user_id, is_public')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    log.error({ code, err: error }, 'Session lookup failed');
    return null;
  }

  sessionCache.set(code, { session: data as Session, timestamp: Date.now() });
  return data as Session;
}

export async function saveTranscript(data: TranscriptData): Promise<boolean> {
  const session = await getSessionByCode(data.sessionCode);
  if (!session) {
    log.error({ sessionCode: data.sessionCode }, 'Cannot save transcript: session not found');
    return false;
  }

  if (session.status === 'ended') {
    log.error({ sessionCode: data.sessionCode }, 'Cannot save transcript: session has ended');
    return false;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('transcripts').insert({
    session_id: session.id,
    participant_id: data.participantId || null,
    participant_name: data.participantName,
    original_text: data.originalText,
    translated_text: data.translatedText || null,
    source_language: data.sourceLanguage || null,
    target_language: data.targetLanguage || null,
    speaker_id: data.speakerId || null,
    is_final: data.isFinal,
  });

  if (error) {
    log.error({ err: error }, 'Failed to save transcript');
    return false;
  }

  return true;
}

export async function broadcastStreaming(
  sessionCode: string,
  data: Omit<BroadcastData, 'type' | 'sessionCode'>
): Promise<void> {
  const session = await getSessionByCode(sessionCode);
  if (!session) {
    return;
  }

  const supabase = getSupabaseClient();
  const channel = supabase.channel(`transcripts:${session.id}`);

  await channel.send({
    type: 'broadcast',
    event: 'streaming',
    payload: {
      participantId: data.participantId,
      participantName: data.participantName,
      text: data.text,
      translatedText: data.translatedText,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      speakerId: data.speakerId,
      timestamp: data.timestamp,
    },
  });
}
