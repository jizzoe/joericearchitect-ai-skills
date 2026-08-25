## 1. Claude guidance import

- [x] 1.1 Add root `CLAUDE.md` containing exactly `@AGENTS.md`

## 2. Adapter drift coverage

- [x] 2.1 Ensure `scripts/sdd/check-adapter-drift.mjs` deterministically enumerates every `skills/base/*/SKILL.md` and validates the thin `.claude`/`.agents` adapters
- [x] 2.2 Ensure OpenSpec-generated `openspec-*` and `opsx` assets are excluded from the check

## 3. Tests

- [x] 3.1 Add focused tests: newly added canonical skill, missing adapter, policy-duplicating adapter

## 4. Verification

- [x] 4.1 Run the drift check and the focused test, plus the full suites
- [x] 4.2 Run `openspec validate --all --strict`
