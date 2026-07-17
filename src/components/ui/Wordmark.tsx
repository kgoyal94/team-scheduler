import { T } from "../../lib/tokens";

/**
 * ShiftLift wordmark — lightweight two-tone brand mark used in the login page
 * and the app header. Keep branding changes in one place.
 */
export const BRAND = "#2E7D6B"; // ShiftLift accent (teal-green)

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 900,
        letterSpacing: -0.4,
        color: T.ink,
        display: "inline-flex",
        alignItems: "baseline",
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      Shift<span style={{ color: BRAND }}>Lift</span>
    </span>
  );
}
