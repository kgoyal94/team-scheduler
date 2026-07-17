"use client";
/**
 * Login page — magic-link email login via Supabase.
 * Matches the app's existing visual style (T tokens, inline styles).
 */
import { useState } from "react";
import { getBrowserClient } from "../../data/supabase";
import { T } from "../../lib/tokens";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = getBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // After clicking the link in the email, Supabase redirects here.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Avenir Next','Segoe UI',system-ui,-apple-system,sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo / title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3, color: T.ink }}>
            Shift Board
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>
            the design partner — manager login
          </div>
        </div>

        {submitted ? (
          <div
            style={{
              background: T.okBg,
              border: `1px solid ${T.ok}44`,
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 13,
              color: T.ok,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            Check your inbox — we sent a magic link to <strong>{email}</strong>.
            <br />
            <span style={{ fontWeight: 400, color: T.inkSoft }}>
              Click the link to sign in. You can close this tab.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: T.inkSoft,
                marginBottom: 6,
              }}
            >
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 14,
                padding: "9px 12px",
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                background: "#fff",
                color: T.ink,
                outline: "none",
                marginBottom: 14,
              }}
            />

            {error && (
              <div
                style={{
                  background: T.dangerBg,
                  border: `1px solid ${T.danger}44`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  color: T.danger,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                background: loading ? T.inkSoft : T.ink,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 0.1,
              }}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
