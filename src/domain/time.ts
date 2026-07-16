export const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const dowOf = (iso: string): number => (new Date(iso + "T12:00:00").getDay() + 6) % 7;
export const mondayOf = (iso: string): string => addDays(iso, -dowOf(iso));
export const fmtDate = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtMonth = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
export const addMonths = (iso: string, n: number): string => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};
export const monthOfISO = (iso: string): string => iso.slice(0, 7);
export const fmtTime = (min: number): string => {
  const h24 = Math.floor(min / 60), m = min % 60, h = ((h24 + 11) % 12) + 1;
  return `${h}:${String(m).padStart(2, "0")}${h24 < 12 ? "a" : "p"}`;
};
export const plainTime = (min: number): string => {
  const h24 = Math.floor(min / 60), m = min % 60, h = ((h24 + 11) % 12) + 1;
  return `${h}:${String(m).padStart(2, "0")}`;
};
export const todayISO = (): string => new Date().toISOString().slice(0, 10);
