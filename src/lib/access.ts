/**
 * Email allowlist. Only these addresses may access the app, even though anyone
 * can request a magic link (the link just won't grant access).
 *
 * Configured via the ALLOWED_EMAILS env var (comma-separated). If unset (e.g.
 * local dev with no list), access is open — set the var in every environment
 * that holds real data.
 */
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (ALLOWED.length === 0) return true; // no list configured → don't lock out dev
  return ALLOWED.includes(email.toLowerCase());
}
