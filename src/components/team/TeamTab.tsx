"use client";
import React from "react";
import { Employee, Shift } from "../../domain/types";
import { T } from "../../lib/tokens";
import { DAY_NAMES, DEFAULT_EMP_COLORS } from "../../lib/constants";
import { fmtTime } from "../../domain/time";
import { uid } from "../../lib/util";
import { Btn } from "../ui/Btn";
import { TimeOffEditor } from "./TimeOffEditor";
import { BlockedTimeEditor } from "./BlockedTimeEditor";

interface TeamTabProps {
  employees: Employee[];
  updateEmp: (id: string, patch: Partial<Employee>) => void;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export function TeamTab({ employees, updateEmp, setEmployees, setShifts }: TeamTabProps) {
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
        }}
      >
        These rules drive suggestions and flags: min/max weekly hours, flexibility (3 = very
        flexible, 1 = stringent), open/close training, day-of-week availability, and time-off
        requests. Scheduling a completed training shift alongside an opening or closing
        automatically ticks that person&apos;s Can open / Can close.
      </div>
      {employees.map((emp) => (
        <div
          key={emp.id}
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
            <label
              title="Calendar color"
              style={{
                display: "inline-flex",
                width: 20,
                height: 20,
                borderRadius: 99,
                overflow: "hidden",
                border: `2px solid ${emp.color}`,
                cursor: "pointer",
                position: "relative",
                background: emp.color,
              }}
            >
              <input
                type="color"
                value={emp.color}
                onChange={(e) => updateEmp(emp.id, { color: e.target.value })}
                style={{
                  position: "absolute",
                  inset: -4,
                  width: 30,
                  height: 30,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  opacity: 0,
                }}
              />
            </label>
            <input
              value={emp.name}
              onChange={(e) => updateEmp(emp.id, { name: e.target.value })}
              style={{
                fontWeight: 800,
                fontSize: 15,
                border: "none",
                borderBottom: `1px dashed ${T.line}`,
                background: "transparent",
                width: 110,
                color: T.ink,
              }}
            />
            <label style={{ fontSize: 12.5 }}>
              Min hrs/wk{" "}
              <input
                type="number"
                min={0}
                max={80}
                value={emp.minHours}
                onChange={(e) => updateEmp(emp.id, { minHours: +e.target.value || 0 })}
                style={{ width: 52 }}
              />
            </label>
            <label style={{ fontSize: 12.5 }}>
              Max hrs/wk{" "}
              <input
                type="number"
                min={0}
                max={80}
                value={emp.maxHours}
                onChange={(e) => updateEmp(emp.id, { maxHours: +e.target.value || 0 })}
                style={{ width: 52 }}
              />
            </label>
            <label style={{ fontSize: 12.5 }}>
              Flexibility{" "}
              <select
                value={emp.flex}
                onChange={(e) => updateEmp(emp.id, { flex: +e.target.value })}
              >
                <option value={1}>1 — stringent</option>
                <option value={2}>2 — somewhat</option>
                <option value={3}>3 — flexible</option>
              </select>
            </label>
            <label style={{ fontSize: 12.5, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={emp.canOpen}
                onChange={(e) => updateEmp(emp.id, { canOpen: e.target.checked })}
              />{" "}
              Can open
            </label>
            <label style={{ fontSize: 12.5, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={emp.canClose}
                onChange={(e) => updateEmp(emp.id, { canClose: e.target.checked })}
              />{" "}
              Can close
            </label>
            <Btn
              small
              kind="danger"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
                setShifts((prev) => prev.filter((s) => s.empId !== emp.id));
              }}
            >
              Remove
            </Btn>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Available:</span>
            {DAY_NAMES.map((dn, i) => {
              const dayBlocks = (emp.blockedTimes ?? []).filter((b) => b.dow === i);
              const blocked = emp.availability[i] && dayBlocks.length > 0;
              return (
                <button
                  key={dn}
                  onClick={() => {
                    const availability = [...emp.availability];
                    availability[i] = !availability[i];
                    updateEmp(emp.id, { availability });
                  }}
                  title={
                    blocked
                      ? dayBlocks.map((b) => `${fmtTime(b.start)}–${fmtTime(b.end)}`).join(", ")
                      : undefined
                  }
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${blocked ? T.warn : emp.availability[i] ? T.ok : T.line}`,
                    background: blocked ? T.warnBg : emp.availability[i] ? T.okBg : "#F3F4F1",
                    color: blocked ? T.warn : emp.availability[i] ? T.ok : T.inkSoft,
                    fontSize: 11,
                    fontWeight: blocked ? 800 : 700,
                    padding: "2px 9px",
                    cursor: "pointer",
                    textDecoration: emp.availability[i] ? "none" : "line-through",
                  }}
                >
                  {blocked
                    ? `${dn} · ${fmtTime(dayBlocks[0].start)}–${fmtTime(dayBlocks[0].end)} blocked${
                        dayBlocks.length > 1 ? ` +${dayBlocks.length - 1}` : ""
                      }`
                    : dn}
                </button>
              );
            })}
          </div>
          <TimeOffEditor emp={emp} updateEmp={updateEmp} />
          <BlockedTimeEditor emp={emp} updateEmp={updateEmp} />
        </div>
      ))}
      <Btn
        kind="primary"
        onClick={() =>
          setEmployees((prev) => [
            ...prev,
            {
              id: uid(),
              name: "New employee",
              phone: "",
              color: DEFAULT_EMP_COLORS[prev.length % DEFAULT_EMP_COLORS.length],
              minHours: 20,
              maxHours: 40,
              flex: 2,
              canOpen: false,
              canClose: false,
              availability: [true, true, true, true, true, true, true],
              timeOff: [],
            },
          ])
        }
      >
        + Add employee
      </Btn>
    </div>
  );
}
