import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses RLS policies - use with caution!
 *
 * SECURITY: Only use on server-side (API routes, Server Components)
 */
export function getAdminClient() {
  // Security check: prevent usage in browser
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used in browser - service role key would be exposed!');
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
