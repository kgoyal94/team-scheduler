"use client";
import React from "react";
import { Employee, Shift, Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES } from "../../lib/constants";
import { fmtTime } from "../../domain/time";
import { shiftIssues } from "../../domain/rules";
import { trainingFocusLabel } from "../../domain/training";
import { Btn } from "../ui/Btn";
import { TimeSel } from "../ui/TimeSel";

interface ShiftCardProps {
  shift: Shift;
  empById: Record<string, Employee>;
  settings: Settings;
  colorOf: (empId: string) => string;
  editShift: string | null;
  setEditShift: (v: string | null) => void;
  dragId: string | null;
  setDragId: (v: string | null) => void;
  setDropHover: (v: string | null) => void;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export function ShiftCard({
  shift: s,
  empById,
  settings,
  colorOf,
  editShift,
  setEditShift,
  dragId,
  setDragId,
  setDropHover,
  setShifts,
}: ShiftCardProps) {
  const emp = empById[s.empId];
  const st = SHIFT_TYPES[s.type];
  const c = colorOf(s.empId);
  const issues = shiftIssues(s, emp);
  const editing = editShift === s.id;
  const isTraining = s.type === "training";
  return (
    <div
      key={s.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", s.id);
        setDragId(s.id);
      }}
      onDragEnd={() => {
        setDragId(null);
        setDropHover(null);
      }}
      style={{
        background: st.bg,
        borderLeft: `4px solid ${st.edge}`,
        border: isTraining ? `1px dashed ${st.edge}` : undefined,
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderRadius: 8,
        padding: "6px 8px",
        marginBottom: 6,
        cursor: "grab",
        opacity: dragId === s.id ? 0.4 : 1,
        boxShadow: "0 1px 2px rgba(30,40,35,0.08)",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: st.ink,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: c,
              display: "inline-block",
            }}
          />
          {emp ? emp.name : "?"}
        </span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {issues.length > 0 && (
            <span title={issues.join(" · ")} style={{ fontSize: 12 }}>
              ⚠️
            </span>
          )}
          <button
            onClick={() => setEditShift(editing ? null : s.id)}
            title="Edit shift"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              color: st.ink,
              padding: 0,
            }}
          >
            ✎
          </button>
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: st.ink, opacity: 0.85 }}>
        {fmtTime(s.start)} – {fmtTime(s.end)}
        {isTraining && (
          <span style={{ fontStyle: "italic" }}>
            {" "}
            · trains {trainingFocusLabel(s, settings)}
          </span>
        )}
      </div>
      {issues.length > 0 && (
        <div style={{ fontSize: 10.5, color: T.danger, marginTop: 2 }}>{issues[0]}</div>
      )}
      {editing && (
        <div
          style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}
        >
          <TimeSel
            value={s.start}
            onChange={(v) =>
              setShifts((prev) => prev.map((x) => (x.id === s.id ? { ...x, start: v } : x)))
            }
          />
          <span style={{ fontSize: 11 }}>to</span>
          <TimeSel
            value={s.end}
            onChange={(v) =>
              setShifts((prev) => prev.map((x) => (x.id === s.id ? { ...x, end: v } : x)))
            }
          />
          <Btn
            small
            kind="danger"
            onClick={() => {
              setShifts((prev) => prev.filter((x) => x.id !== s.id));
              setEditShift(null);
            }}
          >
            Remove
          </Btn>
        </div>
      )}
    </div>
  );
}
