import { uid } from "../lib/util";
import { addDays } from "../domain/time";
import { DEFAULT_EMP_COLORS } from "../lib/constants";
import { Employee, Shift, Settings } from "../domain/types";

export const mkDay = (
  storeOpen: number,
  storeClose: number,
  closeOut: number,
  shifts: Settings["days"][0]["shifts"]
): Settings["days"][0] => ({ storeOpen, storeClose, closeOut, shifts });

export const weekdayShifts = (swingStart: number, swingEnd: number): Settings["days"][0]["shifts"] => ({
  full:  { needed: 0, start: 450, end: 1260 },
  open:  { needed: 1, start: 450, end: 840 },
  swing: { needed: 1, start: swingStart, end: swingEnd },
  close: { needed: 1, start: 840, end: 1260 },
});

export const defaultSettings: Settings = {
  prepMinutes: 30,
  days: [
    mkDay(480, 960, 30, {
      full:  { needed: 1, start: 450, end: 990 },
      open:  { needed: 0, start: 450, end: 840 },
      swing: { needed: 1, start: 510, end: 990 },
      close: { needed: 0, start: 510, end: 990 },
    }),
    mkDay(480, 1200, 60, weekdayShifts(510, 900)),
    mkDay(480, 1200, 60, weekdayShifts(510, 900)),
    mkDay(480, 1200, 60, weekdayShifts(510, 900)),
    mkDay(480, 1200, 60, weekdayShifts(510, 900)),
    mkDay(480, 1200, 60, weekdayShifts(570, 960)),
    mkDay(480, 960, 30, {
      full:  { needed: 0, start: 450, end: 990 },
      open:  { needed: 1, start: 450, end: 840 },
      swing: { needed: 1, start: 570, end: 960 },
      close: { needed: 1, start: 510, end: 990 },
    }),
  ],
};

export const seedEmployees: Employee[] = [
  {
    id: "e1", name: "Sam", phone: "(555) 555-0101", color: DEFAULT_EMP_COLORS[0],
    minHours: 35, maxHours: 40, flex: 2, canOpen: true, canClose: true,
    availability: [true, true, true, true, true, true, true],
    timeOff: [
      { id: uid(), start: "2026-07-19", end: "2026-07-19", note: "req off" },
      { id: uid(), start: "2026-07-26", end: "2026-07-26", note: "req off" },
      { id: uid(), start: "2026-08-22", end: "2026-08-22", note: "req off" },
    ],
  },
  {
    id: "e2", name: "Jordan", phone: "(555) 555-0102", color: DEFAULT_EMP_COLORS[1],
    minHours: 32, maxHours: 40, flex: 3, canOpen: true, canClose: true,
    availability: [true, true, true, true, true, true, true],
    timeOff: [],
  },
  {
    id: "e3", name: "Taylor", phone: "(555) 555-0103", color: DEFAULT_EMP_COLORS[2],
    minHours: 25, maxHours: 32, flex: 1, canOpen: false, canClose: true,
    availability: [false, true, true, true, true, true, true],
    timeOff: [],
  },
  {
    id: "e4", name: "Morgan", phone: "(555) 555-0104", color: DEFAULT_EMP_COLORS[3],
    minHours: 30, maxHours: 38, flex: 2, canOpen: true, canClose: false,
    availability: [true, true, true, true, true, true, true],
    timeOff: [{ id: uid(), start: "2026-07-14", end: "2026-07-20", note: "vacation" }],
  },
  {
    id: "e5", name: "Alex", phone: "(555) 555-0105", color: DEFAULT_EMP_COLORS[4],
    minHours: 20, maxHours: 30, flex: 3, canOpen: true, canClose: true,
    availability: [true, true, true, true, true, true, true],
    timeOff: [],
  },
];

const W = "2026-07-13";

export const seedShifts: Shift[] = [
  { id: uid(), empId: "e1", date: W, type: "full", start: 450, end: 990 },
  { id: uid(), empId: "e4", date: W, type: "swing", start: 510, end: 990 },
  { id: uid(), empId: "e2", date: addDays(W, 1), type: "open", start: 450, end: 840 },
  { id: uid(), empId: "e5", date: addDays(W, 1), type: "swing", start: 510, end: 900 },
  { id: uid(), empId: "e1", date: addDays(W, 1), type: "close", start: 840, end: 1260 },
  { id: uid(), empId: "e3", date: addDays(W, 1), type: "training", start: 450, end: 840 },
  { id: uid(), empId: "e2", date: addDays(W, 2), type: "open", start: 450, end: 840 },
  { id: uid(), empId: "e5", date: addDays(W, 2), type: "swing", start: 510, end: 900 },
  { id: uid(), empId: "e3", date: addDays(W, 2), type: "close", start: 840, end: 1260 },
  { id: uid(), empId: "e3", date: addDays(W, 2), type: "training", start: 450, end: 840 },
  { id: uid(), empId: "e1", date: addDays(W, 3), type: "open", start: 450, end: 840 },
  { id: uid(), empId: "e2", date: addDays(W, 3), type: "swing", start: 510, end: 900 },
  { id: uid(), empId: "e3", date: addDays(W, 3), type: "close", start: 840, end: 1260 },
  { id: uid(), empId: "e1", date: addDays(W, 4), type: "open", start: 450, end: 840 },
  { id: uid(), empId: "e3", date: addDays(W, 4), type: "swing", start: 510, end: 900 },
  { id: uid(), empId: "e2", date: addDays(W, 4), type: "close", start: 840, end: 1260 },
  { id: uid(), empId: "e1", date: addDays(W, 5), type: "open", start: 510, end: 840 },
  { id: uid(), empId: "e2", date: addDays(W, 5), type: "swing", start: 510, end: 840 },
  { id: uid(), empId: "e3", date: addDays(W, 5), type: "swing", start: 570, end: 960 },
  { id: uid(), empId: "e5", date: addDays(W, 5), type: "close", start: 840, end: 1260 },
  { id: uid(), empId: "e2", date: addDays(W, 6), type: "close", start: 510, end: 990 },
  { id: uid(), empId: "e3", date: addDays(W, 6), type: "swing", start: 570, end: 960 },
  { id: uid(), empId: "e5", date: addDays(W, 6), type: "open", start: 510, end: 990 },
];
