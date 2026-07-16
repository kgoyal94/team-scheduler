"use client";
import React from "react";
import { Employee, Shift, Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES, DAY_NAMES } from "../../lib/constants";
import { addDays, dowOf, fmtTime, mondayOf, monthOfISO, todayISO } from "../../domain/time";
import { onTimeOff } from "../../domain/rules";
import { dayStatusFor } from "../../domain/coverage";

interface MonthViewProps {
  monthAnchor: string;
  employees: Employee[];
  shifts: Shift[];
  settings: Settings;
  empById: Record<string, Employee>;
  colorOf: (empId: string) => string;
  dropHover: string | null;
  setDropHover: (v: string | null) => void;
  setDragId: (v: string | null) => void;
  setWeekStart: (v: string) => void;
  setView: (v: "week" | "month") => void;
  moveShiftDate: (id: string, date: string) => void;
}

export function MonthView({
  monthAnchor,
  employees,
  shifts,
  settings,
  empById,
  colorOf,
  dropHover,
  setDropHover,
  setDragId,
  setWeekStart,
  setView,
  moveShiftDate,
}: MonthViewProps) {
  const mo = monthOfISO(monthAnchor);
  const gridStart = mondayOf(monthAnchor);
  const cells: string[] = [];
  let d = gridStart;
  while (monthOfISO(d) <= mo || dowOf(d) !== 0) {
    cells.push(d);
    d = addDays(d, 1);
    if (cells.length >= 42) break;
  }
  while (cells.length > 7 && monthOfISO(cells[cells.length - 7]) > mo) cells.splice(-7);
  const today = todayISO();
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.line}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        {DAY_NAMES.map((dn) => (
          <div
            key={dn}
            style={{
              padding: "8px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              color: T.inkSoft,
              textAlign: "center",
            }}
          >
            {dn.toUpperCase()}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((date, idx) => {
          const inMonth = monthOfISO(date) === mo;
          const st = dayStatusFor(date, shifts, empById, settings);
          const dayNum = +date.slice(8, 10);
          const offToday = employees.filter((e) => onTimeOff(e, date));
          const dayShifts = shifts
            .filter((s) => s.date === date)
            .sort((a, b) => a.start - b.start);
          const maxShown = 3;
          const extra = dayShifts.length - maxShown;
          const hoverKey = `m|${date}`;
          const tint = !inMonth
            ? "#FAFBF9"
            : st.kind === "covered"
            ? "#F3FAF5"
            : st.kind === "attention"
            ? "#FDF3F0"
            : "#fff";
          return (
            <div
              key={date}
              onDoubleClick={() => {
                setWeekStart(mondayOf(date));
                setView("week");
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDropHover(hoverKey);
              }}
              onDragLeave={() => setDropHover(dropHover === hoverKey ? null : dropHover)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveShiftDate(id, date);
                setDropHover(null);
                setDragId(null);
              }}
              title="Double-click to open this week"
              style={{
                minHeight: 108,
                padding: "6px 6px 8px",
                cursor: "pointer",
                background: dropHover === hoverKey ? "#DCEBE3" : tint,
                borderRight: idx % 7 < 6 ? `1px solid ${T.line}` : "none",
                borderBottom: `1px solid ${T.line}`,
                opacity: inMonth ? 1 : 0.55,
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
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    width: 22,
                    height: 22,
                    lineHeight: "22px",
                    textAlign: "center",
                    borderRadius: 99,
                    background: date === today ? T.ink : "transparent",
                    color:
                      date === today ? "#fff" : inMonth ? T.ink : T.inkSoft,
                  }}
                >
                  {dayNum}
                </span>
                {inMonth && st.kind === "attention" && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      color: T.danger,
                    }}
                  >
                    ● NEEDS {st.missing || st.issueCount}
                  </span>
                )}
              </div>
              {offToday.map((e) => (
                <div
                  key={e.id}
                  style={{
                    background: T.offBg,
                    color: T.offInk,
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✕ {e.name} off
                </div>
              ))}
              {dayShifts.slice(0, maxShown).map((s) => {
                const emp = empById[s.empId];
                const c = colorOf(s.empId);
                const isTraining = s.type === "training";
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", s.id);
                      setDragId(s.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropHover(null);
                    }}
                    title={`${emp ? emp.name : "?"} · ${SHIFT_TYPES[s.type].label} ${fmtTime(s.start)}–${fmtTime(s.end)} — drag to move`}
                    style={{
                      background: isTraining ? "transparent" : c + "22",
                      border: isTraining ? `1px dashed ${c}` : "none",
                      color: c,
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      marginBottom: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "grab",
                      fontStyle: isTraining ? "italic" : "normal",
                    }}
                  >
                    {fmtTime(s.start)} {emp ? emp.name : "?"} ·{" "}
                    {SHIFT_TYPES[s.type].short.toLowerCase()}
                  </div>
                );
              })}
              {extra > 0 && (
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: T.inkSoft,
                    padding: "0 6px",
                  }}
                >
                  +{extra} more
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          padding: "8px 12px",
          borderTop: `1px solid ${T.line}`,
          fontSize: 11.5,
          color: T.inkSoft,
        }}
      >
        <span>
          <span style={{ background: "#E7F2EC", borderRadius: 3, padding: "0 6px" }}>&nbsp;</span>{" "}
          Covered
        </span>
        <span>
          <span style={{ background: "#F9E9E5", borderRadius: 3, padding: "0 6px" }}>&nbsp;</span>{" "}
          Needs attention
        </span>
        <span>
          <span
            style={{
              background: T.offBg,
              color: T.offInk,
              borderRadius: 3,
              padding: "0 4px",
              fontWeight: 700,
            }}
          >
            ✕ off
          </span>{" "}
          Time off
        </span>
        <span style={{ fontStyle: "italic" }}>dashed = training</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {employees.map((e) => (
            <span key={e.id}>
              <span style={{ color: e.color }}>●</span> {e.name}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
