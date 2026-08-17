import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Returns null when the project isn't
 * configured yet — the app degrades to guest/localStorage mode so V0.2
 * functionality keeps working.
 */

let cached: ReturnType<typeof createBrowserClient> | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (cached !== undefined) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cached;
}
