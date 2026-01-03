import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Profile } from '@/lib/supabase/types';

/**
 * GET /api/users/search
 *
 * Search for users by email or full name for autocomplete functionality.
 * This endpoint is used in the email invitation chip input.
 *
 * Query Parameters:
 * - q: Search query string (matches against email and full_name)
 * - limit: Maximum number of results to return (default: 10, max: 50)
 *
 * Returns:
 * - users: Array of Profile objects matching the search criteria
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Return empty results if query is too short
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const supabase = getAdminClient();

    // Search for users by email or full name (case-insensitive)
    // Using OR condition to match against both fields
    const { data: users, error } = await supabase
      .from('profiles')
      .select('email, full_name, avatar_url')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('full_name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error in GET /api/users/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
