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
| 8–23 Aug 2026 | **Actually used.** Real roster entered; 141 shifts across 7 weeks built in four sessions |
| 21 Aug 2026 | Adoption diagnosis run — on the mistaken belief that real data had never been entered |
| 23 Aug 2026 | Last write to the database. Use stops and never resumes |
| Sep 2026 | Shut down. Repo archived and opened |

Total cost: a few weeks of two people's evenings and about $10/month of infrastructure.
Total revenue: $0.

---

## The signal

> **⚠️ Correction, recorded at teardown (September 2026).** The diagnosis below was run on
> 21 August 2026 on the belief that our design partner had never entered their real data. **That
> was wrong.** When the production database was exported immediately before teardown, it showed
> the real staff roster in place and 141 shifts covering seven weeks, written across four
> sessions between 8 and 23 August — 51 of them created *on 21 August*, the day the diagnosis
> was written. We diagnosed a non-adoption that had, by then, already turned into adoption.
>
> We never checked the database. The whole premise was inferred from the fact that nobody told
> us they'd started. The corrected reading is below, and it is a sharper finding than the one we
> thought we had.

The product was live for about five weeks before anything happened, and then it *was* used —
for roughly two weeks, and then not again.

What the export actually showed:

- The real staff roster entered, replacing the seeded demo employees
- 141 shifts across 7 weeks, built in four working sessions (8, 19, 21, 23 August)
- Forward planning — the last session scheduled two weeks into the future
- Rule overrides used 6 times; 7 time-off entries; availability blocks used
- **Training/certification shifts: 2 out of 141**
- Last write 23 August. Nothing after. Three weeks of silence, then shutdown.

That last-but-one line is the finding. **The certification engine was the differentiator, the
moat, and the sole justification for charging $29 — and it accounts for 1.4% of what they
built.** They used us as a plain scheduler. The part we thought we were selling, they barely
touched.

That partner was also the most motivated customer this product could ever have had: a co-owner
of the project who also works at the restaurant, with the prototype built to their own workflow.
Real usage there is a much weaker signal than it looks, for the same reason a "yes" from them
would have been — and the usage still stopped.

What made it sharper: **they already owned a competing scheduler, and weren't using that
either.** Two scheduling tools, neither retained, at one restaurant.

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

**All five were product hypotheses. The answer was none of them** — and we now know H1 was
actively false: somebody did climb the setup cliff, entered the whole roster, and built seven
weeks of schedules. The cliff wasn't what stopped this.

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

We were wrong about two things: whether anyone wanted it, and what defensibility buys you.

**Whether anyone wanted it** is settled by the export. Two training shifts in 141. The one real
user we ever had, building seven weeks of real schedules, reached for the moat twice. A
differentiator nobody exercises is not a differentiator; it's an opinion we held about their
workflow. We had five weeks of live production telemetry available to tell us this at any point
and never looked — we were waiting to be told how it was going instead of reading the database.

**A differentiator layered on top of a free commodity is a feature, not a business.** To a
prospect comparing options, we were a scheduler that costs $29 and does one extra thing, versus
a scheduler that costs $0 and is already integrated with their payroll. The extra thing has to
be worth more than the entire base product is worth — to a business whose alternative is a
spreadsheet. It wasn't close.

The structural problem: competitors monetize scheduling *indirectly*. We had nothing to upsell
into, so scheduling had to carry the whole price. You cannot win a price war against a company
for whom your entire product is a loss leader.

## The mistakes

- **We never read our own database.** This is the worst one, because it was free. We had a
  production Postgres with every shift, every override, and every timestamp in it, and we ran a
  qualitative adoption diagnosis on an *assumption* about whether data had been entered — an
  assumption a single `select count(*)` would have falsified. We only looked at teardown, to
  check whether it was safe to delete. Everything in "What we actually found" was sitting there
  for five weeks.
- **We treated silence as a signal.** Nobody told us they'd started using it, so we concluded
  they hadn't. Users don't send status reports. Instrumentation exists because absence of news
  is not information.
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
- **We ran the stall as a diagnosis, not a feature gap.** The reflex when a pilot stalls is to
  add features. Writing down five falsifiable hypotheses first, and holding the honest row —
  *"if they can't articulate why they didn't adopt a free, already-built, purpose-made tool,
  that is a segment finding, not a product finding"* — is what let the market answer surface
  instead of getting buried under a sprint. The hypotheses were all wrong, but having written
  them down is why we noticed that.
- **We checked the database before deleting it.** A small thing that turned out to matter: the
  export done as a pre-deletion safety step is what corrected this entire document. The
  shutdown reasoning survived; the narrative around it did not.
- **The domain layer stayed pure**, which is why it's still readable as a portfolio artifact
  rather than a tangle of React and database calls.

## Transferable lessons

1. **Read your own production data before you interview anybody.** Qualitative research is for
   explaining behaviour you've already measured, not for guessing at behaviour you could have
   queried. We inverted that and spent a diagnosis session on a premise that was false.
2. **Measure whether anyone uses the feature you're charging for.** Not whether they like it,
   not whether it demos well — whether it appears in their data. Ours appeared twice.
3. **Check the market leader's free tier against your target customer's size before writing
   code.** If free covers your beachhead, your price is zero and you need a different beachhead
   or a different product.
4. **Ask who monetizes your product indirectly.** If a competitor treats your whole product as
   an acquisition wedge, you are not in a feature fight, you are in a business-model fight, and
   features won't settle it.
5. **When your own research names the real alternative, price against *that*.** Ours said
   "spreadsheet and group texts." A spreadsheet costs nothing.
6. **A related party's usage is a ceiling, not a baseline.** Highest possible motivation, a
   product built to their own workflow, a co-owner on the floor — and it still churned in two
   weeks. What a design partner does is the best case, not the expected case. Read their
   *churn* as the loud signal, not their trial.
7. **Compliance automation can be an anti-feature.** For small operators, a tool that documents
   violations creates liability where none was written down. Sell the outcome, not the audit.
8. **Distinguish the two yeses.** A design partner's yes proves the workflow. Only an
   arm's-length customer's invoice proves the business. We never got the second one, and we
   should have gone looking for it before building the first.

---

_Code, strategy, and the interactive demo are preserved in this repository. The product
strategy as it stood at its peak — including the pricing reasoning shown above to be wrong —
is in [`../STRATEGY.md`](../STRATEGY.md), unedited._
