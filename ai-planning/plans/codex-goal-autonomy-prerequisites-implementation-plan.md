# Codex Goal Autonomy Prerequisites Implementation Plan

Date: 2026-08-09
Status: In Progress
Related plan: [OpenSpec SDD Foundation Implementation Plan](openspec-sdd-foundation-implementation-plan.md)

## 1. Outcome

Prepare the local Codex environment, GitHub credentials, repository planning
state, and owner authorization needed to run bounded long-running Goals without
changing the approval behavior of ordinary Codex sessions.

The completed setup SHALL:

- Use a named Codex profile only when explicitly selected for a session.
- Retain the workspace sandbox and route eligible escalations through Codex
  Auto-review.
- Give GitHub Actions a dedicated Project-capable secret without storing the
  token in the repository, shell history, planning documents, or logs.
- Record the exact external mutations authorized for the first live automation
  test.
- Correct stale M1-C1 planning state before autonomous work selection begins.
- Prove the setup through a bounded rehearsal before running M2 through M7.

## 2. Scope

### In Scope

- A personal named Codex profile at `~/.codex/goal.config.toml`.
- Session-specific launch and verification instructions.
- The repository Actions secret named `PROJECT_TOKEN`.
- A bounded authorization statement for disposable `[SDD test]` records.
- Updates to foundation planning and dependency state for completed M1-C1.
- Mac sleep-prevention setup for long-running work.
- A non-destructive preflight and a disposable end-to-end rehearsal.

### Out of Scope

- `danger-full-access`, `--yolo`, or globally disabling approvals.
- Storing any GitHub token in a tracked or untracked repository file.
- Automatically generating or extracting a personal access token.
- Implementing the autonomous SDD runner specified in the companion plan.
- Weakening destructive-action, credential, or material-decision gates.
- Granting unrelated repositories or workflows access to `PROJECT_TOKEN`.

## 3. Current State

As of 2026-08-09:

- M1-C1 is implemented, verified, synced, delivered, and archived.
- `main` is clean and matches `origin/main` at archive commit `f9e4f91`.
- The global Codex config does not set an explicit approval policy, sandbox
  mode, Auto-review setting, or workspace network access.
- `~/.codex/goal.config.toml` is installed with owner-only mode `600`; Codex
  `0.147.0` accepts it with strict configuration parsing.
- Personal Codex exec-policy rules allow `gh` and several Git write commands,
  but not every command needed by a long-running delivery workflow.
- GitHub CLI is authenticated as `jizzoe` with repository and Project access.
- The repository Actions secret `PROJECT_TOKEN` exists; GitHub correctly does
  not expose its value, scopes, or expiration after storage.
- The repository has no branch protection, required checks, GitHub Actions,
  active Git hooks, `AGENTS.md`, or project `.codex/config.toml` yet.
- The foundation implementation and dependency plans have been reconciled to
  show completed M1-C1 and pending M1-C2.

## 4. Resolved Setup Decisions

### PRE-DEC-001: Goal Permissions Are Session-Selected

Do not change the default permission behavior in `~/.codex/config.toml`.
Create a named profile and select it explicitly:

```bash
codex --profile goal --cd <repository-root>
```

Running `codex` without `--profile goal` SHALL retain normal everyday behavior.
Running `/goal` by itself SHALL NOT be treated as a permission change.

### PRE-DEC-002: Auto-review, Not Unrestricted Access

The Goal profile SHALL use:

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

This permits routine work inside the selected workspace and lets an independent
reviewer evaluate eligible escalations. It does not authorize destructive
actions, expand writable roots, or override repository instructions.

### PRE-DEC-003: Dedicated Repository Secret

The Project-capable personal token SHALL be stored only as the repository
Actions secret `PROJECT_TOKEN` in
`jizzoe/joericearchitect-ai-skills`.

It SHALL NOT be stored in:

- `~/.codex/config.toml` or the Goal profile.
- `.env`, `.sdd-test-output/`, fixtures, or shell scripts.
- GitHub issue, PR, Project, or Actions log content.
- A command-line argument, clipboard history record, or shell history entry.

### PRE-DEC-004: Bounded External Authorization

The owner may pre-authorize documented, expected, recoverable lifecycle
mutations. Authorization SHALL identify the repository, record types, allowed
transitions, and explicit exclusions. Unexpected, irreversible, credential,
governance, and materially ambiguous mutations still require a person.

## 5. Work Breakdown

### PRE-1: Create the Named Goal Profile

Owner approval is required once because the file is outside the repository
workspace. Codex may then create `~/.codex/goal.config.toml` with the exact
configuration in PRE-DEC-002.

Evidence:

- The file exists with mode readable only by the owner where supported.
- `codex --profile goal --cd <repo>` starts successfully.
- `/status` reports `workspace-write`, `on-request`, Auto-review, the intended
  workspace, and network availability.
- A normal `codex` session does not implicitly load the Goal profile.

Recovery:

- Stop the Goal session.
- Remove or rename `~/.codex/goal.config.toml`.
- Start Codex without `--profile goal`.

### PRE-2: Review Personal Exec-Policy Rules

Inspect `~/.codex/rules/default.rules` and identify commands expected during
the Goal:

- Read-only Git inspection and diff commands.
- `git switch`, `branch`, `add`, `commit`, `push`, `fetch`, and `pull --ff-only`.
- `gh issue`, `gh project`, `gh pr`, and read-only repository API operations.
- OpenSpec status, instructions, validation, sync, and archive commands.
- Repository test, lint, formatting, eval, and security commands as they are
  introduced.

Prefer Auto-review and narrow prefix rules. Do not add broad shell, interpreter,
deletion, force-push, reset, or arbitrary network allowances.

Evidence:

- Expected low-risk commands either run in the sandbox or receive Auto-review.
- Destructive commands continue to pause or fail closed.
- No rule permits `git reset --hard`, force-pushing a shared branch, arbitrary
  `rm`, credential reads, or security-control changes.

### PRE-3: Create the Project Token

This is a repository-owner action. Create a time-limited personal access token
classic for the personal user-owned Project with:

- `project` for Project queries and mutations.
- `public_repo` for this public repository.
- The shortest practical expiration compatible with the planned run and
  maintenance interval.

Do not reuse the GitHub CLI OAuth token or expose it to Codex. Record the token
in the password manager before closing GitHub's one-time display.

### PRE-4: Store and Verify `PROJECT_TOKEN`

From a trusted terminal, run:

```bash
gh secret set PROJECT_TOKEN \
  --repo jizzoe/joericearchitect-ai-skills
```

Paste the token only at the hidden prompt. Verify only the secret name:

```bash
gh secret list --repo jizzoe/joericearchitect-ai-skills
```

Evidence:

- `PROJECT_TOKEN` appears in the secret-name list.
- No token value appears in shell history, Git, logs, issues, or PRs.
- A later trusted dry-run workflow can query the configured Project.
- Fork and untrusted PR workflows cannot access the secret.

Rotation and recovery:

- Generate a replacement token before expiration.
- Update the same secret name.
- Revoke the old token after the replacement passes a read-only check.
- Delete the secret and revoke the token immediately if exposure is suspected.

### PRE-5: Reconcile Repository Planning State

Update authoritative planning through a reviewed repository change:

- Record M1-C1 as complete and archived.
- Record PRs #5, #6, and #7 and their delivery roles.
- Replace the stale M1 next step with M1-C2 autonomous-execution enablement.
- Add M1-C2 with sequence `102`, dependency M1-C1, and blocking relationship to
  the remaining unattended execution program.
- Keep M2-C1 and M3-C1 eligible after the new autonomy prerequisite completes.
- Preserve the existing M2-through-M7 requirements rather than duplicating
  them in the new plan.

Evidence:

- Implementation and dependency plans agree on status, order, and dependencies.
- No active OpenSpec change or issue is inferred from modification time.
- Links resolve and Markdown whitespace checks pass.

### PRE-6: Record First-Live-Mutation Authorization

Immediately before the rehearsal Goal, the repository owner SHALL provide and
record authorization equivalent to:

> I authorize this Goal to create, update, close, and retain disposable
> `[SDD test]` issues in `jizzoe/joericearchitect-ai-skills`; update their
> Project fields; create and merge verified lifecycle PRs; and delete their
> topic branches. This does not authorize repository deletion, secret
> disclosure or rotation, force-pushing shared branches, weakening security
> controls, modifying unrelated records, or inventing missing product
> decisions.

The authorization may be recorded in the Goal prompt and the appropriate
planning or handoff record. Never copy it into every issue or specification.

### PRE-7: Configure Long-Running Host Behavior

The repository owner SHALL enable **Prevent sleep while running** in Codex
settings and keep the network connection and authenticated sessions available.

Evidence:

- The setting is visibly enabled.
- A short Goal continues while the user is away from the keyboard.
- Notification settings expose pauses, denials, and completion.

### PRE-8: Run a Preflight

Start from clean, current `main`:

```bash
codex --profile goal \
  --cd /Users/joerice/git/joericearchitect/joericearchitect-ai-skills
```

Verify:

1. `/status` shows the intended profile and workspace.
2. Repository reads and writes remain scoped to the workspace.
3. GitHub read operations succeed without exposing credentials.
4. OpenSpec status and validation succeed.
5. A temporary local branch can be created and removed safely.
6. A simulated or policy-inspection test demonstrates that a disallowed
   destructive command would not execute; do not attempt real destruction.
7. Auto-review decisions are visible and actionable.

### PRE-9: Run the Disposable Rehearsal

After the bounded-autonomy capability is implemented, execute one complete
disposable lifecycle before starting all remaining milestones:

1. Create a uniquely named `[SDD test]` issue.
2. Add it to `AI Skills Development` with the expected initial status.
3. Create a minimal valid OpenSpec change.
4. Run Propose, automated planning review, Apply, Verify, delivery, Sync, and
   Archive.
5. Exercise one objective failure and demonstrate automatic correction.
6. Exercise one destructive or ambiguous request and demonstrate a human pause.
7. Confirm issue closure, `Done` Project status, merged PRs, branch deletion,
   living-spec validity, and no active test change.

Preserve the closed issue and merged PRs as evidence. Store transient local
logs only under `.sdd-test-output/`.

## 6. Responsibility Matrix

| Prerequisite | Codex can perform | Owner action required |
|---|---|---|
| Draft and validate Goal profile | Yes | Approve write outside workspace once |
| Select Goal profile | No | Launch with `--profile goal` |
| Review exec-policy rules | Yes | Approve any new narrow persistent rule |
| Generate personal token | No | Create it in GitHub and store in password manager |
| Set repository secret | Partially | Paste token at hidden prompt |
| Verify secret name | Yes | None after secret is set |
| Update repository planning | Yes | Review only if a material policy choice appears |
| Record bounded mutation authorization | No | Provide explicit authorization |
| Enable sleep prevention | No | Change Codex application setting |
| Run preflight and rehearsal | Yes | Remain available only for intended human gates |

## 7. Authoritative Setup References

- [Codex long-running work and Goal mode](https://learn.chatgpt.com/docs/long-running-work)
- [Codex configuration precedence and project/user config](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Codex sandbox and approvals](https://learn.chatgpt.com/docs/sandboxing)
- [Codex Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review)
- [GitHub Project API authentication](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects?tool=cli)
- [GitHub Actions repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets?tool=cli)

These external instructions are temporally sensitive. Recheck them before
changing scopes, approval settings, or authentication mechanisms.

## 8. Completion Gate

Prerequisites are complete only when:

- The Goal profile is selectable and does not affect ordinary sessions.
- Auto-review works without removing the workspace sandbox.
- `PROJECT_TOKEN` exists as a repository Actions secret and nowhere else in
  repository-controlled storage.
- Planning and dependency documents reflect completed M1-C1 and the M1-C2
  autonomy prerequisite.
- The bounded external authorization is recorded.
- Host sleep prevention is enabled.
- The preflight and disposable end-to-end rehearsal pass.
- All warnings, denials, retries, external URLs, and recovery evidence are
  captured without secrets.

## 9. Implementation Progress

Progress as of 2026-08-09:

| Item | Status | Evidence or remaining gate |
|---|---|---|
| PRE-1 Goal profile | Complete | Installed at `~/.codex/goal.config.toml`, mode `600`; strict config parsing passes |
| PRE-2 Exec-policy review | Complete | No new broad rules added; Auto-review remains the escalation path |
| PRE-3 Create Project token | Complete by owner | Token metadata and recovery copy remain owner-controlled; Codex cannot verify the hidden value, scopes, or expiration |
| PRE-4 Store `PROJECT_TOKEN` | Complete | Repository secret name verified through `gh secret list`; value was not read or displayed |
| PRE-5 Reconcile planning | Complete locally | Implementation and dependency plans updated on the prerequisite branch |
| PRE-6 Mutation authorization | Owner action pending | Provide immediately before the disposable rehearsal |
| PRE-7 Host behavior | Owner action pending | Enable **Prevent sleep while running** and notifications |
| PRE-8 Preflight | Partially complete | Profile syntax, file mode, base-config isolation, Git/OpenSpec state, and policy inspection checked; `/status` requires the owner-launched Goal session |
| PRE-9 Rehearsal | Blocked by M1-C2 | Run only after the bounded-autonomy capability is implemented |
