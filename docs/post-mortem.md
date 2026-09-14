# ShiftLift — Post-Mortem

_Written September 2026, at shutdown. Author: Kuhuk (PM). Design partner and co-owner: Alex Law._

ShiftLift was a shift scheduler for independent cafés, built around the observation that
café staff are not interchangeable — only some people can open, close, or hold keys. It went
from prototype to deployed production app in roughly three weeks, ran as a private beta with
one real restaurant, never acquired a paying customer, and was shut down deliberately.

This is what happened and what it cost us to learn.

---

## Timeline

| When | What |
|---|---|
| Jul 2026 | Single-file React prototype, tailor-made for one independent restaurant |
| Jul 2026 | Productized: Next.js + Supabase + Vercel, magic-link auth, email allowlist |
| 17 Jul 2026 | Live in production, verified end-to-end (auth → bootstrap → persistence) |
| 20 Jul 2026 | List price set at $29/location/month |
| Aug 2026 | Shipped rule overrides + time-boxed availability, persisted to Postgres |
| 21 Aug 2026 | Adoption diagnosis run — five weeks live, real data still not entered |
| Sep 2026 | Shut down. Repo archived and opened; hosted app and database torn down |

Total cost: a few weeks of two people's evenings and about $10/month of infrastructure.
Total revenue: $0.

---

## The signal

The product was live and working for five weeks, and our design partner never put their real
team into it.

That partner is the most motivated customer this product could ever have had: a co-owner of
the project who also works at the restaurant, with the prototype built to their own workflow.
If adoption fails there, the variable isn't the tool.

What made it sharper: **they already owned a competing scheduler, and weren't using that
either.** Two scheduling tools, zero adoption, at one restaurant. Whatever was defeating
adoption was defeating scheduling software generically at that business, not defeating *us*.

## Five hypotheses

Before running the diagnosis we wrote down what could be true, and what observation would
separate the cases — so the session couldn't be talked into confirming whatever we hoped.

| # | Hypothesis | If true, the fix |
|---|---|---|
| H1 | **Setup cliff.** 10–15 employees × availability × hour bounds = 45–90 minutes of data entry *before the first schedule exists*. | Yield a usable schedule from near-zero input: import last week's schedule, infer availability, let constraints accrete. |
| H2 | **The schedule isn't the artifact.** The manager composes it on paper or in their head; the tool is pure re-typing. | Capture, don't compose. Check and distribute a schedule they made. |
| H3 | **Staff don't live in it.** The team checks a photo in a group text, so a second system is duplicate work with no payoff. | Staff-facing view + broadcast becomes P0, not P1. |
| H4 | **Wrong pain.** Schedule-building is ~40 min/week and tolerable. The real weekly pain is call-outs or payroll. | Repoint at the pain they actually name. |
| H5 | **Trust / stakes.** Publishing from an untrusted system is riskier than paper. | Shadow mode: validate their schedule before asking to own it. |

H1 was the prior, and it applied to ShiftLift exactly as built — first login seeded demo data
the manager had to replace by hand.

**All five were product hypotheses. The answer was none of them.**

## What we actually found

Three findings, in increasing order of how much they mattered.

**1. The incumbent tool went unused for a reason that has nothing to do with features.** A
scheduler that validates hours against labor rules produces a written record of every place a
small operator is out of compliance. A tool that documents your exposure is a tool you stop
opening. This is worth sitting with, because our own roadmap treated rule-validation as a
selling point — and for at least some of this segment, automated compliance checking is an
*anti*-feature. It creates evidence.

**2. The real competitor was never the incumbent software.** It was paper, a spreadsheet, a
group text, and the manager's memory. Free, zero setup, never breaks, works offline. Our
competitive analysis had already written this down in plain language — "the real default:
Google Sheets + group texts" — and we benchmarked pricing against a software competitor
anyway.

**3. The price of scheduling in this segment is zero.** The category leader gives scheduling
away free for up to 30 employees at one location. Every café in our stated beachhead is
smaller than that cap. A second major competitor also gives it away. They can, because
scheduling is their acquisition wedge for payroll and POS — the products that actually earn.

Finding 3 is the one that ends the project.

## Why the differentiator wasn't enough

The certification and auto-certification engine was real. As far as we could tell no competitor
handled keyhold certification well, and the shadow-shift mechanic that auto-grants certification
is genuinely a nice piece of design. We were right that it was defensible.

We were wrong about what defensibility buys you.

**A differentiator layered on top of a free commodity is a feature, not a business.** To a
prospect comparing options, we were a scheduler that costs $29 and does one extra thing, versus
a scheduler that costs $0 and is already integrated with their payroll. The extra thing has to
be worth more than the entire base product is worth — to a business whose alternative is a
spreadsheet. It wasn't close.

The structural problem: competitors monetize scheduling *indirectly*. We had nothing to upsell
into, so scheduling had to carry the whole price. You cannot win a price war against a company
for whom your entire product is a loss leader.

## The mistakes

- **We priced against the wrong anchor.** We benchmarked $29 against the incumbent's paid tier
  ($39.99) when the relevant anchor for our own stated beachhead was $0. We had written down the
  correct answer and then ignored it.
- **One unwritten check would have caught it.** "What does the free tier of the market leader
  actually include, and is it bigger than our target customer?" That is fifteen minutes of
  research. It was worth more than the entire build.
- **We treated a free tier as a growth lever instead of reading it as a price signal.** We
  designed a free tier capped at 6 employees — *below* the size of every real café — while
  gating the certification engine behind payment. To a prospect that reads as a worse free
  scheduler. The competitor's free tier wasn't marketing; it was the market telling us the price.
- **We let build speed substitute for demand evidence.** Shipping in three weeks felt like
  validation. It validated that we could build, which was never the open question.

## What we got right

- **We shipped.** A real deployed product with auth, persistence, and a non-trivial rules
  engine, in weeks. The engineering thesis held.
- **We ran the failure as a diagnosis, not a feature gap.** The reflex when a pilot stalls is
  to add features. Writing down five falsifiable hypotheses first, and holding the honest row —
  *"if they can't articulate why they didn't adopt a free, already-built, purpose-made tool,
  that is a segment finding, not a product finding"* — is what let the market answer surface
  instead of getting buried under a sprint.
- **We killed it cleanly.** Nothing is half-running. The hosted app and its database are torn
  down, the repo is archived and opened, and the reasoning is written down where it can be
  reused.
- **The domain layer stayed pure**, which is why it's still readable as a portfolio artifact
  rather than a tangle of React and database calls.

## Transferable lessons

1. **Check the market leader's free tier against your target customer's size before writing
   code.** If free covers your beachhead, your price is zero and you need a different beachhead
   or a different product.
2. **Ask who monetizes your product indirectly.** If a competitor treats your whole product as
   an acquisition wedge, you are not in a feature fight, you are in a business-model fight, and
   features won't settle it.
3. **When your own research names the real alternative, price against *that*.** Ours said
   "spreadsheet and group texts." A spreadsheet costs nothing.
4. **A design partner's adoption failure is data, and a related party's is the loudest data
   you will get.** Highest possible motivation is a ceiling, not a baseline. If it doesn't work
   there, it will not work with a stranger.
5. **Compliance automation can be an anti-feature.** For small operators, a tool that documents
   violations creates liability where none was written down. Sell the outcome, not the audit.
6. **Distinguish the two yeses.** A design partner's yes proves the workflow. Only an
   arm's-length customer's invoice proves the business. We never got the second one, and we
   should have gone looking for it before building the first.

---

_Code, strategy, and the interactive demo are preserved in this repository. The product
strategy as it stood at its peak — including the pricing reasoning shown above to be wrong —
is in [`../STRATEGY.md`](../STRATEGY.md), unedited._
