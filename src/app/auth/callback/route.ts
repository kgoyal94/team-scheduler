/**
 * Auth callback route — establishes a session from the magic-link email, then
 * redirects to the scheduler.
 *
 * Handles BOTH Supabase email flows so login works regardless of the email
 * template configuration:
 *   - PKCE code flow:      ?code=...                 -> exchangeCodeForSession
 *   - OTP verify flow:     ?token_hash=...&type=...  -> verifyOtp
 *
 * Enforces the email allowlist: a successfully-authenticated user whose email
 * is not allowed is immediately signed out and bounced to /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { isAllowedEmail } from "../../../lib/access";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createSupabaseServerClient();

  let authed = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authed = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    authed = !error;
  }

  if (authed) {
    // Enforce the allowlist before letting the session stand.
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAllowedEmail(user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not-authorized`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
