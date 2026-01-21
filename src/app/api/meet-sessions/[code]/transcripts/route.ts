import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { MeetTranscript, MeetTranscriptWithParticipant } from '@/lib/supabase/types';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/meet-sessions/[code]/transcripts - Upload transcript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

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

    const body = await request.json();
    const { participantId, text, translatedText, isFinal, startTime, endTime } = body;

    if (!participantId || !text || !startTime) {
      return NextResponse.json(
        { error: 'participantId, text, and startTime are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('meet_sessions')
      .select('id')
      .eq('meeting_code', code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify participant belongs to session and user
    const { data: participant, error: participantError } = await supabase
      .from('meet_session_participants')
      .select('*')
      .eq('id', participantId)
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found or unauthorized' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Create transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('meet_transcripts')
      .insert({
        session_id: session.id,
        participant_id: participantId,
        text,
        translated_text: translatedText || null,
        is_final: isFinal || false,
        start_time: startTime,
        end_time: endTime || null,
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('[MeetTranscripts] Error creating transcript:', transcriptError);
      return NextResponse.json(
        { error: 'Failed to create transcript' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(transcript, { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetTranscripts] Error in POST /api/meet-sessions/[code]/transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET /api/meet-sessions/[code]/transcripts - Get all transcripts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

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

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('meet_sessions')
      .select('id')
      .eq('meeting_code', code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify user is a participant in this session
    const { data: userParticipant } = await supabase
      .from('meet_session_participants')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    if (!userParticipant) {
      return NextResponse.json(
        { error: 'Not a participant in this session' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Fetch transcripts with participant info
    const { data: transcripts, error: transcriptsError } = await supabase
      .from('meet_transcripts')
      .select(`
        *,
        participant:meet_session_participants(*)
      `)
      .eq('session_id', session.id)
      .eq('is_final', true)
      .order('start_time', { ascending: true });

    if (transcriptsError) {
      console.error('[MeetTranscripts] Error fetching transcripts:', transcriptsError);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(transcripts || [], { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetTranscripts] Error in GET /api/meet-sessions/[code]/transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/meet-sessions/[code]/transcripts - Update transcript translation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

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

    const body = await request.json();
    const { participantId, text, translatedText } = body;

    // Validate required fields
    if (!participantId || !text || !translatedText) {
      return NextResponse.json(
        { error: 'participantId, text, and translatedText are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('meet_sessions')
      .select('id')
      .eq('meeting_code', code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify participant belongs to session and user
    const { data: participant, error: participantError } = await supabase
      .from('meet_session_participants')
      .select('*')
      .eq('id', participantId)
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found or unauthorized' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Find most recent transcript matching criteria
    const { data: transcriptData, error: findError } = await supabase
      .from('meet_transcripts')
      .select('*')
      .eq('session_id', session.id)
      .eq('participant_id', participantId)
      .eq('text', text)
      .is('translated_text', null)
      .eq('is_final', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (findError || !transcriptData) {
      console.error('[MeetTranscripts] Transcript not found for update:', findError);
      return NextResponse.json(
        { error: 'No matching transcript found to update' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update translated_text
    const { data: updatedData, error: updateError } = await supabase
      .from('meet_transcripts')
      .update({
        translated_text: translatedText,
      })
      .eq('id', transcriptData.id)
      .select()
      .single();

    if (updateError) {
      console.error('[MeetTranscripts] Error updating transcript:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transcript' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(updatedData, { headers: corsHeaders });
  } catch (error) {
    console.error('[MeetTranscripts] Error in PATCH /api/meet-sessions/[code]/transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
