## 1. Canonical authoring contract

- [x] 1.1 Add `base-skill-authoring` metadata and concise workflow instructions.
- [x] 1.2 Add progressive references for the contract package, gap result,
  autonomy/guardrail use, and evaluation matrix. Depends on: 1.1.

## 2. Platform exposure and evaluation

- [x] 2.1 Add or regenerate thin Claude and Codex exposures that point to the
  canonical skill without copied policy. Depends on: 1.1.
- [x] 2.2 Add synthetic fixtures and deterministic tests for trigger/non-trigger,
  gaps, injection/secrets, profile pauses, recovery, adapter parity, and
  second-workspace portability. Depends on: 1.2, 2.1.

## 3. Verification and delivery evidence

- [x] 3.1 Run focused evals, metadata/shared-guardrail/contracts validation,
  OpenSpec validation, diff/security/portability/attribution/recovery reviews,
  and record requirements mapping. Depends on: 2.2.
- [x] 3.2 Complete formal OpenSpec Verify and independent read-only review using
  immutable base/head evidence before implementation delivery. Depends on: 3.1.
  Evidence: owner-approved one-time exception and formal Verify evidence for
  `6eed4d9ffba8234085f4b3b2e50ea6aa1eb294e4` are recorded on issue #76:
  https://github.com/jizzoe/joericearchitect-ai-skills/issues/76#issuecomment-5274108580.
