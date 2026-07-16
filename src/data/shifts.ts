// TODO(Phase 2 / Kuhuk): replace with Supabase
import { Shift } from "../domain/types";
import { seedShifts } from "./seed";

let _shifts: Shift[] = [...seedShifts];

export function loadShifts(): Shift[] {
  return _shifts;
}

export function saveShifts(shifts: Shift[]): void {
  _shifts = shifts;
}
