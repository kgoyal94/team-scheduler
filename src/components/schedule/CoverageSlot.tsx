"use client";
import React from "react";
import { Employee, Shift, Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES } from "../../lib/constants";
import { ShiftCard } from "./ShiftCard";

interface CoverageSlotProps {
  date: string;
  type: string;
  dow: number;
  shifts: Shift[];
  settings: Settings;
  dragId: string | null;
  dropHover: string | null;
  setDropHover: (v: string | null) => void;
  moveShift: (id: string, date: string, type: string) => void;
  setSuggestFor: (v: { date: string; type: string } | null) => void;
  empById: Record<string, Employee>;
  colorOf: (empId: string) => string;
  editShift: string | null;
  setEditShift: (v: string | null) => void;
  setDragId: (v: string | null) => void;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export function CoverageSlot({
  date,
  type,
  dow,
  shifts,
  settings,
  dragId,
  dropHover,
  setDropHover,
  moveShift,
  setSuggestFor,
  empById,
  colorOf,
  editShift,
  setEditShift,
  setDragId,
  setShifts,
}: CoverageSlotProps) {
  const tmplFor = (dow: number, type: string) =>
    settings.days[dow].shifts[type as keyof typeof settings.days[0]["shifts"]];
  const trainingDefault = (dow: number) => {
    const o = settings.days[dow].shifts.open;
    return { start: o.start, end: o.end };
  };

  const st = SHIFT_TYPES[type as keyof typeof SHIFT_TYPES];
  const isTraining = type === "training";
  const tmpl = isTraining ? trainingDefault(dow) : tmplFor(dow, type);
  const need = isTraining ? 0 : tmplFor(dow, type).needed;
  const dayShifts = shifts.filter((s) => s.date === date && s.type === type);
  if (!isTraining && need === 0 && dayShifts.length === 0 && !dragId) return null;
  if (isTraining && dayShifts.length === 0 && !dragId) {
    return (
      <div key={type} style={{ padding: "4px 6px 6px", borderTop: `1px dashed ${T.line}` }}>
        <button
          onClick={() => setSuggestFor({ date, type })}
          style={{
            width: "100%",
            border: `1px dashed ${st.edge}88`,
            background: "transparent",
            color: st.edge,
            borderRadius: 8,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "4px",
            cursor: "pointer",
          }}
        >
          + training shadow
        </button>
      </div>
    );
  }
  const missing = need - dayShifts.length;
  const hoverKey = `${date}|${type}`;
  return (
    <div
      key={type}
      onDragOver={(e) => {
        e.preventDefault();
        setDropHover(hoverKey);
      }}
      onDragLeave={() => setDropHover(dropHover === hoverKey ? null : dropHover)}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) moveShift(id, date, type);
        setDropHover(null);
        setDragId(null);
      }}
      style={{
        padding: "6px 6px 2px",
        borderTop: `1px dashed ${T.line}`,
        background: dropHover === hoverKey ? `${st.edge}22` : "transparent",
        transition: "background 120ms",
        minHeight: 46,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span
          style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: st.edge }}
          title={`${st.label}${isTraining ? " (does not count toward coverage)" : ` · needs ${need}`}`}
        >
          {st.short}
        </span>
        <button
          onClick={() => setSuggestFor({ date, type })}
          title={`Add / suggest a ${st.label.toLowerCase()} shift`}
          style={{
            border: "none",
            background: "transparent",
            color: st.edge,
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            padding: "0 2px",
          }}
        >
          +
        </button>
      </div>
      {dayShifts.map((s) => (
        <ShiftCard
          key={s.id}
          shift={s}
          empById={empById}
          settings={settings}
          colorOf={colorOf}
          editShift={editShift}
          setEditShift={setEditShift}
          dragId={dragId}
          setDragId={setDragId}
          setDropHover={setDropHover}
          setShifts={setShifts}
        />
      ))}
      {missing > 0 && (
        <button
          onClick={() => setSuggestFor({ date, type })}
          style={{
            width: "100%",
            border: `1.5px dashed ${T.danger}88`,
            background: T.dangerBg,
            color: T.danger,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            padding: "6px 4px",
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          Needs {missing} {st.label.toLowerCase()} — suggest
        </button>
      )}
    </div>
  );
}
