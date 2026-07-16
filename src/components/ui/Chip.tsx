"use client";

interface ChipProps {
  children: React.ReactNode;
  bg: string;
  ink: string;
  style?: React.CSSProperties;
}

export function Chip({ children, bg, ink, style }: ChipProps) {
  return (
    <span
      style={{
        background: bg,
        color: ink,
        borderRadius: 999,
        padding: "1px 8px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
