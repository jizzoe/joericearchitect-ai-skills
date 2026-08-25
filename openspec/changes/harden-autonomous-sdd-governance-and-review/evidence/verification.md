# Verification

- `openspec validate --all --strict` → 49 passed, 0 failed.
- `node --test scripts/sdd/test scripts/runtime/test scripts/github/test` →
  433 passed, 0 failed.
- `node scripts/sdd/check-adapter-drift.mjs .` → valid, no issues.
- `ai-skills-runtime doctor` → runtime contract v1, content verified, claude and
  codex available.

Diff scope: the two design briefs, the lifecycle skill, the
`human-decision-classification.md` and `review-matrix.md` references, the new
`open-question-resolution.md` reference, the review-adapter checklist/severity
prompt wiring, the `review-severity-classification.test.mjs` test, and the new
OpenSpec change artifacts. No secret material.

