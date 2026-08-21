/**
 * Employee persistence layer (Phase 2 — Supabase).
 *
 * DB columns (snake_case)  ↔  app type (camelCase)
 *   min_hours              ↔  minHours
 *   max_hours              ↔  maxHours
 *   can_open               ↔  canOpen
 *   can_close              ↔  canClose
 *   availability (bool[7]) ↔  availability
 *
 * time_off rows are assembled into Employee.timeOff after fetching.
 */
import { Employee, TimeOff, BlockedTime } from "../domain/types";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Row shapes returned by Supabase (partial — only what we use)
// ---------------------------------------------------------------------------

interface EmpRow {
  id: string;
  name: string;
  phone: string;
  color: string;
  min_hours: number;
  max_hours: number;
  flex: number;
  can_open: boolean;
  can_close: boolean;
  availability: boolean[];
  blocked_times: BlockedTime[] | null;
}

interface TimeOffRow {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function rowToEmployee(row: EmpRow, timeOffRows: TimeOffRow[]): Employee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    color: row.color,
    minHours: row.min_hours,
    maxHours: row.max_hours,
    flex: row.flex,
    canOpen: row.can_open,
    canClose: row.can_close,
    availability: row.availability,
    blockedTimes: row.blocked_times ?? [],
    timeOff: timeOffRows
      .filter((t) => t.employee_id === row.id)
      .map((t) => ({
        id: t.id,
        start: t.start_date,
        end: t.end_date,
        note: t.note,
      })),
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Load all employees for a business, with their time_off entries assembled.
 */
export async function loadEmployees(businessId: string): Promise<Employee[]> {
  const { data: empRows, error: empErr } = await supabase()
    .from("employees")
    .select("id,name,phone,color,min_hours,max_hours,flex,can_open,can_close,availability,blocked_times")
    .eq("business_id", businessId)
    .order("created_at");

  if (empErr || !empRows) {
    console.error("[employees] loadEmployees error", empErr);
    return [];
  }

  if (empRows.length === 0) return [];

  const empIds = empRows.map((r) => r.id);
  const { data: toRows, error: toErr } = await supabase()
    .from("time_off")
    .select("id,employee_id,start_date,end_date,note")
    .in("employee_id", empIds);

  if (toErr) {
    console.error("[employees] loadEmployees time_off error", toErr);
  }

  const timeOffRows: TimeOffRow[] = (toRows ?? []) as TimeOffRow[];
  return (empRows as EmpRow[]).map((row) => rowToEmployee(row, timeOffRows));
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Insert a new employee row and return the DB-assigned UUID.
 * Also inserts any time_off entries that come with the employee.
 */
export async function createEmployee(
  businessId: string,
  emp: Omit<Employee, "id">
): Promise<string | null> {
  const { data, error } = await supabase()
    .from("employees")
    .insert({
      business_id: businessId,
      name: emp.name,
      phone: emp.phone,
      color: emp.color,
      min_hours: emp.minHours,
      max_hours: emp.maxHours,
      flex: emp.flex,
      can_open: emp.canOpen,
      can_close: emp.canClose,
      availability: emp.availability,
      blocked_times: emp.blockedTimes ?? [],
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[employees] createEmployee error", error);
    return null;
  }

  const newId = data.id as string;

  if (emp.timeOff.length > 0) {
    await insertTimeOffRows(newId, emp.timeOff);
  }

  return newId;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Persist a patch to a single employee row.
 * Only the columns that are present in the patch are updated.
 */
export async function updateEmployee(
  id: string,
  patch: Partial<Employee>
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.color !== undefined) dbPatch.color = patch.color;
  if (patch.minHours !== undefined) dbPatch.min_hours = patch.minHours;
  if (patch.maxHours !== undefined) dbPatch.max_hours = patch.maxHours;
  if (patch.flex !== undefined) dbPatch.flex = patch.flex;
  if (patch.canOpen !== undefined) dbPatch.can_open = patch.canOpen;
  if (patch.canClose !== undefined) dbPatch.can_close = patch.canClose;
  if (patch.availability !== undefined) dbPatch.availability = patch.availability;
  if (patch.blockedTimes !== undefined) dbPatch.blocked_times = patch.blockedTimes;

  if (Object.keys(dbPatch).length > 0) {
    const { error } = await supabase().from("employees").update(dbPatch).eq("id", id);
    if (error) console.error("[employees] updateEmployee error", error);
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete an employee (cascade deletes time_off and shifts via FK).
 */
export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase().from("employees").delete().eq("id", id);
  if (error) console.error("[employees] deleteEmployee error", error);
}

// ---------------------------------------------------------------------------
// Time-off helpers
// ---------------------------------------------------------------------------

async function insertTimeOffRows(employeeId: string, entries: TimeOff[]): Promise<void> {
  const rows = entries.map((t) => ({
    employee_id: employeeId,
    start_date: t.start,
    end_date: t.end,
    note: t.note,
  }));
  const { error } = await supabase().from("time_off").insert(rows);
  if (error) console.error("[employees] insertTimeOffRows error", error);
}

/**
 * Add a single time-off entry and return the DB-assigned UUID.
 */
export async function addTimeOff(
  employeeId: string,
  entry: Omit<TimeOff, "id">
): Promise<string | null> {
  const { data, error } = await supabase()
    .from("time_off")
    .insert({
      employee_id: employeeId,
      start_date: entry.start,
      end_date: entry.end,
      note: entry.note,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[employees] addTimeOff error", error);
    return null;
  }
  return data.id as string;
}

/**
 * Remove a single time-off entry by its UUID.
 */
export async function removeTimeOff(timeOffId: string): Promise<void> {
  const { error } = await supabase().from("time_off").delete().eq("id", timeOffId);
  if (error) console.error("[employees] removeTimeOff error", error);
}
