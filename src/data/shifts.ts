/**
 * Shifts persistence layer (Phase 2 — Supabase).
 *
 * DB columns (snake_case)  ↔  app type (camelCase)
 *   employee_id            ↔  empId
 *   start_min              ↔  start
 *   end_min                ↔  end
 *   date                   ↔  date  (ISO string, same in both)
 *   type                   ↔  type  (same literal union)
 */
import { Shift } from "../domain/types";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Row shape
// ---------------------------------------------------------------------------

interface ShiftRow {
  id: string;
  employee_id: string;
  date: string;
  type: string;
  start_min: number;
  end_min: number;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function rowToShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    empId: row.employee_id,
    date: row.date,
    type: row.type as Shift["type"],
    start: row.start_min,
    end: row.end_min,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Load all shifts for a business. */
export async function loadShifts(businessId: string): Promise<Shift[]> {
  const { data, error } = await supabase()
    .from("shifts")
    .select("id,employee_id,date,type,start_min,end_min")
    .eq("business_id", businessId)
    .order("date")
    .order("start_min");

  if (error || !data) {
    console.error("[shifts] loadShifts error", error);
    return [];
  }

  return (data as ShiftRow[]).map(rowToShift);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Insert a new shift and return the DB-assigned UUID.
 * The component must use this UUID (not a client-generated uid()) to avoid
 * desync between optimistic state and the DB.
 */
export async function createShift(
  businessId: string,
  shift: Omit<Shift, "id">
): Promise<string | null> {
  const { data, error } = await supabase()
    .from("shifts")
    .insert({
      business_id: businessId,
      employee_id: shift.empId,
      date: shift.date,
      type: shift.type,
      start_min: shift.start,
      end_min: shift.end,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[shifts] createShift error", error);
    return null;
  }
  return data.id as string;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Persist changes to an existing shift (move, type change, time edit).
 * Optimistic updates are fine — this is fire-and-forget from the component.
 */
export async function updateShift(
  id: string,
  patch: Partial<Pick<Shift, "date" | "type" | "start" | "end" | "empId">>
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.type !== undefined) dbPatch.type = patch.type;
  if (patch.start !== undefined) dbPatch.start_min = patch.start;
  if (patch.end !== undefined) dbPatch.end_min = patch.end;
  if (patch.empId !== undefined) dbPatch.employee_id = patch.empId;

  if (Object.keys(dbPatch).length === 0) return;

  const { error } = await supabase().from("shifts").update(dbPatch).eq("id", id);
  if (error) console.error("[shifts] updateShift error", error);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase().from("shifts").delete().eq("id", id);
  if (error) console.error("[shifts] deleteShift error", error);
}

// ---------------------------------------------------------------------------
// Bulk insert (used by bootstrap)
// ---------------------------------------------------------------------------

/**
 * Insert multiple shifts in one round-trip and return an array of
 * { tempId, dbId } pairs so the caller can remap client-side IDs to UUIDs.
 *
 * Each item in `shifts` carries its own tempId (the seed string id like "e1")
 * for cross-referencing after insert.
 */
export async function bulkCreateShifts(
  businessId: string,
  shifts: (Omit<Shift, "id"> & { tempId: string })[]
): Promise<{ tempId: string; dbId: string }[]> {
  if (shifts.length === 0) return [];

  const rows = shifts.map((s) => ({
    business_id: businessId,
    employee_id: s.empId,
    date: s.date,
    type: s.type,
    start_min: s.start,
    end_min: s.end,
  }));

  const { data, error } = await supabase()
    .from("shifts")
    .insert(rows)
    .select("id");

  if (error || !data) {
    console.error("[shifts] bulkCreateShifts error", error);
    return [];
  }

  // Supabase returns rows in insertion order.
  return (data as { id: string }[]).map((row, i) => ({
    tempId: shifts[i].tempId,
    dbId: row.id,
  }));
}
