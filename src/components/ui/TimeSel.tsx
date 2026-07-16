"use client";
import { TIME_OPTIONS } from "../../lib/constants";
import { fmtTime } from "../../domain/time";

interface TimeSelProps {
  value: number;
  onChange: (v: number) => void;
  style?: React.CSSProperties;
}

export function TimeSel({ value, onChange, style }: TimeSelProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{ fontSize: 11.5, ...style }}
    >
      {TIME_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {fmtTime(m)}
        </option>
      ))}
    </select>
  );
}
