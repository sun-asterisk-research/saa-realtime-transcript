import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Session, Transcript } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

interface TranscriptRequest {
  participantId: string;
  participantName: string;
  originalText: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  speakerId?: string;
  isFinal: boolean;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
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

    // Get transcripts
    const { data: transcriptsData, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('session_id', session.id)
      .eq('is_final', true)
      .order('sequence_number', { ascending: true });

    if (transcriptsError) {
      console.error('Error fetching transcripts:', transcriptsError);
      return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }

    const transcripts = (transcriptsData || []) as Transcript[];

    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error('Error in GET /api/sessions/[code]/transcripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body: TranscriptRequest = await request.json();
    const { participantId, participantName, originalText, translatedText, sourceLanguage, targetLanguage, speakerId, isFinal } =
      body;

    if (!participantName || !originalText) {
      return NextResponse.json({ error: 'participantName and originalText are required' }, { status: 400 });
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

    // Insert transcript
    const { data: transcriptData, error: insertError } = await supabase
      .from('transcripts')
      .insert({
        session_id: session.id,
        participant_id: participantId || null,
        participant_name: participantName,
        original_text: originalText,
        translated_text: translatedText || null,
        source_language: sourceLanguage || null,
        target_language: targetLanguage || null,
        speaker_id: speakerId || null,
        is_final: isFinal,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting transcript:', insertError);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    const transcript = transcriptData as Transcript;

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/transcripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participantId, originalText, translatedText, targetLanguage } = body;

    // Validate required fields
    if (!participantId || !originalText || !translatedText) {
      return NextResponse.json(
        { error: 'participantId, originalText, and translatedText are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get session by code
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    // Find most recent transcript matching criteria
    const { data: transcriptData, error: findError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('session_id', session.id)
      .eq('participant_id', participantId)
      .eq('original_text', originalText)
      .is('translated_text', null)
      .eq('is_final', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !transcriptData) {
      console.error('Transcript not found for update:', findError);
      return NextResponse.json(
        { error: 'No matching transcript found to update' },
        { status: 404 }
      );
    }

    // Update translated_text and target_language
    const { data: updatedData, error: updateError } = await supabase
      .from('transcripts')
      .update({
        translated_text: translatedText,
        target_language: targetLanguage || null,
      })
      .eq('id', transcriptData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transcript:', updateError);
      return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
    }

    const updatedTranscript = updatedData as Transcript;

    return NextResponse.json({ transcript: updatedTranscript });
  } catch (error) {
    console.error('Error in PATCH /api/sessions/[code]/transcripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
