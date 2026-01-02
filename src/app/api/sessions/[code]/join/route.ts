import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Session, Participant } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

interface JoinRequest {
  name: string;
  preferredLanguage?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body: JoinRequest = await request.json();
    const { name, preferredLanguage } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    if (session.status === 'ended') {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    // Validate preferredLanguage for two-way mode
    let validatedPreferredLanguage = preferredLanguage || null;
    if (session.mode === 'two_way' && preferredLanguage) {
      if (preferredLanguage !== session.language_a && preferredLanguage !== session.language_b) {
        return NextResponse.json(
          { error: `preferredLanguage must be ${session.language_a} or ${session.language_b}` },
          { status: 400 }
        );
      }
    } else if (session.mode === 'two_way' && !preferredLanguage) {
      // Default to language_a if not specified
      validatedPreferredLanguage = session.language_a;
    }

    // Add participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        name,
        preferred_language: validatedPreferredLanguage,
        is_host: false,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error joining session:', participantError);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
    }

    const participant = participantData as Participant;

    return NextResponse.json({
      session,
      participant,
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/join:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
