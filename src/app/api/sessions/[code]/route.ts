import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Session, Participant } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = getAdminClient();

    const { data: sessionData, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    // Get active participants
    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', session.id)
      .is('left_at', null)
      .order('joined_at', { ascending: true });

    const participants = (participantsData || []) as Participant[];

    return NextResponse.json({
      session,
      participants,
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/[code]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await request.json();
    const supabase = getAdminClient();

    // Get session first
    const { data: sessionData, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    // Update session
    const { data: updatedData, error: updateError } = await supabase
      .from('sessions')
      .update({
        ...body,
        ended_at: body.status === 'ended' ? new Date().toISOString() : session.ended_at,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    const updatedSession = updatedData as Session;

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error in PATCH /api/sessions/[code]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
