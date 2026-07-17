/**
 * Supabase client helpers (Phase 2).
 *
 * Browser client: used in Client Components and the data layer (which runs in the
 * browser when called from Scheduler.tsx).
 *
 * Server client: used in Server Components, middleware, and route handlers.
 *
 * Both are guarded so that a missing env var during `next build` (static analysis)
 * does NOT throw — the clients simply won't be able to make requests.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Singleton browser client — safe to call in any "use client" context. */
let _browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return a no-op stub during build / missing env so the import doesn't crash.
    // Real runtime requests will fail with a network error (expected without env vars).
    _browserClient = createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  } else {
    _browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _browserClient;
}

/** Convenience alias — the data-layer modules import this. */
export const supabase = getBrowserClient;
