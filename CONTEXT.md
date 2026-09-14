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
- **Ran as a private beta for ~5 weeks** with one real independent restaurant.
- **Revenue: $0.** List price was set at $29/location/month; no customer was ever billed.
- **Adoption: zero.** The design partner never entered their real staff data. The diagnosis
  that followed is the post-mortem.
- **Shut down 2026-09-14.** Cause was a market finding, not a product defect: the category
  leader gives single-location scheduling away free above our entire target segment's size,
  so willingness to pay was ~$0.

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
| Supabase project | **Deleted.** Database, schema, and auth users destroyed. |
| Vercel project | **Deleted.** |
| `shiftlift.app` domain | **Removed from Vercel.** Registration is third-party and expires on its own. |
| GitHub repo | **Public + archived**, kept as a portfolio artifact. |
| Interactive demo | `docs/index.html`, served via GitHub Pages. No backend. |

The app can no longer run against a live backend without provisioning a new Supabase project
and applying `supabase/migrations/`.
