# Planning Review

Date: 2026-08-19. Reviewed before Apply for change
`distribute-shared-sdd-runtime` under the autonomous `prototype-rapid`
delivery authorization.

## Scope and linkage

- Scope matches `proposal.md`: build, install, resolve, verify, and recover a
  shared SDD runtime distributed in lockstep with canonical skills.
- Non-goals are explicit and unchanged: no `gh skill` replacement, no implicit
  host approval/credential/PATH configuration, no launcher authorization
  decisions, no per-skill or per-agent runtime duplication.
- GitHub linkage is current: issue #142, `tracking.yaml` validated, Project
  item set to `In Progress`.
- Design-brief provenance is captured at `context/design-brief.md`; the
  owner decision gate is recorded at `context/decision-record.md`.

## Requirements and scenarios

Four delta specs were reviewed. Every requirement carries at least two
scenarios, each in WHEN/THEN form, and each maps to at least one task:

| Requirement area | Tasks |
| --- | --- |
| Builder closure, staging, smoke validation | 2.1, 1.3 |
| Dispatchable helpers, no importable path | 2.2, 2.7 |
| Fail-closed dispatcher, Node preflight | 2.3, 2.7 |
| Mechanical-only target validation | 2.3, 4.3 |
| Contract versioning and `doctor` | 2.5, 4.1 |
| Labeled development mode | 2.6, 2.7 |
| Paired installation, atomic activation | 3.1–3.6 |
| Version ordering and offline rollback | 3.3, 3.6 |
| Installed-runtime completeness evidence | 5.1, 5.2 |

## Objective finding: helper inventory undercounts non-dispatchable modules

`proposal.md`, `design.md`, and task 2.2 state that **five** helper modules
export functions with no executable entrypoint. A direct inventory of the
seventeen modules referenced by canonical skills finds **seven**:

- `scripts/sdd/independent-review-contract.mjs`
- `scripts/sdd/platform-review-adapters.mjs`
- `scripts/sdd/research-planning-skill-runtime.mjs`
- `scripts/sdd/sdd-lifecycle-hygiene.mjs`
- `scripts/sdd/sdd-workspace-cleanup.mjs`
- `scripts/sdd/autonomous-sdd-controller.mjs`
- `scripts/sdd/check-operation-authorization.mjs`

`autonomous-sdd-controller.mjs` carries a `#!/usr/bin/env node` shebang, which
is what the original count appears to have keyed on, but it never reads
`process.argv` and exposes no command behavior.

`check-operation-authorization.mjs` was found during launcher testing. It has a
main guard, but that guard only prints "This module is imported by
deterministic validators and tests" and exits 2. It is the most referenced
helper in the catalog — five canonical skills name it — and it is the
authorization authority the launcher deliberately does not duplicate, so an
installed skill that cannot dispatch it cannot check authorization at all.

Both are referenced by canonical skills, so under the delta requirement "Every
declared helper is dispatchable through one contract" both must gain an
executable entrypoint.

**Disposition:** implement seven entrypoints and correct the counts in
`proposal.md`, `design.md`, and `tasks.md`. The controller and the review
adapters expose many distinct operations, so they take the enumerated
`subcommand` shape; the other five take the single-payload wrapper.

## Dependencies, security, recovery, portability

- Task dependencies form a valid DAG rooted at the completed decision gate 0.1;
  no task depends on a later task.
- Security: the launcher performs mechanical target validation only and makes
  no authorization decision; helper-level checks in
  `scripts/sdd/check-operation-authorization.mjs` remain the sole authority.
  The launcher exposes no verb returning an importable module path, and injects
  no credentials.
- Recovery: `activate --previous` restores the retained prior runtime offline;
  the receipt records the prior skill pin; failed activation retains the prior
  active runtime.
- Portability: no product-specific repository, credential, branch, or path is
  embedded in the manifest, builder, launcher, or installers. Target
  repositories are explicit absolute invocation inputs.
- Attribution: all new assets are repository-owned and assistant-neutral; thin
  Claude/Codex adapters stay pointers with no duplicated runtime policy.

## Evidence obligations carried into Apply

Focused tests, critical-flow checks, requirements mapping, local code and
secret review, `openspec verify`, `openspec validate --all --strict`, and
lifecycle reconciliation, per the resolved authorization's required quality
actions.
