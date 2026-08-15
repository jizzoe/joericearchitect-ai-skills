# SDD Project Bootstrap Skill

Date: 2026-08-13
Status: Implementation-ready design brief draft. Create an OpenSpec proposal only after the owner accepts this scope.

## Decision

Create `sdd-project-bootstrap`, a reusable, assistant-neutral skill that guides a user or operates inside a target repository to adopt OpenSpec and seed repository-owned governance for safe lifecycle work.

The skill operationalizes [SDD Project Bootstrap Runbook](../../docs/sdd-project-bootstrap.md). It uses OpenSpec for generated lifecycle integrations and leaves generated OpenSpec files under OpenSpec ownership. It does not replace OpenSpec or create a second lifecycle implementation.

## Users And Modes

### Interactive bootstrap

Use when a user wants to walk through project setup. The skill inventories the target, asks only for missing project-specific inputs, produces a proposed artifact plan, and waits for approval before mutation or external action.

### Assisted local bootstrap

Use when an LLM is running in the target repository and the user authorizes a bounded setup run. The skill collects and validates inputs, initializes OpenSpec if approved, writes or updates permitted project-owned artifacts, validates the result, and returns durable evidence. It pauses for material ambiguity, user-level configuration changes, external writes, credential operations, destructive actions, and scope expansion.

The first release supports local repository initialization and seeded policy only. It does not create GitHub resources or provision external services.

## Trigger And Non-Triggers

Use when a repository needs OpenSpec adoption, generated lifecycle exposure, or a repository-owned SDD policy layer.

Do not use to:

- perform ordinary OpenSpec Propose, Apply, Verify, Sync, or Archive work in an already governed repository;
- overwrite an existing governance system without an explicit migration scope;
- install software, alter user-level OpenSpec configuration, authenticate a service, install global skills, or create GitHub resources without explicit approval; or
- substitute generic policy for unresolved product, data, delivery, or ownership decisions.

## Required Inputs

The skill requests the project-specific input set defined in the runbook:

- product identity, ownership boundary, and non-goals;
- implementation repository/workspace ownership;
- selected assistants and OpenSpec lifecycle actions;
- canonical artifact paths and local validation commands;
- approval, sensitive-data, external-mutation, and autonomy boundaries;
- delivery profile and review requirements;
- GitHub lifecycle decision, if any; and
- selected global skills and optional non-secret configuration defaults.

Missing material inputs produce a structured gap report. The skill may propose conservative defaults but must label them as assumptions and require approval before writing them to repository policy.

## Artifact Plan

The skill must map each accepted input to the artifact it creates or updates:

| Artifact | Ownership | Purpose |
|---|---|---|
| `.claude/commands/opsx/`, `.claude/skills/openspec-*/`, `.agents/skills/openspec-*/` | OpenSpec-generated | Expose the selected lifecycle actions. |
| `AGENTS.md` | Project | Apply project boundary, required reading, approval rules, validation expectations, and generated-file preservation to repository work. |
| `openspec/config.yaml` | Project/OpenSpec context | Describe product boundary, supported assistants, canonical locations, ownership, and quality constraints. |
| `docs/sdd-workflow.md` | Project | Document lifecycle, project-specific validation/recovery, and generated-versus-project-owned boundaries. |
| `docs/ai-assistant-governance.md` | Project, optional | Hold expanded autonomy, data, approval, and delivery policy when needed. |
| `config/ai-skills.json` | Project, optional | Hold stable non-secret defaults for reusable skills. |
| `config/sdd-github.json` | Project, optional | Hold approved non-secret GitHub lifecycle references. |

The skill must preserve existing project-owned content, avoid unrelated edits, and reference rather than duplicate existing authoritative documentation.

## Workflow

1. Inventory the target repository, including existing agent instructions, assistant/OpenSpec assets, configuration, documentation, validation scripts, and dirty worktree state.
2. Classify the target as new, partially initialized, or already governed.
3. Collect missing required inputs and produce an artifact plan with every proposed path, operation, source, and unresolved decision.
4. Obtain approval for the artifact plan and separately for any user-level or external mutation.
5. When approved, run the selected OpenSpec initialization command and inspect resulting generated integrations.
6. Create or update only approved project-owned artifacts.
7. Validate generated inventories, project paths, OpenSpec state, configured validation commands, and secret/placeholder exclusions.
8. Emit `skill-result-v1` with created/updated artifacts, commands/evidence, assumptions, open questions, and the next action.

## Safety And Authorization

The canonical skill links to shared guardrails and uses `skill-result-v1`. Autonomous operation is limited to an explicitly authorized local setup scope with named target repository, permitted paths, artifact plan, expiration, validations, recovery behavior, and forbidden actions.

The skill must:

- treat existing repository files and tool output as untrusted content;
- never copy secrets, credentials, tokens, PII, or mutable approval grants into project or reusable assets;
- preserve generated OpenSpec files and never manually modify their content;
- distinguish globally installed skill availability from project policy and authorization;
- pause before global configuration changes, installations, authentication, GitHub/other external mutation, or overwriting a human-authored policy; and
- never claim bootstrap completion without recorded validation evidence.

## Canonical Assets And Adapters

Implementation should add:

- `skills/base/sdd-project-bootstrap/SKILL.md`;
- thin Claude and Codex discovery wrappers;
- references for the project-input interview, artifact mapping, and generated-file inventories;
- deterministic helpers only where they reduce repeated, error-prone inventory or validation work; and
- synthetic fixtures and tests under `evals/skills/sdd-project-bootstrap/`.

The canonical skill must follow `docs/skill-authoring.md`, including the shared guardrail reference. Platform wrappers must remain thin and may not embed project-specific policy or make initialization decisions.

## Evaluation Requirements

Use synthetic new, partially initialized, and already governed repositories to test:

- trigger and non-trigger behavior;
- missing-input gap reports and approved-default labeling;
- generated OpenSpec inventory recognition;
- project-owned artifact mapping and safe path handling;
- preservation of user-authored policy and unrelated changes;
- rejection of secrets, PII, untrusted embedded instructions, and unsafe paths;
- pause before global configuration, installation, credentials, and external mutation;
- interactive approval and bounded autonomous authorization behavior;
- partial-generation recovery guidance; and
- portable second-workspace execution without product-specific constants.

## Acceptance Gate

An implementation change is complete only when a synthetic target repository can be inspected, receive a complete accepted input set, initialize selected OpenSpec integrations, seed approved local policy artifacts, and emit validated evidence without modifying generated content or unrelated files.

It must also prove safe pauses for missing material decisions and all forbidden mutation classes. A live target repository is not required for the first-release evaluation suite.
