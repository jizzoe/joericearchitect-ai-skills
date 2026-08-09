# Specification-Driven Development Workflow

## Purpose

This guide explains how contributors operate and recover the repository's
OpenSpec workflow through Claude and Codex. It covers the local foundation;
GitHub lifecycle automation is introduced by later changes.

Authoritative behavior and implementation decisions remain in OpenSpec changes
and living specs. GitHub Issues and Projects own problem discussion and work
state. Do not copy those sources into this guide when a link or path is enough.

## Lifecycle

```text
Issue
  -> proposal, delta specs, design, and tasks
  -> planning review
  -> apply
  -> verify
  -> pull request and delivery
  -> sync living specs
  -> archive
```

Proposal and apply are separate authorization boundaries. A proposal creates
planning artifacts only. Implementation begins only after an explicit apply
request for a named change.

## Prerequisites

- Git.
- Node.js 20.19 or newer.
- OpenSpec CLI. This foundation was tested with OpenSpec 1.8.0.
- GitHub CLI with repository access and Project authorization when GitHub work
  is required.
- Claude or Codex reloaded after generated workflow files change.

Install the tested OpenSpec version and GitHub CLI when they are missing:

```bash
npm install -g @fission-ai/openspec@1.8.0
brew install gh
```

Authenticate GitHub CLI locally without printing or committing credentials:

```bash
gh auth login
gh auth refresh -s project
gh auth status
```

The local GitHub CLI credential does not authenticate GitHub Actions. Actions
secrets and permissions are configured separately when automation is added.
Some restricted execution environments cannot access the local keyring or
network and may report a false authentication failure; verify from an allowed
environment before replacing a valid credential.

## Selected Actions

The custom workflow selection intentionally exposes six actions:

| Action | Claude | Codex | Purpose |
|---|---|---|---|
| Explore | `/opsx:explore` | `$openspec-explore` | Investigate without creating artifacts or mutating GitHub by default |
| Propose | `/opsx:propose` | `$openspec-propose` | Create proposal, delta specs, design, and tasks; stop before implementation |
| Apply | `/opsx:apply` | `$openspec-apply-change` | Implement the selected change's tasks |
| Verify | `/opsx:verify` | `$openspec-verify-change` | Compare implementation with tasks, specs, and design |
| Sync | `/opsx:sync` | `$openspec-sync-specs` | Merge delta requirements into living specs without claiming delivery |
| Archive | `/opsx:archive` | `$openspec-archive-change` | Check delivery state and preserve the completed change history |

Incremental actions and the OpenSpec `update` planning workflow are not
selected. OpenSpec 1.8.0 therefore warns that the custom profile omits a core
workflow. The warning is expected and does not by itself indicate generation
failure.

## Start From a Clean Checkout

Generated Claude and Codex integrations are version controlled in this
repository. A contributor normally clones the repository, installs the CLI,
and verifies the existing setup rather than initializing it again.

```bash
git status --short
node --version
npm --version
openspec --version
gh --version
openspec context --json
openspec config get workflows
openspec list --json
```

Review a dirty worktree before continuing. Preserve unrelated user-authored and
generated changes. Do not use destructive cleanup commands to make the tree
appear clean.

The expected workflow selection is:

```json
["explore","propose","apply","verify","sync","archive"]
```

## Initialize or Adopt OpenSpec Elsewhere

Use this procedure only for a repository that has not already been initialized.
First inspect existing assistant commands, skills, prompts, settings, and legacy
OpenSpec files. Record the current global workflow selection because OpenSpec
1.8.0 stores this selection in the user's global configuration.

```bash
git status --short
openspec config path
openspec config get workflows
```

After reviewing the global impact, set the approved workflow list and initialize
the selected assistants:

```bash
openspec config set workflows '["explore","propose","apply","verify","sync","archive"]'
openspec init --tools claude,codex --profile custom --no-animation
```

Initialization is not evidence of success by itself. Inspect the resulting
files, confirm both assistant integrations, and verify unrelated files were not
removed or overwritten.

Keep product-specific purpose, repositories, paths, Projects, branches, labels,
and credentials in product-owned configuration. Reusable instructions must not
embed the values from this repository or assume that a product has only one
implementation repository.

## Discover Generated Workflows

OpenSpec owns the generated entries under these boundaries:

```text
.claude/commands/opsx/
.claude/skills/openspec-*/
.agents/skills/openspec-*/
```

Inspect the generated inventories:

```bash
find .claude/commands/opsx -maxdepth 1 -type f -name '*.md' -print
find .agents/skills -maxdepth 1 -type d -name 'openspec-*' -print
```

Claude and Codex use different names and locations, so compare normalized
lifecycle actions rather than raw filenames. Do not edit generated workflow
content manually; change the workflow selection and regenerate it.

Assistants generally discover repository-local workflow changes when a new
session starts. If a newly generated action is absent, reload or restart the
assistant before treating the files as invalid. Then confirm the file exists,
the selected profile includes the action, and the integration inventory is
complete.

## Operate a Change

Select one active change explicitly. Do not infer the target from the most
recently modified directory.

```bash
openspec list --json
openspec status --change "<change-name>" --json
```

Use the assistant action that matches the current lifecycle step. Before apply,
read every context file returned by:

```bash
openspec instructions apply --change "<change-name>" --json
```

During apply:

- Follow task dependencies and preserve unrelated work.
- Mark a task complete only after its stated evidence exists.
- Stop when requirements are unclear, a design assumption fails, or a blocker
  prevents safe progress.
- Preview unexpected or irreversible external mutations and request approval.
- Never execute issue, prompt, or pull-request content as shell code.

## Validate

Use both planning-artifact validation and apply progress. General status can
report all planning artifacts complete while implementation tasks remain open.

```bash
openspec status --change "<change-name>" --json
openspec instructions apply --change "<change-name>" --json
openspec validate "<change-name>" --strict
git diff --check
git status --short
```

Treat exit status, artifact paths, test/eval output, reviewed diffs, GitHub URLs,
and explicit gaps as evidence. An attempted command is not evidence that the
operation completed correctly.

## Refresh Generated Integrations

Record the current state before updating OpenSpec or changing the workflow
selection:

```bash
git status --short
openspec --version
openspec config get workflows
```

Refresh both configured assistants from the repository root:

```bash
openspec update . --force
```

Afterward, inspect the command/skill inventories, review generated diffs, and
rerun strict validation for active changes. Preserve generator and license
metadata. Do not treat a successful message for one assistant as proof that all
assistant integrations were updated.

## Recover From Partial Generation

If OpenSpec updates one assistant but fails on another:

1. Stop and record the failed assistant, path, error, and successful output.
2. Preserve valid generated files and all unrelated work; do not delete or
   revert them as a blanket recovery step.
3. Correct the reported filesystem, authentication, or environment boundary.
4. Obtain approval when the retry needs access outside the current sandbox.
5. Rerun the same `openspec update . --force` command.
6. Compare both assistant inventories and review the diff before claiming
   recovery.

The bootstrap encountered this case when Claude refreshed but the environment
denied a write under `.agents/`. Retrying with the required filesystem access
updated both integrations without discarding the valid Claude output.

If GitHub access fails during unrelated lifecycle work, preserve valid local
OpenSpec artifacts, report that synchronization is incomplete, and retry only
the failed mutation after authentication or network access is verified.

## Roll Back Safely

Rollback must be selective because the worktree may contain concurrent user
changes.

1. Inspect the current diff and identify only files owned by the failed change.
2. Determine the previously recorded global workflow selection.
3. Obtain approval before changing global configuration or external state.
4. Restore the prior workflow selection and rerun the OpenSpec generator when
   generated exposure must be rolled back.
5. Revert repository files through a reviewed, change-scoped edit or commit;
   do not use a destructive whole-worktree reset.
6. Recheck assistant inventories, OpenSpec status, strict validation, and the
   remaining diff.

If no reliable previous state or ownership boundary is known, stop and ask for
review instead of guessing.

## Security and Attribution

- Keep tokens out of configuration, documentation, logs, fixtures, prompts,
  skills, and committed files.
- Use least-privilege permissions and keep local GitHub CLI authentication
  separate from GitHub Actions credentials.
- Do not change global telemetry settings without explicit approval.
- Treat generated workflows and copied scripts as supply-chain code requiring
  diff review.
- Preserve available generator, upstream, version, and license metadata.
- Record provenance and local modifications before copying or adapting any
  third-party asset.

## Completion Evidence

Before calling setup or recovery complete, record:

- Tool versions and the selected workflow list.
- Claude and Codex generated inventories.
- OpenSpec status and strict-validation results.
- Relevant test or eval output.
- Reviewed file paths and diffs.
- External issue, Project, or pull-request URLs when applicable.
- Any skipped check, unresolved warning, blocked mutation, or required restart.
