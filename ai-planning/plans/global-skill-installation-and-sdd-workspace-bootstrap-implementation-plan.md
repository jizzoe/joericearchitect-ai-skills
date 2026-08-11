# Global Skill Installation and SDD Workspace Bootstrap Implementation Plan

Date: 2026-08-10
Status: Proposed

## 1. Purpose

Deliver two related improvements to this reusable AI asset repository:

1. Document and automate global installation of repo-owned skills for Claude
   and Codex.
2. Provide a reusable `bootstrap-sdd-workspace` skill for initializing and
   validating single-repository and multi-repository SDD workspaces.

Both initiatives use a mixed workflow:

```text
ad hoc research
  -> ad hoc decision record
  -> OpenSpec proposal and review
  -> OpenSpec apply and verification
  -> capability documentation
  -> delivery, sync, and archive
```

Research and option selection do not change repository behavior and therefore
do not require an OpenSpec change. Automation, reusable skills, templates,
platform exposure, and their supported behavior do require OpenSpec changes.

Documentation that explains a newly delivered capability is part of that
capability's OpenSpec scope and completion evidence. It is not deferred as an
untracked follow-up even when it is drafted with ordinary ad hoc prompts.

## 2. Outcomes

The completed work SHALL provide:

- Current, source-backed guidance for installing repo-owned skills globally in
  Claude and Codex.
- A deterministic, non-destructive installation mechanism selected after
  comparing supported platform options and recent public examples.
- Verification, update, conflict, and uninstall behavior for global installs.
- A reusable `bootstrap-sdd-workspace` skill with progressive-disclosure
  documentation, deterministic scripts where appropriate, and portable
  templates.
- Explicit configuration for products composed of one or more implementation
  repositories.
- Safe Claude and Codex initialization that preserves unrelated configuration.
- Idempotent verification and targeted recovery for partial setup.
- A non-mutating multi-repository fixture representing the shape of a future
  full-stack mobile product without importing that product's domain behavior.

## 3. Governing Principles

- This plan expands and supersedes the unimplemented global-installation
  documentation item in Batch 5 of
  `bounded-autonomous-sdd-execution-implementation-plan.md`; it does not create
  a second competing installation contract.
- Keep canonical assistant-neutral behavior under `skills/base/`; expose it to
  Claude and Codex through thin platform adapters.
- Prefer built-in platform installation and initialization mechanisms before
  creating custom replacements.
- Treat explicit manifests as authoritative. Discovery may suggest values but
  must not silently decide product boundaries or repository ownership.
- Require preview or dry-run before writing outside the current repository or
  changing assistant-global configuration.
- Never copy credentials, tokens, personal paths, mutable IDs, or product
  constants into reusable skills, scripts, templates, fixtures, or docs.
- Preserve existing user-authored and generated files. Conflicts fail closed
  with an actionable report unless replacement is explicitly approved.
- Make automation idempotent and give every mutation a documented verification
  and recovery path.
- Scale tests and OpenSpec artifacts to behavior and risk, while retaining the
  full Propose, Apply, Verify, Sync, and Archive lifecycle.

## 4. Initiative 1: Global Skill Installation

### 4.1 Ad Hoc Research

Research the currently supported global skill installation mechanisms for
Claude and Codex. Record findings under:

```text
ai-planning/research/skill-installation/
```

The research SHALL cover:

- Official global and repository-local skill discovery locations.
- Platform-native installers, plugins, marketplaces, and supported CLI flows.
- Copy, symbolic-link, package, and generated-adapter approaches.
- macOS and other relevant platform differences.
- Discovery or restart behavior after installation.
- Update, version pinning, provenance, drift detection, and uninstall options.
- Behavior when a destination already exists or contains user-authored work.
- Security implications of installing third-party skills or executable scripts.
- Recent, maintained GitHub repositories with installation patterns worth
  following, including license and maintenance evidence.
- Compatibility with this repository's canonical-source and thin-adapter model.

Prefer official documentation for platform behavior. Treat GitHub examples as
implementation references rather than authoritative platform contracts.

Research completion evidence:

- Source links and access dates are recorded.
- Unsupported or stale options are identified explicitly.
- At least two viable approaches are compared using common criteria.
- Unknown or platform-version-dependent behavior is called out for testing.

### 4.2 Ad Hoc Decision Record

Select the installation approach before creating the OpenSpec change. Record:

- Selected installation model for Claude and Codex.
- Whether both platforms can share one mechanism or require thin adapters.
- Canonical source and installed destination ownership.
- Copy versus link behavior and the portability tradeoff.
- Update, conflict, rollback, and uninstall semantics.
- Supported operating systems and prerequisites.
- Why rejected approaches were not selected.

Decision criteria:

| Criterion | Required consideration |
|---|---|
| Platform support | Uses documented Claude and Codex discovery behavior |
| Safety | Does not overwrite unrelated files or expose secrets |
| Portability | Avoids hard-coded user and repository paths |
| Maintainability | Prevents silent divergence from canonical skills |
| Recoverability | Supports preview, verification, and uninstall |
| Simplicity | Adds no more packaging machinery than the use case needs |

### 4.3 OpenSpec Change: Automate Global Skill Installation

Proposed semantic change name:

```text
automate-global-skill-installation
```

Create the issue and OpenSpec artifacts only after the research decision is
reviewed. The selected approach belongs in `design.md`; durable observable
behavior belongs in the delta specification.

Expected implementation scope:

- Deterministic installation scripts in a repository-owned script boundary.
- Explicit source, destination, assistant, and operation inputs.
- Dry-run output showing planned creates, updates, conflicts, and removals.
- Safe installation for Claude, Codex, or both.
- Idempotent reruns that do not duplicate installations.
- Verification that installed skills resolve to the intended canonical version.
- Update behavior that distinguishes managed files from user-authored files.
- Uninstall behavior limited to artifacts managed by this repository.
- Actionable errors for unsupported platforms, missing prerequisites, stale
  links, permission failures, and destination conflicts.
- Attribution and license preservation for any incorporated external pattern.

Out of scope unless research demonstrates a requirement:

- A general-purpose package manager for arbitrary third-party skills.
- Silent changes to Claude or Codex global configuration.
- Automatic network downloads during normal installation.
- Installation of credentials, MCP authentication, or product configuration.

### 4.4 Installation Documentation Is Part of the Capability

The OpenSpec change SHALL include user documentation as an implementation and
verification task. At minimum, the documentation SHALL explain:

- Prerequisites and supported platform versions.
- Install, dry-run, verify, update, and uninstall commands.
- Claude-only, Codex-only, and dual-platform examples.
- Installed locations and canonical-source ownership.
- Restart or reload requirements.
- Conflict handling and recovery from a partial installation.
- Security and trust review before installing executable skills.
- Manual installation steps when automation is unavailable.

The primary how-to may live under `docs/`, with concise entry points from the
repository README and any relevant skill reference. Commands in the guide must
be exercised in isolated temporary homes or fixtures before delivery.

### 4.5 Verification

Required scenarios include:

- Fresh Claude-only installation.
- Fresh Codex-only installation.
- Dual-platform installation.
- Dry-run with no filesystem mutation.
- Idempotent second run.
- Managed update after a canonical skill changes.
- Existing user-authored destination conflict.
- Stale or broken symbolic link when links are supported.
- Partial failure affecting only one assistant.
- Uninstall that preserves unrelated files.
- Paths containing spaces and a second-repository fixture.
- Documentation walkthrough from a clean temporary environment.

## 5. Initiative 2: SDD Workspace Bootstrap

### 5.1 Ad Hoc Research

Research reusable SDD workspace initialization patterns and record findings
under:

```text
ai-planning/research/sdd-workspace-bootstrap/
```

The research SHALL cover:

- Current OpenSpec initialization, update, workflow-selection, and validation
  behavior.
- Claude and Codex repository-level discovery and generated-file ownership.
- Existing guidance in `docs/sdd-workflow.md` and
  `docs/sdd-foundation-operations.md` to avoid duplication.
- Single-repository and multi-repository product workspace patterns.
- Product-level specification ownership across implementation repositories.
- Manifest formats, repository role modeling, and configuration validation.
- Safe scaffolding, merge, rerun, and recovery behavior.
- Recent public repositories or templates with reusable bootstrap patterns.
- How the global skill installer from Initiative 1 should be reused rather than
  reimplemented.

Research completion evidence matches Initiative 1: cited sources, compared
options, tested assumptions, recorded unknowns, and explicit rejection reasons.

### 5.2 Ad Hoc Decision Record

Decide and record:

- Workspace topology and authoritative product-level specification location.
- Minimum generated directory and file set.
- Manifest schema and required versus optional fields.
- Explicit configuration versus discovery boundaries.
- OpenSpec workflow profile and initialization strategy.
- Claude and Codex adapter generation or installation strategy.
- Script language and dependency policy.
- Conflict, partial-failure, rollback, and rerun behavior.
- Which behavior belongs in the skill, scripts, templates, and references.

The decision SHALL preserve single-repository setup as the simplest supported
case while modeling repositories as a collection.

### 5.3 OpenSpec Change: Add SDD Workspace Bootstrap

Proposed semantic change name:

```text
add-sdd-workspace-bootstrap
```

This change depends on the installation decision and should reuse the delivered
installer where global skill availability is needed.

#### Canonical Skill

Create a reusable canonical skill such as:

```text
skills/base/bootstrap-sdd-workspace/
├── SKILL.md
├── references/
│   ├── workspace-model.md
│   ├── configuration.md
│   ├── operations.md
│   └── recovery.md
├── scripts/
└── assets/
```

`SKILL.md` SHALL remain concise and procedural. Detailed how-to material belongs
in `references/`, deterministic behavior belongs in `scripts/`, and reusable
workspace file content belongs in `assets/`. Claude and Codex exposure SHALL be
thin and generated or packaged from this canonical source.

Documentation is therefore part of the skill itself through progressive
disclosure. A short top-level repository guide may provide discovery and link
to the canonical operational references, but must not become a divergent copy.

#### Scripts and Templates That Generate Workspace Files

Templates provide portable starting content; scripts collect explicit inputs,
render or merge templates, and report proposed changes. Candidate output
includes:

```text
<workspace>/
├── AGENTS.md
├── openspec/
│   ├── config.yaml
│   └── specs/
├── config/
│   └── workspace-repositories.yaml
├── docs/
│   └── sdd-workflow.md
├── .agents/skills/
└── .claude/skills/
```

The final file set is selected during research and design. Generation SHALL:

- Preview creates, merges, skips, and conflicts.
- Avoid replacing existing files without explicit approval.
- Distinguish generated, canonical, and user-authored ownership.
- Accept configured values rather than embedding this repository's constants.
- Produce a usable minimum workspace without committing empty directories.
- Support safe reruns after initial setup.

#### Multi-Repository Discovery and Configuration

Use an explicit manifest as the source of truth. A representative shape is:

```yaml
product: mobile-platform
repositories:
  - name: mobile-app
    role: ios-android-client
    path: ../mobile-app
  - name: api
    role: backend-services
    path: ../backend
  - name: infrastructure
    role: deployment
    path: ../infrastructure
```

The capability may scan configured roots and suggest Git repository candidates,
but a person SHALL confirm membership and roles before the manifest is written.
It SHALL support:

- Repository name, path or remote, role, and default branch.
- Identification of the product workspace and spec-owning repository.
- Issue, Project, integration-test, release, and implementation ownership where
  configured.
- Missing, inaccessible, duplicate, or inconsistent repository reporting.
- Relocatable configuration without hard-coded personal absolute paths.

Discovery SHALL NOT infer product membership solely from directory proximity or
silently mutate discovered repositories.

#### Automated Claude and Codex Initialization

The capability SHALL:

- Detect existing Claude, Codex, and OpenSpec files before mutation.
- Confirm prerequisites and supported versions.
- Run the approved OpenSpec initialization or refresh procedure.
- Generate or install thin assistant exposure from canonical assets.
- Preserve unrelated assistant settings, commands, skills, and user files.
- Report reload or restart requirements.
- Preview assistant-global configuration changes and require approval before
  performing them.
- Be idempotent when initialization is rerun.

Global workflow-selection side effects and files outside the workspace require
an explicit preview and normal permission approval. The skill SHALL not weaken
sandbox, approval, credential, or security settings.

#### Verification and Recovery Tooling

Verification SHALL check:

- Required files exist and parse successfully.
- The workspace manifest is internally consistent.
- Configured repositories are reachable without mutating them.
- Claude and Codex expose the intended equivalent lifecycle actions.
- Thin adapters resolve to canonical skills and do not contain duplicated
  policy.
- OpenSpec strict validation passes where applicable.
- Reusable assets do not contain credentials or product-specific constants.
- A second run produces no unexpected changes.

Recovery SHALL:

- Identify the exact failed step, platform, repository, and path.
- Preserve valid output from successful steps.
- Retry only the affected operation when safe.
- Preview conflicts and proposed repairs.
- Detect stale adapters, partial generation, invalid manifests, and moved
  repositories.
- Offer targeted repair or manual recovery instructions without destructive
  blanket cleanup.

### 5.4 Bootstrap Documentation Is Part of the Skill

The skill's `references/` content SHALL document:

- Prerequisites and supported topology.
- Single-repository and multi-repository walkthroughs.
- Manifest fields and ownership decisions.
- Dry-run, bootstrap, verification, rerun, and recovery procedures.
- Claude and Codex discovery or restart behavior.
- Safe handling of existing files and global configuration.
- How to add or remove a repository later.
- How product-specific specs remain in the product workspace rather than this
  reusable asset repository.

Every documented command and recovery path must be covered by an automated
fixture or a recorded manual walkthrough.

### 5.5 Verification and Evals

Required scenarios include:

- New single-repository workspace.
- New multi-repository workspace.
- Explicit manifest with discovery disabled.
- Candidate discovery followed by human confirmation.
- Existing assistant configuration that must be preserved.
- Existing OpenSpec workspace requiring refresh rather than initialization.
- Missing repository, duplicate role, invalid path, and invalid manifest.
- Partial Claude success and Codex failure, and the inverse.
- Insufficient permission for a global or external write.
- Idempotent rerun and targeted recovery.
- Trigger and non-trigger behavior for the bootstrap skill.
- Portability fixture using generic mobile, service, and infrastructure
  repositories without bookkeeping-specific behavior.
- Documentation walkthrough from an empty temporary workspace.

## 6. Dependencies and Sequence

```text
I1-R  installation research
  -> I1-D  installation decision
  -> I1-S  automate-global-skill-installation OpenSpec change
  -> I2-R  bootstrap research informed by the installer
  -> I2-D  bootstrap decision
  -> I2-S  add-sdd-workspace-bootstrap OpenSpec change
```

Bootstrap research may begin while the installation change is being delivered,
but the bootstrap design SHALL not freeze its installation integration until
Initiative 1's public contract is stable.

The two OpenSpec changes should remain separate because global installation is
a reusable capability with independent users, risks, tests, and rollback. The
bootstrap skill consumes that capability but also remains usable through
documented manual prerequisites when the installer is unavailable.

## 7. Proposed Artifact Map

Final paths remain subject to the two decision records and OpenSpec designs.

```text
ai-planning/
├── research/
│   ├── skill-installation/
│   └── sdd-workspace-bootstrap/
└── plans/
    └── global-skill-installation-and-sdd-workspace-bootstrap-implementation-plan.md

docs/
├── global-skill-installation.md
└── sdd-workspace-bootstrap.md

skills/base/
└── bootstrap-sdd-workspace/
    ├── SKILL.md
    ├── references/
    ├── scripts/
    └── assets/

scripts/
└── skills/

evals/
├── skills/bootstrap-sdd-workspace/
└── workflows/skill-installation/
```

Top-level docs are entry points and operator guides. Canonical procedural policy
for bootstrap remains in the skill, and deterministic installation behavior
remains in scripts. Avoid copying the same normative instructions among these
locations.

## 8. Security and Trust Review

Both OpenSpec changes SHALL address:

- Executable third-party skill content and supply-chain provenance.
- Symbolic-link boundary and path-traversal risks.
- Writes outside the current repository or workspace.
- Existing-file replacement and untrusted template inputs.
- Prompt injection in discovered repository documentation.
- Secret, token, and personal-path leakage into generated output or logs.
- Arbitrary shell execution and unsafe interpolation.
- Least-privilege assistant and OpenSpec configuration.
- Dry-run accuracy and recovery from interrupted mutations.
- Attribution and license obligations for borrowed patterns or templates.

## 9. Definition of Done

This plan is complete when:

- Both research records and decisions are reviewed and source-backed.
- Both OpenSpec changes complete Propose, Apply, Verify, delivery, Sync, and
  Archive.
- Global installation works for the supported Claude and Codex environments and
  can be verified, updated, and uninstalled safely.
- `bootstrap-sdd-workspace` works for single- and multi-repository fixtures,
  preserves existing configuration, and recovers from partial failure.
- Documentation is delivered as part of each capability and every supported
  command has objective test or walkthrough evidence.
- Canonical behavior is not duplicated across Claude, Codex, top-level docs,
  and generated files.
- Strict OpenSpec validation, relevant tests and evals, security review,
  portability review, attribution review, and documentation review pass.

## 10. Immediate Next Actions

1. Complete and review the global skill installation research.
2. Record the installation decision and selected update/uninstall model.
3. Create the GitHub issue and OpenSpec change
   `automate-global-skill-installation`.
4. Begin SDD workspace bootstrap research while the installation contract is
   being implemented.
5. Record the bootstrap topology, manifest, and ownership decisions.
6. Create the GitHub issue and OpenSpec change
   `add-sdd-workspace-bootstrap` after the installer contract stabilizes.
