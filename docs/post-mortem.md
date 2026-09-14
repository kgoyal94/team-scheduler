# ShiftLift — Post-Mortem

_Written September 2026, at shutdown. Author: Kuhuk (PM)._

ShiftLift was a shift scheduler for independent cafés, built around the observation that café
staff are not interchangeable — only some people can open, close, or hold keys. It went from
prototype to deployed production app in roughly three weeks, ran as a private beta with one real
restaurant, never acquired a paying customer, and was shut down deliberately.

It was killed by a pricing decision made before any code was written. This is that decision.

---

## Timeline

| When | What |
|---|---|
| Jul 2026 | Single-file React prototype, tailor-made for one independent restaurant |
| Jul 2026 | Productized: Next.js + Supabase + Vercel, magic-link auth, email allowlist |
| 17 Jul 2026 | Live in production, verified end-to-end (auth → bootstrap → persistence) |
| 20 Jul 2026 | List price set at $29/location/month, benchmarked against a competitor's $39.99 |
| Aug 2026 | Shipped rule overrides + time-boxed availability, persisted to Postgres |
| 8–23 Aug 2026 | Used by the design partner: real roster, 141 shifts over 7 weeks, four sessions |
| 23 Aug 2026 | Last write to the database. Use stops and never resumes |
| Sep 2026 | Shut down. Repo archived and opened |

Total cost: a few weeks of two people's evenings and about $10/month of infrastructure.
Total revenue: $0.

---

## The error

Our competitive analysis reported that 7shifts, the main café-native competitor, charged
**$39.99 per location per month**. So we priced at $29: clearly under the incumbent, clearly a
real tool rather than a toy, with room for a founding-partner discount without moving list price.

**$39.99 is a real 7shifts price. It is not the price of shift scheduling.**

7shifts is a payroll company. Scheduling is the product they give away to acquire the account.
Their scheduling tool is **free** for a single location, with a headcount cap comfortably above
every café in the beachhead we had chosen for ourselves. The $39.99 figure belonged to a fuller
plan built around payroll and labor compliance — a different product, a different buyer, a
different job.

The real anchor was **$0**. We spent three weeks building against a number that described
something we were not competing with.

## Why this kind of wrong is hard to catch

It was not a hallucination, and it was not laziness. Every fact in the analysis was verifiable.

The error lived in the **mapping between a vendor and a SKU**. "7shifts costs $39.99" is a true
sentence and a useless one, because a vendor is not a product. The question we needed answered
was *what would this café pay to do this job*. The question we got answered was *what does this
company charge*. Those are different questions, and the second one looks exactly like the first
in a well-formatted table.

Three things kept it invisible:

**It read well.** The document was organized, sourced, and confident. Polish is not accuracy,
but it feels like accuracy, and it suppresses the instinct to double-check.

**It confirmed what we wanted.** We wanted a number to undercut. $39.99 supplied one. Nobody
went looking for the number that would have said stop.

**It contradicted itself.** [`../STRATEGY.md`](../STRATEGY.md) §2 correctly names the real
default for these businesses as "Google Sheets + group texts." The monetization plan separately
flagged a competitor's genuinely useful free tier as the actual price competitor. Both true, both
written down in our own documents, both ignored — because the pricing section had already
produced a tidy answer. A long document can hold two incompatible conclusions without
complaining. A reader in a hurry keeps the convenient one.

## Why the differentiator couldn't save it

The certification and auto-certification engine was real. As far as we could tell no competitor
handled keyhold certification well, and the shadow-shift mechanic that auto-grants certification
is a nice piece of design. We were right that it was defensible. We were wrong about what
defensibility buys you, and wrong about whether anyone wanted it.

**A differentiator on top of a free commodity is a feature, not a business.** To a prospect
comparing options, we were a scheduler that costs $29 and does one extra thing, versus a
scheduler that costs $0 and already connects to their payroll. The extra thing has to be worth
more than the entire base product — to a business whose current alternative is a spreadsheet. It
was not close.

And the extra thing went unused. Of 141 shifts the design partner built, **two were
training/certification shifts.** The engine we based the whole wedge on, and intended to make the
paywall, was roughly 1% of what they actually did with the product. We planned to charge for the
feature our only real user ignored.

## What the usage did and did not tell us

The design partner did adopt it, for about two weeks: the real staff roster replaced the demo
data, 141 shifts across seven weeks were built in four sessions between 8 and 23 August, and the
last of those scheduled two weeks into the future. Overrides, time-off, and availability blocks
were all used. Then it stopped.

It is tempting to read that as encouraging. It is not, and the temptation is itself the mistake
worth recording: **usage is not willingness to pay.** A café using a free tool built to their own
specification, by a co-owner who works there, tells you the workflow is real. It tells you
nothing about whether anyone would pay $29 a month for it, and nothing at all about whether a
stranger would. Those are separate claims requiring separate evidence, and we only ever had
evidence for the first one.

The arm's-length version of the question did get asked, and it answered clearly: the
`/shiftlift-beta` signup page ran for roughly two months and received **zero signups.** No café
we were not related to ever asked for access, at any price, at zero friction.

## Five hypotheses we didn't need

When the pilot stalled, we wrote down five falsifiable explanations before interviewing anyone:
a setup cliff (the roster takes 45–90 minutes to enter before the first schedule exists); the
schedule isn't the artifact (the manager composes on paper, the tool is re-typing); staff don't
live in it (the team checks a photo in a group chat); wrong pain (call-outs and payroll hurt
more than building the schedule); and trust (publishing from an untrusted system is riskier than
paper).

Writing them down first was right, and it is the part of the process worth keeping. But all five
were **product** hypotheses, and the answer was a **market** answer. No amount of fixing
onboarding, adding a staff view, or building shadow mode changes the fact that the category
leader gives this away. When your diagnosis menu contains only product explanations, you will
pick one, and you will build it.

## The mistakes

- **We never checked the market leader's free tier.** Not its existence, not its limits, not
  whether our target customer fit inside them. Fifteen minutes of work, worth more than the
  entire build.
- **We never asked what our product was a loss leader for.** 7shifts can give scheduling away
  because scheduling is not their business. That single question ends the project in July.
- **We anchored on a competitor's price instead of on the customer's alternative.** Our own
  research named the customer's real alternative — a spreadsheet, which is free — and we
  benchmarked against a paid SKU anyway.
- **We treated a free tier as a growth lever instead of a price signal.** We designed our own
  free tier capped at 6 employees, *below* the size of every real café, while gating the
  certification engine behind payment. To a prospect that reads as a worse free scheduler. The
  competitor's free tier was not marketing; it was the market telling us the price.
- **We let build speed substitute for demand evidence.** Shipping in three weeks felt like
  validation. It validated that we could build, which was never the open question.

## What we got right

- **We shipped.** A real deployed product with auth, persistence, and a non-trivial rules engine,
  in weeks, with two people. The engineering thesis held.
- **We wrote falsifiable hypotheses before interviewing.** They were all wrong, and having
  written them down is precisely why that became visible instead of turning into a sprint.
- **We killed it cleanly.** The hosted app and database are gone, the domain is released, the
  repo is open, and the reasoning is written down where it can be reused.
- **The domain layer stayed pure**, which is why this reads as a portfolio artifact rather than
  a tangle of React and database calls.

## Transferable lessons

1. **Check the market leader's free tier against your target customer's size before writing
   code.** If free covers your beachhead, your price is zero, and you need a different beachhead
   or a different product.
2. **Ask who monetizes your product indirectly.** If a competitor treats your entire product as
   an acquisition cost, you are in a business-model fight. Features do not settle it.
3. **Prices attach to SKUs, not to companies.** "Vendor X charges $Y" should never survive into
   your reasoning without the plan name, what is included, and the URL.
4. **Anchor on the customer's alternative, not the competitor's price sheet.** For most small
   businesses that alternative is a spreadsheet and a group chat, and it costs nothing.
5. **Read your own strategy documents for self-contradiction.** Ours contained the correct answer
   in one section and the fatal one in another. The correct answer was two months old by the time
   we acted on it.
6. **Usage is not willingness to pay**, and a related party's usage is not even usage in the
   sense you care about. Separate "does this workflow work" from "will a stranger pay for it,"
   and get evidence for both.
7. **Measure whether anyone uses the feature you intend to charge for.** Ours was 2 of 141.

---

_Code, strategy, and the interactive demo are preserved in this repository. The product strategy
as it stood at its peak — including the pricing reasoning shown above to be wrong — is in
[`../STRATEGY.md`](../STRATEGY.md), unedited._
