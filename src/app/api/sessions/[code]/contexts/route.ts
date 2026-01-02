import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { mergeContextSets } from '@/lib/context/merge';
import type { ContextSetWithDetails, SessionContextSet } from '@/lib/supabase/types';
import type { Context } from '@soniox/speech-to-text-web';

// GET /api/sessions/[code]/contexts - Get session's context sets + merged context
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;

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

    // Get session context sets with full context set details
    const { data: sessionContextSets, error: scsError } = await supabase
      .from('session_context_sets')
      .select(
        `
        id,
        session_id,
        context_set_id,
        sort_order,
        added_at,
        context_set:context_sets(
          *,
          terms:context_set_terms(id, context_set_id, term, sort_order, created_at),
          general:context_set_general(id, context_set_id, key, value, created_at),
          translation_terms:context_set_translation_terms(id, context_set_id, source, target, sort_order, created_at)
        )
      `,
      )
      .eq('session_id', session.id)
      .order('sort_order', { ascending: true });

    if (scsError) {
      console.error('Error fetching session context sets:', scsError);
      return NextResponse.json({ error: 'Failed to fetch session contexts' }, { status: 500 });
    }

    // Extract context sets and add counts
    const contextSets: ContextSetWithDetails[] = (sessionContextSets || [])
      .map((scs: any) => scs.context_set)
      .filter((cs: any) => cs !== null)
      .map((cs: any) => ({
        ...cs,
        term_count: cs.terms?.length || 0,
        general_count: cs.general?.length || 0,
        translation_term_count: cs.translation_terms?.length || 0,
      }));

    // Merge context sets into single Soniox Context object
    const mergedContext: Context = mergeContextSets(contextSets);

    return NextResponse.json({
      contextSets,
      mergedContext,
      sessionContextSets: sessionContextSets || [],
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/[code]/contexts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sessions/[code]/contexts - Add context set(s) to session
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body: { contextSetIds: string[] } = await request.json();
    const { contextSetIds } = body;

    if (!contextSetIds || !Array.isArray(contextSetIds) || contextSetIds.length === 0) {
      return NextResponse.json({ error: 'contextSetIds array is required' }, { status: 400 });
    }

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

    // Verify all context sets exist
    const { data: contextSets, error: csError } = await supabase
      .from('context_sets')
      .select('id')
      .in('id', contextSetIds);

    if (csError || !contextSets || contextSets.length !== contextSetIds.length) {
      return NextResponse.json({ error: 'One or more context sets not found' }, { status: 404 });
    }

    // Get current max sort_order for this session
    const { data: existingSCS, error: maxError } = await supabase
      .from('session_context_sets')
      .select('sort_order')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = existingSCS && existingSCS.length > 0 ? existingSCS[0].sort_order : -1;

    // Insert session context sets (skip duplicates using ON CONFLICT)
    const sessionContextSetsData = contextSetIds.map((contextSetId, idx) => ({
      session_id: session.id,
      context_set_id: contextSetId,
      sort_order: maxSortOrder + 1 + idx,
    }));

    const { data: insertedSCS, error: insertError } = await supabase
      .from('session_context_sets')
      .upsert(sessionContextSetsData, {
        onConflict: 'session_id,context_set_id',
        ignoreDuplicates: true,
      })
      .select();

    if (insertError) {
      console.error('Error inserting session context sets:', insertError);
      return NextResponse.json({ error: 'Failed to add context sets to session' }, { status: 500 });
    }

    // Fetch updated merged context
    const updatedResponse = await GET(
      new NextRequest(`${request.url.split('/contexts')[0]}/contexts`),
      { params: { code } },
    );
    const updatedData = await updatedResponse.json();

    return NextResponse.json(
      {
        sessionContextSets: insertedSCS,
        mergedContext: updatedData.mergedContext,
        message: `Added ${insertedSCS?.length || 0} context set(s) to session`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/sessions/[code]/contexts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
