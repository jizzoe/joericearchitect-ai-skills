# Open Question Resolution

Explore may run with open questions and produce recommendations, but the runner
must never enter Propose (planning) with an open question the owner has not
explicitly resolved. This is a material human decision, not an objective fix.

## Presentation Contract

For every open question surfaced during Explore, present:

- **The question** in official terminology/jargon.
- **A plain-English translation and explanation** of what the question means in
  practice and why it matters.
- **The candidate options**, each with pros, cons, and tradeoffs.
- **A recommendation**, with the reasoning behind it.

Do not select an option, write a resolution, or proceed to Propose without the
owner's explicit answer.

## Approval and Recording

The owner resolves each question either by approving the runner's recommendation
or by supplying a different answer. The resolution MUST be durably recorded as
`owner-approved` (with a reference) before Propose. Record it in the OpenSpec
change's `design.md` "Open-question resolutions" section and, where a controller
record exists, in that record.

## Applies To

All production and prototype runs. A prototype profile does not bypass this
gate.
