import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Doesn't throw at import/build time — lets `next build` succeed before
  // env vars are configured in Vercel. supabase-js still needs a
  // well-formed URL to construct the client, so a placeholder is used;
  // any real query against it will fail loudly at request time instead.
  console.warn(
    'Supabase env vars are not set. Copy .env.example to .env.local and fill them in.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Server-only client that bypasses RLS for writes (aqi_score_cache).
// null when the service role key isn't configured — callers must skip
// writes in that case. Never import this from client components.
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
