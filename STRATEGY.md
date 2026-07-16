# Team Scheduler — Product Strategy

_Last updated: 2026-07-16. Owner: Kuhuk (PM). Design partner: the design partner (Alex Law)._

This doc is the strategic source of truth: MVP launch path, competitive landscape,
blue ocean analysis, and prioritized roadmap. `CONTEXT.md` is the operational/living
doc (current state, who's doing what). Keep them in sync.

---

## 0. Snapshot

- **Product:** "Shift Board" — a shift-scheduling tool, currently a single-file React
  prototype (`shift-board.html`) tailor-made for **the design partner** restaurant.
- **Trial customer / design partner:** the design partner (Alex Law is repo owner + a CC employee).
- **Long-term goal:** productize for independent cafés/restaurants.
- **Platform decision:** **Web first** (not iOS) — see §1.
- **MVP scope decision:** Fast (2–3 weeks), **manager-only**, persist + deploy the
  existing prototype with no new user-facing features.
- **Target market:** start with single-location indie cafés/restaurants; expand within
  F&B; treat small 2–5 location groups as the ceiling. **Chains/franchise = out of scope
  (a trap — see §4).**

---

## 1. the design partner MVP Launch Path (Web, 2–3 weeks, manager-only)

### One-sentence strategy
Don't build features — **make the prototype real**: give it a saved home, put it online,
and lock it behind a login, changing nothing a user sees.

### Why web, not iOS (decided)
| Factor | Verdict |
|---|---|
| Existing code | Already React — a web deploy reuses ~100% of it; iOS is a rewrite |
| Who uses it | A **manager** building a schedule at a counter/laptop — a desk task |
| Core output | A Google Sheets `.xlsx` export — inherently desktop/web |
| Speed | No App Store review; ship fixes same-day |
| When iOS earns its place | Only when **staff-facing self-service** ships — staff live on phones |

### The gap between "prototype" and "usable daily"
The prototype has exactly three blockers to daily use — and they are the whole MVP:
1. **No persistence.** All state is React `useState`; a refresh wipes everything. #1 job.
2. **Not a real build.** React + Babel compile in-browser from CDN — demo-only, fragile.
3. **No login.** It's an open HTML file; needs a basic gate to live at a URL.

What is **already done and good** (preserve untouched): the rules engine, drag-and-drop,
coverage flags, auto-certification, weekly-hours tracking, and the styled two-tab Excel export.

### Recommended build
**Stack:** Next.js + Supabase + Vercel (persistence + auth in one move; one-command deploy).

| Phase | Work | Est. |
|---|---|---|
| 1. Port to a real build | Move the React into a Next.js app; drop CDN/Babel. No behavior change. | 2–3 days |
| 2. Persistence | Supabase tables: `employees`, `shifts`, `settings`, `business` (single tenant). Load-on-mount + save-on-change. Keep seed data as one-time bootstrap. | 3–5 days |
| 3. Auth | Supabase Auth, single manager login (magic link). No multi-tenant yet. | 1–2 days |
| 4. Deploy + harden | Vercel deploy, subdomain, confirm `.xlsx` export in prod, test on manager's real browser. | 1–2 days |
| 5. CC onboarding | Load real staff/hours/time-off; build one real weekly schedule with the manager. | 2–3 days |

**Explicitly deferred (do NOT build now):** staff logins, notifications/SMS, shift swapping,
time clock, labor cost, payroll, multi-location, mobile app. Each is a *productization*
decision the blue ocean analysis should inform.

**Most important thing:** persistence is the entire ballgame. If the timeline slips, cut
auth to a shared password before you cut persistence.

---

## 2. Competitive Landscape (9 tools, July 2026)

Prices per-location/month unless noted; approximate.

| Camp | Tools | Entry price | Really for | Catch for an indie café |
|---|---|---|---|---|
| Enterprise restaurant | HotSchedules/Fourth, Push Operations | Quote-only, ~$500+ setup | 50+ staff, chains | 12-mo contracts, vendor onboarding; **HotSchedules charges *staff* $2.99 for the app** |
| Restaurant-native mid | 7shifts, Sling (Toast-owned) | 7shifts free→$40+; Sling free→$2/user | 1–8 locations | 7shifts pricey per-location; **Sling eroding into Toast POS** |
| Horizontal SMB | When I Work, Homebase, Deputy, Connecteam | $0 (Homebase/Connecteam)→$2.50–5/user | All hourly industries | **Per-location cliffs**, add-on stacking, $30 minimums, feature gating |
| POS-bundled | Square Team, Toast Scheduling | Free + $35/loc; Sling Lite free | Businesses on that POS | Captive to POS; hardware lock-in, auto-renewing contracts |
| Honest baseline | Schedulefly; the real default: **Google Sheets + group texts** | $30 flat / free | Anti-bloat indies | Schedulefly: dated UI, weak app, no integrations |

**Consistent complaints everywhere:** pricing that punishes the smallest and the growing
(per-seat metering, per-location cliffs, minimum floors), bait-and-switch feature gating,
upsell nagging, unreliable shift notifications, billing/cancellation that feels like a trap.

---

## 3. Blue Ocean Analysis

### The seven unmet needs (from real owner complaints)
1. Reliable schedule broadcast with **"seen" confirmation** (most-cited daily pain)
2. Self-serve **call-out coverage** (on-call list + one-tap "post for pickup")
3. **Flat, transparent pricing + frictionless cancel**
4. Deliberate **"just scheduling" simplicity** (no payroll/forecasting/HR upsell)
5. **Availability + time-off in one place**
6. **"Who's qualified to open / close / keyhold"** tagging — _no incumbent does this well_
7. Simple **overtime / hours-cap warnings** (no enterprise analytics)

### Critical insight: the prototype already wins the hardest-to-copy need
Need #6 is unmet by every competitor — and the prototype **already has it, more deeply than
anyone on the market**:
- Open/Swing/Close coverage modeled from **store hours** (café-native, not generic "shifts")
- Per-person `canOpen`/`canClose` as a **first-class scheduling constraint**
- **Auto-certification**: a completed shadow/training shift auto-grants open/close ability —
  _not found anywhere else in the market_
- An **explainable rules engine** ("ruled out because…") — transparency no incumbent offers

Reframe: this is not a worse 7shifts. It's **"the scheduler that knows who can run your café."**

### Four Actions Framework
- **Eliminate:** per-seat & per-location metering; POS/payroll lock-in; paid employee app;
  contracts & cancellation friction; enterprise forecasting/HR/ATS.
- **Reduce:** onboarding time (<10 min); analytics depth; total feature surface; config burden.
- **Raise:** notification reliability + "seen" receipts; scheduling transparency; pricing
  clarity; café-shaped defaults.
- **Create:** auto-certification from shadow shifts; open/close/keyhold as a coverage
  constraint; explainable suggestions; flat size-banded pricing with one-click cancel.

### Value innovation
Differentiation (café-native certification intelligence — cheap to keep, already built) **and**
low cost (deliberately not building forecasting/payroll/HR bloat) at the same time.

---

## 4. Roadmap & Growth Path

### Growth-path answer: go DEEP in F&B, do NOT climb toward chains
```
Beachhead          Adjacent expansion       Natural upsell          TRAP — avoid
─────────          ──────────────────       ─────────────           ────────────
Single-location    Other single-location    2–5 location small      Chains / franchise
indie cafés  ──►   F&B (bars, bakeries, ──► groups (flat multi- ──╳  (HotSchedules/Fourth
(the design partner)    quick-serve)             loc pricing = wedge       territory)
                                            vs Homebase's cliff)
```
Climbing to chains means competing on forecasting, POS depth, and enterprise compliance —
the exact features being eliminated. It refills your own blue ocean. Small groups are the
ceiling, and an opportunity (where Homebase's per-location pricing enrages owners).

### Roadmap (Now / Next / Later)

**NOW — "Make the prototype real"** (weeks 1–3): §1. Ship nothing new. Also **validate need #6**
at zero build cost — watch whether the CC manager actually leans on "who can open" + auto-cert.

**NEXT — productization wedge** (post-validation, ~weeks 4–10), cheapest-differentiating-first:

| Priority | Feature | Need | Why this order |
|---|---|---|---|
| P0 | Reliable schedule broadcast + "seen" receipts (SMS/push) | #1 | Top daily pain; already store phone numbers, send nothing |
| P0 | Staff read-only schedule view (link or login) | prereq | Unlocks #1/#2/#5; first staff surface → **iOS becomes worth considering here** |
| P1 | Time-off + availability self-intake | #5 | Removes sticky-note chaos; small build on existing model |
| P1 | One-tap "post shift for pickup" + call-out coverage | #2 | Owner stops being last resort |
| P2 | Lean the certification story into marketing | #6 | The moat — make it the headline |

**LATER — expansion enablers:** multi-location (flat-priced, anti-Homebase), light labor-cost %,
simple OT warnings (#7) — each only when a paying segment pulls for it.

**NEVER (guardrails that protect the blue ocean):** deep demand forecasting, native payroll,
HR/ATS, POS lock-in, per-seat/per-location-cliff pricing, employee app fees, annual contracts.

### Business model
Flat, size-banded, month-to-month, one-click cancel (the model Schedulefly is praised for).
Anchor ~**$29–39/mo flat for a ≤15-staff single location**; genuinely usable free tier for
tiny teams (≤5 staff) as top-of-funnel. Never meter per employee.
