# ShiftLift — Project Context

> **⚠️ ARCHIVED — September 2026.** This project is shut down. Nothing is running.
> This file is a final state record, not a living doc.

## What it was
**ShiftLift** — a café/restaurant shift-scheduling web app, and a
[Reborn Industries](https://rebornindustries.co) product. Began as a single-file React
prototype tailor-made for one independent restaurant design partner, then became a modular
Next.js app. Differentiator: café-native open/close/**keyhold certification** with
auto-certification from shadow shifts.

- Product overview + architecture → [`README.md`](README.md)
- Why it was shut down → [`docs/post-mortem.md`](docs/post-mortem.md)
- Product strategy as it stood (unedited, including the pricing call that was wrong) →
  [`STRATEGY.md`](STRATEGY.md)
- Code conventions → [`CLAUDE.md`](CLAUDE.md)
- Interactive demo (no backend) → [`docs/index.html`](docs/index.html)

## People
- **Kuhuk** — PM; product, platform, infrastructure.
- **Alex Law** — co-owner and domain expert; validated the workflow on the floor at the
  design-partner restaurant.

Both built with AI assistance. The ownership split that made two-person concurrent work
possible is documented in `CLAUDE.md`.

## Final status
- **Shipped and verified live 2026-07-17** — magic-link auth → server-side email allowlist →
  first-login bootstrap → Postgres persistence, all confirmed working in production.
- **Ran as a private beta** with one real independent restaurant.
- **Revenue: $0.** List price was set at $29/location/month; no customer was ever billed.
- **Adoption: real but brief.** Contrary to what we believed at the time, the design partner
  *did* adopt it — real roster entered, 141 shifts across 7 weeks built in four sessions
  between 2026-08-08 and 2026-08-23, scheduling up to two weeks ahead. Then use stopped dead
  and never resumed. Discovered only at teardown, from the production DB export.
- **The differentiator went unused:** 2 training/certification shifts out of 141.
- **Shut down 2026-09-14.** Cause was a market finding, not a product defect: the category
  leader gives single-location scheduling away free above our entire target segment's size,
  so willingness to pay was ~$0. The adoption discovery sharpened this rather than changing
  it — they used the free-commodity half and ignored the half we priced.

## What shipped
- Week + month schedule board with drag-to-move shifts
- Coverage model by shift type (`open` / `swing` / `close` / `full`), derived from store hours
- Per-employee certification (`canOpen` / `canClose`) as a hard scheduling constraint
- Auto-certification from completed `training` shadow shifts (the moat)
- Explainable suggestion engine — scored candidates with reasons, plus "ruled out, and why"
- Rule override with named conflict + captured reason + visible marking
- Per-employee weekly hour bounds, day availability, time-boxed availability blocks, time-off
- Excel export
- Magic-link auth behind a server-side email allowlist

## What was never built
Staff-facing read-only view · schedule broadcast + "seen" receipts · time-off self-intake ·
shift pickup · per-business RLS (policies were "authenticated = full access", safe only
behind the 3-email allowlist with a single tenant) · custom SMTP · self-serve billing ·
multi-tenancy · any iOS client.

## Teardown record (2026-09-14)
| Resource | Disposition |
|---|---|
| GitHub repo | **Public.** Kept as a portfolio artifact. |
| Interactive demo | `docs/index.html`, served via GitHub Pages. No backend, no data. |
| Production data | **Exported and preserved privately** before any teardown (real staff names — never published). |
| Supabase project | **Pending founder decision.** Still running; Pro-tier projects cannot be paused, so the choice is delete or keep. |
| Vercel project + `shiftlift.app` | **Pending** — held until the Supabase call is made. Domain registration is third-party and expires on its own. |

Nothing in this repository contains customer data: the demo runs on fictional staff and the
seeded demo set, and the real roster was never committed.
