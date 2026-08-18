## 1. Canonical lifecycle package

- [x] 1.1 Create `skills/base/autonomous-sdd-lifecycle/` with valid metadata,
  the existing lifecycle policy, explicit `skill-result-v1` output, progressive
  references, and the shared guardrail link.
  - Depends on: none
  - Evidence: metadata and shared-guardrail validators pass for the discovered canonical lifecycle skill.
- [x] 1.2 Convert the legacy workflow and reference paths into thin
  compatibility pointers to the canonical lifecycle skill. Depends on 1.1.
  - Depends on: 1.1
  - Evidence: lifecycle eval asserts the compatibility workflow and all four reference pointers remain below their thin-size limits.
- [x] 1.3 Point delivery plus Claude and Codex lifecycle adapters directly at
  the installed-layout-safe canonical skill path. Depends on 1.1.
  - Depends on: 1.1
  - Evidence: adapter drift reports valid and lifecycle eval resolves the delivery sibling path without the legacy checkout traversal.

## 2. Deterministic packaging evidence

- [x] 2.1 Update adapter drift validation and lifecycle evals to prove one
  canonical policy source, thin compatibility paths, equivalent adapters,
  trigger/non-trigger boundaries, recovery, and result-contract guidance.
  Depends on 1.2 and 1.3.
  - Depends on: 1.2, 1.3
  - Evidence: `node --test evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs` passes six tests.
- [x] 2.2 Extend disposable global-install fixtures to install lifecycle and
  delivery together for Claude and Codex and fail when the installed sibling
  dependency cannot be resolved. Depends on 1.3.
  - Depends on: 1.3
  - Evidence: `node evals/skills/global-skill-installation/run-fixtures.mjs` passes install/list and installed dependency resolution for both agents.
- [x] 2.3 Run metadata, shared-guardrail, lifecycle, installer, second-checkout,
  and security/portability tests and record exact evidence. Depends on 2.1 and
  2.2.
  - Depends on: 2.1, 2.2
  - Evidence: all named focused commands pass; the disposable installer reports authenticated invocation as blocked because no disposable authenticated profiles were supplied, while install/list/dependency verification passes.

## 3. Documentation and delivery validation

- [x] 3.1 Update lifecycle and global-install documentation to identify the
  canonical package, compatibility path, dependency behavior, refresh command,
  and new-session discovery requirement. Depends on 1.2 and 2.2.
  - Depends on: 1.2, 2.2
  - Evidence: documentation names the canonical skill, compatibility boundary, sibling dependency, verification, and reload behavior.
- [x] 3.2 Review the bounded diff for duplication, product constants, secrets,
  attribution, unrelated active-work overlap, and rollback clarity; run
  `openspec validate package-autonomous-sdd-lifecycle-globally --strict`,
  `openspec validate --all --strict`, and `git diff --check`. Depends on 2.3
  and 3.1.
  - Depends on: 2.3, 3.1
  - Evidence: focused validation, artifact quality, whitespace, security, portability, and isolated `openspec validate --all --strict` pass for all 30 scoped items; the live workspace gate separately reports only the preserved unrelated cleanup change's incomplete delta scenarios.
- [x] 3.3 Refresh both user-scope local installations and verify that each
  agent lists lifecycle and delivery and that delivery's installed canonical
  link resolves. Depends on 3.2.
  - Depends on: 3.2
  - Evidence: `gh skill list` shows both local-source skills for each agent; all 17 canonical skill bodies and references match local sources, and filesystem resolution reaches each listed lifecycle `SKILL.md`.
