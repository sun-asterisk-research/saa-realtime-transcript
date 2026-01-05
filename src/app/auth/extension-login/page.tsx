import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function ExtensionLoginPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is already logged in, redirect to callback with token
  if (session?.access_token) {
    redirect(`/auth/extension-callback?token=${encodeURIComponent(session.access_token)}`);
  }

  // If not logged in, redirect to regular login page
  // The user will be redirected back here after login
  redirect(`/login?redirect=/auth/extension-login`);
}
