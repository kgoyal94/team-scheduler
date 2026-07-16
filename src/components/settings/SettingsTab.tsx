"use client";
import React from "react";
import { Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { COVERAGE_TYPES, SHIFT_TYPES, DAY_FULL } from "../../lib/constants";
import { Btn } from "../ui/Btn";
import { Chip } from "../ui/Chip";
import { TimeSel } from "../ui/TimeSel";

interface SettingsTabProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  updateDay: (dow: number, patch: Partial<Settings["days"][0]>) => void;
  updateDayShift: (
    dow: number,
    type: string,
    patch: Partial<{ needed: number; start: number; end: number }>
  ) => void;
  applyStoreHours: (dow: number) => void;
}

export function SettingsTab({
  settings,
  setSettings,
  updateDay,
  updateDayShift,
  applyStoreHours,
}: SettingsTabProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: "#fff",
          border: `1px solid ${T.line}`,
          borderRadius: 12,
          padding: 14,
          fontSize: 12.5,
          color: T.inkSoft,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
        }}
      >
        <span>
          Store hours drive the shift templates. Opening staff arrive early to set up; closing
          staff stay after to wrap up. Training shifts shadow these and don&apos;t count toward
          coverage.
        </span>
        <label style={{ fontWeight: 700, color: T.ink }}>
          Opening prep:{" "}
          <input
            type="number"
            min={0}
            max={120}
            step={15}
            value={settings.prepMinutes}
            onChange={(e) =>
              setSettings((p) => ({ ...p, prepMinutes: +e.target.value || 0 }))
            }
            style={{ width: 52 }}
          />{" "}
          min before open
        </label>
      </div>
      {settings.days.map((d, dow) => (
        <div
          key={dow}
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 15, width: 92 }}>{DAY_FULL[dow]}</span>
            <label style={{ fontSize: 12.5 }}>
              Store open{" "}
              <TimeSel value={d.storeOpen} onChange={(v) => updateDay(dow, { storeOpen: v })} />
            </label>
            <label style={{ fontSize: 12.5 }}>
              close{" "}
              <TimeSel value={d.storeClose} onChange={(v) => updateDay(dow, { storeClose: v })} />
            </label>
            <label style={{ fontSize: 12.5 }}>
              Close-out{" "}
              <input
                type="number"
                min={0}
                max={120}
                step={15}
                value={d.closeOut}
                onChange={(e) => updateDay(dow, { closeOut: +e.target.value || 0 })}
                style={{ width: 48 }}
              />{" "}
              min
            </label>
            <Btn
              small
              onClick={() => applyStoreHours(dow)}
              title="Recompute opening start and closing end from store hours and buffers"
            >
              Apply to shifts
            </Btn>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {COVERAGE_TYPES.map((type) => {
              const st = SHIFT_TYPES[type];
              const t = d.shifts[type];
              return (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    opacity: t.needed === 0 ? 0.55 : 1,
                  }}
                >
                  <Chip
                    bg={type === "full" ? "#F3E9DA" : st.bg}
                    ink={st.ink}
                    style={{ width: 96, textAlign: "center" }}
                  >
                    {st.label}
                  </Chip>
                  <label style={{ fontSize: 12 }}>
                    Needed{" "}
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={t.needed}
                      onChange={(e) => updateDayShift(dow, type, { needed: +e.target.value || 0 })}
                      style={{ width: 42 }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    from{" "}
                    <TimeSel
                      value={t.start}
                      onChange={(v) => updateDayShift(dow, type, { start: v })}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    to{" "}
                    <TimeSel
                      value={t.end}
                      onChange={(v) => updateDayShift(dow, type, { end: v })}
                    />
                  </label>
                  <span style={{ fontSize: 11, color: T.inkSoft }}>
                    {((t.end - t.start) / 60).toFixed(1)}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
