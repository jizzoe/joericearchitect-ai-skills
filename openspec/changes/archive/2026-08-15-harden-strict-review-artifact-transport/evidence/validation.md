# Validation evidence

## Deterministic checks

- `node --test scripts/sdd/test/platform-review-adapters.test.mjs`: 25 passed,
  0 failed.
- `node --test`: 308 passed, 0 failed.
- `openspec validate --all --strict`: 28 passed, 0 failed.

## Scope and safety review

- The strict adapter remains artifact-only: no transcript, stdout, or JSONL
  fallback was added.
- The managed preflight runs before view construction; a failed preflight does
  not request an elevated launch.
- The signed executable's CLI help must advertise `--output-last-message`
  before a strict request is prepared.
- A final strict-isolated acceptance result is required separately for the
  exact committed head before delivery.
