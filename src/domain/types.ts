export type ShiftTypeKey = "full" | "open" | "swing" | "close" | "training";
export type CoverageTypeKey = "full" | "open" | "swing" | "close";

export interface TimeOff {
  id: string;
  start: string; // ISO date
  end: string;   // ISO date
  note: string;
}

// A time-boxed unavailability within an otherwise-available day (see domain/rules.ts
// blockedOverlap). dow is 0=Mon..6=Sun, matching Employee.availability's indexing.
export interface BlockedTime {
  dow: number;
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  color: string;
  minHours: number;
  maxHours: number;
  flex: number;
  canOpen: boolean;
  canClose: boolean;
  availability: boolean[]; // length 7, Mon-Sun
  timeOff: TimeOff[];
  // Optional: not yet persisted (no DB column — see src/data/employees.ts). Guard
  // reads with `emp.blockedTimes ?? []` so rows loaded before this field existed
  // (or straight from Supabase today) don't break.
  blockedTimes?: BlockedTime[];
}

// A rule violation surfaced when scheduling someone who wouldn't normally qualify.
// severity "hard" = a real constraint (time off, training, double-booked, blocked);
// "soft" = a flag that's still worth an override but is less strict (over hours max,
// partial availability-block overlap).
export interface Conflict {
  severity: "hard" | "soft";
  label: string;
  detail: string; // lowercase clause, reads as "<emp.name> <detail>."
}

// Recorded on a Shift when it was assigned via an override (see domain/rules.ts
// conflictsFor + components/schedule/OverrideConfirm.tsx).
export interface ShiftOverride {
  reason: string;  // free-text note the scheduler typed, may be empty
  summary: string; // short computed label for display on the shift card (1i)
}

export interface Shift {
  id: string;
  empId: string;
  date: string; // ISO date
  type: ShiftTypeKey;
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
  // Optional: not yet persisted (no DB column — see src/data/shifts.ts). Present only
  // on shifts assigned through the override flow this session.
  override?: ShiftOverride;
}

export interface ShiftTemplate {
  needed: number;
  start: number;
  end: number;
}

export interface DaySettings {
  storeOpen: number;
  storeClose: number;
  closeOut: number;
  shifts: {
    full: ShiftTemplate;
    open: ShiftTemplate;
    swing: ShiftTemplate;
    close: ShiftTemplate;
  };
}

export interface Settings {
  prepMinutes: number;
  days: DaySettings[]; // length 7, index 0 = Monday
}
