"use client";
import * as XLSX from "xlsx-js-style";
import { Employee, Shift, Settings } from "../domain/types";
import { addDays, fmtDate, fmtMonth, mondayOf, monthOfISO, plainTime } from "../domain/time";
import { DAY_NAMES, COVERAGE_TYPES, SHIFT_TYPES } from "../lib/constants";
import { dowOf } from "../domain/time";
import { onTimeOff, shiftIssues } from "../domain/rules";

const thinBorder = () => {
  const s = { style: "thin", color: { rgb: "CDD3CB" } };
  return { top: s, bottom: s, left: s, right: s };
};
const shiftText = (s: Shift) => {
  if (s.type === "swing") return `SWING ${plainTime(s.start)} to ${plainTime(s.end)}`;
  if (s.type === "training") return `TRAINING ${plainTime(s.start)} to ${plainTime(s.end)}`;
  if (s.type === "full") return `${plainTime(s.start)} to ${plainTime(s.end)} (open+close)`;
  return `${plainTime(s.start)} to ${plainTime(s.end)}`;
};
const cellFillFor = (type: string) =>
  type === "open" ? "FBF1DC"
  : type === "swing" ? "E4EEF6"
  : type === "close" ? "EAE6F3"
  : type === "full" ? "F3E9DA"
  : type === "training" ? "E1F1EC"
  : "FFFFFF";

export function buildWorkbook({
  employees,
  shifts,
  settings,
  weekStart,
  monthAnchor,
}: {
  employees: Employee[];
  shifts: Shift[];
  settings: Settings;
  weekStart: string;
  monthAnchor: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XL = XLSX as any;
  const wb = XL.utils.book_new();
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  /* ---------- WEEK sheet ---------- */
  const headFill = { patternType: "solid", fgColor: { rgb: "2C332E" } };
  const headFont = { bold: true, color: { rgb: "FFFFFF" }, sz: 11 };
  const wsWeekAoa: (string | number)[][] = [];
  const styleMap: Record<string, object> = {};

  const put = (r: number, c: number, v: string | number, style?: object) => {
    while (wsWeekAoa.length <= r) wsWeekAoa.push([]);
    wsWeekAoa[r][c] = v;
    if (style) styleMap[`${r},${c}`] = style;
  };

  const headerCols = [
    "",
    "Phone number",
    ...DAY_NAMES.map((d, i) => `${d.toUpperCase()}  ${fmtDate(weekDates[i])}`),
    "TIME OFF REQUESTS",
  ];
  headerCols.forEach((h, c) =>
    put(0, c, h, {
      fill: headFill,
      font: headFont,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: thinBorder(),
    })
  );

  employees.forEach((emp, idx) => {
    const r = idx + 1;
    put(r, 0, emp.name, {
      font: { bold: true },
      border: thinBorder(),
      alignment: { vertical: "center" },
    });
    put(r, 1, emp.phone, {
      border: thinBorder(),
      alignment: { vertical: "center" },
      font: { sz: 10, color: { rgb: "5B675F" } },
    });
    weekDates.forEach((date, di) => {
      const ds = shifts
        .filter((s) => s.empId === emp.id && s.date === date)
        .sort((a, b) => a.start - b.start);
      let val = "", fill = "FFFFFF";
      if (ds.length) {
        val = ds.map(shiftText).join("\n");
        fill = cellFillFor(ds[0].type);
      } else if (onTimeOff(emp, date)) {
        val = "req off";
        fill = "EFEAF7";
      }
      put(r, 2 + di, val, {
        fill: { patternType: "solid", fgColor: { rgb: fill } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder(),
        font: { sz: 10 },
      });
    });
    const notes = emp.timeOff
      .map(
        (t) =>
          (t.start === t.end ? fmtDate(t.start) : `${fmtDate(t.start)}–${fmtDate(t.end)}`) +
          (t.note ? ` (${t.note})` : "")
      )
      .join("; ");
    put(r, 9, notes, {
      border: thinBorder(),
      alignment: { wrapText: true, vertical: "center" },
      font: { sz: 10 },
    });
  });

  const wsWeek = XL.utils.aoa_to_sheet(wsWeekAoa);
  Object.entries(styleMap).forEach(([k, style]) => {
    const [r, c] = k.split(",").map(Number);
    const addr = XL.utils.encode_cell({ r, c });
    if (!wsWeek[addr]) wsWeek[addr] = { t: "s", v: "" };
    wsWeek[addr].s = style;
  });
  wsWeek["!cols"] = [{ wch: 13 }, { wch: 16 }, ...DAY_NAMES.map(() => ({ wch: 17 })), { wch: 30 }];
  wsWeek["!rows"] = [{ hpt: 30 }, ...employees.map(() => ({ hpt: 34 }))];
  wsWeek["!freeze"] = { xSplit: 1, ySplit: 1 };
  XL.utils.book_append_sheet(wb, wsWeek, `Week of ${fmtDate(weekStart)}`.slice(0, 31));

  /* ---------- MONTH sheet ---------- */
  const empById = Object.fromEntries(employees.map((e) => [e.id, e]));
  const dayStatusKind = (date: string) => {
    const dow = dowOf(date);
    const dayShifts = shifts.filter((s) => s.date === date);
    if (dayShifts.length === 0) return "empty";
    let missing = 0;
    COVERAGE_TYPES.forEach((type) => {
      const need = settings.days[dow].shifts[type].needed;
      const n = dayShifts.filter((s) => s.type === type).length;
      if (n < need) missing += need - n;
    });
    const issues = dayShifts.reduce(
      (s2, s) => s2 + shiftIssues(s, empById[s.empId]).length,
      0
    );
    return missing > 0 || issues > 0 ? "attention" : "covered";
  };

  const mo = monthOfISO(monthAnchor);
  const gridStart = mondayOf(monthAnchor);
  const mCells: string[] = [];
  let d = gridStart;
  while (monthOfISO(d) <= mo || dowOf(d) !== 0) {
    mCells.push(d);
    d = addDays(d, 1);
    if (mCells.length >= 42) break;
  }
  while (mCells.length > 7 && monthOfISO(mCells[mCells.length - 7]) > mo) mCells.splice(-7);

  const mAoa: (string | number)[][] = [];
  const mStyle: Record<string, object> = {};
  const mput = (r: number, c: number, v: string | number, style?: object) => {
    while (mAoa.length <= r) mAoa.push([]);
    mAoa[r][c] = v;
    if (style) mStyle[`${r},${c}`] = style;
  };
  mput(0, 0, fmtMonth(monthAnchor), { font: { bold: true, sz: 14 } });
  DAY_NAMES.forEach((dn, c) =>
    mput(1, c, dn.toUpperCase(), {
      fill: headFill,
      font: headFont,
      alignment: { horizontal: "center" },
      border: thinBorder(),
    })
  );

  mCells.forEach((date, i) => {
    const row = 2 + Math.floor(i / 7);
    const col = i % 7;
    const inMonth = monthOfISO(date) === mo;
    const kind = inMonth ? dayStatusKind(date) : "empty";
    const dayShifts = shifts.filter((s) => s.date === date).sort((a, b) => a.start - b.start);
    const offs = employees.filter((e) => onTimeOff(e, date)).map((e) => `✕ ${e.name} off`);
    const lines = [String(+date.slice(8, 10))];
    offs.forEach((o) => lines.push(o));
    dayShifts.forEach((s) => {
      const emp = empById[s.empId];
      lines.push(
        `${emp ? emp.name : "?"} · ${SHIFT_TYPES[s.type].short.toLowerCase()} ${plainTime(s.start)}-${plainTime(s.end)}`
      );
    });
    const fill = !inMonth
      ? "F4F5F2"
      : kind === "covered"
      ? "E7F2EC"
      : kind === "attention"
      ? "F9E9E5"
      : "FFFFFF";
    mput(row, col, lines.join("\n"), {
      fill: { patternType: "solid", fgColor: { rgb: fill } },
      alignment: { vertical: "top", wrapText: true },
      border: thinBorder(),
      font: { sz: 9, color: { rgb: inMonth ? "212A26" : "9AA69E" } },
    });
  });

  const wsMonth = XL.utils.aoa_to_sheet(mAoa);
  Object.entries(mStyle).forEach(([k, style]) => {
    const [r, c] = k.split(",").map(Number);
    const addr = XL.utils.encode_cell({ r, c });
    if (!wsMonth[addr]) wsMonth[addr] = { t: "s", v: "" };
    wsMonth[addr].s = style;
  });
  wsMonth["!cols"] = DAY_NAMES.map(() => ({ wch: 22 }));
  const weekRows = Math.ceil(mCells.length / 7);
  wsMonth["!rows"] = [
    { hpt: 22 },
    { hpt: 18 },
    ...Array.from({ length: weekRows }, () => ({ hpt: 84 })),
  ];
  wsMonth["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  XL.utils.book_append_sheet(wb, wsMonth, fmtMonth(monthAnchor).slice(0, 31));

  XL.writeFile(wb, `shift-board_${weekStart}.xlsx`);
}
