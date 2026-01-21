import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
import type { JoinRequest } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ code: string }>;
}

interface SubmitJoinRequestBody {
  name: string;
  email?: string;
  message?: string;
}

/**
 * GET /api/sessions/[code]/join-requests
 *
 * Get all join requests for a session (host only).
 * Returns pending, approved, and rejected requests.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Check authentication - only host can view join requests
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
      return NextResponse.json({ error: 'Only the session creator can view join requests' }, { status: 403 });
    }

    // Get all join requests for this session
    const { data: requests, error: requestsError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('session_id', sessionData.id)
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: (requests || []) as JoinRequest[] });
  } catch (error) {
    console.error('Error in GET /api/sessions/[code]/join-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/sessions/[code]/join-requests
 *
 * Submit a join request for a session.
 * Anyone can submit a request (authenticated or anonymous).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body: SubmitJoinRequestBody = await request.json();
    const { name, email, message } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Get authenticated user (optional)
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    // Use authenticated user's email if available, otherwise use provided email
    const requestEmail = user?.email || email || null;

    const supabase = getAdminClient();

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, allow_join_requests, is_public, status')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionData.status === 'ended') {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    if (sessionData.is_public) {
      return NextResponse.json({ error: 'This is a public session, you can join directly' }, { status: 400 });
    }

    if (!sessionData.allow_join_requests) {
      return NextResponse.json(
        { error: 'This session does not allow join requests' },
        { status: 403 }
      );
    }

    // Check if user already has a pending or approved request
    if (requestEmail) {
      const { data: existingRequest } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('session_id', sessionData.id)
        .eq('email', requestEmail)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return NextResponse.json(
            { error: 'You already have a pending join request for this session' },
            { status: 400 }
          );
        }
        if (existingRequest.status === 'approved') {
          return NextResponse.json(
            { error: 'Your join request has already been approved. You can join the session now.' },
            { status: 400 }
          );
        }
        // If rejected, allow submitting a new request (delete old one first)
        await supabase.from('join_requests').delete().eq('id', existingRequest.id);
      }
    }

    // Create join request
    const { data: joinRequestData, error: joinRequestError } = await supabase
      .from('join_requests')
      .insert({
        session_id: sessionData.id,
        email: requestEmail,
        name,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (joinRequestError) {
      console.error('Error creating join request:', joinRequestError);
      return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 });
    }

    return NextResponse.json({
      request: joinRequestData as JoinRequest,
      message: 'Your request has been sent to the host',
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/join-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
