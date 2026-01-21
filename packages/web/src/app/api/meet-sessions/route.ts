import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { MeetSession, JoinMeetSessionResponse } from '@/lib/supabase/types';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/meet-sessions - Create or join a Meet session
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Check for Bearer token authentication (for extension)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      // Validate token with Supabase
      const supabase = await createServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, {
          status: 401,
          headers: corsHeaders,
        });
      }

      userId = user.id;
    } else {
      // If no Bearer token, check for session cookie (web app request)
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, {
          status: 401,
          headers: corsHeaders,
        });
      }

      userId = user.id;
    }

    const body = await request.json();
    const { meetingCode, displayName, email } = body;

    if (!meetingCode || !displayName) {
      return NextResponse.json(
        { error: 'meetingCode and displayName are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate meeting code format (e.g., arf-qqwo-oyx)
    if (!/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingCode)) {
      return NextResponse.json(
        { error: 'Invalid meeting code format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    // 1. Find or create session
    let session: MeetSession;

    const { data: existingSession } = await supabase
      .from('meet_sessions')
      .select('*')
      .eq('meeting_code', meetingCode)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      console.log('[MeetSessions] Joining existing session:', existingSession.id);
      session = existingSession as MeetSession;
    } else {
      console.log('[MeetSessions] Creating new session for code:', meetingCode);
      const { data: newSession, error: createError } = await supabase
        .from('meet_sessions')
        .insert({
          meeting_code: meetingCode,
          status: 'active',
        })
        .select()
        .single();

      if (createError) {
        console.error('[MeetSessions] Error creating session:', createError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500, headers: corsHeaders }
        );
      }

      session = newSession as MeetSession;
    }

    // 2. Create or update participant
    const { data: existingParticipant } = await supabase
      .from('meet_session_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    let participant;

    if (existingParticipant) {
      // Update existing participant (rejoin)
      console.log('[MeetSessions] Participant rejoining:', existingParticipant.id);
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('meet_session_participants')
        .update({
          is_active: true,
          left_at: null,
          display_name: displayName,
          email: email || null,
        })
        .eq('id', existingParticipant.id)
        .select()
        .single();

      if (updateError) {
        console.error('[MeetSessions] Error updating participant:', updateError);
        return NextResponse.json(
          { error: 'Failed to update participant' },
          { status: 500, headers: corsHeaders }
        );
      }

      participant = updatedParticipant;
    } else {
      // Create new participant
      console.log('[MeetSessions] Creating new participant');
      const { data: newParticipant, error: insertError } = await supabase
        .from('meet_session_participants')
        .insert({
          session_id: session.id,
          user_id: userId,
          display_name: displayName,
          email: email || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[MeetSessions] Error creating participant:', insertError);
        return NextResponse.json(
          { error: 'Failed to create participant' },
          { status: 500, headers: corsHeaders }
        );
      }

      participant = newParticipant;
    }

    const response: JoinMeetSessionResponse = {
      session,
      participant,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetSessions] Error in POST /api/meet-sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
