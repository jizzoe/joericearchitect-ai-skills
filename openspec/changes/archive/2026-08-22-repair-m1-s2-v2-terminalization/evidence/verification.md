# Verification evidence

Reviewed repair-branch head: `fix/m1-s2-v2-terminalization-repair`.

## Requirements mapping

| Requirement | Evidence |
|---|---|
| Exact, evidence-bound terminalization | Controller identity and fresh-evidence checks; success, mismatch, incomplete-cleanup, and stale-evidence tests. |
| Idempotent terminalization with retained audit history | Immutable receipt/release/projection publishing and repeat-request test. |
| A released archived run no longer blocks admission | Terminalize-then-admit test; a different active claim still returns an immutable conflict. |
| Declared runtime-only exposure | Runtime manifest and subcommand-dispatch test, including malformed request rejection. |

## Checks

- Focused Node suites: 100 passing tests.
- Full repository Node suites: 356 passing tests.
- `node scripts/validation/validate-tracking.mjs openspec/changes/repair-m1-s2-v2-terminalization/tracking.yaml`: passed.
- `git diff --check`: passed.
- `openspec validate --all --strict`: 36 passed, 0 failed.

The Node test fixtures intentionally create temporary non-repository directories;
some runtime tests print harmless Git "not a repository" diagnostics while
asserting their classified behavior. No test failed.

## Security, portability, and recovery review

- No credential, repository-specific M1-S2 identity, PR number, state root, or
  user path is embedded in reusable runtime code.
- The controller derives the state bundle from a typed repository identity and
  rejects a caller-selected active-bundle path.
- Unknown fields, mismatched identities, non-current delivery proof, incomplete
  cleanup, and conflicting archive receipts pause before changing the active
  bundle.
- A successful retry reads the retained archive receipt and returns the prior
  result without creating a new run or deleting audit evidence.
