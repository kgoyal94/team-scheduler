"use client";
import { T } from "../../lib/tokens";

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "ghost" | "primary" | "danger" | "warn";
  small?: boolean;
  style?: React.CSSProperties;
  title?: string;
}

export function Btn({ children, onClick, kind = "ghost", small, style, title }: BtnProps) {
  const base: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    borderRadius: 8,
    padding: small ? "3px 8px" : "7px 12px",
    cursor: "pointer",
    border: `1px solid ${T.line}`,
    background: "#fff",
    color: T.ink,
    ...style,
  };
  if (kind === "primary") {
    base.background = T.ink;
    base.color = "#fff";
    base.border = `1px solid ${T.ink}`;
  }
  if (kind === "danger") {
    base.background = T.dangerBg;
    base.color = T.danger;
    base.border = `1px solid ${T.danger}44`;
  }
  if (kind === "warn") {
    base.background = T.warn;
    base.color = "#fff";
    base.border = `1px solid ${T.warn}`;
  }
  return (
    <button onClick={onClick} style={base} title={title}>
      {children}
    </button>
  );
}
