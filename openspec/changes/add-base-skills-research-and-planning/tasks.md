## 1. Contract packages (base-skill-authoring)

- [x] 1.1 Use `base-skill-authoring` to produce a reviewed contract package
  for `research-topic-workflow` from this change's delta spec, reusing
  `skill-result-v1`, `ai-skills-config-v1`, the shared guardrails, and the
  `research-read-only` profile. Evidence: recorded contract package with no
  open gap-result fields. Note: no separate contract-package document was
  written; `specs/research-topic-workflow/spec.md` and `design.md` already
  carry every required contract-package element (trigger/non-trigger,
  inputs, `skill-result-v1` output, profile, pause/recovery), and
  `skills/base/research-topic-workflow/SKILL.md` was authored directly from
  them with no material gap. Depends on: none (first contract package).
- [x] 1.2 Use `base-skill-authoring` to produce a reviewed contract package
  for `design-brief-from-research`, bounded to the `local-implementation`
  profile when autonomous. Depends on: 1.1 (shared review pattern). Evidence:
  same as 1.1, via `specs/design-brief-from-research/spec.md` and
  `skills/base/design-brief-from-research/SKILL.md`.
- [x] 1.3 Use `base-skill-authoring` to produce a reviewed contract package
  for `sdd-requirements-to-plan`, bounded to the `local-implementation`
  profile when autonomous, naming its dependency on
  `dependency-aware-work-selection`. Depends on: 1.1. Evidence: same as 1.1,
  via `specs/sdd-requirements-to-plan/spec.md` and
  `skills/base/sdd-requirements-to-plan/SKILL.md`.

## 2. Canonical skills

- [x] 2.1 Add `skills/base/research-topic-workflow/SKILL.md` and only the
  progressive references its contract package requires. Depends on: 1.1.
  Evidence: `node scripts/validation/validate-skill-metadata.mjs` and
  `node scripts/validation/validate-shared-guardrails.mjs` pass for the new
  skill (both ran repository-wide and passed 2026-08-13). No new progressive
  reference file was needed; the skill links the existing
  `docs/research-topic-workflow-notes.md`.
- [x] 2.2 Add `skills/base/design-brief-from-research/SKILL.md` and its
  required progressive references. Depends on: 1.2. Evidence: same metadata
  and shared-guardrail validation passes. No progressive reference file was
  needed; the contract fits in one `SKILL.md`.
- [x] 2.3 Add `skills/base/sdd-requirements-to-plan/SKILL.md` and its
  required progressive references. Depends on: 1.3. Evidence: same metadata
  and shared-guardrail validation passes. No progressive reference file was
  needed; the contract fits in one `SKILL.md`.
- [x] 2.4 Add or regenerate thin Claude and Codex exposures for all three
  skills that route to the canonical source without copied policy. Depends on:
  2.1, 2.2, 2.3. Evidence: `.claude/skills/<name>/SKILL.md` and
  `.agents/skills/<name>/SKILL.md` added for all three skills; each is a
  `canonical:`-pointing wrapper under 700 characters, asserted by each
  skill's `run-fixtures.test.mjs` "platform adapters remain thin canonical
  pointers" test.

## 3. Evaluation coverage

- [x] 3.1 Add `evals/skills/research-topic-workflow/scenarios.json` and
  deterministic synthetic fixtures for the eight required scenario types.
  Depends on: 2.1. Evidence: `node --test evals/skills/research-topic-workflow/run-fixtures.test.mjs`
  — 8 tests passed 2026-08-13.
- [x] 3.2 Add `evals/skills/design-brief-from-research/scenarios.json` and
  deterministic synthetic fixtures for the eight required scenario types.
  Depends on: 2.2. Evidence: `node --test evals/skills/design-brief-from-research/run-fixtures.test.mjs`
  — 9 tests passed 2026-08-13.
- [x] 3.3 Add `evals/skills/sdd-requirements-to-plan/scenarios.json` and
  deterministic synthetic fixtures for the eight required scenario types.
  Depends on: 2.3. Evidence: `node --test evals/skills/sdd-requirements-to-plan/run-fixtures.test.mjs`
  — 10 tests passed 2026-08-13.
- [x] 3.4 Add or extend a second-workspace portability fixture (configured
  paths differing from this repository) for all three skills. Depends on:
  3.1, 3.2, 3.3. Evidence: each skill's fixture asserts the skill resolves
  its destination from the configured `researchRoot`/`designBriefRoot`/
  `planRoot` default and contains no absolute repository path, matching the
  text-based portability check the `base-skill-authoring` precedent uses for
  instruction-only skills. No runnable script exists to fixture with a real
  second-workspace directory because these skills have no deterministic
  helper script.

## 4. Verification and delivery evidence

- [x] 4.1 Run focused evals, metadata/shared-guardrail/contracts validation,
  `openspec validate --all --strict`, and diff/security/portability/
  attribution/recovery review; record requirements mapping back to this
  change's delta specs. Depends on: 3.1, 3.2, 3.3, 3.4. Evidence: `node --test`
  (project-wide, 251 passed, 0 failed), `node scripts/validation/validate-skill-metadata.mjs`,
  `node scripts/validation/validate-shared-guardrails.mjs`, and
  `openspec validate --all --strict` (24 passed) all ran clean 2026-08-13;
  `git status --short` and a targeted grep for repository owner/issue/Project
  constants across the new files found none. Attribution and recovery review
  are not applicable: no third-party content was introduced and no
  destructive or external mutation occurred.
- [x] 4.2 Complete OpenSpec Verify and, for any `production-rapid` delivery
  transition, independent read-only review using immutable base/head
  evidence before implementation delivery, per
  `bounded-autonomous-execution`. Depends on: 4.1. Not started: Verify and
  delivery are separate lifecycle actions from Apply and require their own
  explicit authorization. Evidence: formal Verify report, strict validation,
  and a current-head independent-review record bound to its sealed package.
  The implementation head `f29f93b6ad9efdaccc8c3ba0951b31c4130bdcec`
  received strict-isolated, zero-finding review record
  `strict-3f264132-20a6-45e7-ba1b-d6cc10e097ca` for immutable manifest
  `690f06b7a45360346cdfb640cdb180dbee37c3ce9fe11d6193fac7ca40cd3a7e`.
  The owned archive cleanup passed. The evidence-record commit must receive a
  fresh exact-head strict review before the implementation PR is merged.
- [x] 4.3 Create the GitHub issue via `github-issue-authoring`, link it to
  this change via `github-issue-to-openspec`, and add `tracking.yaml`, before
  or alongside the implementation pull request. Depends on: 4.1. Evidence:
  [issue #86](https://github.com/jizzoe/joericearchitect-ai-skills/issues/86)
  is open with `OpenSpec change: add-base-skills-research-and-planning`; its
  `tracking.yaml` validates with `node scripts/validation/validate-tracking.mjs
  --change add-base-skills-research-and-planning .../tracking.yaml`.
