"use client";

import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useSession } from "@/components/auth/session-provider";

/** Shared auth helpers for the login/signup forms. */

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { error: "not_configured" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { error: "not_configured", needsConfirmation: false };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  const needsConfirmation = Boolean(
    !error && data.session === null && data.user
  );
  return { error: error?.message ?? null, needsConfirmation };
}

export async function signOut(): Promise<void> {
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function useRequireAuth(): {
  user: User | null;
  loading: boolean;
  configured: boolean;
} {
  const { user, loading } = useSession();
  const configured = Boolean(getBrowserSupabase());

  // Not logged in but auth configured → callers bounce to /login.
  return { user, loading, configured };
}
