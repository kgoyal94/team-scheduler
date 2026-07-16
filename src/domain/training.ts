import { Shift, Settings } from "./types";
import { dowOf } from "./time";

export function trainingCovers(
  shift: Pick<Shift, "date" | "start" | "end">,
  settings: Settings
): { open: boolean; close: boolean } {
  const d = settings.days[dowOf(shift.date)];
  const openStart = d.storeOpen - settings.prepMinutes;
  const closeEnd = d.storeClose + d.closeOut;
  return { open: shift.start <= openStart + 15, close: shift.end >= closeEnd - 15 };
}

export function trainingFocusLabel(
  shift: Pick<Shift, "date" | "start" | "end">,
  settings: Settings
): string {
  const c = trainingCovers(shift, settings);
  if (c.open && c.close) return "open + close";
  if (c.open) return "opening";
  if (c.close) return "closing";
  return "swing";
}
