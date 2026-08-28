
## 2026-08-20 — Recover and plan Jira-linkage rules

**Status:** Deferred deliberately. Revisit before any Jira issue creation,
Jira-to-OpenSpec binding, or Jira-based autonomous delivery is proposed.

### Search result

A repository-wide search, including active and archived OpenSpec paths and Git
history, found no durable Jira project key, issue-linkage contract, tracker
configuration, connected Jira adapter, or implemented Jira integration.
`config/sdd-github.json`, the canonical SDD skills, runtime scripts, and
OpenSpec archive contain GitHub-specific tracking only.

### Planning evidence found

- `ai-planning/research/cross-assistant-ai-assets-best-practices.md` says an
  external issue-tracker API belongs behind an MCP server plus a skill.
- `ai-planning/research/sdlc-skills-repo-review.md` describes Atlassian
  integration as an optional pattern in a third-party reference repository.
- `ai-planning/research/builtin-ai-assets-claude-vs-codex.md` notes that
  partner skills can use Atlassian MCP connectors.
- `ai-planning/research/global-skill-master-inventory.md` treats
  GitHub/Atlassian integration as pattern-only reference material; the current
  canonical implementation remains GitHub-specific.
- `ai-planning/research/git-workflows/github-workflow-options.md` says the
  branch-name convention resembles a prior Jira scheme but is not authoritative
  GitHub linkage.
- `ai-planning/design-briefs/standards-driven-quality-skills.md` permits
  read-only public issue-tracker research; it does not define Jira mutation or
  linkage behavior.

### Required future decision

Recover the previously accepted Jira-linkage rules from their authoritative
source, then create a dedicated roadmap/design-brief slice that defines:

1. Jira as source of truth, mirror, or optional configured adapter;
2. required Jira fields, issue/epic links, and GitHub/OpenSpec/PR relationships;
3. configuration ownership, connector/authentication scopes, and secret
   handling;
4. idempotent create/reuse, reconciliation, and failure/paused behavior; and
5. which lifecycle phases may mutate Jira, under what explicit authorization,
   and what evidence closes the record.

Do not infer or create Jira records until that slice is accepted and an
authorized Jira connection is configured.

## 2026-08-27 — Host-managed reviewer binaries (strict-review prerequisite)

**Status:** Deferred. Revisit before the next strict independent review is
attempted on a fresh machine or after any `brew upgrade`/reinstall of the
reviewer CLIs.

### Background

While driving the `repair-requirements-to-plan-outcome-validation` (#244)
delivery, the strict Codex review paused fail-closed with
`independent-reviewer-codex-preflight-boundary-unavailable`. Root cause: the
parent-capture review transport (introduced by
`Repair strict review terminal event capture`, #248, commit `cb5e0d5`) now
requires the reviewer executable to pass a **managed-mutation-proof** preflight
— i.e. the binary and its whole path chain must be **system-owned and
non-writable by the current user**, in addition to the existing code-signing
check. The ordinary Homebrew install (`/opt/homebrew/Caskroom/codex/...`, owned
by the user, writable) therefore fails, even though its Apple/OpenAI signature
(`identifier "codex"`, team `2DC432GLL2`) verifies correctly.

This requirement is currently implicit in `resolveTrustedReviewerExecutable`
(`scripts/sdd/platform-review-adapters.mjs`) and is not surfaced in setup/docs.
It bit the first delivery after #248 landed.

### Follow-ups

1. **Make the host-managed-reviewer requirement very visible in the docs.**
   Document that strict review requires the selected reviewer binary to be
   (a) at a fixed trusted path, (b) code-signed by its vendor, and (c) owned by
   root/non-writable. Trusted Codex paths are `/opt/homebrew/bin/codex`,
   `/usr/local/bin/codex`, `/usr/bin/codex`. Surface this in the SDD setup and
   independent-review docs so it is not rediscovered by a fail-closed pause.

2. **Add a setup-SDD step that provisions a hardened review toolchain.** This is
   the long-term fix. Provide an idempotent provisioning path that installs and
   refreshes root-owned, non-writable copies of the whole strict-review
   toolchain — **codex** (and later **claude code** / **deepseek**) under
   `/usr/local/bin`, **node** under `/usr/local/bin`, and the review capture
   runtime (the installed runtime's `scripts/sdd` capture/contract files) under
   `/usr/local/lib/ai-skills/runtime` — each `chown root:wheel` + `chmod 0755`
   or `a-w`, verifying vendor code signatures where applicable. Wire this into
   the SDD setup skill so a fresh machine, an upgraded reviewer CLI, an upgraded
   Node, or a refreshed runtime does not silently trip the preflight. The manual
   three-step sudo sequence (codex → node → runtime) should collapse into one
   repeatable, idempotent setup command.

### Reference facts (to avoid re-deriving later)

- Preflight location: `resolveTrustedReviewerExecutable` /
  `resolveManagedHostFileIdentity` / `mutationDenied` in
  `scripts/sdd/platform-review-adapters.mjs`.
- macOS Codex requirement string: `=identifier "codex" and anchor apple generic
  and certificate 1[field.1.2.840.113635.100.6.2.6] exists and certificate
  leaf[field.1.2.840.113635.100.6.1.13] exists and certificate
  leaf[subject.OU] = "2DC432GLL2"`.
- The Homebrew `codex` binary is self-contained (links only system frameworks)
  and copies cleanly; a root-owned copy at `/usr/local/bin/codex` satisfies the
  preflight.
- **The host-managed requirement is the whole review toolchain, not just codex.**
  The parent-capture transport (`buildCodexParentStrictReviewToolRequest` →
  `prepareCodexCaptureLaunch`) additionally pins `node` (`process.execPath`),
  `codex-review-event-capture.mjs`, and `codex-review-event-contract.mjs` via
  `resolveManagedHostFileIdentity`, and requires them to be (a) non-symlink,
  (b) non-writable by the current user, and (c) loaded from OUTSIDE the active
  repository (i.e. the installed runtime). A user-writable Homebrew `node` and a
  user-writable runtime both fail (`independent-reviewer-codex-capture-identity-unavailable`,
  `independent-reviewer-codex-capture-active-workspace-denied`).
- Homebrew `node` is a thin wrapper (`bin/node`, ~50 KB) that loads
  `@rpath/libnode.147.dylib`. Hardening it requires copying BOTH
  `Cellar/node/<ver>/bin/node` → `/usr/local/bin/node` AND
  `Cellar/node/<ver>/lib/libnode.147.dylib` → `/usr/local/lib/`. Its
  openssl/icu4c dependencies remain absolute Homebrew paths and still resolve,
  so no extra copy is needed for those.
- `codex` is not a single binary: it is a package whose entrypoint spawns
  `codex-code-mode-host` and uses a bundled zsh fork and ripgrep. Hardening it
  requires copying the whole package to the `/usr/local` root —
  `bin/codex`, `bin/codex-code-mode-host`, `codex-resources/` (zsh fork),
  `codex-path/` (rg), and `codex-package.json`. Missing `codex-code-mode-host`
  makes codex emit a code-mode error item and stop before `turn.started`
  (`codex-jsonl-turn-start-missing`).
- **Trust-boundary gap:** the preflight pins/code-signature-verifies the
  `codex` entrypoint but NOT the `codex-code-mode-host` child binary that codex
  spawns. A substituted `codex-code-mode-host` is not checked. The setup step
  should pin/verify the whole package (entrypoint + code-mode-host + zsh + rg),
  not just `bin/codex`.


## 2026-08-27 — Claude as degraded backup reviewer is not wired into the shorthand

**Status:** Deferred. Revisit before relying on Claude as a fallback reviewer.

**Finding:** Under `ship-sdd prod`, `reviewPolicy` resolves to `strict-only`,
which has no degraded fallback — Codex unavailability fails closed (there is no
automatic Claude backup). Claude is implemented as a reviewer adapter
(`claude-detached-restricted-v1`) with a `read-search-tools-only` boundary that
produces `authorized-degraded` (not `strict-isolated`) results. Enabling it as a
fallback requires a `strict-first-degraded` authorization, which the `ship-sdd`
shorthand does not expose (`prod` = `strict-only`, `prototype` =
`same-session-local`). The resolved authorization reports
`degradedFallbackAuthorized: false`.

**Follow-up:** Add a `strict-first-degraded` profile/shorthand (or document how
to request it explicitly) so the owner can opt into "Codex strict first, Claude
degraded fallback on strict unavailability" without hand-editing the request.
Also note that Claude hardening (root-owned copy) is optional today because the
mutation-proof preflight is Codex-only.

## 2026-08-28 — #244 delivered end-to-end; controller terminalization deferred

**Status:** Delivery complete. One bookkeeping follow-up remains.

### Delivered

- Implementation PR #253 (squash `7f22f8c`), Sync PR #254 (squash `6e81ddd`),
  and Archive PR #255 (squash `bd8cbba`) all merged to `main`; topic branches
  deleted. `origin/main` is `bd8cbba`.
- Strict isolated Codex review passed at each checkpoint (0 findings at the
  final implementation, Sync, and Archive heads). Review surfaced and resolved
  real objective-fix/high findings along the way, including the anchored-pattern
  prefix bypass, untrusted `candidate.outcome` in the plan, and duplicate
  accepted-outcomes section.
- Issue #244 is `CLOSED`; the `AI Skills Development` project item is `Done`.
- The change bundle is archived at
  `openspec/changes/archive/2026-08-28-repair-requirements-to-plan-outcome-validation/`;
  `openspec list` reports no active changes.
- Living `sdd-requirements-to-plan` spec now carries the three new
  outcome-validation requirements (11 requirements total).
- Runtime and skills rebuilt and installed from `bd8cbba`;
  `ai-skills-runtime doctor` reports `ok: true`, `available`,
  `contentVerified: true`, and an empty compatibility list. The installed
  `research-planning-skill-runtime` wrapper injects `validateRequirementsOutcomesV1`.

### Follow-up: controller `terminalize-v2-run` not executed

The v2 controller run `controller-1589ad768790685879f89c72fa3aae6f` was
initialized (`currentPhase: propose`) but the lifecycle phases and delivery
bindings were advanced manually outside the controller (parent review scripts +
`gh`), so the controller checkpoint was left stale. `terminalize-v2-run`
requires a full reconstructed `completionEvidence` (implementation/sync/archive
delivery bindings, delivered head commits, issue/Project state, and a matching
terminal summary), which was not reconstructed. A future run should either
advance the controller phases/bindings as it goes, or reconcile this run to
terminalized via the controller with the archived delivery evidence. No stray
delivery resources remain: the four session worktrees and three local topic
branches were removed (previous sessions' prunable worktrees and the dirty
`244-fix-requirements-to-plan-runtime-outcome-validation` branch were left
untouched).

