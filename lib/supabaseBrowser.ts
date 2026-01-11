// lib/supabaseBrowser.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Browser Supabase client (singleton).
 * Use as: const supabase = supabaseBrowser();
 */
export function supabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  return _client;
}
