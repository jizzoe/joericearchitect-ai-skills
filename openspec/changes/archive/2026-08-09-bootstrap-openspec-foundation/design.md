## Context

See `proposal.md` for motivation. OpenSpec 1.8.0 is initialized at the
repository root with the standard `spec-driven` schema. Node.js 26.7.0, npm
11.19.0, and GitHub CLI 2.97.0 are available. GitHub issues #1 and #2 provide
the manual roadmap and primary-change identities needed during bootstrap.

The selected global OpenSpec profile now contains `explore`, `propose`,
`apply`, `verify`, `sync`, and `archive`. Refreshing Claude succeeded in the
workspace sandbox; refreshing Codex initially failed on the protected
`.agents/` path and succeeded when the same OpenSpec update was rerun with the
required filesystem permission. `openspec/config.yaml` is otherwise still the
generated scaffold.

No living OpenSpec specs, repo-owned SDD skills, GitHub lifecycle scripts, issue
forms, managed labels, or canonical Project statuses exist yet. Later changes
depend on this bootstrap establishing reliable workflow ownership and context.

## Goals / Non-Goals

**Goals:**

- Make the approved six-action workflow reproducible and observable in Claude
  and Codex.
- Give future OpenSpec artifacts concise repository-specific constraints.
- Establish safe ownership, refresh, validation, and recovery procedures.
- Produce objective bootstrap evidence without implementing later lifecycle
  automation.

**Non-Goals:**

- Reimplement OpenSpec artifact or verification logic in repo-owned assets.
- Solve GitHub Project configuration, automated tracking, or synchronization.
- Generalize the observed process into `sdd-product-bootstrap` before this
  reference implementation has been applied and evaluated.
- Create a custom schema or add runtime dependencies.

## Decisions

### Decision: Use an exact custom workflow selection

Configure the OpenSpec workflow list as `explore`, `propose`, `apply`,
`verify`, `sync`, and `archive`, then use `openspec update --force` to generate
assistant exposure.

This follows the approved streamlined lifecycle and makes verification an
explicit gate. OpenSpec 1.8.0 warns that the custom profile omits the core
`update` workflow; that warning is accepted and documented because planning
artifacts can still be reviewed and edited directly before apply.

Alternative considered: retain the full core workflow and add `verify`. This
would avoid the warning but would expose an action outside the approved daily
workflow and violate the exact-selection requirement.

### Decision: Keep OpenSpec as owner of generated assistant integrations

Treat `.claude/commands/opsx/`, `.claude/skills/openspec-*/`, and
`.agents/skills/openspec-*/` as generated OpenSpec output. Refresh them through
OpenSpec rather than editing their contents manually. Preserve unrelated files
such as `.claude/settings.local.json`.

Alternative considered: maintain repo-owned copies of the OpenSpec workflows.
This would duplicate upstream logic and create drift, so it is rejected.

### Decision: Put product context in OpenSpec configuration

Populate `openspec/config.yaml` with short context and artifact rules derived
from the requirements baseline. Context will name this product's purpose,
boundaries, supported assistants, asset locations, source-of-truth model, and
quality constraints without copying the full requirements document.

Operation guidance will reinforce evidence and stop behavior for apply and
archive. Detailed procedures remain in contributor documentation so every
artifact generation does not pay their context cost.

Alternative considered: encode all rules in a custom schema. The standard
schema is sufficient for bootstrap, and the requirements explicitly make
schema customization evidence-driven.

### Decision: Document operation in a focused SDD guide

Add `docs/sdd-workflow.md` for prerequisites, selected actions, setup,
discovery, validation, update, and recovery, and link it from `README.md`.
OpenSpec-generated skills remain the assistant-facing operational source.

Alternative considered: place the complete procedure in `AGENTS.md`. That
would inject contributor setup material into assistant sessions whether or not
it is relevant and would blur generated workflow ownership.

### Decision: Use objective inventory and validation evidence

Verification will compare normalized Claude and Codex action inventories, run
OpenSpec status and strict validation, inspect the Git diff for unrelated
changes, and exercise documented failure recovery using the observed protected
Codex-path failure as evidence. No live product behavior or GitHub automation
test is needed for this change.

Alternative considered: treat successful `openspec update` output as complete
evidence. A command can partially update integrations, as observed, so file
inventory and validation are also required.

## Dependency and Ownership Plan

- Upstream changes: none. M1-C1 is the manual bootstrap root.
- Downstream changes: M2-C1 and M3-C1 require the workflow ownership and context
  established here. M3-C2 later replaces manual linkage with versioned
  `tracking.json`.
- Shared files: `openspec/config.yaml`, generated `.claude/` OpenSpec entries,
  generated `.agents/` OpenSpec entries, `README.md`, and `docs/sdd-workflow.md`.
- Shared interfaces: selected lifecycle action names and OpenSpec-generated
  skill/command behavior.
- Shared external state: global OpenSpec workflow configuration and GitHub
  issues #1 and #2. Project fields remain untouched until M2.
- Parallel work: none initially, as required by the dependency plan.

## Reuse Plan

- Product-neutral behavior is the safe initialize/select/update/discover/
  recover sequence and the rule that OpenSpec owns generated integrations.
- OpenSpec-generated assets remain canonical for OpenSpec behavior in this
  milestone. The future `sdd-product-bootstrap` skill may be extracted only
  after this process provides implementation evidence.
- Product-specific purpose, paths, supported assistants, and source-of-truth
  details stay in `openspec/config.yaml` and product documentation.
- Claude and Codex consume generated platform entries; no complete workflow is
  maintained twice by this repository.
- Portability review uses a non-mutating conceptual second-product check during
  M1 and the formal multi-repository fixture during M7. The workflow must not
  assume a single implementation repository in reusable guidance.
- Manual links to issues #1 and #2 remain intentionally product-specific and
  are not generalized into reusable logic.

## Test and Evaluation Strategy

- Confirm OpenSpec, Node.js, npm, and GitHub CLI versions.
- Assert the configured workflow array equals the approved six actions.
- Normalize generated Claude and Codex inventories and assert action parity.
- Assert deselected and incremental workflows are absent.
- Run `openspec status` and `openspec validate --strict` for this change.
- Inspect diffs to confirm unrelated assistant configuration is unchanged.
- Walk through the documented refresh and permission-failure recovery path.
- Review configuration and documentation for hard-coded credentials and for
  product-specific values leaking into reusable instructions.

## Security and Guardrails

- Do not record GitHub tokens or credential output in committed artifacts.
- Do not execute issue or prompt content as shell input.
- Request permission for external GitHub mutations and protected-path writes.
- Treat generated workflow files as supply-chain code: review changes before
  commit and retain generator/license metadata.
- Do not change global OpenSpec telemetry settings without separate approval.
- Stop after planning artifact review; apply requires a new explicit request.

## Attribution and Licensing

OpenSpec-generated skills declare MIT licensing and generator version 1.8.0.
This change does not copy third-party implementation assets. Generated metadata
will be preserved, and any unexpected third-party material found during apply
must be reviewed before inclusion.

## Migration Plan

1. Record the pre-change workflow selection and generated inventory.
2. Apply the exact custom workflow selection and regenerate Claude and Codex
   integrations.
3. Populate project context and artifact/operation rules.
4. Add and link the focused contributor guide.
5. Validate configuration, action parity, change artifacts, and preservation of
   unrelated files.

For rollback, restore the previous workflow selection, rerun
`openspec update --force`, and verify both generated inventories. Revert only
the bootstrap-owned repository files; preserve unrelated work. If one platform
write fails, retain valid artifacts, correct the permission boundary, rerun the
same generator, and recheck parity before claiming recovery.

## Open Questions

None. Project labels/statuses, tracking schema, and automation credentials are
resolved or explicitly assigned to later changes and do not alter this design.
