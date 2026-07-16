import { Employee, Shift, Settings, ShiftTypeKey } from "./types";
import { dowOf } from "./time";
import { DAY_NAMES } from "../lib/constants";
import { trainingCovers } from "./training";

export const onTimeOff = (emp: Employee, dateISO: string) =>
  emp.timeOff.find((t) => dateISO >= t.start && dateISO <= t.end);

export const trainedFor = (emp: Employee, type: ShiftTypeKey): boolean =>
  type === "open" ? emp.canOpen
  : type === "close" ? emp.canClose
  : type === "full" ? (emp.canOpen && emp.canClose)
  : true;

export const trainingLabel = (type: ShiftTypeKey): string =>
  type === "full" ? "open and close" : type === "open" ? "open" : "close";

export const hoursFor = (shifts: Shift[], empId: string, weekDates: string[]): number =>
  shifts
    .filter((s) => s.empId === empId && weekDates.includes(s.date))
    .reduce((sum, s) => sum + (s.end - s.start) / 60, 0);

export interface RankResult {
  qualified: { emp: Employee; score: number; reasons: string[] }[];
  excluded: { emp: Employee; why: string }[];
}

export function rankCandidates({
  employees,
  shifts,
  dateISO,
  type,
  weekDates,
  tmpl,
  settings,
}: {
  employees: Employee[];
  shifts: Shift[];
  dateISO: string;
  type: ShiftTypeKey;
  weekDates: string[];
  tmpl: { start: number; end: number };
  settings: Settings;
}): RankResult {
  const dow = weekDates.indexOf(dateISO);
  const shiftHrs = (tmpl.end - tmpl.start) / 60;
  const isTraining = type === "training";
  const focus = isTraining
    ? trainingCovers({ date: dateISO, start: tmpl.start, end: tmpl.end }, settings)
    : null;
  const qualified: RankResult["qualified"] = [];
  const excluded: RankResult["excluded"] = [];

  employees.forEach((emp) => {
    const off = onTimeOff(emp, dateISO);
    if (off) {
      excluded.push({ emp, why: `Requested off (${off.note || "time off"})` });
      return;
    }
    if (!emp.availability[dow]) {
      excluded.push({ emp, why: `Not available on ${DAY_NAMES[dow]}s` });
      return;
    }
    if (!isTraining && !trainedFor(emp, type)) {
      excluded.push({ emp, why: `Not trained to ${trainingLabel(type)}` });
      return;
    }
    if (shifts.some((s) => s.empId === emp.id && s.date === dateISO)) {
      excluded.push({ emp, why: "Already scheduled this day" });
      return;
    }
    const hrs = hoursFor(shifts, emp.id, weekDates);
    if (hrs + shiftHrs > emp.maxHours + 0.01) {
      excluded.push({
        emp,
        why: `Would go over their ${emp.maxHours}h weekly max (at ${hrs.toFixed(1)}h)`,
      });
      return;
    }

    const reasons: string[] = [];
    let score: number;

    if (isTraining && focus) {
      const needsOpen = focus.open && !emp.canOpen;
      const needsClose = focus.close && !emp.canClose;
      score = emp.flex * 3 + (needsOpen ? 6 : 0) + (needsClose ? 6 : 0);
      if (needsOpen || needsClose)
        reasons.push(
          `Not yet certified to ${[needsOpen && "open", needsClose && "close"]
            .filter(Boolean)
            .join(" & ")} — this trains them`
        );
      else reasons.push("Already certified — refresher shadow shift");
      reasons.push(`Flexibility ${emp.flex}/3`);
    } else {
      const deficit = Math.max(0, emp.minHours - hrs);
      const headroom = emp.maxHours - (hrs + shiftHrs);
      score = deficit * 2 + emp.flex * 3 + Math.min(headroom, 10) * 0.3;
      if (deficit > 0) reasons.push(`${deficit.toFixed(1)}h under their ${emp.minHours}h minimum`);
      else reasons.push(`Minimum already met (${hrs.toFixed(1)}h)`);
      reasons.push(`Flexibility ${emp.flex}/3`);
      reasons.push(`${headroom.toFixed(1)}h of room under their ${emp.maxHours}h max`);
      if (type !== "swing") reasons.push(`Trained to ${trainingLabel(type)}`);
    }
    qualified.push({ emp, score, reasons });
  });

  qualified.sort((a, b) => b.score - a.score);
  return { qualified, excluded };
}

export function shiftIssues(shift: Shift, emp: Employee | undefined): string[] {
  const issues: string[] = [];
  if (!emp) return ["Unknown employee"];
  const off = onTimeOff(emp, shift.date);
  if (off) issues.push(`${emp.name} requested this day off`);
  const dow = dowOf(shift.date);
  if (!emp.availability[dow]) issues.push(`${emp.name} is unavailable on ${DAY_NAMES[dow]}s`);
  if (shift.type !== "training" && !trainedFor(emp, shift.type))
    issues.push(`${emp.name} isn't trained to ${trainingLabel(shift.type)}`);
  return issues;
}
