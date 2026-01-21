import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
import type { Session, Participant } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = getAdminClient();

    // Get authenticated user (optional for GET)
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    const { data: sessionData, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as Session;

    // Check access permissions
    let canAccess = session.is_public || session.status === 'ended';
    let userInvitationStatus: 'pending' | 'accepted' | 'declined' | null = null;
    let userJoinRequestStatus: 'pending' | 'approved' | 'rejected' | null = null;

    if (user) {
      // User is the creator
      if (session.creator_user_id === user.id) {
        canAccess = true;
      }

      // Check if user is invited
      if (!canAccess) {
        const { data: invitation } = await supabase
          .from('session_invitations')
          .select('status')
          .eq('session_id', session.id)
          .eq('email', user.email!)
          .maybeSingle();

        if (invitation) {
          canAccess = true;
          userInvitationStatus = invitation.status;
        }
      }

      // Check if user has an approved join request
      if (!canAccess) {
        const { data: joinRequest } = await supabase
          .from('join_requests')
          .select('status')
          .eq('session_id', session.id)
          .eq('email', user.email!)
          .maybeSingle();

        if (joinRequest) {
          userJoinRequestStatus = joinRequest.status;
          if (joinRequest.status === 'approved') {
            canAccess = true;
          }
        }
      }
    }

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
      canAccess,
      userInvitationStatus,
      userJoinRequestStatus,
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

    // Check authentication - only creator can update session
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    // Verify user is the creator
    if (session.creator_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the session creator can update the session' }, { status: 403 });
    }

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
