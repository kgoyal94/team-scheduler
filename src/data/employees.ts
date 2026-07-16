// TODO(Phase 2 / Kuhuk): replace with Supabase
import { Employee } from "../domain/types";
import { seedEmployees } from "./seed";

let _employees: Employee[] = [...seedEmployees];

export function loadEmployees(): Employee[] {
  return _employees;
}

export function saveEmployees(employees: Employee[]): void {
  _employees = employees;
}
