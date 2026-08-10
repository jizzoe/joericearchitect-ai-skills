## Why

M2-C1 through M6-C1 delivered the SDD foundation capabilities. M7-C1 verifies
that the combined foundation is coherent, portable, secure across PR trust
boundaries, documented for operation and recovery, and ready to govern the next
change without hidden manual state.

## What Changes

- Add `sdd-foundation-verification` capability evidence.
- Add a foundation baseline test suite and multi-repository bookkeeping-product
  fixture.
- Add setup, operation, recovery, token rotation, and OpenSpec update guidance.
- Add repository agent guidance and third-party notices for referenced Actions.
- Consolidate final verification evidence for delivered living specs and
  archived changes.

## Non-Goals

- Do not enable required branch protection checks without separate user approval.
- Do not rotate or disclose credentials.
- Do not modify unrelated repositories.
- Do not add new product decisions beyond verification evidence.

## Capabilities

### New Capabilities

- `sdd-foundation-verification`: behavior for verifying the combined SDD
  foundation across lifecycle, tracking, linkage, dependency, security, and
  portability evidence.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/49
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M2-C1 through M6-C1 are complete.
- Affected users: maintainers and assistants using the completed SDD foundation.
- Affected assets: docs, eval fixtures, verification tests, notices, and
  OpenSpec verification records.
- Scope: verification and hardening documentation.
- Compatibility: existing specs, scripts, workflows, and skills remain
  compatible.
- Security: tests inspect workflow trust boundaries and portable assets for
  fixture-specific constants.

## Reuse Plan

- Product-neutral verification belongs in evals, docs, notices, and OpenSpec
  evidence.
- Product-specific fixture values stay under `evals/fixtures/products/`.
- Claude/Codex guidance stays in `AGENTS.md` and existing canonical skill
  wrappers.
- Portability is verified by checking reusable assets against a non-mutating
  multi-repository fixture.

