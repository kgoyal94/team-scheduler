"use client";
import { useState } from "react";
import { Employee, BlockedTime } from "../../domain/types";
import { T } from "../../lib/tokens";
import { DAY_NAMES } from "../../lib/constants";
import { fmtTime } from "../../domain/time";
import { Btn } from "../ui/Btn";
import { TimeSel } from "../ui/TimeSel";

interface BlockedTimeEditorProps {
  emp: Employee;
  updateEmp: (id: string, patch: Partial<Employee>) => void;
}

// Time-boxed availability (1j): everyone is available by default (see the day
// chips above); this only carves out a stretch of a still-available day, e.g.
// "Wed 10:30a–4:00p" for a school pickup. A block that fully covers a shift
// rules the candidate out in Suggestions; a partial overlap flags them as
// needing an override instead (see domain/rules.ts blockedOverlap).
export function BlockedTimeEditor({ emp, updateEmp }: BlockedTimeEditorProps) {
  const [dow, setDow] = useState(0);
  const [start, setStart] = useState(600); // 10:00a
  const [end, setEnd] = useState(720); // 12:00p
  const blocks = emp.blockedTimes ?? [];

  const addBlock = () => {
    if (end <= start) return;
    const next: BlockedTime[] = [...blocks, { dow, start, end }];
    next.sort((a, b) => a.dow - b.dow || a.start - b.start);
    updateEmp(emp.id, { blockedTimes: next });
  };

  const removeBlock = (i: number) => {
    updateEmp(emp.id, { blockedTimes: blocks.filter((_, j) => j !== i) });
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 4 }}>
        Blocked times (within an available day)
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
        {blocks.length === 0 && (
          <span style={{ fontSize: 12, color: T.inkSoft }}>None — available all day, every available day</span>
        )}
        {blocks.map((b, i) => (
          <span
            key={i}
            style={{
              background: T.warnBg,
              color: T.warn,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              padding: "2px 8px",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {DAY_NAMES[b.dow]} {fmtTime(b.start)}–{fmtTime(b.end)}
            <button
              onClick={() => removeBlock(i)}
              style={{
                border: "none",
                background: "transparent",
                color: T.warn,
                cursor: "pointer",
                fontWeight: 800,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <select value={dow} onChange={(e) => setDow(+e.target.value)} style={{ fontSize: 12 }}>
          {DAY_NAMES.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
        <TimeSel value={start} onChange={setStart} />
        <span style={{ fontSize: 11 }}>to</span>
        <TimeSel value={end} onChange={setEnd} />
        <Btn small onClick={addBlock}>
          + block time
        </Btn>
      </div>
    </div>
  );
}
