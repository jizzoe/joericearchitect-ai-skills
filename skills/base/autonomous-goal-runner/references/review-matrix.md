# Review Matrix

Every batch and lifecycle transition needs evidence proportional to the
changed behavior.

## Shared Review Checklist

Both the implementer self-review and the independent reviewer use the same
canonical checklist. Check each dimension and report findings in every one:

- correctness and spec compliance (every requirement and scenario)
- edge cases, error handling, and failure recovery
- security, secret handling, and untrusted input
- concurrency, idempotency, and durable-state precedence
- portability and attribution (no product constants, license/source noted)

## Self-Review Pre-Flight

Before invoking the independent reviewer, the implementer runs this same
checklist against its own diff and fixes what it finds. In later rounds it also
verifies the prior fix resolved its finding and checks for regressions.

## Required Evidence Classes

| Evidence | Required when | Examples |
|---|---|---|
| Task-specific tests or evals | behavior, scripts, fixtures, adapters, or workflows change | `node --test`, fixture assertions |
| OpenSpec validation | OpenSpec artifacts or spec-covered behavior change | `openspec validate <change> --strict` |
| Code or documentation review | any file changes | scope, clarity, consistency, maintainability |
| Security and supply-chain review | scripts, external state, credentials, untrusted input, dependencies | no shell interpolation, no new dependency, no secret text |
| Requirements mapping | claiming task or requirement completion | changed files mapped to tasks and scenarios |
| Portability review | reusable assets or platform adapters change | no product constants, configured values only |
| Attribution review | third-party code, docs, assets, or dependencies are introduced | license and source notes |
| Recovery review | checkpoint, external mutation, or lifecycle transition changes | idempotent rerun and durable-state precedence |

## Finding Classes

Every finding carries a severity (per the independent-review findings schema)
plus a class.

Severity:

- material = `blocker`, `high`, `objective-fix` — correctness, security, or spec
  violation; drives a correction loop
- advisory = `warning`, `false-positive` — nitpick or non-blocking; recorded,
  does not drive a correction loop

Class:

- `objective-fix`: correct automatically and rerun affected checks
- `human-decision`: pause before changing behavior or external state
- `warning`: document as accepted limitation if gates still pass
- `false-positive`: cite evidence and continue

## Completeness Escalation

The reviewer's completeness second pass (re-review the same diff for anything
missed; do not repeat prior findings) is used only as an escalation: after two
consecutive rounds still produce `material` findings, add it to the next round.
The correction budget remains three materially-different fixes per failure
signature, then a fail-closed pause to the owner.

## Completion Rule

Do not mark a task, batch, or transition complete unless every required
evidence class is either present and current or explicitly documented as not
applicable with a reason.
