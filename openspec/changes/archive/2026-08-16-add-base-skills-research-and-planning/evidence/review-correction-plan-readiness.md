# Strict review correction: plan readiness rendering

The strict isolated review record `strict-10222216-3698-42a2-b96f-d0b4e5da8ba9`
identified two objective omissions in
`scripts/sdd/research-planning-skill-runtime.mjs`.

- Empty dependency, hazard, parallel-work, evaluation, and guardrail lists
  now mean a known absence rather than an invalid candidate. They render as
  explicit `None supplied` entries. Acceptance evidence remains mandatory.
- A candidate that satisfies the readiness contract now renders
  `Readiness: Propose-ready.` when the selected next action is OpenSpec
  Propose, while preserving `proposed` for identifiers that have not been
  created.

`evals/skills/sdd-requirements-to-plan/run-fixtures.test.mjs` adds an
executable dependency-free candidate case. It verifies both the explicit
empty-list rendering and the per-candidate Propose-ready label.

This is a behavior-preserving completion of the delta-spec readiness contract.
A new immutable package and strict isolated review are required for the
corrected head.
