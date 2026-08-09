# Review Matrix

Every batch and lifecycle transition needs evidence proportional to the
changed behavior.

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

- `objective-fix`: correct automatically and rerun affected checks
- `human-decision`: pause before changing behavior or external state
- `warning`: document as accepted limitation if gates still pass
- `false-positive`: cite evidence and continue

## Completion Rule

Do not mark a task, batch, or transition complete unless every required
evidence class is either present and current or explicitly documented as not
applicable with a reason.
