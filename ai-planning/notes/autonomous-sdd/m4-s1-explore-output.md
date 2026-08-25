# M4-S1 Explore Output — GitHub Intake and Implementation Delivery

Date: 2026-08-24
Change: `integrate-autonomous-sdd-github-delivery`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M4-S1 makes GitHub intake and implementation delivery one idempotent,
recoverable transition chain: exact issue, Project, branch, PR, check, merge,
closure, and status operations converge without duplicate or unrelated mutation.
The two open questions from the M4-S1 brief §6 are:

1. Select and prove a disposable GitHub repository/account strategy.
2. Finalize field-level ownership for issue, PR, and Project updates.

Both are owner decisions. This note records the evidence-derived
recommendations and the live proof gathered on 2026-08-24, for owner review
before Propose. No implementation is authorized by this note.

Live state (re-inspected 2026-08-24): on `main` (`f750389`), working tree clean
except three unrelated untracked dirs (`.continue/`,
`docs/research/aidlc/cloud-deployed-sdd-framework/`, `docs/research/security/`).
OpenSpec reports no active changes. `ai-skills-runtime doctor` reports
`ok: true` / `classification: available` (runtime `runtime-cfd993c706d6`, source
`c9e128f…`, contentVerified). M3-S1/S2/S3 delivered and archived; the M3
dependency is satisfied.

## Open question resolutions

### Q1 — Disposable GitHub repository/account strategy

**Answer (recommended middle ground — pending owner confirmation).** Use **two
credentials on the existing `jizzoe` account**, selected per-operation via the
existing `selectedEntry` field in `github-cli-auth-context.mjs` and
`issue-intake-binding.mjs`. No new account is required.

| Credential | Type | Scope | Covers |
|---|---|---|---|
| `sdd-fixture-token` | Fine-grained PAT | "Only select repositories" → `jizzoe/sdd-fixture-main`, read-write on `Contents`/`Issues`/`Pull requests` | Issue create/close, branch, PR create/update, merge |
| `sdd-fixture-project-token` | Classic PAT, `project` scope only | Projects (v2), no repo content | `project.itemAdd`, `project.setStatus` |

Rationale for the split: GitHub fine-grained PATs do **not** expose a
"Projects" permission in the account or repository permission UI (verified on
2026-08-24). Projects (v2) access still requires the classic `project` scope.
Keeping Project access on a *separate* classic token with only `project` scope
preserves least-privilege: that token cannot touch repo content.

**Live proof captured (2026-08-24):**

- Fine-grained token is in use (no `x-oauth-scopes` response header, unlike the
  keyring classic token which returns `gist, project, read:org, repo`).
- Real repo (`jizzoe/joericearchitect-ai-skills`) is protected:
  - `GET /repos/…/hooks` → `403` (no admin).
  - `GET /repos/…/collaborators` → `403` (no push).
- Classic `project`-only token cannot read repo content:
  - `GET /repos/jizzoe/sdd-fixture-main` → `404` ("needs the 'repo' scope").

Lesson recorded: the `.permissions` object in a repository response is **not**
a reliable isolation signal for fine-grained PATs. It reported `admin: true` on
the real repo even though operation-level enforcement returned `403`; the field
reflects the account's ownership relationship, not the token's granular scope.
Isolation evidence must come from operation-level probes (`hooks`,
`collaborators`, repo-content read), not from `.permissions` metadata.

Remaining setup before fixture use:

- A **disposable fixture Project** (user-owned, named "sdd-fixture") so the real
  Project `jizzoe` #1 "AI Skills Development" is never mutated by fixtures.
- `config/sdd-github.json` (or a fixture profile) points at
  `jizzoe/sdd-fixture-main` + the fixture Project; bindings set `selectedEntry`
  to the correct keychain entry per operation family.
- Both tokens live in the macOS keychain under distinct entries; the controller
  never sees a token — the authenticated host retrieves the entry and passes it
  as `GH_TOKEN` for the single `gh` subprocess.

Alternatives considered and rejected/deferred:

- **Dedicated disposable account (Option B)** — strongest structural isolation,
  reusable for M4-S4 fault-matrix and M7-S2 soak, but adds account/2FA/token
  management. Not required for contract-only M4-S1; re-evaluate before M4-S4.
- **Existing broad keyring token** — rejected: `repo` scope is account-wide; it
  returned `admin: true` on the real repo and would violate least-privilege.
- **Simulated/non-mutating adapters only** — rejected: cannot prove real merge,
  branch-retention restoration, or remote-success/local-receipt-loss, which
  M4-S1 acceptance evidence requires.

### Q2 — Field-level ownership for issue, PR, and Project updates

**Answer (recommendation — pending owner confirmation).** Formalize a
**delimited-block + field allowlist** model, seeded from the existing helpers:

- **Issue** — system owns: exact title (create-or-reuse match), the managed
  block delimited by `managedIssueBlockMarkers`
  (`<!-- sdd-managed:start -->` / `<!-- sdd-managed:end -->`), and the managed
  label set. Human owns: all other body content, all other labels, assignees,
  milestone, comments. Precedent:
  `renderManagedIssueBlock` / `replaceManagedBlock` in
  `scripts/github/lib/issues.mjs` already preserve text outside the block.
- **Project** — system owns: the single configured `statusField`
  (name → allowed options) and item add/remove for the exact work unit. Human
  owns: all other fields and field definitions. Precedent:
  `planSetProjectStatus` in `scripts/github/lib/projects.mjs` validates the
  status against the field's options only.
- **Pull request** — system owns: PR creation (title/body derived from the
  change), the topic branch, and the status mapping from PR events. Human owns:
  PR body edits, reviewers, other labels, comments. Trust gate:
  `classifyPullRequestTrust` restricts Project mutation to same-repository PRs
  only.

Each adapter request then declares an **ownership scope** (the exact managed
fields), and writes only those fields, via exact identity + precondition digest,
never overwriting human-owned content. This satisfies the M4-S1 acceptance
criterion "unrelated human issue/PR text and repository settings remain
unchanged" and the constraint "preserve human fields."

Open sub-item to settle at Propose: the exact enumeration of PR-update fields
on retry (which derived fields may be updated vs. preserved).

## Owner sign-off and authorization (2026-08-24)

- Q1 (two-token fixture strategy) — **signed off**.
- Q2 (delimited-block + field-allowlist ownership) — **signed off**.
- Disposable fixture Project **"sdd-fixture"** created in GitHub.
- Owner explicitly authorized **M4-S1 delivery in autonomous mode** through to
  spec change close and cleanup.

Delivery remains governed by the handoff guardrails: delivered by the **pre-v2
lifecycle** (never the v2 controller), **contract-only/audit**, no real
ownership activation or production Apply before the full activation bundle and
M4-S4 qualification.
