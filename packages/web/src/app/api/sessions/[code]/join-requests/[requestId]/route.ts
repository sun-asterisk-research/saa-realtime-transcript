import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
import type { JoinRequest } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string; requestId: string }>;
}

interface ApproveRejectBody {
  action: 'approve' | 'reject';
}

/**
 * POST /api/sessions/[code]/join-requests/[requestId]
 *
 * Approve or reject a join request (host only).
 *
 * When approved:
 * - Updates request status to 'approved'
 * - Creates a session_invitation record if email is provided
 *
 * When rejected:
 * - Updates request status to 'rejected'
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code, requestId } = await params;
    const body: ApproveRejectBody = await request.json();
    const { action } = body;

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    // Check authentication - only host can approve/reject
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getAdminClient();

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, creator_user_id')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is the creator
    if (sessionData.creator_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the session creator can approve or reject join requests' }, { status: 403 });
    }

    // Get the join request
    const { data: joinRequestData, error: joinRequestError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('session_id', sessionData.id)
      .single();

    if (joinRequestError || !joinRequestData) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    const joinRequest = joinRequestData as JoinRequest;

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${joinRequest.status}` },
        { status: 400 }
      );
    }

    // Update join request status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supabase
      .from('join_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        responded_by_user_id: user.id,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating join request:', updateError);
      return NextResponse.json({ error: 'Failed to update join request' }, { status: 500 });
    }

    // If approved and email is provided, create an invitation
    if (action === 'approve' && joinRequest.email) {
      const { error: invitationError } = await supabase
        .from('session_invitations')
        .insert({
          session_id: sessionData.id,
          email: joinRequest.email,
          invited_by_user_id: user.id,
          status: 'accepted', // Pre-accepted since user requested to join
        })
        .select()
        .single();

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        // Don't fail the request - the approval was successful
        // User can still join with the approved request
      }
    }

    return NextResponse.json({
      request: updatedRequest as JoinRequest,
      message: action === 'approve' ? 'Join request approved' : 'Join request rejected',
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/join-requests/[requestId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
