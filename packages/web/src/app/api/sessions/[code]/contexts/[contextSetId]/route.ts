import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';

// DELETE /api/sessions/[code]/contexts/[contextSetId] - Remove context set from session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; contextSetId: string }> },
) {
  try {
    const { code, contextSetId } = await params;

    const supabase = getAdminClient();

    // Get session ID from code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session context set
    const { error: deleteError } = await supabase
      .from('session_context_sets')
      .delete()
      .eq('session_id', session.id)
      .eq('context_set_id', contextSetId);

    if (deleteError) {
      console.error('Error removing context set from session:', deleteError);
      return NextResponse.json({ error: 'Failed to remove context set from session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Context set removed from session',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sessions/[code]/contexts/[contextSetId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
