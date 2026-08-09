## Context

M5-C1 follows M4-C1 intake and M4-C2 lifecycle sync. PR validation can now rely
on issue links, OpenSpec change directories, and tracking metadata, but it must
not perform Project reconciliation or expose privileged credentials.

## Goals / Non-Goals

Goals:

- Validate PR bodies for issue-closing or issue-related references and
  OpenSpec change references.
- Validate tracking metadata and reciprocal PR/OpenSpec linkage.
- Route OpenSpec validation when relevant paths change.
- Add advisory GitHub checks with read-only permissions.
- Provide corrective instructions in failures.

Non-goals:

- No Project status reconciliation from PR state.
- No privileged GitHub token or Project token usage.
- No required branch protection.
- No workflow-driven repair.

## Decisions

### DEC-001: Keep PR validation advisory

The workflows run validation and report findings but do not become required
branch protection checks in M5-C1.

Rationale: M5-C2 must first finish PR-driven Project reconciliation.

### DEC-002: Validate PR body locally from supplied text

The PR contract validator accepts a body file and changed paths file so tests
and CI can run without network calls.

Rationale: untrusted PR validation should avoid privileged GitHub API calls.

### DEC-003: Use read-only workflow permissions

Advisory workflows use `contents: read` and `pull-requests: read` only.

Rationale: linkage validation does not require mutation or Project credentials.

## Affected Files and Interfaces

- `scripts/validation/validate-pr-contract.mjs`
- `scripts/validation/validate-openspec-linkage.mjs`
- `scripts/validation/test/pr-linkage.test.mjs`
- `.github/workflows/openspec-validate.yml`
- `.github/workflows/openspec-linkage.yml`
- `skills/base/github-pr-linkage/SKILL.md`
- `.claude/skills/github-pr-linkage/SKILL.md`
- `.agents/skills/github-pr-linkage/SKILL.md`
- `evals/skills/github-pr-linkage/`
- `openspec/changes/enforce-openspec-pr-linkage/tracking.yaml`

## Verification Strategy

- Run OpenSpec strict validation.
- Run artifact-quality and tracking validation for this change.
- Run PR linkage tests for valid, missing issue, missing change, invalid
  tracking, changed-path routing, workflow permissions, and corrective output.
- Run existing focused suites.
- Run security and secret-pattern scans across workflows, validators, skills,
  evals, and change artifacts.

## Attribution and Licensing

M5-C1 uses repository-authored YAML, Markdown, JSON, and dependency-free Node.js
code. No third-party runtime package or copied external implementation is added.

## Recovery

- Validators emit rule IDs and corrective instructions.
- Advisory workflow failures can be rerun after editing PR body or tracking
  files.
- Missing tracking or OpenSpec paths fail locally without mutating GitHub.
- Later required-check promotion must happen in a separate approved change.

## Reuse Plan

- Canonical behavior: validation scripts and base skill.
- Product configuration: issue numbers, change names, PR bodies, and tracking
  paths are supplied as inputs.
- Claude/Codex exposure: wrappers point to canonical skill and scripts.
- Portability: workflows and tests avoid Project credentials and mutable IDs.
