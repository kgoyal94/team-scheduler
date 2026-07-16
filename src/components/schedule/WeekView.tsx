"use client";
import React from "react";
import { Employee, Shift, Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES, COVERAGE_TYPES, DAY_NAMES } from "../../lib/constants";
import { fmtDate, fmtTime } from "../../domain/time";
import { onTimeOff } from "../../domain/rules";
import { Btn } from "../ui/Btn";
import { Chip } from "../ui/Chip";
import { CoverageSlot } from "./CoverageSlot";

interface Gap {
  date: string;
  type: string;
  missing: number;
  dow: number;
}
interface Conflict {
  msg: string;
  dow: number;
}
interface HourRow {
  emp: Employee;
  hrs: number;
  under: boolean;
  over: boolean;
}

interface WeekViewProps {
  weekDates: string[];
  employees: Employee[];
  shifts: Shift[];
  settings: Settings;
  gaps: Gap[];
  conflicts: Conflict[];
  overMax: HourRow[];
  hourRows: HourRow[];
  weekIsEmpty: boolean;
  copyPrevWeek: () => void;
  setSuggestFor: (v: { date: string; type: string } | null) => void;
  dragId: string | null;
  dropHover: string | null;
  setDropHover: (v: string | null) => void;
  moveShift: (id: string, date: string, type: string) => void;
  empById: Record<string, Employee>;
  colorOf: (empId: string) => string;
  editShift: string | null;
  setEditShift: (v: string | null) => void;
  setDragId: (v: string | null) => void;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export function WeekView({
  weekDates,
  employees,
  shifts,
  settings,
  gaps,
  conflicts,
  overMax,
  hourRows,
  weekIsEmpty,
  copyPrevWeek,
  setSuggestFor,
  dragId,
  dropHover,
  setDropHover,
  moveShift,
  empById,
  colorOf,
  editShift,
  setEditShift,
  setDragId,
  setShifts,
}: WeekViewProps) {
  return (
    <>
      {(gaps.length > 0 || conflicts.length > 0 || overMax.length > 0) && (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              color: T.danger,
              marginBottom: 6,
            }}
          >
            NEEDS ATTENTION
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {gaps.map((g, i) => (
              <button
                key={i}
                onClick={() => setSuggestFor({ date: g.date, type: g.type })}
                style={{
                  background: T.dangerBg,
                  color: T.danger,
                  border: `1px solid ${T.danger}33`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                {DAY_NAMES[g.dow]} needs {g.missing} {SHIFT_TYPES[g.type as keyof typeof SHIFT_TYPES].label.toLowerCase()} →
              </button>
            ))}
            {overMax.map((r) => (
              <Chip key={r.emp.id} bg={T.warnBg} ink={T.warn}>
                ⚠ {r.emp.name} is over their {r.emp.maxHours}h max ({r.hrs.toFixed(1)}h)
              </Chip>
            ))}
            {conflicts.map((c, i) => (
              <Chip key={"c" + i} bg={T.warnBg} ink={T.warn}>
                ⚠ {DAY_NAMES[c.dow]}: {c.msg}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {weekIsEmpty && (
        <div
          style={{
            background: "#fff",
            border: `1px dashed ${T.line}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>This week is blank. Start from last week&apos;s pattern?</span>
          <Btn kind="primary" small onClick={copyPrevWeek}>
            Copy previous week
          </Btn>
        </div>
      )}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,minmax(150px,1fr))",
            gap: 8,
            minWidth: 1080,
          }}
        >
          {weekDates.map((date, i) => {
            const offToday = employees.filter((e) => onTimeOff(e, date));
            const d = settings.days[i];
            return (
              <div
                key={date}
                style={{
                  background: T.panel,
                  borderRadius: 12,
                  border: `1px solid ${T.line}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px 6px",
                    background:
                      "linear-gradient(90deg,#E9A13B22,#3E7CB122,#6C5CA822)",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    {DAY_NAMES[i]}{" "}
                    <span style={{ fontWeight: 500, color: T.inkSoft }}>
                      {fmtDate(date)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.inkSoft }}>
                    Store {fmtTime(d.storeOpen)}–{fmtTime(d.storeClose)}
                  </div>
                  {offToday.length > 0 && (
                    <div
                      style={{
                        marginTop: 4,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                      }}
                    >
                      {offToday.map((e) => (
                        <Chip key={e.id} bg={T.offBg} ink={T.offInk}>
                          {e.name} off
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
                {COVERAGE_TYPES.map((type) => (
                  <CoverageSlot
                    key={type}
                    date={date}
                    type={type}
                    dow={i}
                    shifts={shifts}
                    settings={settings}
                    dragId={dragId}
                    dropHover={dropHover}
                    setDropHover={setDropHover}
                    moveShift={moveShift}
                    setSuggestFor={setSuggestFor}
                    empById={empById}
                    colorOf={colorOf}
                    editShift={editShift}
                    setEditShift={setEditShift}
                    setDragId={setDragId}
                    setShifts={setShifts}
                  />
                ))}
                <CoverageSlot
                  key="training"
                  date={date}
                  type="training"
                  dow={i}
                  shifts={shifts}
                  settings={settings}
                  dragId={dragId}
                  dropHover={dropHover}
                  setDropHover={setDropHover}
                  moveShift={moveShift}
                  setSuggestFor={setSuggestFor}
                  empById={empById}
                  colorOf={colorOf}
                  editShift={editShift}
                  setEditShift={setEditShift}
                  setDragId={setDragId}
                  setShifts={setShifts}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 12,
          padding: 14,
          marginTop: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            color: T.inkSoft,
            marginBottom: 8,
          }}
        >
          WEEKLY HOURS — MINIMUM TO MAXIMUM
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {hourRows.map(({ emp, hrs, under, over }) => {
            const pct = Math.min(100, (hrs / Math.max(emp.maxHours, 1)) * 100);
            const minPct = Math.min(100, (emp.minHours / Math.max(emp.maxHours, 1)) * 100);
            return (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 70, fontWeight: 700, fontSize: 13 }}>{emp.name}</span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: "#EDEFEA",
                    borderRadius: 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: over ? T.warn : under ? T.danger : T.ok,
                      transition: "width 200ms",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${minPct}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: T.ink,
                      opacity: 0.5,
                    }}
                    title={`${emp.minHours}h minimum`}
                  />
                </div>
                <span
                  style={{
                    width: 160,
                    fontSize: 12,
                    textAlign: "right",
                    color: over ? T.warn : under ? T.danger : T.inkSoft,
                    fontWeight: under || over ? 700 : 500,
                  }}
                >
                  {hrs.toFixed(1)}h ({emp.minHours}–{emp.maxHours}h)
                  {over ? " ▲ over max" : under ? " ▼ under min" : " ✓"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
