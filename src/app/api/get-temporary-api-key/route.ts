import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// You don't want to expose the API key to the client, so we generate a temporary one.
// Temporary API keys are then used to initialize the SonioxClient instance on the client.
export async function POST(request: Request) {
  if (!process.env.SONIOX_API_KEY) {
    return NextResponse.json({ error: 'SONIOX_API_KEY is not set' }, { status: 400 });
  }

  // Check for Bearer token authentication (for extension)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    // Validate token with Supabase
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Token is valid, proceed to generate temporary API key
  }
  // If no Bearer token, assume it's a regular client request (already authenticated via cookies)

  const host = process.env.SONIOX_API_HOST || 'https://api.soniox.com';
  const response = await fetch(`${host}/v1/auth/temporary-api-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SONIOX_API_KEY}`,
    },
    body: JSON.stringify({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 300,
    }),
  });

  const data = await response.json();

  return NextResponse.json({
    apiKey: data.api_key,
  });
}
