# ShiftLift — Project Context (living doc)

_Operational state: what it is, who's doing what, what's live, what's next. Strategy lives in
`STRATEGY.md`; conventions in `CLAUDE.md`. **Update this every working session.**_

## SITE
```
name:      ShiftLift
status:    BETA
tagline:   Staff scheduling made simple.
liveUrl:   https://shiftlift.app
cta:       beta-form → /shiftlift-beta (table: shiftlift_beta_signups)
```
_In live private beta — one restaurant (the design partner) in real use; recruiting more via the beta page._

---

## ▶ Next session — start here
1. **Pull first:** `git pull` in `~/Desktop/Claude/team-scheduler` (see Collaboration model).
2. **Run locally:** `npm install` → `npm run dev`. Needs `.env.local` (already present locally,
   gitignored). **Verify with `npx tsc --noEmit`, NOT `next build`** (disk-constrained Mac —
   see Environment note). Vercel does production builds.
3. **Deploy:** `npx vercel --prod --yes --scope reborn-industries-llc` (repo isn't Git-connected
   to Vercel yet, so deploys are manual via CLI).
4. **Status:** MVP is LIVE and verified at **https://shiftlift.app**. The immediate next step is
   the **manager's first sign-in + entering real the design partner data** (see Next actions).

---

## What this is
**ShiftLift** — a café/restaurant shift-scheduling web app; a **Reborn Industries** product.
Live at **https://shiftlift.app**. Began as a single-file React prototype (`shift-board.html`,
kept in-repo for reference) tailor-made for trial customer **the design partner**; now a modular
Next.js app, rebranded and genericized. Differentiator/moat: café-native open/close/**keyhold
certification** with auto-cert from shadow shifts — no competitor does this well. See `STRATEGY.md`.

## People
- **Kuhuk** — PM (Sony Music PM by day; CS background). Drives productization + owns infra/billing.
- **Alex Law** ("she") — repo owner (`lawalex/team-scheduler`), a **the design partner employee**, and
  Reborn **employee #1**. Domain expert who validates the workflow on the floor.
- Both **vibe code** (build with AI). See Collaboration model.

## Live resources
- **App:** https://shiftlift.app (custom domain, registered third-party, on Vercel)
- **Repo:** `lawalex/team-scheduler`; local clone `~/Desktop/Claude/team-scheduler` (HTTPS — no SSH key here)
- **Vercel:** project `team-scheduler` under team **reborn-industries-llc**
  (projectId `prj_TeZW1Gz4K3hBUzgRLXJ0w8WC2MDW`). Deploy via CLI (not Git-connected yet).
- **Supabase:** project `team-scheduler` `ufpuxvfxgnjwavysbrgm`, org **Reborn Enterprises LLC**
  (Pro plan), us-east-1. Schema in `supabase/migrations/0001_init.sql`.
- **Env vars** (set on Vercel for prod/preview/dev, and in local `.env.local`):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAILS`.

## Stack
Next.js 15 (App Router) + TypeScript + Supabase (Postgres + Auth) + Vercel. Styling = the
prototype's inline design tokens (`src/lib/tokens.ts`), no Tailwind. Excel export via
`xlsx-js-style`. Folder structure + conventions: `CLAUDE.md`.

## Auth model
Magic-link (passwordless), **self-service** — each person requests their own link at
`shiftlift.app/login`. Locked by a server-side **email allowlist** (`ALLOWED_EMAILS`), enforced
in the auth callback (reject + signOut) and middleware. Currently allowed:
`manager@example.com` (manager), `alex@example.com` (Alex), `kuhukg@gmail.com` (Kuhuk).
Supabase Auth URL config is set (Site URL `https://shiftlift.app`; redirects `shiftlift.app/**`
+ `localhost:3000/**`). First login triggers a bootstrap that seeds generic demo data.

## Decisions locked
- **Web first**, not iOS. iOS only once staff-facing self-service ships.
- MVP = manager-only, "make the prototype real" (persist + build + auth + deploy). Done.
- Target market: single-location indie cafés → wider F&B → small groups. **No chains.**
- Name/domain: **ShiftLift / shiftlift.app**.
- Billing on Kuhuk's personal card temporarily → switch to LLC + EIN when it arrives (~end Jul 2026).

## Done so far (commits on `main`)
- `324977a` — Scaffold Next.js + TS; split the monolith into modules
- `c991d29` — Phase 2: Supabase persistence + magic-link auth
- `8f95f26` — Rebrand to ShiftLift; genericize demo data; clearer login
- `693f02f` — Callback handles both PKCE (`code`) and OTP (`token_hash`) flows
- `a5cd306` — Server-side email allowlist
- **Verified end-to-end 2026-07-17:** kuhukg login → allowlist pass → bootstrap wrote 1 business
  ("My Business") + 5 employees + 23 shifts + 4 time_off to Postgres. Auth → allowlist →
  bootstrap → persistence all confirmed live.

## Next actions
- [ ] **Manager's first sign-in** (`manager@example.com`) → replace demo data with real
      the design partner staff/hours/schedule. (This is the pilot going live.)
- [ ] **Repo → Reborn GitHub org** (Alex as admin) — unlocks Vercel auto-deploy-on-push
      (removes the manual CLI deploy step).
- [ ] **Custom SMTP** for Supabase Auth — built-in email is rate-limited/spam-prone.
- [ ] **Tighten RLS** to per-business membership before onboarding a 2nd business (currently
      "authenticated = full access" — safe only because of the 3-email allowlist + one business).
- [ ] Switch Supabase/Vercel billing to the LLC + EIN when the EIN arrives.
- [ ] Validate the **certification/keyhold wedge** (STRATEGY unmet-need #6) with the manager.
- [ ] Then Roadmap "NEXT" phase (STRATEGY §4): schedule broadcast + "seen" receipts, staff
      read-only view, time-off self-intake, shift-pickup.

## ⚠️ Environment note (this Mac)
Disk is chronically near-full (~5 GB free of 228). Full local `next build`s repeatedly filled
the volume and deadlocked the shell (even `Bash` output couldn't be written). **Use
`npx tsc --noEmit` to verify locally; let Vercel build in the cloud.** Keep `.next`, npm cache,
and Xcode DerivedData clear. If Bash starts failing with ENOSPC, free disk before continuing.

## Collaboration model (two vibe-coders, avoid collisions)

> **⚠️ READ FIRST (Kuhuk, Alex, and their Claude agents):** **ALWAYS `git pull` in your existing
> local clone BEFORE you start working each session** — not just before committing. Committing on
> a stale copy is what creates conflicts. Do NOT re-download the repo as a ZIP (no history; can
> clobber your work). Push small changes often.

- **Workflow:** commit + push **directly to `main`** (simple 2-person model). Pull before
  starting; push frequently. If a push is rejected: `git pull --rebase`, then push. Upgrade path
  if you start colliding: feature branches + PRs.
- **Divide by file/folder ownership**, not by lines in a shared file:
  - **Alex** → domain/product-truth: `src/domain/`, `src/components/{schedule,team,settings}/`.
  - **Kuhuk** → platform: `src/data/`, `src/auth/`, `src/app/`, `supabase/`, deploy.
  - **SHARED (heads-up first):** `src/lib/`, `src/domain/types.ts`, `src/components/ui/`, `src/export/`.
- Scope AI edits to named files ("edit X"), not "refactor the app." Review every diff before
  committing — agents silently reformat/rename.
- **Git hygiene:** your primary Claude assistant MAY commit/push to `main` when you explicitly
  ask. But **build/background sub-agents must NOT run git** (a nested `.git` once diverged another
  repo). No nested `.git`.
- Never commit secrets — `.env.local` (gitignored) + a checked-in `.env.example`.
