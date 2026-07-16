# Team Scheduler — Project Context (living doc)

_Update this every working session. Strategy lives in `STRATEGY.md`; this is the
operational state: what it is, who's doing what, and what's in flight._

## What this is
"Shift Board" — a shift-scheduling app for cafés/restaurants. Currently a single-file
React prototype (`shift-board.html`) tailor-made for the trial customer, **the design partner**.
Long-term goal: productize for independent cafés/restaurants. See `STRATEGY.md`.

## People
- **Kuhuk** — PM (Sony Music PM by day; CS background). Driving productization + strategy.
- **Alex Law** — repo owner (`lawalex/team-scheduler`) and a **the design partner employee**.
  Domain expert — can validate the real scheduling workflow on the floor.
- Both will be **vibe coding** (building with AI assistance). See "Collaboration model" below.

## Current state (2026-07-16)
- Repo cloned locally at `~/Desktop/Claude/team-scheduler` (via HTTPS; SSH key not set up).
- Repo contents: `shift-board.html` (the prototype), plus `STRATEGY.md` and this `CONTEXT.md`.
- **Prototype is local-only:** no persistence (refresh wipes state), no backend, no auth,
  no build step (React + Babel from CDN). Manager-only, single-location.
- Prototype's genuine strengths (keep): rules engine, drag-drop, coverage flags,
  **auto-certification from shadow shifts**, weekly-hours tracking, styled 2-tab `.xlsx` export.

## Decisions locked
- **Web first**, not iOS (see STRATEGY §1). iOS only once staff-facing self-service ships.
- MVP = **Fast (2–3 wks), manager-only**: persist + build + auth + deploy. No new features.
- Stack for MVP: **Next.js + Supabase + Vercel**.
- Target market: single-location indie cafés → wider F&B → small groups. **No chains.**

## In flight / next actions
- [ ] Agree architecture + folder structure in writing (before vibe coding) — prevents the
      worst collision (divergent foundations).
- [ ] First shared task: **split `shift-board.html` into a modular Next.js structure**
      (many small files) so parallel work stops colliding in one giant file.
- [ ] MVP Phases 1–5 (see STRATEGY §1).
- [ ] Validate unmet-need #6 (open/close/keyhold certification) with the CC manager at zero
      build cost — is it the category wedge or just nice-to-have?

## Collaboration model (two vibe-coders, avoid collisions)

> **⚠️ WORKFLOW CONSTRAINT — READ FIRST (applies to Kuhuk, Alex, and their Claude agents):**
> **ALWAYS `git pull` in your existing local clone BEFORE you start working each session —
> not just before committing.** Committing on top of a stale copy is what creates conflicts.
> Do NOT re-download the repo as a ZIP from GitHub (that has no git history and can clobber
> uncommitted work); use `git pull` in the clone you already have. Push small changes often
> so the other person's next pull stays current.

- One repo, one stack, one folder structure — agreed in writing here before building.
- **Workflow (decided 2026-07-16): commit + push directly to `main`** — simple 2-person model.
  Pull before starting (above), push frequently. If a push is rejected because the other
  person pushed first: `git pull --rebase` then push again. Upgrade path if you start
  colliding: feature branches + PRs.
- **Divide by file/folder ownership, not by lines in a shared file.** Suggested split:
  - Alex → domain/product-truth: scheduling logic, rules engine, coverage model, business
    settings (the parts she can validate live at the restaurant).
  - Kuhuk → platform: data layer (Supabase schema, persistence), auth, deploy, app shell.
- Kill the monolith first — collisions happen at file granularity; many small files = safe.
- Commit `package-lock.json`; keep a shared `CLAUDE.md` of conventions so both AI agents
  produce consistent diffs.
- Scope AI edits to named files ("edit X"), not "refactor the app." Review every diff before
  committing — agents silently reformat/rename.
- **Git hygiene:** your primary Claude assistant MAY commit/push to `main` when you explicitly
  ask it to. But **build/background sub-agents must NOT run git** (a nested `.git` from a
  parallel agent once diverged another repo). No nested `.git`. The human stays in control.
- Env/secrets: never commit Supabase keys; share via `.env.local` (gitignored) + a checked-in
  `.env.example`.

**Decided 2026-07-16:** ONE shared codebase (not parallel spikes). Converge on the foundation
up front, then divide by file ownership per the model above.

### Kickoff sequence (do in this order)
1. **Together:** agree stack + folder structure + `CLAUDE.md` conventions; commit them.
2. **Together (one sitting):** scaffold the Next.js app and split `shift-board.html` into
   modular files. This is the "kill the monolith" step — do it before parallel work.
3. **Split:** Alex takes the scheduling-domain files; Kuhuk takes data/auth/deploy/shell.
4. From here: branch per feature → PR into `main` → merge at least daily.
