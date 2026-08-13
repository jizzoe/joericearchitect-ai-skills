# Human Decision Classification

Classify every blocker or review finding before continuing. Severity describes
impact and does not alone decide whether to pause. Use durable
evidence and the active authorization; do not infer permission from a prior
chat message alone.

## Pause For Human Decision

Pause when progress requires:

- a missing or conflicting requirement, observable behavior, compatibility
  rule, architecture choice, data ownership rule, license obligation, security
  posture, or governance decision
- credential creation, rotation, scope changes, disclosure risk, or missing
  owner-controlled access
- destructive action such as repository deletion, hard reset, force-push of a
  shared branch, or deletion outside the approved recovery plan
- unexpected external target or mutation class
- unresolved dependency, dependency cycle, or shared-resource conflict
- durable state conflict where precedence is not established
- persistent environment, authentication, network, rate-limit, or tool failure
  that prevents safe progress
- exhausted correction budget for one failure signature

## Do Not Pause Solely For

Continue and correct when the finding is objective, scoped, and
behavior-preserving, such as:

- formatting, lint, type, schema, deterministic test, link, or generated
  exposure failures
- stale fixtures that can be regenerated from canonical source
- missing task evidence that can be produced without changing approved
  behavior
- review findings with a narrow fix and no new product decision
- blocker or high findings whose evidence supports a scoped,
  behavior-preserving objective fix inside the correction budget
- warnings that are explicitly accepted by the approved plan or verification
  evidence

## Finding Classes

- `objective-fix`: behavior-preserving correction is clear and bounded
- `human-decision`: material decision or missing authorization is required
- `warning`: known limitation or advisory issue that does not block the gate
- `false-positive`: finding is disproven by cited evidence
- `environment-impasse`: runtime or external service prevents safe progress
- `blocked`: correction budget or durable-state conflict prevents continuation

Every classification must identify the evidence, affected artifact or target,
and next action.
