import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { MeetSessionWithParticipants } from '@/lib/supabase/types';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/meet-sessions/[code] - Get session info with participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Validate meeting code format
    if (!/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid meeting code format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Authenticate user
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
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

    const supabase = await createServerClient();

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('meet_sessions')
      .select('*')
      .eq('meeting_code', code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from('meet_session_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error('[MeetSessions] Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500, headers: corsHeaders }
      );
    }

    const response: MeetSessionWithParticipants = {
      ...session,
      participants: participants || [],
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetSessions] Error in GET /api/meet-sessions/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/meet-sessions/[code] - Update session (e.g., end session)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'ended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    const { data: session, error } = await supabase
      .from('meet_sessions')
      .update({
        status,
        ...(status === 'ended' && { ended_at: new Date().toISOString() }),
      })
      .eq('meeting_code', code)
      .select()
      .single();

    if (error) {
      console.error('[MeetSessions] Error updating session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(session, { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetSessions] Error in PATCH /api/meet-sessions/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
