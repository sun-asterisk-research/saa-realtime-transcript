import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';

interface RouteParams {
  params: Promise<{ code: string; participantId: string }>;
}

interface UpdatePreferenceRequest {
  preferredLanguage: string;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { code, participantId } = await params;
    const body: UpdatePreferenceRequest = await request.json();
    const { preferredLanguage } = body;

    if (!preferredLanguage) {
      return NextResponse.json({ error: 'preferredLanguage is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get session to validate the language
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate that preferredLanguage matches session's language pair
    if (sessionData.mode === 'two_way') {
      if (preferredLanguage !== sessionData.language_a && preferredLanguage !== sessionData.language_b) {
        return NextResponse.json(
          { error: `preferredLanguage must be ${sessionData.language_a} or ${sessionData.language_b}` },
          { status: 400 }
        );
      }
    }

    // Update participant's preferred language
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .update({ preferred_language: preferredLanguage })
      .eq('id', participantId)
      .eq('session_id', sessionData.id)
      .select()
      .single();

    if (participantError) {
      console.error('Error updating participant:', participantError);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({ participant: participantData });
  } catch (error) {
    console.error('Error in PATCH /api/sessions/[code]/participants/[participantId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
