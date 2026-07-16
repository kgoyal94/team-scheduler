# CLAUDE.md — conventions for the Team Scheduler codebase

This file is read by AI coding agents (and humans). Its purpose: **two people are vibe
coding one repo — follow these rules so our diffs stay small, compatible, and mergeable.**

Strategy: `STRATEGY.md`. Living state / who-owns-what: `CONTEXT.md`. Read both before large changes.

---

## Golden rules (non-negotiable)

1. **Stay in your lane.** Edit only files in your ownership area (see map below). To change
   a file the other person owns, ask first — don't have your agent "helpfully" refactor it.
2. **Scope every change to named files.** Never "refactor the app," "clean up," or "reformat"
   files you weren't asked to touch. Unrequested reformatting manufactures merge conflicts.
3. **Git stays with the human + the primary assistant.** Your primary Claude assistant may
   commit/push when you explicitly ask. **Build/background sub-agents do NOT run git** (a
   nested `.git` from a parallel agent once diverged a repo). No nested `.git`.
4. **Pull before you start; push small and often, straight to `main`.** `git pull` at the
   start of every session (not just before committing). 2-person direct-to-`main` model;
   feature branches + PRs are the upgrade path if you start colliding.
5. **Keep the domain pure.** Logic in `src/domain/` has no React, no Supabase, no I/O — just
   functions over plain data. This is what lets the two owners work without stepping on each other.
6. **Behavior-preserving port.** Phase 1 (see STRATEGY §1) must not change what the user sees.
   Don't redesign UI or rename domain concepts during the port.
7. **Never commit secrets.** Supabase keys live in `.env.local` (gitignored). Update
   `.env.example` when you add a variable.

---

## Stack (agree or change in step 1, then treat as fixed)

- **Framework:** Next.js (App Router) + React 18
- **Language:** **TypeScript** — the type checker catches interface mismatches where Alex's
  domain code meets Kuhuk's data code, which is exactly the seam two people break.
- **DB + Auth:** Supabase (Postgres + Supabase Auth)
- **Hosting:** Vercel
- **Package manager:** **npm** — commit `package-lock.json`. Pin Node in `.nvmrc`.
- **Styling:** keep the prototype's **inline styles + design-token object** (`src/lib/tokens.ts`)
  for the Phase-1 port — lowest-risk, behavior-preserving. Tailwind is a possible LATER
  migration, not now.
- **Formatting/lint:** Prettier (committed `.prettierrc`) + `next lint`. Both agents must use
  the same config so formatting never shows up in a diff.
- **Spreadsheet export:** `xlsx-js-style` (already used by the prototype) — keep as-is.

---

## Folder structure

```
team-scheduler/
├── CLAUDE.md · CONTEXT.md · STRATEGY.md · README.md
├── .env.example · .env.local(gitignored) · .gitignore · .nvmrc · .prettierrc
├── package.json · package-lock.json · next.config.js · tsconfig.json
├── shift-board.html          # ORIGINAL prototype — keep as reference until fully ported, then delete
├── public/
├── supabase/
│   └── migrations/           # SQL migrations                                [Kuhuk]
└── src/
    ├── app/                                                                  [Kuhuk — shell]
    │   ├── layout.tsx
    │   ├── page.tsx          # scheduler shell + tab switching (thin; delegates to components)
    │   ├── globals.css
    │   └── login/page.tsx
    ├── components/
    │   ├── ui/               # shared atoms: Btn, Chip, TimeSel               [SHARED — agree first]
    │   ├── schedule/         # week view, month view, shift card, slot, suggest modal  [Alex]
    │   ├── team/             # employee editor, time-off editor              [Alex]
    │   └── settings/         # business-settings editor                      [Alex]
    ├── domain/               # PURE logic — no React, no I/O                  [Alex]
    │   ├── types.ts          # Employee, Shift, Settings, ShiftType…          [SHARED — agree first]
    │   ├── time.ts           # addDays, dowOf, fmtTime… (date/time helpers)
    │   ├── coverage.ts       # coverage types, gaps, dayStatus
    │   ├── rules.ts          # rankCandidates, shiftIssues, trainedFor
    │   └── training.ts       # trainingCovers, auto-certification logic
    ├── data/                 # persistence layer                             [Kuhuk]
    │   ├── supabase.ts       # client
    │   ├── employees.ts · shifts.ts · settings.ts   # load/save per entity
    │   └── seed.ts           # the design partner bootstrap data
    ├── auth/                                                                  [Kuhuk]
    │   └── (session helpers, route guards)
    ├── export/
    │   └── workbook.ts       # buildWorkbook (.xlsx export)                   [SHARED — agree first]
    └── lib/
        ├── tokens.ts         # design tokens (the `T` object)                 [SHARED — agree first]
        └── constants.ts      # SHIFT_TYPES, COVERAGE_TYPES, DAY_NAMES…        [SHARED — agree first]
```

### Ownership map (mirrors real roles — see CONTEXT.md)
- **Alex** (validates product-truth live at the design partner): `src/domain/`, `src/components/{schedule,team,settings}/`
- **Kuhuk** (platform / productization): `src/data/`, `src/auth/`, `src/app/`, `supabase/`
- **SHARED (change only after a quick heads-up):** `src/lib/`, `src/domain/types.ts`,
  `src/components/ui/`, `src/export/`. These are the seams; a silent change here breaks the
  other person. Touch them deliberately, in their own small PR.

---

## Coding conventions

- **Files:** one component per file, PascalCase (`WeekView.tsx`); logic/util files camelCase
  (`rules.ts`). Named exports (no default exports) so imports are greppable and consistent.
- **Types:** all shared shapes live in `src/domain/types.ts`. Never redefine `Employee`/`Shift`
  locally. Prefer explicit types on function signatures at file boundaries.
- **Domain purity:** functions in `src/domain/` take data in, return data out — no React state,
  no `fetch`, no Supabase. UI and data layers import from domain, never the reverse.
- **Data layer:** every DB read/write goes through `src/data/*` functions (e.g. `loadShifts()`,
  `saveShift()`). Components never call Supabase directly.
- **Constants over magic values:** shift types, day names, and design tokens come from
  `src/lib/`. Don't inline hex colors or `"open"/"close"` string literals in components.
- **Keep the prototype's vocabulary.** Don't rename existing concepts during the port (see glossary).
- **Comments:** match the surrounding density. Explain *why*, not *what*.

---

## Git workflow (2-person direct-to-`main` model)

1. **`git pull` in your existing clone before you start each session** — not just before
   committing, and never re-download the repo as a ZIP (no history; can clobber your work).
2. Work only in your ownership lane (see map above).
3. Small, frequent commits. Messages: imperative, one line (`Add shifts load/save layer`).
4. **Push often**, straight to `main`, so the other person's next pull stays current.
5. If a push is rejected (they pushed first): `git pull --rebase`, resolve any conflict, push.
6. Build/background sub-agents never run git; the human or primary assistant does the above.
7. Upgrade path if you start colliding: feature branches + PRs.

---

## Definition of done for a change
- Only intended files changed (check the diff — no stray reformatting).
- Stayed in your lane, or got the OK for a shared/other-owned file.
- Types check (`tsc`), lint passes (`next lint`), app builds (`next build`) and runs.
- No secrets committed; `.env.example` updated if a new var was added.

---

## Domain glossary (use these exact terms — keep them consistent across both agents)

- **Coverage shift types:** `open`, `swing`, `close`, `full` (= open+close in one). These count
  toward staffing. **`training`** is a shadow shift that does NOT count toward coverage.
- **Coverage / gap:** a day "needs" N of each type (driven by store hours in Business Settings);
  a gap is an unmet need.
- **Certification:** per-employee `canOpen` / `canClose` — a first-class scheduling constraint
  (this is our differentiator; see STRATEGY §3). Only certified staff can be assigned open/close.
- **Auto-certification:** completing a `training` shift that shadows an open/close automatically
  grants `canOpen`/`canClose`. **This is our moat — do not remove or weaken it.**
- **Flexibility (`flex`, 1–3):** how movable a person's hours are; feeds the suggestion ranking.
- **min/max hours:** weekly bounds per employee; drives under/over flags and ranking.
- **Rules engine:** `rankCandidates` returns qualified staff (scored, with human-readable
  reasons) and a `ruled out, and why` list. **Keep suggestions explainable** — the "why" is a
  feature, not debug output.
- **Business / tenant:** for the MVP there is ONE business (the design partner). Multi-tenant is LATER.
