## Why

The repository can now run bounded OpenSpec lifecycle work, but feature and bug
intake still depends on ad hoc issue creation and a minimal Project status
model. M2-C1 establishes consistent GitHub entry points before later changes
automate OpenSpec linkage, lifecycle sync, PR validation, and work selection.

## What Changes

- Add managed feature, bug, SDD, and test labels without introducing status
  labels.
- Add GitHub issue forms for feature and bug work with required SDD intake
  fields.
- Add issue-template configuration and a pull request template with SDD
  linkage, validation, security, recovery, and portability prompts.
- Add non-secret GitHub integration configuration for repository, Project,
  status, label, branch, and managed marker names.
- Expand or verify the `AI Skills Development` Project intake statuses:
  `Backlog`, `Ready`, `In Progress`, `In Review`, and `Done`.
- Verify intake behavior with disposable `[SDD test]` feature and bug issues.
- Keep this change focused on intake and Kanban visibility; downstream
  lifecycle automation remains in later milestones.

## Capabilities

### New Capabilities

- `github-work-intake`: behavior for standardized GitHub issue intake,
  managed labels, Project Kanban status visibility, PR checklist prompts, and
  non-secret configuration used by later SDD automation.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/15
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Affected users: repository owner and contributors creating feature, bug, and
  SDD work.
- Affected systems: GitHub Issues, GitHub Project `AI Skills Development`,
  pull requests, repository configuration, and later SDD automation.
- Expected files:
  - `.github/ISSUE_TEMPLATE/feature.yml`
  - `.github/ISSUE_TEMPLATE/bug.yml`
  - `.github/ISSUE_TEMPLATE/config.yml`
  - `.github/pull_request_template.md`
  - `config/sdd-github.json`
  - focused validation fixtures or reports for intake behavior
- Compatibility: existing issues and OpenSpec changes remain valid. New forms
  guide future issue creation but do not rewrite historical issues.
- Security: no credentials or token values are stored. GitHub Project identity
  and label/status names are non-secret configuration.

## Reuse Plan

- Product-neutral behavior belongs in issue-form structure, PR checklist
  conventions, non-secret GitHub configuration shape, and future deterministic
  validators.
- Product-specific values remain in `config/sdd-github.json`, issue metadata,
  Project field names, and repository-owned documentation.
- Claude and Codex consume the intake conventions through repository files and
  later lifecycle skills rather than duplicated platform policy.
- Portability is evaluated by keeping repository owner/name, Project identity,
  default branch, status names, and label names configurable.
- This change intentionally leaves full GitHub/OpenSpec synchronization,
  tracking validation, CI enforcement, and dependency-aware navigation to later
  milestones.
