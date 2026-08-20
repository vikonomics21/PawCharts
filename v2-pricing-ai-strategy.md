# PawChart V2 Pricing And AI Strategy

This note preserves the current V2 thinking around monetization, paywalls, and AI. It is future-facing strategy, not current private-beta implementation scope.

## Pricing Recommendation

- Free should support one pet and one owner with core profile setup, basic health records, reminders/routines, measurements, and limited private document storage.
- Plus should unlock the strongest household value: multiple pets, household sharing, expanded document storage, Lists & kits, public vaccination links, and broader care-routine usage.
- Suggested Plus launch price: `$5.99/mo` or `$49/year`. A later non-launch annual price could move closer to `$59/year` if retention and willingness-to-pay support it.
- AI should be optional at first, either as an add-on around `+$5/mo` or bundled into a Premium tier around `$9.99/mo` or `$89/year`.
- Keep AI additive rather than required. The core product should still work as a pet profile, records, routines, documents, and handoff tool without AI.

## Paywall Recommendation

- Paywall adding more than one pet first. It is easy to understand, maps to obvious incremental value, and avoids blocking the first successful setup.
- Put household sharing in Plus, but be careful not to block basic trust-building too early. Limited free handoff features or public vaccination links may help adoption if sharing becomes part of the user's first value moment.
- If only one feature can be paywalled first, choose multi-pet. Add household sharing to Plus once the free single-pet experience is clearly useful.

## AI Product Direction

- Position AI as pet-record intelligence, not diagnosis.
- Good AI jobs for PawChart:
  - answer questions from the pet's own profile, logs, and documents
  - summarize health history before vet visits
  - prepare Ask-the-vet cards from observations and records
  - identify patterns in observations, medication logs, weight, and measurements
  - summarize uploaded documents and bills
  - suggest app updates from chat or document content, with owner confirmation before saving
- Do not let AI diagnose, prescribe, recommend medication doses, or replace a veterinarian.
- AI-suggested writes must always use a review step such as `Here's what I found. Confirm before saving.`
- AI answers should cite the pet records or uploaded documents they used where practical.

## AI Usage Controls

- Do not offer unlimited AI in the first paid version.
- Use a credit model with monthly limits and daily caps.
- Possible credit weights:
  - normal pet-record question: `1 credit`
  - document summary or vet prep summary: `3-5 credits`
  - full pet report or broad history analysis: `5-10 credits`
- Plus can include a small teaser allowance, such as a few AI actions per month.
- AI add-on or Premium can include a larger monthly pool, such as roughly `100 credits/month`.
- Control costs with token caps, retrieval-based context instead of full-profile prompts, cached summaries, cheaper models for simple routing/summaries, and an `ai_usage_events` ledger.
- If users exceed included credits, show a clear limit state and later support paid top-ups only if demand justifies the complexity.

## Launch Notes And References

- Competitor pricing and AI/vendor pricing should be rechecked before final pricing launch because market pricing and model costs change.
- The current working benchmark is that comparable pet apps often sit around a few dollars per month or tens of dollars per year, while PawChart can justify higher value if it combines records, documents, household handoff, and planning.
- Stripe subscriptions, entitlement enforcement, AI retrieval, usage metering, and AI safety review are later implementation tracks.
