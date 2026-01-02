import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Session } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

interface LeaveRequest {
  participantId: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body: LeaveRequest = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get session to verify code
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    // Update participant left_at
    const { error: updateError } = await supabase
      .from('participants')
      .update({ left_at: new Date().toISOString() })
      .eq('id', participantId)
      .eq('session_id', session.id);

    if (updateError) {
      console.error('Error leaving session:', updateError);
      return NextResponse.json({ error: 'Failed to leave session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
