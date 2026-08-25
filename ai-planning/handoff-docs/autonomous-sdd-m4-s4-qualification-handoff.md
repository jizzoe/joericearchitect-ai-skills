# M4-S4 Qualification — Session Handoff

## Goal

Qualify **single-change autonomous SDD reliability** (M4-S4): build the
qualification machinery, then run a **10-skill real-completion campaign** plus a
**disposable fault-matrix gate** in production autonomous mode. Acceptance: 10
clean real completions + a passing fault-matrix gate.

Profile: `ship-sdd <change> prod` resolves to autonomous production-rapid
**strict-only** independent review for the real-work gate (no degraded fallback;
strict-unavailable = fail-closed pause).

## What this session accomplished

1. **Run #1** (`add-claude-cross-tool-repo-hygiene`) was attempted and surfaced
   the campaign's central blocker: **both strict reviewers failed closed**. It
   also turned out to be a **duplicate** of the already-archived
   `2026-08-18-add-claude-cross-tool-repo-hygiene`, so it does **not** count as
   a clean completion (0 clean completions so far).

2. **All five machinery defects were fixed and delivered**:

   | Finding | Defect | Delivered via |
   |---|---|---|
   | #2 | runtime passed `claude` to `gh skill list` (needs `claude-code`) | #241 / PR #242 |
   | #3 | runtime tests never validated the `gh` arg vector | #241 / PR #242 |
   | #4 | codex `permissions.sealed-review` profile → `sandbox-exec` re-exec denied | #239 / PR #240 |
   | #5 | findings schema declared draft 2020-12 (Claude `--json-schema` rejects) | #239 / PR #240 |
   | #7 | Claude reviewer had no isolated auth provisioning | #239 / PR #240 |

3. **Strict review re-verified end-to-end** (see below) — produced a valid
   `strict-isolated` result, and the reviewer **caught a real coverage gap**
   (#8, fixed: `install-runtime.test.mjs` stub now asserts the mapped `claude-code`
   id + `--json skillName,version,pinned` vector).

4. **Delivered** two changes through the full SDD lifecycle (propose → apply →
   verify → review → PR → squash-merge → sync → archive):
   - `repair-independent-review-adapters` (PR #240)
   - `repair-runtime-gh-agent-mapping` (PR #242)

`origin/main` is at `7dc2170`.

## Current state

- **Strict reviewers work**: Codex (`--sandbox read-only`) and Claude
  (draft-07 schema + `prepareClaudeReviewerEnvironment`) both complete.
- **0 clean completions** recorded — the campaign still needs 10.
- Findings log: `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`
  (findings #1–#8, all resolved except #1 observation).
- A disposable fault-matrix gate exists in `scripts/sdd/autonomous-sdd-qualification.mjs`
  (M4-S4 machinery) but has **not** been run against the `sdd-fixture` repo yet.

## The strict review machinery (how to run a real review)

The working sequence (all in `scripts/sdd/`), verified this session:

1. `buildReviewPackage({ repositoryPath, baseCommit, headCommit, artifactPaths, validationEvidence })`
   — `independent-review-contract.mjs`. Requires full 40-char canonical commit SHAs.
2. `createArchivedReviewView({ repositoryPath, headCommit })` — `detached-review-view.mjs`.
3. `writeReviewPackageForView(view, pkg.package)` — `platform-review-adapters.mjs`.
4. `runCodexReviewAdapter({ reviewPackage, view, schemaPath, resultPath, reviewer, attestationRef, executable: "codex" })`
   — the strict codex adapter (uses `--sandbox read-only`).
5. `sealCodexStrictReviewPayload({ payload, reviewPackage, reviewer, reviewPath })`
   — seals the raw findings payload into a `strict-isolated` result.
6. `validateReviewResult(result, { expectedPackage, configuredReviewer, implementerSession })`
   — returns `{ valid: true }` for a good strict result.

A working throwaway driver is at `/tmp/strict-review-driver.mjs` (not committed).
The reviewer `identity` must differ from the `implementerSession` (anti-self-review).

## Campaign mechanics

- **10-run threshold** (Q1, approved): accumulate 10 clean real completions,
  each a full SDD lifecycle in the real repo with a working strict review.
- **Fault-matrix gate** (Q2, drafted): disposable fault injection in the
  `sdd-fixture` repo (evidence-only, not a keeper).
- **Pause conditions** (broader than "material decision + uncorrectable failure"):
  ambiguous durable state, in-doubt external outcome, host/permission denial,
  missing credential, unexpected scope expansion, destructive action outside
  plan, secret-leak risk, behavior-changing validation failures.
- **Backlog order** (agreed): after run #2, continue the job-search backlog —
  `linkedin-job-lead-intake`, `gmail-job-lead-intake`,
  `company-and-role-research`, `job-search-post-review-processing`.

## Next steps for the new session

1. **Start run #2**: `generic-git-repository-cleanup` (this repo) in prod
   autonomous mode. This is the first candidate for a *clean* completion.
2. **Close the unarchived `job-discovery-and-verification` change** in the
   `job-search-workflows-and-skils` repo before any job-search runs.
3. **Continue the backlog** until 10 clean completions accumulate.
4. **Run the disposable fault-matrix gate** in `sdd-fixture`; after it and the
   10 completions both pass, update the roadmap + M4-S4 qualification record.

## Key files and commands

- Qualification log: `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`
- Roadmap: `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md`
- Review machinery: `scripts/sdd/{platform-review-adapters,independent-review-contract,detached-review-view}.mjs`
- Runtime probe: `scripts/runtime/{launcher,install-runtime}.mjs`
- Validate: `openspec validate --all --strict`
- Archive a completed change: `openspec archive <change-name> --yes`
- Delivery: branch → `gh pr create` (body links issue + `OpenSpec change: <name>`) →
  `gh pr merge --squash --delete-branch` → `openspec archive` → commit + push.

Gotcha learned: when delivering, **always branch from `origin/main`** (not a
local `main` that holds unpushed commits) or unrelated local commits get folded
into the squash merge.
