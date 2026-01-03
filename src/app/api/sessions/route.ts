import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import type { TranslationMode, Session, Participant } from '@/lib/supabase/types';

interface CreateSessionRequest {
  hostName: string;
  title: string; // NEW - Session title/name
  description?: string; // NEW - Optional description
  mode: TranslationMode;
  targetLanguage?: string;
  languageA?: string;
  languageB?: string;
  preferredLanguage?: string; // Host's display language for two-way mode
  scheduledStartTime?: string; // NEW - ISO timestamp for scheduled sessions
  isPublic?: boolean; // NEW - Public vs private session
  invitedEmails?: string[]; // NEW - List of invited emails
  contextSetIds?: string[]; // Optional context sets to attach to session
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication - REQUIRED for creating sessions
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required to create sessions' }, { status: 401 });
    }

    const body: CreateSessionRequest = await request.json();
    const {
      hostName,
      title,
      description,
      mode,
      targetLanguage,
      languageA,
      languageB,
      preferredLanguage,
      scheduledStartTime,
      isPublic = false,
      invitedEmails = [],
      contextSetIds,
    } = body;

    // 2. Validate required fields
    if (!hostName || !mode || !title) {
      return NextResponse.json({ error: 'hostName, title, and mode are required' }, { status: 400 });
    }

    if (mode === 'one_way' && !targetLanguage) {
      return NextResponse.json({ error: 'targetLanguage is required for one_way mode' }, { status: 400 });
    }

    if (mode === 'two_way' && (!languageA || !languageB)) {
      return NextResponse.json({ error: 'languageA and languageB are required for two_way mode' }, { status: 400 });
    }

    // 3. Validate scheduled start time (must be in the future)
    if (scheduledStartTime) {
      const scheduledDate = new Date(scheduledStartTime);
      if (scheduledDate <= new Date()) {
        return NextResponse.json({ error: 'Scheduled start time must be in the future' }, { status: 400 });
      }
    }

    const supabase = getAdminClient();
    const code = nanoid(6).toUpperCase();

    // 4. Create session with new fields
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code,
        host_name: hostName,
        title, // NEW
        description: description || null, // NEW
        creator_user_id: user.id, // NEW - Link to authenticated user
        scheduled_start_time: scheduledStartTime || null, // NEW
        is_public: isPublic, // NEW
        allow_join_requests: !isPublic, // NEW - Allow join requests for private sessions
        mode,
        target_language: mode === 'one_way' ? targetLanguage : null,
        language_a: mode === 'two_way' ? languageA : null,
        language_b: mode === 'two_way' ? languageB : null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const session = sessionData as Session;

    // 5. Add host as first participant with user_id
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        user_id: user.id, // NEW - Link to authenticated user
        name: hostName,
        is_host: true,
        preferred_language: mode === 'two_way' ? (preferredLanguage || languageA) : null,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error adding host as participant:', participantError);
      return NextResponse.json({ error: 'Failed to add host as participant' }, { status: 500 });
    }

    const participant = participantData as Participant;

    // 6. Create invitations for invited emails
    if (invitedEmails.length > 0) {
      // Normalize and deduplicate emails
      const normalizedEmails = [...new Set(invitedEmails.map((email) => email.toLowerCase().trim()))];

      const invitations = normalizedEmails.map((email) => ({
        session_id: session.id,
        email,
        invited_by_user_id: user.id,
        status: 'pending' as const,
      }));

      const { error: invitationError } = await supabase.from('session_invitations').insert(invitations);

      if (invitationError) {
        console.error('Error creating invitations:', invitationError);
        // Don't fail the request - invitations can be added later
        // Just log the error
      }
    }

    // 7. Add context sets to session if provided
    if (contextSetIds && contextSetIds.length > 0) {
      const sessionContextSetsData = contextSetIds.map((contextSetId, idx) => ({
        session_id: session.id,
        context_set_id: contextSetId,
        sort_order: idx,
      }));

      const { error: contextError } = await supabase
        .from('session_context_sets')
        .insert(sessionContextSetsData);

      if (contextError) {
        console.error('Error adding context sets to session:', contextError);
        // Don't fail the request, just log the error
        // Context sets can be added later via the session contexts API
      }
    }

    return NextResponse.json({
      session,
      participant,
    });
  } catch (error) {
    console.error('Error in POST /api/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
