# ShiftLift

**A shift scheduler for independent cafés that understood who can open, close, and hold keys.**

Built, shipped to production, run as a private beta with a real restaurant — and then shut
down deliberately when the pricing floor turned out to be zero. The code, the strategy, and
the post-mortem are all here.

> **Status: archived (September 2026).** No longer developed, no longer sold. The interactive
> demo below runs entirely client-side and needs no backend.

### ▶ [Try the interactive demo](https://kgoyal94.github.io/team-scheduler/)

Runs entirely in your browser on seeded demo data — drag shifts between days, watch the
coverage gaps and hour violations update live, open the suggestion engine, export to Excel.
Nothing to install, no sign-up, no server.

---

## What it looked like

**The schedule board** — a week of coverage, with staffing gaps and hour-limit breaches
surfaced as you build:

![Week view of the schedule board](docs/screenshots/schedule-week.png)

**Team & rules** — the constraints that drive suggestions: weekly hour bounds, flexibility,
day availability, time-off, and the open/close certifications:

![Team and rules editor](docs/screenshots/team-rules.png)

**Business settings** — store hours per day generate the shift templates, so coverage needs
are derived rather than hand-entered:

![Business settings editor](docs/screenshots/business-settings.png)

---

## The idea

Most scheduling tools treat employees as interchangeable hours. Cafés don't work that way:
**only some people can open, only some can close, and only some hold keys.** Put the wrong
person on a Tuesday open and the store doesn't open.

ShiftLift made certification a first-class scheduling constraint:

- **Coverage by shift type** — `open`, `swing`, `close`, and `full` (open+close in one). Store
  hours in Business Settings generate each day's needs; unmet needs show as gaps.
- **Certification-aware assignment** — an employee carries `canOpen` / `canClose`. Uncertified
  staff can't be assigned to those slots, and the board says so.
- **Auto-certification from shadow shifts** — the differentiator. A `training` shift that
  shadows a real open or close doesn't count toward coverage, but completing it automatically
  grants the certification. Training a new closer became a scheduling action rather than a
  spreadsheet someone forgets to update.
- **Explainable suggestions** — `rankCandidates` returns scored candidates *with reasons*,
  plus an explicit "ruled out, and why" list. The manager sees the reasoning, not a black box.
- **Override with a paper trail** — any rule can be overridden, but the conflict is named, a
  reason is captured, and the shift is marked.
- **Hour bounds** — per-employee weekly min/max drive under/over flags and candidate ranking.
- **Excel export** — because the schedule still had to get printed and taped to a wall.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Data + auth | Supabase (Postgres + magic-link Auth), server-side email allowlist |
| Hosting | Vercel (git-connected, auto-deploy on `main`) |
| Styling | Inline styles over a design-token object (`src/lib/tokens.ts`) — no Tailwind |
| Export | `xlsx-js-style` |

The architecture's one firm rule: **`src/domain/` is pure.** No React, no Supabase, no I/O —
just functions over plain data. Coverage math, the rules engine, and the certification logic
live there and are independently readable. UI and data layers import from domain, never the
reverse. That constraint existed for a human reason: two people were building this at once,
and a pure domain layer is what let them work without colliding.

```
src/
├── app/           # Next.js routes, auth callback, middleware
├── components/    # schedule/ · team/ · settings/ · ui/
├── domain/        # PURE logic: coverage, rules, training, time
├── data/          # Supabase persistence, one module per entity
├── export/        # Excel workbook builder
└── lib/           # design tokens, constants
supabase/migrations/
docs/index.html    # the original single-file prototype → now the demo
```

## Running it

The demo needs nothing. The full app needs a Supabase project:

```bash
npm install
cp .env.example .env.local   # add your Supabase URL + anon key
npm run dev
```

First sign-in bootstraps a demo business with five employees and a seeded week.

---

## Why it was shut down

It died on a pricing error that was made before any code was written, and the error came out of
a competitive analysis that was almost entirely correct.

The analysis said the main café-native competitor, 7shifts, charged **$39.99 per location per
month**. We set our list price at $29 to undercut it. That reasoning held up through months of
review.

$39.99 is a real 7shifts price. It is not the price of shift scheduling.

7shifts is a payroll company, and scheduling is what they give away to win the account. Their
scheduling product is **free** for a single location, with a headcount cap comfortably above
every café in our stated beachhead. The $39.99 belonged to a fuller, payroll-centric plan — a
different product, for a different buyer, solving a different problem.

So the real comparison was never $29 against $39.99. It was **$29 against $0**, from a
better-known vendor, for the customer we had specifically chosen to target.

There is no version of that fight we win. Not with a better certification engine, not at $19,
not at $9. When a competitor hands out your entire product to acquire a customer for something
else, you are not in a feature fight — you are in a business-model fight, and features do not
settle it. We had no adjacent product to upsell into, so scheduling had to carry the whole
price, against a company for whom it was a coupon.

The failure mode is worth naming precisely, because it was not a hallucination and not
laziness. Every individual fact in that analysis was verifiable. The error lived in the
**mapping between a vendor and a SKU**: "7shifts costs $39.99" is a true sentence and a useless
one. The question we needed answered was what this café would pay to do this job, and we
accepted an answer to what this company charges.

It was also self-contradicting, and we missed that too. Elsewhere in [`STRATEGY.md`](STRATEGY.md)
the same analysis correctly names the real default as "Google Sheets + group texts," and flags a
competitor's free tier as the actual price competitor. Both true, both written down, both
ignored, because the pricing section had already produced a tidy number. A long document can
hold two incompatible conclusions without complaining; a reader in a hurry keeps the convenient
one.

What we got right, and wrong:

- **Right:** we shipped a real, working, deployed product in weeks instead of months. The
  engineering thesis held.
- **Right:** when it stalled, we treated it as a market question rather than a missing-features
  question. More features would have buried the finding.
- **Wrong:** we never checked what the market leader's *free* tier actually included, or measured
  it against the size of our target customer. That is fifteen minutes of work, and it was worth
  more than the entire build.
- **Wrong:** we never asked what our product was a loss leader *for*. The answer would have
  ended the project in July.

The full write-up is in [`docs/post-mortem.md`](docs/post-mortem.md). The product strategy as
it stood — competitive landscape, blue-ocean analysis, roadmap — is preserved unedited in
[`STRATEGY.md`](STRATEGY.md), including the pricing reasoning that turned out to be wrong.

## Credits

Built by [Kuhuk Goyal](https://github.com/kgoyal94) and Alex Law — product/platform and
domain expertise respectively. A [Reborn Industries](https://rebornindustries.co) project.

## License

MIT — see [LICENSE](LICENSE).
