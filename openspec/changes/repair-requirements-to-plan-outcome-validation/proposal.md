## Why

The installed `sdd-requirements-to-plan` runtime always pauses because its
launcher does not provide the outcome-validation dependency that the canonical
executor requires. Direct fixtures mask the defect by injecting a test-local
callback, so planning cannot safely rely on observable outcomes in production.

## What Changes

- Add one trusted, deterministic validator for the approved v1 accepted-outcome
  Markdown contract and bind its result to the exact requirements-content
  digest.
- Inject that validator only from the installed planning-runtime launcher; do
  not accept caller-supplied validation claims.
- Add direct and installed-wrapper regression coverage for valid input,
  malformed, legacy, stale, vague, and instruction-like input, with no plan
  write on failure.
- **BREAKING**: requirements documents without the explicit v1 outcome block
  will pause planning until they are migrated; no heuristic legacy parser will
  be introduced.

## Scope and Non-Goals

Scope is the trusted v1 outcome contract, content binding, repository-launcher
injection, portable tests, and runtime-distribution evidence. This change does
not change design-brief approval, write authorization, plan generation, or
any Run #2 implementation thread.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sdd-requirements-to-plan`: Planning must derive trusted, content-bound
  observable outcomes from a versioned requirements contract and fail closed
  when that evidence is absent or invalid.

## Impact

- Affected assets: the canonical planning runtime, its repository launcher,
  the reusable skill guidance, runtime distribution checks, and planning evals.
- Users of the installed Claude and Codex exposure receive the same trusted
  launcher behavior; the platform wrappers remain thin.
- Issue: [#244](https://github.com/jizzoe/joericearchitect-ai-skills/issues/244).
- Reuse plan: keep validation and digest binding in an assistant-neutral,
  repository-owned runtime module. Repository paths, credentials, and product
  values remain runtime inputs rather than reusable constants.
- No OpenSpec, GitHub, or other governance record is created by the planning
  operation. Migration is intentionally fail-closed so a legacy document
  cannot be mistaken for trustworthy outcome evidence.
