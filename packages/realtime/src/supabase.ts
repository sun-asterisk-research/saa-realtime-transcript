import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { TranscriptData, BroadcastData } from './types.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
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
    console.error('[Auth] Token verification failed:', error?.message);
    return null;
  }

  return data.user;
}

interface Session {
  id: string;
  code: string;
  status: string;
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
    .select('id, code, status')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    console.error(`Session lookup failed for ${code}:`, error?.message);
    return null;
  }

  sessionCache.set(code, { session: data as Session, timestamp: Date.now() });
  return data as Session;
}

export async function saveTranscript(data: TranscriptData): Promise<boolean> {
  const session = await getSessionByCode(data.sessionCode);
  if (!session) {
    console.error(`Cannot save transcript: session ${data.sessionCode} not found`);
    return false;
  }

  if (session.status === 'ended') {
    console.error(`Cannot save transcript: session ${data.sessionCode} has ended`);
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
    console.error('Failed to save transcript:', error.message);
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
