import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { ContextSetFormData, ContextSetWithDetails } from '@/lib/supabase/types';

// GET /api/context-sets/[id] - Get single context set with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('context_sets')
      .select(
        `
        *,
        terms:context_set_terms(id, context_set_id, term, sort_order, created_at),
        general:context_set_general(id, context_set_id, key, value, created_at),
        translation_terms:context_set_translation_terms(id, context_set_id, source, target, sort_order, created_at)
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Context set not found' }, { status: 404 });
      }
      console.error('Error fetching context set:', error);
      return NextResponse.json({ error: 'Failed to fetch context set' }, { status: 500 });
    }

    const contextSet: ContextSetWithDetails = {
      ...data,
      term_count: data.terms?.length || 0,
      general_count: data.general?.length || 0,
      translation_term_count: data.translation_terms?.length || 0,
    };

    return NextResponse.json({ contextSet });
  } catch (error) {
    console.error('Error in GET /api/context-sets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/context-sets/[id] - Update context set
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id} = await params;
    const body: Partial<ContextSetFormData> & { userId?: string } = await request.json();
    const { name, description, text, is_public, terms, general, translation_terms, userId } = body;

    const supabase = getAdminClient();

    // Verify ownership if userId provided
    if (userId) {
      const { data: existingSet, error: fetchError } = await supabase
        .from('context_sets')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingSet) {
        return NextResponse.json({ error: 'Context set not found' }, { status: 404 });
      }

      if (existingSet.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Validation
    if (name && name.length > 100) {
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

    // Update context set basic fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (text !== undefined) updateData.text = text || null;
    if (is_public !== undefined) updateData.is_public = is_public;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase.from('context_sets').update(updateData).eq('id', id);

      if (updateError) {
        console.error('Error updating context set:', updateError);
        return NextResponse.json({ error: 'Failed to update context set' }, { status: 500 });
      }
    }

    // Update terms (replace all)
    if (terms !== undefined) {
      // Delete existing terms
      await supabase.from('context_set_terms').delete().eq('context_set_id', id);

      // Insert new terms
      if (terms.length > 0) {
        const termsData = terms.map((term, idx) => ({
          context_set_id: id,
          term,
          sort_order: idx,
        }));

        const { error: termsError } = await supabase.from('context_set_terms').insert(termsData);

        if (termsError) {
          console.error('Error updating terms:', termsError);
          return NextResponse.json({ error: 'Failed to update terms' }, { status: 500 });
        }
      }
    }

    // Update general metadata (replace all)
    if (general !== undefined) {
      // Delete existing general metadata
      await supabase.from('context_set_general').delete().eq('context_set_id', id);

      // Insert new general metadata
      if (general.length > 0) {
        const generalData = general.map((g) => ({
          context_set_id: id,
          key: g.key,
          value: g.value,
        }));

        const { error: generalError } = await supabase.from('context_set_general').insert(generalData);

        if (generalError) {
          console.error('Error updating general metadata:', generalError);
          return NextResponse.json({ error: 'Failed to update general metadata' }, { status: 500 });
        }
      }
    }

    // Update translation terms (replace all)
    if (translation_terms !== undefined) {
      // Delete existing translation terms
      await supabase.from('context_set_translation_terms').delete().eq('context_set_id', id);

      // Insert new translation terms
      if (translation_terms.length > 0) {
        const translationData = translation_terms.map((tt, idx) => ({
          context_set_id: id,
          source: tt.source,
          target: tt.target,
          sort_order: idx,
        }));

        const { error: translationError } = await supabase.from('context_set_translation_terms').insert(translationData);

        if (translationError) {
          console.error('Error updating translation terms:', translationError);
          return NextResponse.json({ error: 'Failed to update translation terms' }, { status: 500 });
        }
      }
    }

    // Fetch updated context set
    const { data: updatedData, error: fetchError } = await supabase
      .from('context_sets')
      .select(
        `
        *,
        terms:context_set_terms(id, context_set_id, term, sort_order, created_at),
        general:context_set_general(id, context_set_id, key, value, created_at),
        translation_terms:context_set_translation_terms(id, context_set_id, source, target, sort_order, created_at)
      `,
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated context set:', fetchError);
      return NextResponse.json({ error: 'Context set updated but failed to fetch details' }, { status: 500 });
    }

    const contextSet: ContextSetWithDetails = {
      ...updatedData,
      term_count: updatedData.terms?.length || 0,
      general_count: updatedData.general?.length || 0,
      translation_term_count: updatedData.translation_terms?.length || 0,
    };

    return NextResponse.json({ contextSet });
  } catch (error) {
    console.error('Error in PATCH /api/context-sets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/context-sets/[id] - Delete context set
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = getAdminClient();

    // Verify ownership if userId provided
    if (userId) {
      const { data: existingSet, error: fetchError } = await supabase
        .from('context_sets')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingSet) {
        return NextResponse.json({ error: 'Context set not found' }, { status: 404 });
      }

      if (existingSet.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete context set (CASCADE will delete related terms, general, translation_terms, session_context_sets)
    const { error: deleteError } = await supabase.from('context_sets').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting context set:', deleteError);
      return NextResponse.json({ error: 'Failed to delete context set' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/context-sets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
