# Verification

- `openspec validate harden-autonomous-sdd-governance-and-review --strict` →
  valid.
- `openspec validate --all --strict` → 48 passed, 0 failed.
- `node --test` over `scripts/**/*.test.mjs` → 487 passed, 0 failed.
- `node scripts/sdd/check-adapter-drift.mjs .` → valid, no issues.

Diff scope: the two design briefs, the lifecycle skill, the
`human-decision-classification.md` and `review-matrix.md` references, the new
`open-question-resolution.md` reference, the review-adapter checklist/severity
prompt wiring plus the completeness-prompt fix (retain the checklist and carry a
sanitized summary of prior findings), the `review-severity-classification.test.mjs`
test, and the OpenSpec change artifacts. No secret material.

