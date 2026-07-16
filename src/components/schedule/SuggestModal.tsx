"use client";
import { Employee, Shift, Settings } from "../../domain/types";
import { T } from "../../lib/tokens";
import { SHIFT_TYPES, DAY_NAMES } from "../../lib/constants";
import { addDays, dowOf, fmtDate, fmtTime, mondayOf } from "../../domain/time";
import { rankCandidates } from "../../domain/rules";
import { Btn } from "../ui/Btn";
import { Chip } from "../ui/Chip";

interface SuggestModalProps {
  suggestFor: { date: string; type: string };
  employees: Employee[];
  shifts: Shift[];
  settings: Settings;
  assign: (empId: string, date: string, type: string) => void;
  setSuggestFor: (v: { date: string; type: string } | null) => void;
}

export function SuggestModal({
  suggestFor,
  employees,
  shifts,
  settings,
  assign,
  setSuggestFor,
}: SuggestModalProps) {
  const tmplFor = (dow: number, type: string) =>
    settings.days[dow].shifts[type as keyof typeof settings.days[0]["shifts"]];
  const trainingDefault = (dow: number) => {
    const o = settings.days[dow].shifts.open;
    return { start: o.start, end: o.end };
  };
  const templateOrTraining = (dow: number, type: string) =>
    type === "training" ? trainingDefault(dow) : tmplFor(dow, type);

  const dow = dowOf(suggestFor.date);
  const st = SHIFT_TYPES[suggestFor.type as keyof typeof SHIFT_TYPES];
  const tmpl = templateOrTraining(dow, suggestFor.type);
  const wk = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(suggestFor.date), i));
  const { qualified, excluded } = rankCandidates({
    employees,
    shifts,
    dateISO: suggestFor.date,
    type: suggestFor.type as Shift["type"],
    weekDates: wk,
    tmpl,
    settings,
  });
  return (
    <div
      onClick={() => setSuggestFor(null)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(25,32,28,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          borderRadius: 14,
          padding: 20,
          width: "min(440px,100%)",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(20,28,24,0.3)",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div
            style={{ fontSize: 11, color: T.inkSoft, fontWeight: 700, letterSpacing: 1 }}
          >
            SUGGESTIONS
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {st.label} · {DAY_NAMES[dow]} {fmtDate(suggestFor.date)}
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft }}>
            {fmtTime(tmpl.start)}–{fmtTime(tmpl.end)} ·{" "}
            {suggestFor.type === "training"
              ? "ranked to put uncertified staff alongside a trained shift"
              : "ranked by hours still needed, flexibility, and room under their weekly max"}
            .
          </div>
        </div>
        {qualified.length === 0 && (
          <div
            style={{
              background: T.dangerBg,
              color: T.danger,
              borderRadius: 10,
              padding: 10,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            No one fully qualifies — see who&apos;s ruled out below.
          </div>
        )}
        {qualified.map((c, i) => (
          <div
            key={c.emp.id}
            style={{
              border: `1px solid ${i === 0 ? T.ok : T.line}`,
              background: i === 0 ? T.okBg : "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                {c.emp.name}{" "}
                {i === 0 && (
                  <Chip bg={T.ok} ink="#fff" style={{ marginLeft: 4 }}>
                    Best match
                  </Chip>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: T.inkSoft }}>
                {c.reasons.join(" · ")}
              </div>
            </div>
            <Btn
              kind="primary"
              small
              onClick={() => assign(c.emp.id, suggestFor.date, suggestFor.type)}
            >
              Assign
            </Btn>
          </div>
        ))}
        {excluded.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.inkSoft,
                letterSpacing: 1,
                margin: "12px 0 6px",
              }}
            >
              RULED OUT
            </div>
            {excluded.map((x) => (
              <div
                key={x.emp.id}
                style={{
                  fontSize: 12.5,
                  color: T.inkSoft,
                  padding: "4px 2px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 700 }}>{x.emp.name}</span>
                <span style={{ textAlign: "right" }}>{x.why}</span>
              </div>
            ))}
          </>
        )}
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <Btn onClick={() => setSuggestFor(null)}>Close</Btn>
        </div>
      </div>
    </div>
  );
}
