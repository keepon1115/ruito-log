// Supabase browser client. Returns null (and `isSupabaseConfigured === false`)
// when env vars are absent — the app then runs on the in-memory mock store.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anon!, {
      auth: { persistSession: false }, // no-login family app
    });
  }
  return client;
}

// Storage bucket names (private; media served via signed URLs).
export const BUCKET_AUDIO = 'audio';
export const BUCKET_IMAGES = 'images';

// Single shared child for this family deployment (no auth → fixed id).
export const CHILD_ID = process.env.NEXT_PUBLIC_CHILD_ID || 'demo-child';
