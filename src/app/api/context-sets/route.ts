import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { ContextSet, ContextSetFormData, ContextSetWithDetails } from '@/lib/supabase/types';

// GET /api/context-sets - List context sets (user's + public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const publicOnly = searchParams.get('publicOnly') === 'true';
    const userId = searchParams.get('userId'); // For filtering user's contexts

    const supabase = getAdminClient();

    // Build query
    let query = supabase
      .from('context_sets')
      .select(
        `
        *,
        terms:context_set_terms(id, context_set_id, term, sort_order, created_at),
        general:context_set_general(id, context_set_id, key, value, created_at),
        translation_terms:context_set_translation_terms(id, context_set_id, source, target, sort_order, created_at)
      `,
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false });

    // Filter by visibility
    if (publicOnly) {
      query = query.eq('is_public', true);
    } else if (userId) {
      // User's own contexts + public contexts
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching context sets:', error);
      return NextResponse.json({ error: 'Failed to fetch context sets' }, { status: 500 });
    }

    // Add counts to each context set
    const contextSets: ContextSetWithDetails[] = (data || []).map((cs: any) => ({
      ...cs,
      term_count: cs.terms?.length || 0,
      general_count: cs.general?.length || 0,
      translation_term_count: cs.translation_terms?.length || 0,
    }));

    return NextResponse.json({
      contextSets,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/context-sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/context-sets - Create new context set
export async function POST(request: NextRequest) {
  try {
    const body: ContextSetFormData & { userId?: string | null } = await request.json();
    const { name, description, text, is_public, terms, general, translation_terms, userId } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // If not public, userId is required
    if (!is_public && !userId) {
      return NextResponse.json({ error: 'userId is required for private context sets' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'name must be ≤100 characters' }, { status: 400 });
    }

    if (text && text.length > 10000) {
      return NextResponse.json({ error: 'text must be ≤10,000 characters' }, { status: 400 });
    }

    if (terms && terms.length > 500) {
      return NextResponse.json({ error: 'max 500 terms allowed' }, { status: 400 });
    }

    if (general && general.length > 100) {
      return NextResponse.json({ error: 'max 100 general metadata pairs allowed' }, { status: 400 });
    }

    if (translation_terms && translation_terms.length > 500) {
      return NextResponse.json({ error: 'max 500 translation terms allowed' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Create context set
    const { data: contextSetData, error: contextSetError } = await supabase
      .from('context_sets')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        text: text || null,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (contextSetError) {
      console.error('Error creating context set:', contextSetError);
      return NextResponse.json({ error: 'Failed to create context set' }, { status: 500 });
    }

    const contextSet = contextSetData as ContextSet;

    // Insert terms
    if (terms && terms.length > 0) {
      const termsData = terms.map((term, idx) => ({
        context_set_id: contextSet.id,
        term,
        sort_order: idx,
      }));

      const { error: termsError } = await supabase.from('context_set_terms').insert(termsData);

      if (termsError) {
        console.error('Error inserting terms:', termsError);
        // Rollback context set
        await supabase.from('context_sets').delete().eq('id', contextSet.id);
        return NextResponse.json({ error: 'Failed to create terms' }, { status: 500 });
      }
    }

    // Insert general metadata
    if (general && general.length > 0) {
      const generalData = general.map((g) => ({
        context_set_id: contextSet.id,
        key: g.key,
        value: g.value,
      }));

      const { error: generalError } = await supabase.from('context_set_general').insert(generalData);

      if (generalError) {
        console.error('Error inserting general metadata:', generalError);
        await supabase.from('context_sets').delete().eq('id', contextSet.id);
        return NextResponse.json({ error: 'Failed to create general metadata' }, { status: 500 });
      }
    }

    // Insert translation terms
    if (translation_terms && translation_terms.length > 0) {
      const translationData = translation_terms.map((tt, idx) => ({
        context_set_id: contextSet.id,
        source: tt.source,
        target: tt.target,
        sort_order: idx,
      }));

      const { error: translationError } = await supabase.from('context_set_translation_terms').insert(translationData);

      if (translationError) {
        console.error('Error inserting translation terms:', translationError);
        await supabase.from('context_sets').delete().eq('id', contextSet.id);
        return NextResponse.json({ error: 'Failed to create translation terms' }, { status: 500 });
      }
    }

    // Fetch complete context set with all relations
    const { data: completeContextSet, error: fetchError } = await supabase
      .from('context_sets')
      .select(
        `
        *,
        terms:context_set_terms(id, context_set_id, term, sort_order, created_at),
        general:context_set_general(id, context_set_id, key, value, created_at),
        translation_terms:context_set_translation_terms(id, context_set_id, source, target, sort_order, created_at)
      `,
      )
      .eq('id', contextSet.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete context set:', fetchError);
      return NextResponse.json({ error: 'Context set created but failed to fetch details' }, { status: 500 });
    }

    const result: ContextSetWithDetails = {
      ...completeContextSet,
      term_count: completeContextSet.terms?.length || 0,
      general_count: completeContextSet.general?.length || 0,
      translation_term_count: completeContextSet.translation_terms?.length || 0,
    };

    return NextResponse.json({ contextSet: result }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/context-sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
