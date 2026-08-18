# Review Contract

## Activation and Non-Triggers

Activate for one bounded code, documentation, configuration, generated-asset,
or mixed change whose target, context, and existing evidence are explicit. Do
not activate for implementation, refactoring, approval, delivery, an unbounded
repository audit, test execution alone, formal OpenSpec Verify, or strict
independent review.

## Severity

- `blocker`: prevents the selected verification or delivery profile from
  passing.
- `high`: likely material correctness, security, or data-integrity impact.
- `medium`: credible defect or risk requiring follow-up.
- `low`: limited improvement.

## Disposition

- `objective-fix`: a separately authorized, behavior-preserving correction is
  clear and bounded.
- `human-decision`: material product, architecture, security, compatibility,
  licensing, governance, data-ownership, or scope judgment is required.
- `warning`: advisory risk that does not block the current gate.
- `false-positive`: cited evidence disproves the suspected defect.

Severity and disposition are separate fields. A low-severity finding can still
need a human decision, while a high-severity finding can describe an objective
defect but still blocks the selected profile until correction and rereview.

## Details Shape

`details` contains only:

- `assurance`: exactly `local-review`; this label is never independent,
  isolated, strict, production, approval, CI, test, or OpenSpec Verify evidence;
- `worker`: non-sensitive execution identity plus `sameSession: true`,
  `readOnly: true`, `canMutate: false`, and `canApprove: false`;
- `reviewedScope`: workspace-relative `targets`, `contextPaths`, and shared
  `evidenceIds`;
- `findings`: stable ID, severity, disposition, workspace-relative subject,
  evidence IDs, impact, and recommendation;
- `coverage`: review area, `reviewed`, `gap`, or `not-applicable` status, and
  evidence IDs;
- `standardsSelection`: selected rule IDs, scoped resolved overrides, and
  not-applicable rule IDs from the validated selection record; use empty arrays
  when stack-standard coverage is not requested;
- `evidenceGaps`: stable ID, subject, and reason; and
- `scopeSummary`: concise text.

Every finding evidence ID resolves to the top-level `skill-result-v1` evidence
array. Secret values, credential-bearing output, absolute paths, and upward
path traversal are invalid.

## Recovery

If review is interrupted, reread the bounded target, changed paths, context,
and current evidence. Discard conclusions whose subject or evidence changed.
Resume from the first incomplete review area and never apply a finding from the
review skill.
