## 1. Planning and Support Boundaries

- [x] 1.1 Confirm the primary GitHub issue before delivery or retain the approved no-issue exception with an explicit delivery decision.
  - Depends on: planning review approval.
  - Evidence: [#55](https://github.com/jizzoe/joericearchitect-ai-skills/issues/55) is recorded in the proposal and will be linked by the delivery pull request.

- [x] 1.2 Inventory supported GitHub CLI, Claude Code, and Codex versions and verify the current `gh skill` command contract in a disposable environment.
  - Depends on: 1.1.
  - Evidence: a versioned fixture record captures CLI help/output, agent versions, command flags, source/ref, selected scope, and any unsupported behavior.

## 2. Canonical Metadata Contract

- [x] 2.1 Add valid `name` and `description` YAML frontmatter to every canonical `skills/base/*/SKILL.md` while preserving skill directory names and substantive instructions.
  - Depends on: 1.2.
  - Evidence: each discovered canonical skill has unique lowercase kebab-case metadata matching its directory and an activation-oriented description; wrapper policy remains thin.

- [x] 2.2 Document the canonical-skill frontmatter contract in the applicable skill-creation guidance or template.
  - Depends on: 2.1.
  - Evidence: authoring guidance identifies the required fields, directory-name rule, description expectations, and non-applicability to unrelated Markdown or generated wrappers.

## 3. Offline Validation

- [x] 3.1 Implement an offline metadata validator that dynamically discovers distributable canonical skills and reports missing/invalid frontmatter, required fields, duplicate names, and directory mismatches.
  - Depends on: 2.1.
  - Evidence: the command reads only repository content, does not execute skill instructions or access the network, and emits deterministic paths, rule IDs, and nonzero failures.

- [x] 3.2 Add valid and invalid regression fixtures and focused tests for dynamic discovery and every metadata failure class.
  - Depends on: 3.1.
  - Evidence: tests prove a newly added fixture skill is discovered without a hard-coded list, and prove precise failures for absent/invalid frontmatter, absent fields, duplicates, and mismatches.

- [x] 3.3 Wire the metadata validator into the normal local validation command and CI boundary after reviewing existing scripts and workflow ownership.
  - Depends on: 3.1, 3.2.
  - Evidence: local and CI execution invoke the same deterministic check, with no secrets, product-specific constants, or untrusted skill execution.

## 4. Installation Documentation and Fixture Evidence

- [x] 4.1 Publish the supported `gh skill` guide covering prerequisites, trust review, preview, Claude-only, Codex-only, and dual-agent user-scope installation, pinning, verification, reload, updates, troubleshooting, and explicit non-goals.
  - Depends on: 1.2, 2.1.
  - Evidence: documentation commands match the versioned fixture contract, preserve user-authored destinations, and state that the workflow does not install credentials, MCP configuration, dependencies, or product settings.

- [x] 4.2 Add disposable Claude-only, Codex-only, and dual-agent fixture flows that isolate user homes and capture source, scope, destination, discovery, and invocation evidence.
  - Depends on: 1.2, 4.1.
  - Evidence: the 2026-08-12 fixture passed isolated install/list, source, scope, destination, and discovery checks for both agents; the pre-provisioned disposable Codex profile passed invocation and cleanup for `codex-cli 0.147.0`; the pre-provisioned Claude Code profile correctly reported its unauthenticated prerequisite as blocked. The fixture rejects the current user's `$HOME`, and the guide does not claim support for an agent/version pairing until its authenticated disposable invocation passes.

- [x] 4.3 Extend fixture coverage for preview/no mutation, idempotent rerun, user-authored destination conflict, listing/update verification, paths with spaces, and a second-product source-layout fixture.
  - Depends on: 4.2.
  - Evidence: the fixture proves non-mutating source discovery, dry-run update preservation, rerun rejection, conflict preservation, listing, paths with spaces, and a second-product source layout; the separately authorized Codex run removes only its fixture skill.

## 5. Review and Delivery

- [x] 5.1 Review the change for canonical-wrapper ownership, security, portability, recovery, attribution, and absence of secrets or product-specific constants.
  - Depends on: 2.2, 3.3, 4.3.
  - Evidence: adapter-drift validation passes; `gh skill` remains the only installer; the fixture creates disposable paths dynamically and leaves real credentials untouched; the targeted secret scan finds only policy text; source links are attributable; and Claude's macOS Keychain limitation is documented rather than hidden.

- [x] 5.2 Run focused tests, documentation walkthrough fixtures, metadata validation, `openspec validate normalize-skill-metadata-and-document-global-installation --strict`, `openspec validate --all --strict`, and `git diff --check`.
  - Depends on: 5.1.
  - Evidence: 2026-08-11 runs pass the metadata validator, 11 focused Node tests, offline fixture install/list/update checks, adapter-drift check, change validation, all-spec validation (13 passed, 0 failed), artifact validation, `git diff --check`, and an authenticated disposable-profile Codex invocation; Claude Code invocation remains an explicit pending prerequisite rather than a release support claim.

- [x] 5.3 Complete formal Verify, implementation delivery, Sync, and Archive as separately authorized lifecycle checkpoints.
  - Depends on: 5.2.
  - Evidence: formal verification found no implementation gaps; implementation [PR #56](https://github.com/jizzoe/joericearchitect-ai-skills/pull/56) and Sync [PR #65](https://github.com/jizzoe/joericearchitect-ai-skills/pull/65) are merged and link `OpenSpec change: normalize-skill-metadata-and-document-global-installation`; [#55](https://github.com/jizzoe/joericearchitect-ai-skills/issues/55) is closed and its configured Project item is `Done`; this archive checkpoint preserves the completed change history.
