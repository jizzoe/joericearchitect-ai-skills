## 1. Bootstrap State and Work Identity

- [x] 1.1 Verify repository, tool, OpenSpec, assistant-integration, and GitHub Project baseline state without modifying existing user work.
  - Depends on: none
  - Parallel with: none
  - Evidence: recorded versions for OpenSpec 1.8.0, Node.js 26.7.0, npm 11.19.0, and GitHub CLI 2.97.0; empty OpenSpec change list before creation; Project 1 read-only inventory; preserved dirty-worktree inventory.

- [x] 1.2 Create roadmap issue #1 and primary M1-C1 issue #2, then attach #2 as a native sub-issue without adding premature M2 labels or Project status.
  - Depends on: 1.1
  - Parallel with: none
  - Evidence: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1 and https://github.com/jizzoe/joericearchitect-ai-skills/issues/2; roadmap reports one open sub-issue; Project 1 remains unchanged for later backfill.

- [x] 1.3 Configure the exact six-action OpenSpec workflow selection and regenerate OpenSpec-managed Claude and Codex exposure.
  - Depends on: 1.1
  - Parallel with: none
  - Evidence: `openspec config list --json` reports `explore`, `propose`, `apply`, `verify`, `sync`, and `archive`; generated inventories contain Claude and Codex verification entries and omit the deselected update entries; the protected Codex-path retry completed successfully.

## 2. Repository Context and Artifact Rules

- [x] 2.1 Replace the generated `openspec/config.yaml` context scaffold with concise product boundaries, supported assistants, canonical asset locations, and source-of-truth ownership.
  - Depends on: 1.3
  - Parallel with: none; task 2.2 edits the same file
  - Evidence: parsed configuration contains the required context and does not embed secrets or unrelated product requirements.

- [x] 2.2 Add proposal, specification, design, task, apply, and archive guidance covering quality, evidence, security, attribution, portability, recovery, stable task IDs, and explicit stop behavior.
  - Depends on: 2.1
  - Parallel with: none; task 2.1 edits the same file
  - Evidence: `openspec instructions` exposes the intended constraints for each configured artifact or operation without copying the full requirements baseline.

## 3. Contributor Workflow Documentation

- [x] 3.1 Add `docs/sdd-workflow.md` with prerequisites, selected actions, initialization, discovery, validation, refresh, permission-failure recovery, and rollback procedures.
  - Depends on: 2.2
  - Parallel with: 4.1
  - Evidence: a clean-environment walkthrough can follow the documented commands without requiring undisclosed state or credentials.

- [x] 3.2 Link the focused SDD workflow guide from `README.md` and clarify the repository's Claude/Codex purpose without duplicating the guide.
  - Depends on: 3.1
  - Parallel with: 4.2
  - Evidence: the concise root README identifies the Claude/Codex asset scope, and its relative link resolves to `docs/sdd-workflow.md`.

## 4. Cross-Assistant and Portability Verification

- [x] 4.1 Normalize the generated Claude and Codex workflow inventories and verify parity for the six selected actions and absence of deselected or incremental workflows.
  - Depends on: 1.3
  - Parallel with: 3.1
  - Evidence: normalized Claude commands, Claude skills, and Codex skills each equal `apply`, `archive`, `explore`, `propose`, `sync`, and `verify`; no missing, extra, deselected, or incremental action was found.

- [x] 4.2 Verify generated ownership/provenance metadata and confirm unrelated assistant configuration and pre-existing user changes remain untouched.
  - Depends on: 1.3
  - Parallel with: 3.2
  - Evidence: all generated Claude/Codex skills retain MIT, OpenSpec author, and generator 1.8.0 metadata; generated commands retain OpenSpec workflow markers; within generated integration paths, the bootstrap commit replaces only `update` exposure with `verify`. The tracked `ai-planning/prompts/skill-ideas.txt` is byte-identical to the parent commit. The ignored `.claude/settings.local.json` was created after the bootstrap commit, is absent from both Git trees, and now has SHA-256 `561a6234bfc3d4ae78d88ab609f8e0c178d9bb4028e8b01fcb9b9ab22fde73d9` as a forward preservation baseline.

- [x] 4.3 Review configuration and documentation against a second-product, multi-repository scenario and check for embedded repository owner, Project number, credentials, or product-domain constants in reusable guidance.
  - Depends on: 2.2, 3.1
  - Parallel with: none
  - Evidence: a conceptual second product with a different owner, Project, and multiple implementation repositories can use the documented relative-path and configured-input procedure unchanged. Reusable guidance and generated integrations contain no embedded owner, Project number, credential, branch, or product-domain constant; repository purpose, boundaries, and canonical paths remain intentionally product-specific in `openspec/config.yaml` and `README.md`.

- [x] 4.4 Verify assistant discovery after reload or restart and confirm the documented stale-discovery recovery path for both Claude and Codex.
  - Depends on: 3.1, 4.1
  - Parallel with: none
  - Evidence: this Codex session exposes all six generated OpenSpec skills. A fresh Claude Code 2.1.220 startup loaded six project skills and six legacy project commands and watched both generated directories; API-level enumeration was unavailable because Claude was not logged in, but local discovery completed before authentication. The guide directs both assistants to start a new session or reload/restart, then verify the file, selected profile, and complete inventory before diagnosing invalid generation.

## 5. Validation, Review, and Completion Evidence

- [x] 5.1 Run OpenSpec status and strict validation for `bootstrap-openspec-foundation`, plus repository formatting/link checks that are available without adding dependencies.
  - Depends on: 2.2, 3.2, 4.1
  - Parallel with: 4.3
  - Evidence: OpenSpec status, strict validation, and every configured artifact/operation instruction succeeded; exact six-action inventory parity, generated provenance, relative Markdown links, balanced code fences, `git diff --check`, and credential-pattern scans passed. No repository-provided formatter, Markdown linter, package test runner, or build target exists, so no additional project command was available without adding dependencies.

- [x] 5.2 Review the implementation against both delta specs and the design, including security, attribution, recovery, maintainability, and Claude/Codex portability.
  - Depends on: 4.2, 4.3, 4.4, 5.1
  - Parallel with: none
  - Evidence: `verification-report.md` maps all 19 delta-spec scenarios and all five design decisions to files and executed commands; it reviews security, attribution, recovery, maintainability, and portability and records the initially incomplete task 5.3 as a resolved critical finding, the Claude login limitation as a warning, later validation automation as a suggestion, and all known gaps.

- [x] 5.3 Update the M1-C1 issue with final evidence and deferred M2/M3 backfill, then prepare the change for pull-request review without syncing or archiving before delivery.
  - Depends on: 5.2
  - Parallel with: none
  - Evidence: [issue #2 evidence comment](https://github.com/jizzoe/joericearchitect-ai-skills/issues/2#issuecomment-5230092221) links the reviewed artifacts, verification evidence, explicit M2/M3 deferrals, and the original draft PR #3. That PR was closed unmerged when [replacement PR #5](https://github.com/jizzoe/joericearchitect-ai-skills/pull/5) moved delivery to issue-numbered branch `feature/2-bootstrap-openspec` targeting `main`. PR #5 formally closes issue #2 when merged. At the task 5.3 checkpoint, the issue remained open, the replacement PR remained draft, and no Project mutation, sync, archive, or delivery claim had occurred.
