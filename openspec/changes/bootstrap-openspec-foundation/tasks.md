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

- [ ] 3.2 Link the focused SDD workflow guide from `README.md` and clarify the repository's Claude/Codex purpose without duplicating the guide.
  - Depends on: 3.1
  - Parallel with: 4.2
  - Evidence: the root README provides a working link and a concise entry point for contributors.

## 4. Cross-Assistant and Portability Verification

- [ ] 4.1 Normalize the generated Claude and Codex workflow inventories and verify parity for the six selected actions and absence of deselected or incremental workflows.
  - Depends on: 1.3
  - Parallel with: 3.1
  - Evidence: recorded inventory comparison identifies no missing or extra normalized lifecycle action.

- [ ] 4.2 Verify generated ownership/provenance metadata and confirm unrelated assistant configuration and pre-existing user changes remain untouched.
  - Depends on: 1.3
  - Parallel with: 3.2
  - Evidence: reviewed Git diff distinguishes generated OpenSpec changes from preserved `.claude/settings.local.json`, planning work, and `ai-planning/prompts/skill-ideas.txt`.

- [ ] 4.3 Review configuration and documentation against a second-product, multi-repository scenario and check for embedded repository owner, Project number, credentials, or product-domain constants in reusable guidance.
  - Depends on: 2.2, 3.1
  - Parallel with: none
  - Evidence: portability review records product-neutral steps, product-owned configuration, and any intentional product-specific references.

- [ ] 4.4 Verify assistant discovery after reload or restart and confirm the documented stale-discovery recovery path for both Claude and Codex.
  - Depends on: 3.1, 4.1
  - Parallel with: none
  - Evidence: both assistants identify the selected actions, or an explicit environment limitation and recovery result is recorded.

## 5. Validation, Review, and Completion Evidence

- [ ] 5.1 Run OpenSpec status and strict validation for `bootstrap-openspec-foundation`, plus repository formatting/link checks that are available without adding dependencies.
  - Depends on: 2.2, 3.2, 4.1
  - Parallel with: 4.3
  - Evidence: command outputs and exit statuses are summarized; every failure or skipped check has an actionable explanation.

- [ ] 5.2 Review the implementation against both delta specs and the design, including security, attribution, recovery, maintainability, and Claude/Codex portability.
  - Depends on: 4.2, 4.3, 4.4, 5.1
  - Parallel with: none
  - Evidence: verification report maps requirements and scenarios to files and commands and records critical issues, warnings, suggestions, and known gaps.

- [ ] 5.3 Update the M1-C1 issue with final evidence and deferred M2/M3 backfill, then prepare the change for pull-request review without syncing or archiving before delivery.
  - Depends on: 5.2
  - Parallel with: none
  - Evidence: issue #2 links the reviewed artifacts and verification evidence; Project/label/tracking deferrals are explicit; no premature archive or delivery claim exists.
