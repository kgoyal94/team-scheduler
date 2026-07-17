/**
 * First-run bootstrap (Phase 2).
 *
 * If the DB has no business row yet, this module:
 *  1. Creates the "the design partner" business with defaultSettings.
 *  2. Inserts the seed employees (from seed.ts), resolving their time_off.
 *  3. Inserts the seed shifts, remapping the seed string empIds (e1, e2…)
 *     to the real UUIDs returned by the DB.
 *
 * It is safe to call on every app load — it short-circuits immediately
 * when a business row already exists.
 *
 * Returns the (possibly freshly created) businessId.
 */
import { getBusinessId, createBusiness } from "./settings";
import { createEmployee } from "./employees";
import { bulkCreateShifts } from "./shifts";
import { seedEmployees, seedShifts, defaultSettings } from "./seed";

export async function ensureBootstrapped(): Promise<string> {
  // Fast path — already set up.
  const existing = await getBusinessId();
  if (existing) return existing;

  // 1. Create the business.
  const businessId = await createBusiness("the design partner", defaultSettings);
  if (!businessId) {
    throw new Error("[bootstrap] Failed to create business row");
  }

  // 2. Insert employees; build empId → UUID map.
  const empIdMap: Record<string, string> = {};
  for (const emp of seedEmployees) {
    const { id: _discard, ...rest } = emp;
    const uuid = await createEmployee(businessId, rest);
    if (uuid) {
      empIdMap[emp.id] = uuid; // e.g. "e1" → "abc-123-..."
    }
  }

  // 3. Insert shifts, remapping seed empIds to real UUIDs.
  type ShiftToInsert = {
    tempId: string;
    empId: string;
    date: string;
    type: "open" | "swing" | "close" | "full" | "training";
    start: number;
    end: number;
  };

  const shiftsToInsert: ShiftToInsert[] = seedShifts
    .map((s) => {
      const mappedEmpId = empIdMap[s.empId];
      if (!mappedEmpId) return null; // seed empId not found (shouldn't happen)
      return {
        tempId: s.id,       // original seed uid — for logging only
        empId: mappedEmpId,
        date: s.date,
        type: s.type,
        start: s.start,
        end: s.end,
      };
    })
    .filter((x): x is ShiftToInsert => x !== null);

  await bulkCreateShifts(businessId, shiftsToInsert);

  return businessId;
}
