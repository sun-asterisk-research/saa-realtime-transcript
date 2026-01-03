import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
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

    // Get authenticated user (optional)
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

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

    // Validate access permissions
    let hasAccess = session.is_public;

    if (!hasAccess && user) {
      // Check if user is the creator
      if (session.creator_user_id === user.id) {
        hasAccess = true;
      }

      // Check if user is invited
      if (!hasAccess) {
        const { data: invitation } = await supabase
          .from('session_invitations')
          .select('*')
          .eq('session_id', session.id)
          .eq('email', user.email!)
          .maybeSingle();

        if (invitation) {
          hasAccess = true;
          // Update invitation status to accepted
          await supabase
            .from('session_invitations')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', invitation.id);
        }
      }

      // Check if user has approved join request
      if (!hasAccess) {
        const { data: joinReq } = await supabase
          .from('join_requests')
          .select('*')
          .eq('session_id', session.id)
          .eq('email', user.email!)
          .eq('status', 'approved')
          .maybeSingle();

        if (joinReq) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You are not invited to this session. Please request access.' },
        { status: 403 }
      );
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

    // Add participant with user_id if authenticated
    // Set is_host to true if user is the session creator
    const isHost = user ? session.creator_user_id === user.id : false;

    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        user_id: user?.id || null, // Link to user if authenticated
        name,
        preferred_language: validatedPreferredLanguage,
        is_host: isHost,
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
