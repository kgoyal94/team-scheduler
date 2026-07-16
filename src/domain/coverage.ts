import { Shift, Settings, Employee } from "./types";
import { COVERAGE_TYPES } from "../lib/constants";
import { dowOf } from "./time";
import { shiftIssues } from "./rules";

export type DayStatusKind = "empty" | "covered" | "attention";

export interface DayStatus {
  kind: DayStatusKind;
  missing: number;
  issueCount: number;
}

export function dayStatusFor(
  date: string,
  shifts: Shift[],
  empById: Record<string, Employee>,
  settings: Settings
): DayStatus {
  const dow = dowOf(date);
  const dayShifts = shifts.filter((s) => s.date === date);
  if (dayShifts.length === 0) return { kind: "empty", missing: 0, issueCount: 0 };
  let missing = 0;
  COVERAGE_TYPES.forEach((type) => {
    const need = settings.days[dow].shifts[type].needed;
    const n = dayShifts.filter((s) => s.type === type).length;
    if (n < need) missing += need - n;
  });
  const issueCount = dayShifts.reduce(
    (s2, s) => s2 + shiftIssues(s, empById[s.empId]).length,
    0
  );
  return missing > 0 || issueCount > 0
    ? { kind: "attention", missing, issueCount }
    : { kind: "covered", missing: 0, issueCount: 0 };
}
