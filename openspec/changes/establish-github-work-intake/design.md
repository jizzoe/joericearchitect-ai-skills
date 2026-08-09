## Context

M2-C1 follows the completed M1-C2 bounded autonomous runner. The repository has
valid living specs and no active OpenSpec changes at selection time. GitHub
Issues and the public user Project exist, but issue forms, PR template,
managed labels, non-secret GitHub configuration, and the full five-status
intake model are not yet present.

The design must preserve these boundaries:

- GitHub Issues and Project state own work intake and lifecycle visibility.
- OpenSpec owns requirements and change artifacts.
- Repository files own templates and non-secret configuration.
- Secrets, token scopes, Project item IDs, and other mutable external IDs are
  not committed.

## Goals / Non-Goals

Goals:

- Establish repeatable feature and bug issue intake.
- Add PR prompts that support SDD verification and review.
- Define managed labels without duplicating Project statuses as labels.
- Add portable non-secret GitHub configuration.
- Verify Project intake status behavior with disposable records.

Non-goals:

- Automating OpenSpec change creation from issues.
- Implementing lifecycle status synchronization.
- Adding tracking schema validation.
- Enforcing PR linkage through CI.
- Creating or rotating credentials.

## Decisions

### DEC-001: Use GitHub-native issue forms first

Add `.github/ISSUE_TEMPLATE/feature.yml` and `bug.yml` rather than a custom
issue authoring script.

Rationale: GitHub forms are built-in, visible to contributors, and sufficient
for the first intake layer. Later M4 work can add deterministic create-or-find
behavior.

### DEC-002: Keep status in Project fields, not labels

Managed labels describe work type and automation scope. Project statuses carry
workflow state.

Rationale: Status labels would duplicate Project state and create future
reconciliation ambiguity.

### DEC-003: Commit only non-secret configuration

`config/sdd-github.json` stores repository, Project, status, label, marker, and
default-branch names. It does not store credentials, Project item IDs, field
IDs, PR state, timestamps, or last-sync output.

Rationale: Names are reviewable configuration; credentials and mutable IDs are
runtime state.

### DEC-004: Verify live Project behavior with disposable issues

Use clearly marked `[SDD test]` issues for feature and bug intake verification.
Close and retain them as evidence.

Rationale: GitHub form rendering and Project behavior require live integration
evidence. Retained records provide auditability.

### DEC-005: Keep templates portable by convention and configuration

Forms and PR templates should avoid embedding this repository's issue numbers,
Project item IDs, token names, or branch-specific assumptions. Product-specific
repository and Project values live in configuration and issue metadata.

Rationale: Later reusable skills should consume configured values rather than
hard-coded product constants.

## Verification Strategy

- Validate OpenSpec artifacts strictly.
- Validate issue forms and PR template are present and parseable as YAML or
  Markdown.
- Verify required labels exist and status labels do not.
- Verify Project status options include `Backlog`, `Ready`, `In Progress`,
  `In Review`, and `Done`.
- Create or reuse disposable `[SDD test]` feature and bug issues, add them to
  the Project, move them through intake statuses, close them, and retain URLs.
- Run a secret-pattern review across templates, configuration, and evidence.
- Verify configuration shape against a second-product fixture.

## Recovery

- Re-running label creation should update or report existing labels without
  creating duplicates.
- Re-running Project item addition should converge to one item per issue.
- Disposable issue verification should search by exact title before creating a
  new record.
- If Project status mutation is unavailable because fields are missing or
  credentials lack scope, pause with current issue URLs and the missing field or
  permission.

## Reuse Plan

- Product-neutral behavior: issue-form field pattern, PR evidence prompts,
  label/status separation, non-secret config shape, and disposable intake
  verification pattern.
- Canonical assets: repository templates and `config/sdd-github.json` now;
  future deterministic GitHub helpers in M4/M6.
- Product-specific values: owner, repository, Project title/number, default
  branch, status names, labels, and test issue titles.
- Claude/Codex consumption: both assistants read the same repository templates
  and configuration; no platform-specific copies are needed in M2-C1.
- Portability: second-product fixture verifies config shape can represent a
  different owner, repository, Project, branch, status set, and labels.
