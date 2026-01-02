import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { nanoid } from 'nanoid';
import type { TranslationMode, Session, Participant } from '@/lib/supabase/types';

interface CreateSessionRequest {
  hostName: string;
  mode: TranslationMode;
  targetLanguage?: string;
  languageA?: string;
  languageB?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();
    const { hostName, mode, targetLanguage, languageA, languageB } = body;

    if (!hostName || !mode) {
      return NextResponse.json({ error: 'hostName and mode are required' }, { status: 400 });
    }

    if (mode === 'one_way' && !targetLanguage) {
      return NextResponse.json({ error: 'targetLanguage is required for one_way mode' }, { status: 400 });
    }

    if (mode === 'two_way' && (!languageA || !languageB)) {
      return NextResponse.json({ error: 'languageA and languageB are required for two_way mode' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const code = nanoid(6).toUpperCase();

    // Create session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code,
        host_name: hostName,
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

    // Add host as first participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        name: hostName,
        is_host: true,
        preferred_language: mode === 'two_way' ? languageA : null,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error adding host as participant:', participantError);
      return NextResponse.json({ error: 'Failed to add host as participant' }, { status: 500 });
    }

    const participant = participantData as Participant;

    return NextResponse.json({
      session,
      participant,
    });
  } catch (error) {
    console.error('Error in POST /api/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
