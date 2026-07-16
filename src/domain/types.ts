export type ShiftTypeKey = "full" | "open" | "swing" | "close" | "training";
export type CoverageTypeKey = "full" | "open" | "swing" | "close";

export interface TimeOff {
  id: string;
  start: string; // ISO date
  end: string;   // ISO date
  note: string;
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
}

export interface Shift {
  id: string;
  empId: string;
  date: string; // ISO date
  type: ShiftTypeKey;
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
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
