export const SHIFT_TYPES = {
  full:     { label: "Open + Close", short: "OPEN+CLOSE", bg: "linear-gradient(105deg,#FBF1DC 0%,#EAE6F3 100%)", edge: "#B0722F", ink: "#6B4A1E", coverage: true },
  open:     { label: "Opening",  short: "OPEN",  bg: "#FBF1DC", edge: "#E9A13B", ink: "#7A5310", coverage: true },
  swing:    { label: "Swing",    short: "SWING", bg: "#E4EEF6", edge: "#3E7CB1", ink: "#28527A", coverage: true },
  close:    { label: "Closing",  short: "CLOSE", bg: "#EAE6F3", edge: "#6C5CA8", ink: "#453873", coverage: true },
  training: { label: "Training", short: "TRAINING", bg: "#E1F1EC", edge: "#2E7D6B", ink: "#1C5A4C", coverage: false },
} as const;

export const COVERAGE_TYPES = ["full", "open", "swing", "close"] as const;
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAY_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
export const DEFAULT_EMP_COLORS = ["#0B57D0", "#A3490F", "#1E6B3C", "#6231B5", "#B0264C", "#0F6B6A", "#7A5E0D", "#3F4A55"] as const;
export const TIME_OPTIONS: number[] = [];
for (let m = 300; m <= 1410; m += 30) TIME_OPTIONS.push(m);
