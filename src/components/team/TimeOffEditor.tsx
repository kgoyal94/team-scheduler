"use client";
import { useState } from "react";
import { Employee } from "../../domain/types";
import { T } from "../../lib/tokens";
import { fmtDate } from "../../domain/time";
import { uid } from "../../lib/util";
import { Btn } from "../ui/Btn";

interface TimeOffEditorProps {
  emp: Employee;
  updateEmp: (id: string, patch: Partial<Employee>) => void;
}

export function TimeOffEditor({ emp, updateEmp }: TimeOffEditorProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 4 }}>
        Time-off requests
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
        {emp.timeOff.length === 0 && (
          <span style={{ fontSize: 12, color: T.inkSoft }}>None</span>
        )}
        {emp.timeOff.map((t) => (
          <span
            key={t.id}
            style={{
              background: T.offBg,
              color: T.offInk,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "2px 8px",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {fmtDate(t.start)}
            {t.end !== t.start ? ` – ${fmtDate(t.end)}` : ""}
            {t.note ? ` · ${t.note}` : ""}
            <button
              onClick={() =>
                updateEmp(emp.id, { timeOff: emp.timeOff.filter((x) => x.id !== t.id) })
              }
              style={{
                border: "none",
                background: "transparent",
                color: T.offInk,
                cursor: "pointer",
                fontWeight: 800,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{ fontSize: 12 }}
        />
        <span style={{ fontSize: 12 }}>to</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          style={{ fontSize: 12 }}
        />
        <input
          placeholder="note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ fontSize: 12, width: 120 }}
        />
        <Btn
          small
          onClick={() => {
            if (!start) return;
            const e2 = end && end >= start ? end : start;
            updateEmp(emp.id, {
              timeOff: [
                ...emp.timeOff,
                { id: uid(), start, end: e2, note: note.trim() },
              ],
            });
            setStart("");
            setEnd("");
            setNote("");
          }}
        >
          Add
        </Btn>
      </div>
    </div>
  );
}
