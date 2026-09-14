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
- **Shut down 2026-09-14 on a pricing error, not a product defect.** Our competitive analysis
  reported 7shifts at **$39.99/location/month** and we priced $29 to undercut it. That figure
  belonged to a different, payroll-centric plan; **7shifts gives scheduling away free** for a
  single location, above the size of every café in our stated beachhead. The real anchor was
  **$0**. Details → [`docs/post-mortem.md`](docs/post-mortem.md).
- **Arm's-length demand: zero.** The `/shiftlift-beta` page ran ~2 months and got **0 signups**.
- **Adoption: real but brief, and it proved nothing about price.** The design partner did use it
  — real roster, 141 shifts over 7 weeks, four sessions 2026-08-08 → 2026-08-23 — then stopped.
  That validates the workflow only. Usage by a related party on a free tool is not willingness
  to pay.
- **The feature we intended to charge for went unused:** 2 training/certification shifts of 141.

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
| Production data | **Exported and preserved privately** before teardown (real staff names — never published). |
| Supabase project | **Deleted.** Database, schema and auth users destroyed (Pro-tier projects cannot be paused, so delete was the only way to release it). |
| Vercel project | **Deleted.** |
| `shiftlift.app` | **Released** from Vercel; now 404s. Third-party registration left to lapse — do not renew. |
| Marketing presence | Removed from the rebornindustries.co showcase; the beta signup page is gone. |

Nothing in this repository contains customer data: the demo runs on fictional staff and the
seeded demo set, and the real roster was never committed.
