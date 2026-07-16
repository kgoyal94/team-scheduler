"use client";
import { useState, useMemo, useEffect } from "react";
import { Employee, Shift, Settings } from "../domain/types";
import { T } from "../lib/tokens";
import { COVERAGE_TYPES } from "../lib/constants";
import {
  addDays, dowOf, mondayOf, fmtDate, fmtMonth, addMonths, todayISO,
} from "../domain/time";
import { hoursFor, shiftIssues } from "../domain/rules";
import { trainingCovers } from "../domain/training";
import { buildWorkbook } from "../export/workbook";
import { loadEmployees } from "../data/employees";
import { loadShifts } from "../data/shifts";
import { loadSettings } from "../data/settings";
import { uid } from "../lib/util";
import { Btn } from "./ui/Btn";
import { WeekView } from "./schedule/WeekView";
import { MonthView } from "./schedule/MonthView";
import { SuggestModal } from "./schedule/SuggestModal";
import { TeamTab } from "./team/TeamTab";
import { SettingsTab } from "./settings/SettingsTab";

export function Scheduler() {
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [shifts, setShifts] = useState<Shift[]>(() => loadShifts());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [weekStart, setWeekStart] = useState("2026-07-13");
  const [monthAnchor, setMonthAnchor] = useState("2026-07-01");
  const [tab, setTab] = useState<"schedule" | "team" | "settings">("schedule");
  const [view, setView] = useState<"week" | "month">("week");
  const [suggestFor, setSuggestFor] = useState<{ date: string; type: string } | null>(null);
  const [editShift, setEditShift] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState<string | null>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const empById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees]
  );
  const colorOf = (empId: string) => (empById[empId] && empById[empId].color) || "#3F4A55";

  const tmplFor = (dow: number, type: string) =>
    settings.days[dow].shifts[type as keyof typeof settings.days[0]["shifts"]];
  const trainingDefault = (dow: number) => {
    const o = settings.days[dow].shifts.open;
    return { start: o.start, end: o.end };
  };
  const templateOrTraining = (dow: number, type: string) =>
    type === "training" ? trainingDefault(dow) : tmplFor(dow, type);

  /* ---- auto-certification from completed training shifts ---- */
  useEffect(() => {
    const grants: Record<string, { open: boolean; close: boolean }> = {};
    const today = todayISO();
    shifts.forEach((s) => {
      if (s.type !== "training" || s.date > today) return;
      const c = trainingCovers(s, settings);
      if (!grants[s.empId]) grants[s.empId] = { open: false, close: false };
      if (c.open) grants[s.empId].open = true;
      if (c.close) grants[s.empId].close = true;
    });
    let changed = false;
    const next = employees.map((e) => {
      const g = grants[e.id];
      if (!g) return e;
      const patch: Partial<Employee> = {};
      if (g.open && !e.canOpen) patch.canOpen = true;
      if (g.close && !e.canClose) patch.canClose = true;
      if (Object.keys(patch).length) { changed = true; return { ...e, ...patch }; }
      return e;
    });
    if (changed) setEmployees(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, settings]);

  /* ---- current-week derived ---- */
  const gaps = useMemo(() => {
    const out: { date: string; type: string; missing: number; dow: number }[] = [];
    weekDates.forEach((date, dow) => {
      COVERAGE_TYPES.forEach((type) => {
        const need = tmplFor(dow, type).needed;
        const n = shifts.filter((s) => s.date === date && s.type === type).length;
        if (n < need) out.push({ date, type, missing: need - n, dow });
      });
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, weekDates, settings]);

  const conflicts = useMemo(() => {
    const out: { msg: string; dow: number }[] = [];
    shifts.filter((s) => weekDates.includes(s.date)).forEach((s) => {
      shiftIssues(s, empById[s.empId]).forEach((msg) =>
        out.push({ msg, dow: weekDates.indexOf(s.date) })
      );
    });
    return out;
  }, [shifts, weekDates, empById]);

  const hourRows = useMemo(
    () =>
      employees.map((e) => {
        const hrs = hoursFor(shifts, e.id, weekDates);
        return { emp: e, hrs, under: hrs < e.minHours - 0.01, over: hrs > e.maxHours + 0.01 };
      }),
    [employees, shifts, weekDates]
  );
  const overMax = hourRows.filter((r) => r.over);
  const weekIsEmpty = !shifts.some((s) => weekDates.includes(s.date));

  /* ---- actions ---- */
  const moveShift = (id: string, date: string, type: string) => {
    const dow = dowOf(date);
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, date, type: type as Shift["type"] };
        if (s.type !== type && type !== "training") {
          const t = tmplFor(dow, type);
          next.start = t.start;
          next.end = t.end;
        }
        return next;
      })
    );
  };
  const moveShiftDate = (id: string, date: string) =>
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, date } : s)));
  const assign = (empId: string, date: string, type: string) => {
    const t = templateOrTraining(dowOf(date), type);
    setShifts((prev) => [
      ...prev,
      { id: uid(), empId, date, type: type as Shift["type"], start: t.start, end: t.end },
    ]);
    setSuggestFor(null);
  };
  const copyPrevWeek = () => {
    const prevDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i - 7));
    const copies = shifts
      .filter((s) => prevDates.includes(s.date))
      .map((s) => ({ ...s, id: uid(), date: addDays(s.date, 7) }));
    setShifts((prev) => [...prev, ...copies]);
  };
  const updateEmp = (id: string, patch: Partial<Employee>) =>
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updateDay = (dow: number, patch: Partial<Settings["days"][0]>) =>
    setSettings((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dow ? { ...d, ...patch } : d)),
    }));
  const updateDayShift = (dow: number, type: string, patch: Partial<{ needed: number; start: number; end: number }>) =>
    setSettings((prev) => ({
      ...prev,
      days: prev.days.map((d, i) =>
        i === dow
          ? { ...d, shifts: { ...d.shifts, [type]: { ...d.shifts[type as keyof typeof d.shifts], ...patch } } }
          : d
      ),
    }));
  const applyStoreHours = (dow: number) => {
    const d = settings.days[dow];
    const openStart = d.storeOpen - settings.prepMinutes;
    const closeEnd = d.storeClose + d.closeOut;
    setSettings((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i !== dow
          ? day
          : {
              ...day,
              shifts: {
                ...day.shifts,
                open: { ...day.shifts.open, start: openStart },
                close: { ...day.shifts.close, end: closeEnd },
                full: { ...day.shifts.full, start: openStart, end: closeEnd },
              },
            }
      ),
    }));
  };

  /* ---- schedule tab ---- */
  const scheduleTab = (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            border: `1px solid ${T.line}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {(
            [
              ["week", "Week"],
              ["month", "Month"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                border: "none",
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: view === key ? T.ink : "#fff",
                color: view === key ? "#fff" : T.ink,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "week" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Btn small onClick={() => setWeekStart(addDays(weekStart, -7))}>←</Btn>
            <span style={{ fontWeight: 800, fontSize: 13 }}>
              {fmtDate(weekStart)} – {fmtDate(addDays(weekStart, 6))}
            </span>
            <Btn small onClick={() => setWeekStart(addDays(weekStart, 7))}>→</Btn>
            <Btn small onClick={() => setWeekStart(mondayOf(todayISO()))}>Today</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Btn small onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}>←</Btn>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{fmtMonth(monthAnchor)}</span>
            <Btn small onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}>→</Btn>
            <Btn small onClick={() => setMonthAnchor(todayISO().slice(0, 7) + "-01")}>Today</Btn>
          </div>
        )}
        <Btn
          small
          kind="primary"
          style={{ marginLeft: "auto" }}
          title="Downloads an .xlsx with a Week tab and a Month tab — open it in Google Sheets"
          onClick={() => {
            try {
              buildWorkbook({ employees, shifts, settings, weekStart, monthAnchor });
            } catch {
              alert("Export failed to load the spreadsheet library. Check your connection and try again.");
            }
          }}
        >
          ⇩ Export to Google Sheets
        </Btn>
      </div>
      {view === "week" ? (
        <WeekView
          weekDates={weekDates}
          employees={employees}
          shifts={shifts}
          settings={settings}
          gaps={gaps}
          conflicts={conflicts}
          overMax={overMax}
          hourRows={hourRows}
          weekIsEmpty={weekIsEmpty}
          copyPrevWeek={copyPrevWeek}
          setSuggestFor={setSuggestFor}
          dragId={dragId}
          dropHover={dropHover}
          setDropHover={setDropHover}
          moveShift={moveShift}
          empById={empById}
          colorOf={colorOf}
          editShift={editShift}
          setEditShift={setEditShift}
          setDragId={setDragId}
          setShifts={setShifts}
        />
      ) : (
        <MonthView
          monthAnchor={monthAnchor}
          employees={employees}
          shifts={shifts}
          settings={settings}
          empById={empById}
          colorOf={colorOf}
          dropHover={dropHover}
          setDropHover={setDropHover}
          setDragId={setDragId}
          setWeekStart={setWeekStart}
          setView={setView}
          moveShiftDate={moveShiftDate}
        />
      )}
    </>
  );

  /* ---- shell ---- */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.ink,
        fontFamily:
          "'Avenir Next','Segoe UI',system-ui,-apple-system,sans-serif",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.3 }}>Shift Board</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>
              Open · Swing · Close · Training — drag shifts to move them
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {(
              [
                ["schedule", "Schedule"],
                ["team", "Team & rules"],
                ["settings", "Business settings"],
              ] as const
            ).map(([key, label]) => (
              <Btn key={key} small kind={tab === key ? "primary" : "ghost"} onClick={() => setTab(key)}>
                {label}
              </Btn>
            ))}
          </div>
        </div>
        {tab === "schedule" ? (
          scheduleTab
        ) : tab === "team" ? (
          <TeamTab
            employees={employees}
            updateEmp={updateEmp}
            setEmployees={setEmployees}
            setShifts={setShifts}
          />
        ) : (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            updateDay={updateDay}
            updateDayShift={updateDayShift}
            applyStoreHours={applyStoreHours}
          />
        )}
      </div>
      {suggestFor && (
        <SuggestModal
          suggestFor={suggestFor}
          employees={employees}
          shifts={shifts}
          settings={settings}
          assign={assign}
          setSuggestFor={setSuggestFor}
        />
      )}
    </div>
  );
}
