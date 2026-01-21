import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

interface InviteRequest {
  emails: string[];
}

// POST - Send invitations to a session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Check authentication
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: InviteRequest = await request.json();
    const { emails } = body;

    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get session and verify user is the host
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is the session creator
    if (session.creator_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can invite participants' }, { status: 403 });
    }

    if (session.status === 'ended') {
      return NextResponse.json({ error: 'Cannot invite to an ended session' }, { status: 400 });
    }

    // Normalize and deduplicate emails
    const normalizedEmails = [...new Set(emails.map((email) => email.toLowerCase().trim()))];

    // Check for existing invitations
    const { data: existingInvitations } = await supabase
      .from('session_invitations')
      .select('email')
      .eq('session_id', session.id)
      .in('email', normalizedEmails);

    const existingEmails = new Set((existingInvitations || []).map((inv) => inv.email));
    const newEmails = normalizedEmails.filter((email) => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json({
        message: 'All emails have already been invited',
        invited: [],
        alreadyInvited: normalizedEmails,
      });
    }

    // Create new invitations
    const invitations = newEmails.map((email) => ({
      session_id: session.id,
      email,
      invited_by_user_id: user.id,
      status: 'pending' as const,
    }));

    const { data: createdInvitations, error: invitationError } = await supabase
      .from('session_invitations')
      .insert(invitations)
      .select();

    if (invitationError) {
      console.error('Error creating invitations:', invitationError);
      return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Invitations sent successfully',
      invited: newEmails,
      alreadyInvited: Array.from(existingEmails),
      invitations: createdInvitations,
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get all invitations for a session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Check authentication
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getAdminClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is the session creator
    if (session.creator_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can view invitations' }, { status: 403 });
    }

    // Get all invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('session_invitations')
      .select('*')
      .eq('session_id', session.id)
      .order('invited_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in GET /api/sessions/[code]/invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
