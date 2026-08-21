-- ShiftLift — persist scheduling overrides + time-boxed blocked availability
--
-- Backs the client-only fields added in commit 2ca7977 (override flow + blocked
-- times). Both are stored as JSONB, matching how businesses.settings already
-- keeps a structured app object in one column.
--
--   shifts.override        ↔  Shift.override      { reason, summary } | null
--   employees.blocked_times ↔ Employee.blockedTimes [{ dow, start, end }, ...]
--
-- start/end in blocked_times are minutes-from-midnight (same convention as
-- shifts.start_min/end_min); dow is 0=Mon..6=Sun (matches availability indexing).

alter table public.shifts
  add column if not exists override jsonb;   -- null unless assigned via the override flow

alter table public.employees
  add column if not exists blocked_times jsonb not null default '[]'::jsonb;
