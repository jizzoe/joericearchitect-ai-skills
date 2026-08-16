# Independent review correction: bind design-brief approval to its owner

- Review record: `strict-d1b3dc9c-ef72-40a9-830d-55cc04e3a717`
- Reviewed head: `2479b6a98481277a6b5671645059846ba331ec17`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Failure signature: `independent-review/high/design-brief-approval-owner-binding`
- Disposition: objective fix
- Correction attempt: 1 of 3 for this failure signature

The canonical skill already required approval evidence to name a decision
owner, but the runtime only required a non-empty `approvedBy` value. The
runtime now requires an explicit `designBriefDecisionOwner` and accepts the
approval only when `approvedBy` exactly matches it. The fixture suite now
proves that an approval attributed to an unrelated identity pauses planning.

A fresh strict-isolated review is required after this correction.
