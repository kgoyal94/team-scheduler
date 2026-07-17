/**
 * Auth callback route — establishes a session from the magic-link email, then
 * redirects to the scheduler.
 *
 * Handles BOTH Supabase email flows so login works regardless of the email
 * template configuration:
 *   - PKCE code flow:      ?code=...                 -> exchangeCodeForSession
 *   - OTP verify flow:     ?token_hash=...&type=...  -> verifyOtp
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createSupabaseServerClient();

  // PKCE code flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // OTP / magic-link verify flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Nothing usable — back to login with a hint.
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
