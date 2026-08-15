# SDD Project Bootstrap Runbook

## Purpose

Use this runbook to adopt Specification-Driven Development (SDD) in a new or existing repository. It establishes three separate layers:

1. OpenSpec-generated lifecycle actions.
2. Globally installed reusable skills available to the selected assistant.
3. Repository-owned governance and product context that applies whenever an agent works in the repository.

OpenSpec initialization creates only the first layer. It does not create the project policy, approval rules, product context, or validation contract that make lifecycle work safe and repeatable.

## Audiences

### Manual operator

Follow the phases in order. Supply the project-specific inputs, review every generated or updated file, and stop for decisions or external authorization.

### LLM operating in the target repository

Use this runbook as an ordered bootstrap procedure. First inspect the target repository and collect the required inputs from the user. Do not invent missing product policy, repository ownership, external permissions, or validation commands. After inputs are accepted, make only local in-scope edits and record validation evidence. Pause before external writes, credential work, global configuration changes, destructive actions, or a material scope change.

## Preconditions

- Start from the target repository root.
- Preserve existing user-authored files and inspect a dirty worktree before changing anything.
- Install Git, Node.js, OpenSpec, and the selected assistants separately.
- Use GitHub CLI only when the project explicitly uses GitHub lifecycle work.
- Keep credentials, tokens, OAuth material, and personal data outside source control and generated documentation.

## Project-Specific Inputs

Collect the following before seeding the repository. The bootstrapper may propose defaults only when the user confirms them.

| Input | Questions to resolve | Artifacts added or updated |
|---|---|---|
| Product identity and purpose | What does this repository own? What is explicitly outside its boundary? | `openspec/config.yaml`, `AGENTS.md`, `docs/sdd-workflow.md` |
| Repository and workspace ownership | Which repositories implement the product? Is this repository a planning, implementation, or shared-assets boundary? | `openspec/config.yaml`, `docs/sdd-workflow.md`, optional `config/sdd-github.json` |
| Assistant support | Which assistants must operate the lifecycle: Claude, Codex, or both? | Generated OpenSpec integrations, `AGENTS.md`, `docs/sdd-workflow.md` |
| Lifecycle selection | Which OpenSpec actions are enabled? Is the standard six-action lifecycle sufficient? | User-level OpenSpec workflow configuration, generated integrations, `docs/sdd-workflow.md` |
| Canonical paths | Where do OpenSpec artifacts, design briefs, plans, research, skills, tests, and evidence live? | `openspec/config.yaml`, `AGENTS.md`, `docs/sdd-workflow.md`, optional `config/ai-skills.json` |
| Local validation contract | Which deterministic commands prove code, documentation, schema, or application behavior? | `docs/sdd-workflow.md`, `AGENTS.md`, approved project scripts or CI configuration |
| Approval and safety policy | Which actions require confirmation? What data is sensitive? What external writes, destructive actions, and scope expansions must pause? | `AGENTS.md`, `docs/sdd-workflow.md`, optional `docs/ai-assistant-governance.md` |
| Delivery profile | Does the project use interactive delivery only, prototype-rapid, production-rapid, or another approved policy? What review evidence is required? | `AGENTS.md`, `docs/sdd-workflow.md`, optional `docs/ai-assistant-governance.md` |
| GitHub and delivery integration | Are Issues, Projects, PRs, CI, Sync, and Archive in scope? Which owner, project, labels, and status model apply? | `openspec/config.yaml`, optional `config/sdd-github.json`, `docs/sdd-workflow.md` |
| Global reusable skills | Which reviewed skills should be available globally? Which lifecycle steps should invoke them when their triggers apply? | User-level skill installation, `AGENTS.md`, `docs/sdd-workflow.md` |
| Local configuration defaults | Are stable non-secret default paths or named adapters needed? | Optional `config/ai-skills.json` |

Never store secrets, tokens, credentials, mutable approval grants, personal data, or product-specific runtime constants in reusable skills or committed global configuration.

## Phase 1: Inspect The Target Repository

1. Read existing `AGENTS.md`, assistant configuration, OpenSpec files, project documentation, automation, and validation scripts.
2. Record the current Git status and do not use destructive cleanup to make the worktree appear clean.
3. Determine whether OpenSpec is absent, partially initialized, or already adopted. Do not rerun initialization blindly in an existing project.
4. Identify existing product documentation that should be referenced rather than duplicated.
5. Present missing project-specific inputs to the user as a concise gap list.

Suggested inspection commands:

```bash
git status --short
find .. -name AGENTS.md -print
find . -maxdepth 3 \( -name 'openspec' -o -name '.claude' -o -name '.agents' \) -print
openspec --version
openspec context --json
openspec list --json
```

If OpenSpec is not installed, report that prerequisite. Do not install software or change user-level configuration without approval.

## Phase 2: Confirm Scope And Inputs

1. Create a short bootstrap decision record in the working conversation or a user-approved project document.
2. Resolve every required input in the table above.
3. Separate local repository changes from external or user-level actions.
4. Obtain confirmation before changing global OpenSpec workflow configuration, installing global skills, authenticating GitHub CLI, or creating GitHub resources.
5. Define a stopping condition: generated integrations exist, project-owned governance is present, required skills are available, and validation passes.

An LLM must pause if the project boundary, validation contract, approval policy, or external ownership is materially ambiguous.

## Phase 3: Initialize OpenSpec

For a new project, record the existing user-level workflow selection first:

```bash
openspec config path
openspec config get workflows
```

After the user approves the lifecycle selection, configure and initialize the selected assistants. The following is the standard six-action selection used by this repository; use a different selection only when the project decision records it.

```bash
openspec config set workflows '["explore","propose","apply","verify","sync","archive"]'
openspec init --tools claude,codex --profile custom --no-animation
```

For one supported assistant, select only that assistant in `--tools`. Review the generated files after initialization. OpenSpec owns these paths:

```text
.claude/commands/opsx/
.claude/skills/openspec-*/
.agents/skills/openspec-*/
```

Do not manually edit generated lifecycle content. Change the selected workflow configuration and regenerate it when the lifecycle must change.

## Phase 4: Seed Project-Owned Governance

Create or update the following project-owned artifacts. Preserve existing content and use links instead of copying large policy documents.

### `AGENTS.md`

Create a root `AGENTS.md`, or update the existing one, with:

- repository purpose, ownership boundary, and non-goals;
- mandatory reading order for local SDD/governance documents;
- the rule that an OpenSpec lifecycle action must use the local project policy;
- explicit approval, external-write, destructive-action, secret/PII, and scope-expansion boundaries;
- required validation and evidence expectations;
- any required global skills, named by their triggers rather than treated as universal auto-loaded policy; and
- a rule to preserve unrelated user changes and generated OpenSpec files.

Minimum pattern:

```markdown
# Agent Guidance

Before OpenSpec lifecycle work, read `docs/sdd-workflow.md` and any project-specific governance documents it names.

This repository owns [product boundary]. Do not [explicit non-goals].

Use the generated OpenSpec lifecycle action for Explore, Propose, Apply, Verify, Sync, and Archive. Use installed reusable skills when their documented trigger applies; global installation alone is not standing authorization.

Require confirmation for [external writes/destructive actions/purchases/etc.].
Run [validation commands] before delivery.
```

### `openspec/config.yaml`

Replace or supplement the generated context scaffold with concise project-specific OpenSpec context. Include the product boundary, supported assistants, canonical artifact locations, source-of-truth ownership, and quality constraints. Do not put credentials, personal data, or mutable runtime authorization in this file.

### `docs/sdd-workflow.md`

Create a local lifecycle guide based on the chosen OpenSpec actions. It must document prerequisites, generated-file ownership, proposal versus Apply authorization, validation commands, recovery steps, approval boundaries, and project-specific artifact paths. Link to `AGENTS.md` and any separate governance document.

### Optional `docs/ai-assistant-governance.md`

Add this only when approval, data classification, autonomy, or delivery rules need more detail than is appropriate for `AGENTS.md`. Define what is always prohibited, what requires just-in-time approval, how autonomous runs are bounded, and how recovery evidence is recorded.

### Optional `config/ai-skills.json`

Add this only for stable, non-secret defaults consumed by reusable skills. Use workspace-relative paths. It may identify approved paths, policy names, feature flags, and named adapters; it must not contain credentials, tokens, PII, or persisted approval grants.

### Optional `config/sdd-github.json`

Add this only when the project has an approved GitHub lifecycle integration. Store repository and Project references, never credentials. Keep its schema, owner, mutation rules, and validation commands documented in the local workflow guide.

## Phase 5: Make Reusable Skills Available

Install reviewed canonical skills at user scope if the selected assistants need them. Installation copies a capability into the user profile; it does not create project policy or grant permission in the target repository.

After installation, start a new assistant session and invoke one known skill to confirm discovery. In `AGENTS.md` and `docs/sdd-workflow.md`, map lifecycle work to skills that apply by trigger:

| Lifecycle need | Reusable capability when applicable |
|---|---|
| Research before a decision | `research-topic-workflow` |
| Turn accepted research into a design record | `design-brief-from-research` |
| Turn accepted requirements into delivery options | `sdd-requirements-to-plan` |
| Review a bounded local change | `base-code-review` |
| Establish local implementation evidence | `base-verification-loop` |
| Production-rapid independent-review gate | `independent-review` |

Generated `openspec-*` actions remain lifecycle entry points. Do not edit them to embed global skill content.

## Phase 6: Validate And Activate

1. Inspect generated Claude and Codex workflow inventories for the selected assistants.
2. Review all project-owned artifacts for unresolved placeholders, secrets, and incorrect paths.
3. Validate OpenSpec and run the project-specific checks recorded in the local workflow guide.
4. Start a new assistant session and confirm that generated lifecycle actions and installed skills are discoverable.
5. Record commands, outputs, artifact paths, and unresolved gaps as bootstrap evidence.

Baseline checks:

```bash
openspec context --json
openspec config get workflows
openspec list --json
openspec validate --all --strict
git diff --check
git status --short
```

For a newly initialized project with no changes or living specs, use the OpenSpec validation commands that its installed version supports and record any expected empty-state result. Do not fabricate a successful validation result.

## Completion Criteria

The bootstrap is complete only when:

- generated OpenSpec integrations match the approved assistant and lifecycle selection;
- `AGENTS.md`, `openspec/config.yaml`, and `docs/sdd-workflow.md` express the approved project-specific boundary and lifecycle policy;
- optional configuration exists only when its project-specific inputs were approved;
- required global skills are installed and discoverable, where selected;
- generated and project-owned files have been reviewed without overwriting unrelated work; and
- recorded validation evidence passes or names a precise, actionable gap.

## Recovery

- If initialization partially succeeds, preserve valid generated files, record the failed assistant/path/error, correct only the required environment issue, then rerun the same OpenSpec generation command.
- If project policy is incomplete, leave generated integrations intact and pause before lifecycle work that depends on the missing decision.
- If a global skill is unavailable, report it as unavailable; do not replace it with a copied, unreviewed local variant.
- If the target repository already has governance, reconcile it through a reviewed update instead of replacing it with this runbook's templates.
