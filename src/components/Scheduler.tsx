"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Employee, Shift, Settings } from "../domain/types";
import { T } from "../lib/tokens";
import { COVERAGE_TYPES } from "../lib/constants";
import {
  addDays, dowOf, mondayOf, fmtDate, fmtMonth, addMonths, todayISO,
} from "../domain/time";
import { hoursFor, shiftIssues } from "../domain/rules";
import { trainingCovers } from "../domain/training";
import { buildWorkbook } from "../export/workbook";
import { uid } from "../lib/util";
import { Btn } from "./ui/Btn";
import { Wordmark } from "./ui/Wordmark";
import { WeekView } from "./schedule/WeekView";
import { MonthView } from "./schedule/MonthView";
import { SuggestModal } from "./schedule/SuggestModal";
import { TeamTab } from "./team/TeamTab";
import { SettingsTab } from "./settings/SettingsTab";

// Data-layer imports (async, Supabase-backed)
import { ensureBootstrapped } from "../data/bootstrap";
import {
  loadEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addTimeOff,
  removeTimeOff,
} from "../data/employees";
import {
  loadShifts,
  createShift,
  updateShift,
  deleteShift,
  bulkCreateShifts,
} from "../data/shifts";
import { loadSettings, saveSettings } from "../data/settings";

export function Scheduler() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState("2026-07-13");
  const [monthAnchor, setMonthAnchor] = useState("2026-07-01");
  const [tab, setTab] = useState<"schedule" | "team" | "settings">("schedule");
  const [view, setView] = useState<"week" | "month">("week");
  const [suggestFor, setSuggestFor] = useState<{ date: string; type: string } | null>(null);
  const [editShift, setEditShift] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState<string | null>(null);

  // Keep a stable ref to businessId for use inside async callbacks.
  const businessIdRef = useRef<string | null>(null);
  useEffect(() => { businessIdRef.current = businessId; }, [businessId]);

  // --------------------------------------------------------------------------
  // Bootstrap / initial load
  // --------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const bid = await ensureBootstrapped();
        if (cancelled) return;

        const [emps, shifts, setts] = await Promise.all([
          loadEmployees(bid),
          loadShifts(bid),
          loadSettings(bid),
        ]);
        if (cancelled) return;

        setBusinessId(bid);
        setEmployees(emps);
        setShifts(shifts);
        if (setts) setSettings(setts);
      } catch (err) {
        console.error("[Scheduler] init error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // --------------------------------------------------------------------------
  // Auto-certification effect (from training shifts → canOpen / canClose)
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!settings) return;
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
      if (Object.keys(patch).length) {
        changed = true;
        // Persist the certification grant asynchronously.
        updateEmployee(e.id, patch).catch((err) =>
          console.error("[Scheduler] auto-cert persist error", err)
        );
        return { ...e, ...patch };
      }
      return e;
    });
    if (changed) setEmployees(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, settings]);

  // --------------------------------------------------------------------------
  // Derived / memoised values
  // --------------------------------------------------------------------------

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const empById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees]
  );
  const colorOf = (empId: string) => (empById[empId] && empById[empId].color) || "#3F4A55";

  // These helpers are only called after the loading guard, when settings is non-null.
  // We cast via 'as Settings' inside to avoid repeating null-checks at every call site.
  const tmplFor = (dow: number, type: string) => {
    const s = settings as Settings;
    return s.days[dow].shifts[type as keyof typeof s.days[0]["shifts"]];
  };
  const trainingDefault = (dow: number) => {
    const o = (settings as Settings).days[dow].shifts.open;
    return { start: o.start, end: o.end };
  };
  const templateOrTraining = (dow: number, type: string) =>
    type === "training" ? trainingDefault(dow) : tmplFor(dow, type);

  const gaps = useMemo(() => {
    if (!settings) return [];
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

  // --------------------------------------------------------------------------
  // Actions — shift mutations
  // --------------------------------------------------------------------------

  const moveShift = (id: string, date: string, type: string) => {
    const dow = dowOf(date);
    // Compute next shift state first, then update state and persist separately.
    const currentShift = shifts.find((s) => s.id === id);
    if (!currentShift) return;
    const next = { ...currentShift, date, type: type as Shift["type"] };
    if (currentShift.type !== type && type !== "training") {
      const t = tmplFor(dow, type);
      next.start = t.start;
      next.end = t.end;
    }
    setShifts((prev) => prev.map((s) => (s.id === id ? next : s)));
    // Persist outside the updater to avoid side effects in StrictMode.
    updateShift(id, { date: next.date, type: next.type, start: next.start, end: next.end })
      .catch((err) => console.error("[Scheduler] moveShift persist error", err));
  };

  const moveShiftDate = (id: string, date: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        updateShift(id, { date }).catch((err) =>
          console.error("[Scheduler] moveShiftDate persist error", err)
        );
        return { ...s, date };
      })
    );
  };

  /**
   * assign — awaits DB insert so we use the real UUID in state.
   * The shift is added to state only after the insert succeeds.
   */
  const assign = useCallback(async (empId: string, date: string, type: string) => {
    const bid = businessIdRef.current;
    if (!bid || !settings) return;
    const t = templateOrTraining(dowOf(date), type);
    const shiftData = { empId, date, type: type as Shift["type"], start: t.start, end: t.end };
    const dbId = await createShift(bid, shiftData);
    if (!dbId) {
      console.error("[Scheduler] assign: createShift returned null");
      return;
    }
    setShifts((prev) => [...prev, { ...shiftData, id: dbId }]);
    setSuggestFor(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, businessIdRef]);

  const copyPrevWeek = useCallback(async () => {
    const bid = businessIdRef.current;
    if (!bid) return;
    const prevDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i - 7));
    const templates = shifts
      .filter((s) => prevDates.includes(s.date))
      .map((s) => ({
        tempId: uid(),          // temporary key for round-trip mapping
        empId: s.empId,
        date: addDays(s.date, 7),
        type: s.type,
        start: s.start,
        end: s.end,
      }));
    if (templates.length === 0) return;
    const mapping = await bulkCreateShifts(bid, templates);
    // Build a lookup from tempId → dbId.
    const dbIds = Object.fromEntries(mapping.map((m) => [m.tempId, m.dbId]));
    const newShifts: Shift[] = templates.map((t) => ({
      id: dbIds[t.tempId] ?? uid(),  // fallback to client uid if bulk insert failed
      empId: t.empId,
      date: t.date,
      type: t.type,
      start: t.start,
      end: t.end,
    }));
    setShifts((prev) => [...prev, ...newShifts]);
  }, [weekStart, shifts, businessIdRef]);

  // --------------------------------------------------------------------------
  // Actions — employee mutations
  // --------------------------------------------------------------------------

  /**
   * updateEmp — optimistic UI update + async DB persist.
   * If the patch includes timeOff changes, the component is responsible for
   * calling addTimeOff / removeTimeOff directly (see TeamTab wiring below).
   * For non-timeOff patches, we call updateEmployee here.
   */
  const updateEmp = useCallback((id: string, patch: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        // timeOff is handled separately via add/removeTimeOff helpers;
        // other fields go straight to the DB.
        const { timeOff: _to, ...dbPatch } = patch;
        if (Object.keys(dbPatch).length > 0) {
          updateEmployee(id, dbPatch).catch((err) =>
            console.error("[Scheduler] updateEmp persist error", err)
          );
        }
        return { ...e, ...patch };
      })
    );
  }, []);

  /**
   * addEmp — awaits DB insert so the new employee gets a real UUID in state.
   */
  const addEmp = useCallback(async (emp: Omit<Employee, "id">) => {
    const bid = businessIdRef.current;
    if (!bid) return;
    const dbId = await createEmployee(bid, emp);
    if (!dbId) {
      console.error("[Scheduler] addEmp: createEmployee returned null");
      return;
    }
    setEmployees((prev) => [...prev, { ...emp, id: dbId }]);
  }, [businessIdRef]);

  /**
   * removeEmp — optimistic UI + async DB delete (cascade removes shifts).
   */
  const removeEmp = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setShifts((prev) => prev.filter((s) => s.empId !== id));
    deleteEmployee(id).catch((err) =>
      console.error("[Scheduler] removeEmp persist error", err)
    );
  }, []);

  /**
   * addTimeOffEntry — inserts into DB, then updates state with the real UUID.
   */
  const addTimeOffEntry = useCallback(
    async (empId: string, entry: { start: string; end: string; note: string }) => {
      const dbId = await addTimeOff(empId, entry);
      const id = dbId ?? uid(); // fallback client uid if insert failed
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === empId
            ? { ...e, timeOff: [...e.timeOff, { id, ...entry }] }
            : e
        )
      );
    },
    []
  );

  /**
   * removeTimeOffEntry — optimistic remove + async DB delete.
   */
  const removeTimeOffEntry = useCallback((empId: string, timeOffId: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId
          ? { ...e, timeOff: e.timeOff.filter((t) => t.id !== timeOffId) }
          : e
      )
    );
    removeTimeOff(timeOffId).catch((err) =>
      console.error("[Scheduler] removeTimeOff persist error", err)
    );
  }, []);

  // --------------------------------------------------------------------------
  // Actions — settings mutations
  // --------------------------------------------------------------------------

  const updateDay = useCallback(
    (dow: number, patch: Partial<Settings["days"][0]>) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          days: prev.days.map((d, i) => (i === dow ? { ...d, ...patch } : d)),
        };
        const bid = businessIdRef.current;
        if (bid) saveSettings(bid, next).catch((err) => console.error("[Scheduler] updateDay persist error", err));
        return next;
      });
    },
    [businessIdRef]
  );

  const updateDayShift = useCallback(
    (
      dow: number,
      type: string,
      patch: Partial<{ needed: number; start: number; end: number }>
    ) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          days: prev.days.map((d, i) =>
            i === dow
              ? {
                  ...d,
                  shifts: {
                    ...d.shifts,
                    [type]: { ...d.shifts[type as keyof typeof d.shifts], ...patch },
                  },
                }
              : d
          ),
        };
        const bid = businessIdRef.current;
        if (bid) saveSettings(bid, next).catch((err) => console.error("[Scheduler] updateDayShift persist error", err));
        return next;
      });
    },
    [businessIdRef]
  );

  const applyStoreHours = useCallback(
    (dow: number) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const d = prev.days[dow];
        const openStart = d.storeOpen - prev.prepMinutes;
        const closeEnd = d.storeClose + d.closeOut;
        const next = {
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
        };
        const bid = businessIdRef.current;
        if (bid) saveSettings(bid, next).catch((err) => console.error("[Scheduler] applyStoreHours persist error", err));
        return next;
      });
    },
    [businessIdRef]
  );

  // --------------------------------------------------------------------------
  // Loading / error states
  // --------------------------------------------------------------------------

  if (loading || !settings) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Avenir Next','Segoe UI',system-ui,-apple-system,sans-serif",
          color: T.inkSoft,
          fontSize: 14,
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>⏳</span> Loading your schedule…
      </div>
    );
  }

  // After the loading guard, settings is guaranteed non-null.
  // Use a narrowed local so TypeScript knows it without `!` assertions.
  const settingsNN: Settings = settings;

  // --------------------------------------------------------------------------
  // TeamTab adapter — wraps the async employee mutations to match the
  // synchronous signatures that TeamTab / TimeOffEditor currently expect.
  // --------------------------------------------------------------------------

  /**
   * updateEmpWithTimeOff intercepts timeOff patches and routes them through
   * the proper async helpers (addTimeOffEntry / removeTimeOffEntry).
   *
   * For all other patches it delegates to updateEmp (optimistic + DB).
   *
   * This keeps TeamTab and TimeOffEditor unchanged.
   */
  const updateEmpForTeamTab = (id: string, patch: Partial<Employee>) => {
    if (patch.timeOff !== undefined) {
      // Diff: find what was added or removed vs current state.
      const emp = employees.find((e) => e.id === id);
      if (!emp) return;
      const oldIds = new Set(emp.timeOff.map((t) => t.id));
      const newIds = new Set(patch.timeOff.map((t) => t.id));

      // Removed entries
      for (const t of emp.timeOff) {
        if (!newIds.has(t.id)) {
          removeTimeOffEntry(id, t.id);
        }
      }
      // Added entries
      for (const t of patch.timeOff) {
        if (!oldIds.has(t.id)) {
          // addTimeOffEntry will update state; apply optimistic here too
          // so the component sees the change immediately (with the client id,
          // which gets replaced by the DB id in addTimeOffEntry).
          addTimeOffEntry(id, { start: t.start, end: t.end, note: t.note });
          // Skip the general updateEmp call below since addTimeOffEntry handles state.
          return;
        }
      }
      // If we only removed, reflect that optimistically (the removeTimeOffEntry
      // already updates state, so we're done).
      return;
    }
    // Non-timeOff patch — delegate.
    updateEmp(id, patch);
  };

  /**
   * setEmployeesForTeamTab — used by TeamTab to add/remove employees via
   * React's dispatch-style API. We intercept add (new element with uid()-style id)
   * and remove (filter) to route through proper async helpers.
   */
  const setEmployeesForTeamTab: React.Dispatch<React.SetStateAction<Employee[]>> = (
    action
  ) => {
    const current = employees;
    const next =
      typeof action === "function" ? (action as (prev: Employee[]) => Employee[])(current) : action;

    const currentIds = new Set(current.map((e) => e.id));
    const nextIds = new Set(next.map((e) => e.id));

    // Additions — an employee in next that isn't in current.
    for (const emp of next) {
      if (!currentIds.has(emp.id)) {
        // TeamTab generates a client uid(); we throw it away and use the DB UUID.
        const { id: _clientId, ...rest } = emp;
        addEmp(rest); // async, will update state with real UUID
        return; // one addition at a time
      }
    }

    // Removals — an employee in current that isn't in next.
    for (const emp of current) {
      if (!nextIds.has(emp.id)) {
        removeEmp(emp.id); // optimistic + async DB delete
        return;
      }
    }

    // Fallback — general update (shouldn't happen through TeamTab).
    setEmployees(next);
  };

  /**
   * setShiftsForTeamTab — when TeamTab removes an employee it also calls
   * setShifts to drop their shifts from state. We intercept to fire DB deletes.
   */
  const setShiftsForTeamTab: React.Dispatch<React.SetStateAction<Shift[]>> = (
    action
  ) => {
    const current = shifts;
    const next =
      typeof action === "function" ? (action as (prev: Shift[]) => Shift[])(current) : action;

    const nextIds = new Set(next.map((s) => s.id));
    for (const s of current) {
      if (!nextIds.has(s.id)) {
        deleteShift(s.id).catch((err) =>
          console.error("[Scheduler] setShiftsForTeamTab deleteShift error", err)
        );
      }
    }

    setShifts(next);
  };

  // --------------------------------------------------------------------------
  // WeekView setShifts interceptor
  // --------------------------------------------------------------------------

  /**
   * setShiftsForWeekView — intercepts the raw React dispatch used by ShiftCard
   * to update shift start/end times or delete a shift. We diff before/after to
   * detect which operation occurred and persist it asynchronously.
   */
  const setShiftsForWeekView: React.Dispatch<React.SetStateAction<Shift[]>> = (
    action
  ) => {
    const current = shifts;
    const next =
      typeof action === "function" ? (action as (prev: Shift[]) => Shift[])(current) : action;

    const currentMap = new Map(current.map((s) => [s.id, s]));
    const nextMap = new Map(next.map((s) => [s.id, s]));

    // Deletions
    for (const s of current) {
      if (!nextMap.has(s.id)) {
        deleteShift(s.id).catch((err) =>
          console.error("[Scheduler] setShiftsForWeekView deleteShift error", err)
        );
      }
    }

    // Updates (start / end time changes)
    for (const s of next) {
      const prev = currentMap.get(s.id);
      if (prev && (prev.start !== s.start || prev.end !== s.end)) {
        updateShift(s.id, { start: s.start, end: s.end }).catch((err) =>
          console.error("[Scheduler] setShiftsForWeekView updateShift error", err)
        );
      }
    }

    setShifts(next);
  };

  // --------------------------------------------------------------------------
  // Schedule tab JSX
  // --------------------------------------------------------------------------

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
              buildWorkbook({ employees, shifts, settings: settingsNN, weekStart, monthAnchor });
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
          settings={settingsNN}
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
          setShifts={setShiftsForWeekView}
        />
      ) : (
        <MonthView
          monthAnchor={monthAnchor}
          employees={employees}
          shifts={shifts}
          settings={settingsNN}
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

  // --------------------------------------------------------------------------
  // Shell
  // --------------------------------------------------------------------------

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
            <Wordmark size={20} />
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
            updateEmp={updateEmpForTeamTab}
            setEmployees={setEmployeesForTeamTab}
            setShifts={setShiftsForTeamTab}
          />
        ) : (
          <SettingsTab
            settings={settingsNN}
            setSettings={(s) => {
              const next = typeof s === "function" ? (s as (prev: Settings) => Settings)(settingsNN) : s;
              setSettings(next);
              const bid = businessIdRef.current;
              if (bid) saveSettings(bid, next).catch((err) => console.error("[Scheduler] setSettings persist error", err));
            }}
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
          settings={settingsNN}
          assign={(empId, date, type) => { assign(empId, date, type); }}
          setSuggestFor={setSuggestFor}
        />
      )}
    </div>
  );
}
