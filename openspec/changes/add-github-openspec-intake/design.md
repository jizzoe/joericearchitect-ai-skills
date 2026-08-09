## Context

M4-C1 starts the local GitHub integration layer after M2-C1 established
GitHub intake configuration and M3-C2 established tracking metadata. Later
M4-C2 will own lifecycle synchronization; this change owns only issue
authoring and issue-to-OpenSpec intake.

The design must preserve these boundaries:

- `config/sdd-github.json` owns configured GitHub names and labels.
- `tracking.yaml` owns local issue/OpenSpec linkage.
- GitHub owns remote issue and Project state.
- OpenSpec remains the source for proposal, spec, design, and task artifacts.
- Live GitHub mutation is allowed only through explicit command execution and
  must be representable as a dry run.

## Goals / Non-Goals

Goals:

- Create a safe `gh` command boundary.
- Provide idempotent issue create-or-find and managed-block update behavior.
- Provide Project add/status helper functions for later lifecycle work.
- Provide issue-to-OpenSpec intake that writes conventional local artifacts and
  tracking metadata.
- Expose canonical skills to Claude and Codex.

Non-goals:

- No lifecycle status transition engine.
- No PR linkage enforcement.
- No GitHub Actions mutation.
- No branch protection or CI gating.

## Decisions

### DEC-001: Use argument arrays for all GitHub commands

The shared `gh` boundary accepts executable plus argument arrays and never
concatenates issue content into shell commands.

Rationale: issue bodies and prompts are untrusted input.

### DEC-002: Dry-run plans are first-class results

Every mutating helper supports a dry-run mode returning the intended operation
instead of calling `gh`.

Rationale: verification can prove behavior without external mutation, and live
mutation remains visibly bounded.

### DEC-003: Managed issue blocks are marker-bounded

Issue links are rendered between configured start/end markers and replacement
preserves all content outside those markers.

Rationale: automation must not overwrite human-authored issue context.

### DEC-004: Skills are thin instructions over canonical scripts

Canonical skills describe when and how to call repository scripts; they do not
duplicate the implementation logic.

Rationale: Claude and Codex exposure should remain consistent and easy to
regenerate.

## Affected Files and Interfaces

- `scripts/github/lib/gh.mjs`
- `scripts/github/lib/issues.mjs`
- `scripts/github/lib/projects.mjs`
- `scripts/github/create-or-find-issue.mjs`
- `scripts/github/update-managed-issue-block.mjs`
- `scripts/github/test/github-intake.test.mjs`
- `skills/base/github-issue-authoring/SKILL.md`
- `skills/base/github-issue-to-openspec/SKILL.md`
- `.claude/skills/github-issue-authoring/SKILL.md`
- `.claude/skills/github-issue-to-openspec/SKILL.md`
- `.agents/skills/github-issue-authoring/SKILL.md`
- `.agents/skills/github-issue-to-openspec/SKILL.md`
- `evals/skills/github-openspec-intake/`
- `openspec/changes/add-github-openspec-intake/tracking.yaml`

## Verification Strategy

- Run `openspec validate add-github-openspec-intake --strict`.
- Run `openspec validate --all --strict`.
- Run artifact-quality validation and tracking validation for this change.
- Run GitHub intake tests covering dry runs, duplicate search, create-or-find,
  managed-block replacement, Project operation plans, issue-to-OpenSpec
  fixture output, missing information, and API failures.
- Run skill exposure checks confirming Claude and Codex files point to
  canonical skills.
- Run security and secret-pattern scans across scripts, skills, evals, and
  change artifacts.

## Attribution and Licensing

M4-C1 uses repository-authored Markdown and dependency-free Node.js code. No
third-party runtime package or copied external implementation is added.

## Recovery

- Dry-run output can be inspected before live mutation.
- Create-or-find searches by exact title before issue creation.
- Managed block replacement is idempotent and preserves content outside
  configured markers.
- Project operations return structured results so later runs can converge or
  report missing permissions/fields.
- If GitHub CLI fails, helpers return a structured failure and do not claim
  synchronization succeeded.

## Reuse Plan

- Canonical behavior: scripts under `scripts/github/` and skills under
  `skills/base/`.
- Product configuration: repository, Project, labels, markers, issue text, and
  branch names are injected from config or command arguments.
- Claude/Codex exposure: thin skill wrappers reference the canonical base skill
  and keep platform-specific behavior out of the implementation.
- Portability: eval fixtures use injected alternate config and do not require
  this repository's issue numbers or Project item IDs.
