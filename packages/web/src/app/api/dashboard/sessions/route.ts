import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { createServerClient } from '@/lib/supabase/server';
import type { Session } from '@/lib/supabase/types';

/**
 * GET /api/dashboard/sessions
 *
 * Get all sessions for the authenticated user:
 * - My Sessions: Sessions created by the user
 * - Invited Sessions: Sessions the user is invited to
 * - Recent Past Sessions: Sessions ended in the last 7 days (created by or invited to)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - required
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getAdminClient();

    // 1. Fetch "My Sessions" (created by user)
    const { data: mySessionsData, error: mySessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('creator_user_id', user.id)
      .order('created_at', { ascending: false });

    if (mySessionsError) {
      console.error('Error fetching my sessions:', mySessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const mySessions = (mySessionsData || []) as Session[];

    // 2. Fetch "Invited Sessions" (via session_invitations)
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('session_invitations')
      .select('session_id')
      .eq('email', user.email!)
      .in('status', ['pending', 'accepted']);

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    const invitedSessionIds = (invitationsData || []).map((inv) => inv.session_id);

    let invitedSessions: Session[] = [];
    if (invitedSessionIds.length > 0) {
      const { data: invitedSessionsData, error: invitedSessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', invitedSessionIds)
        .order('created_at', { ascending: false });

      if (invitedSessionsError) {
        console.error('Error fetching invited sessions:', invitedSessionsError);
        return NextResponse.json({ error: 'Failed to fetch invited sessions' }, { status: 500 });
      }

      invitedSessions = (invitedSessionsData || []) as Session[];
    }

    // 3. Fetch "Recent Past Sessions" (ended in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Combine my session IDs and invited session IDs for the query
    const allAccessibleSessionIds = [
      ...mySessions.map((s) => s.id),
      ...invitedSessionIds,
    ];

    let recentPastSessions: Session[] = [];
    if (allAccessibleSessionIds.length > 0) {
      const { data: recentPastData, error: recentPastError } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'ended')
        .gte('ended_at', sevenDaysAgo.toISOString())
        .in('id', allAccessibleSessionIds)
        .order('ended_at', { ascending: false });

      if (recentPastError) {
        console.error('Error fetching recent past sessions:', recentPastError);
        return NextResponse.json({ error: 'Failed to fetch past sessions' }, { status: 500 });
      }

      recentPastSessions = (recentPastData || []) as Session[];
    }

    return NextResponse.json({
      mySessions,
      invitedSessions,
      recentPastSessions,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
