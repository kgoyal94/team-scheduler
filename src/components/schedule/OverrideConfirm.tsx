"use client";
import { useState } from "react";
import { Employee, Conflict, ShiftOverride } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES, DAY_NAMES } from "../../lib/constants";
import { fmtDate, fmtTime, dowOf } from "../../domain/time";
import { Btn } from "../ui/Btn";

// Canned reasons — click to drop one into the note. Not exhaustive, just the
// common cases; the note is free text either way.
const REASON_TAGS = ["Callout coverage", "Employee asked for it", "Seasonal rush"];

interface OverrideConfirmProps {
  emp: Employee;
  dateISO: string;
  type: string;
  tmpl: { start: number; end: number };
  conflicts: Conflict[];
  onConfirm: (override: ShiftOverride) => void;
  onCancel: () => void;
}

export function OverrideConfirm({
  emp,
  dateISO,
  type,
  tmpl,
  conflicts,
  onConfirm,
  onCancel,
}: OverrideConfirmProps) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const st = SHIFT_TYPES[type as keyof typeof SHIFT_TYPES];
  const top = conflicts[0];
  const sentence = top ? `${emp.name} ${top.detail}.` : `Schedule ${emp.name} anyway?`;

  return (
    <div
      // Nested inside SuggestModal's own backdrop — stop propagation so cancelling
      // the override doesn't also bubble up and close the suggest modal behind it.
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(25,32,28,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          borderRadius: 14,
          padding: 20,
          width: "min(400px,100%)",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(20,28,24,0.3)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: T.warnBg,
            color: T.warn,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          ⚑
        </div>
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 8 }}>
          OVERRIDE · {st.label} · {DAY_NAMES[dowOf(dateISO)]} {fmtDate(dateISO)} ·{" "}
          {fmtTime(tmpl.start)}–{fmtTime(tmpl.end)}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6 }}>{sentence}</div>

        {conflicts.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              border: "none",
              background: "transparent",
              color: T.ok,
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 0",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {expanded ? "Hide rule conflicts ▴" : `See all ${conflicts.length} rule conflicts ▾`}
          </button>
        )}
        {expanded && (
          <div style={{ borderTop: `1px solid ${T.line}`, margin: "4px 0" }}>
            {conflicts.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "flex-start",
                  padding: "9px 0",
                  borderBottom: i < conflicts.length - 1 ? `1px solid ${T.line}` : undefined,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: c.severity === "hard" ? T.danger : T.warn,
                    marginTop: 4,
                    flex: "none",
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>
                    {emp.name} {c.detail}.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: T.inkSoft, marginBottom: 5 }}>
            WHY (SAVED WITH THE SHIFT)
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — helps explain this later"
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "inherit",
              fontSize: 12.5,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "9px 11px",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
            {REASON_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setNote((n) => (n ? `${n}; ${tag}` : tag))}
                style={{
                  background: "#F1F3EF",
                  border: `1px solid ${T.line}`,
                  color: T.inkSoft,
                  borderRadius: 999,
                  padding: "2px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn
            kind="warn"
            style={{ flex: 1, borderRadius: 999, textAlign: "center", padding: "10px 14px", fontSize: 13.5 }}
            onClick={() =>
              onConfirm({ reason: note.trim(), summary: top?.detail ?? "override" })
            }
          >
            Schedule {emp.name} anyway
          </Btn>
          <Btn style={{ borderRadius: 999, padding: "10px 14px", fontSize: 13.5 }} onClick={onCancel}>
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  );
}
