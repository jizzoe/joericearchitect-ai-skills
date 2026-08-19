# Global Skill Installation

Install the repository's canonical skills **and their matching shared SDD
runtime** as one reviewed pair. `gh skill` copies skill packages and records
source metadata; it does not ship the executable helpers those packages call,
so a skill-only installation reports success and then pauses on a missing
helper. The paired installer in this guide installs both halves together.

Installation does not configure Claude Code, Codex, OpenSpec, MCP servers,
credentials, approvals, PATH, or product settings.

## Prerequisites

- GitHub CLI with `gh skill` available. This guide was exercised with `gh`
  `2.97.0`.
- Node 20 or newer. The runtime and both installers preflight it and report a
  stable unavailable result rather than installing or configuring Node.
- Claude Code `2.1.220` and/or Codex CLI `0.147.0` installed separately.
- GitHub authentication when required by the source or rate limits. Do not put
  credentials in skill files or command history.

`gh skill` is preview behavior. Check the installed command contract first:

```bash
gh skill install --help
```

## Bootstrap the Installer

Obtain the installer from a release artifact and verify its attestation before
running it. `gh` is already a prerequisite, so this adds no dependency and
supplies real release-integrity evidence:

```bash
gh release download <release-tag> \
  --repo jizzoe/joericearchitect-ai-skills \
  --pattern 'ai-skills-*.tar.gz'

gh attestation verify ai-skills-<release-tag>.tar.gz \
  --repo jizzoe/joericearchitect-ai-skills

tar -xzf ai-skills-<release-tag>.tar.gz
```

Piped remote execution (`curl | bash`) is not supported: it contradicts the
review-before-install posture the rest of this guide depends on.

## Review Before Installation

Skills are executable operational guidance. Preview each skill and inspect its
referenced files and scripts before installing it. Pin a release tag or commit
SHA for reproducibility.

```bash
gh skill preview \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-pr-linkage@<release-tag-or-commit-sha>
```

Do not replace `<release-tag-or-commit-sha>` with an unreviewed ref. Omit the
suffix only when intentionally installing the repository's default branch.

## Install the Pair

Use the paired installer. It builds or obtains the runtime matching the exact
selected source revision, delegates skill installation to the repository's
existing `gh` wrapper, activates the runtime atomically, and prints one
machine-readable receipt.

```bash
# Pinned remote source, both agents.
scripts/install-ai-skills.sh \
  --remote jizzoe/joericearchitect-ai-skills \
  --pin <release-tag-or-commit-sha> \
  --agent claude --agent codex

# Reviewed local checkout.
scripts/install-ai-skills.sh --local "$(pwd)" --agent claude

# Report the receipt without changing anything.
scripts/install-ai-skills.sh --local "$(pwd)" --agent claude --dry-run
```

`scripts/install-ai-skills.sh` is the POSIX entrypoint. On Windows use
`scripts/install-ai-skills.ps1`, which takes the same options as PowerShell
parameters (`-Local`, `-Remote`, `-Pin`, `-Agent`, `-Force`, `-DryRun`) and
emits the same receipt fields. Both reproduce the same receipt contract, which
the Node installer owns; running the Bash entrypoint under a Windows POSIX
emulation layer is not supported.

A remote source must be pinned to a tag or commit SHA; an unpinned remote
source is refused rather than resolved to whatever the default branch holds. An
unclean local checkout is refused unless you pass the documented
`--allow-dirty-source` development override.

The receipt records the selected agents, source kind and revision, runtime
digest, contract version, `mode`, installed paths, activation state, overwrite
intent, and the prior skill pin needed for rollback.

### Runtime location and PATH

The runtime installs under `~/.ai-skills` (`%USERPROFILE%\.ai-skills` on
Windows):

```
~/.ai-skills/
├── bin/ai-skills-runtime          # launcher shim
└── runtime/
    ├── active.json                # non-secret active runtime metadata
    ├── installed.json             # append-only history, the ordering authority
    ├── runtime-<digest12>/        # active version
    └── runtime-<digest12>/        # retained prior version
```

**The installer never edits a shell startup file and never changes PATH.** It
reports whether `~/.ai-skills/bin` is already reachable and, when it is not,
prints the exact entry to add yourself:

```bash
export PATH="$HOME/.ai-skills/bin:$PATH"
```

### Skills without the runtime

Install every canonical skill for one agent at user scope with `gh` directly
when you only want the skill half. This is not a complete installation: skills
installed this way pause on a missing helper until a matching runtime is
present.

```bash
gh skill install \
  jizzoe/joericearchitect-ai-skills \
  --all \
  --agent claude-code \
  --scope user \
  --pin <release-tag-or-commit-sha>

gh skill install \
  jizzoe/joericearchitect-ai-skills \
  --all \
  --agent codex \
  --scope user \
  --pin <release-tag-or-commit-sha>
```

Run one command for Claude Code, one for Codex, or both. To install one skill,
replace `--all` with its explicit path, for example
`skills/base/github-pr-linkage@<release-tag-or-commit-sha>`.

`autonomous-sdd-delivery` requires the sibling
`autonomous-sdd-lifecycle` package. Use `--all` for the complete autonomous SDD
flow. A delivery-only installation is incomplete and must pause if its
`../autonomous-sdd-lifecycle/SKILL.md` reference does not resolve from the
installed skill directory.

Do not add `--force` as routine maintenance. It overwrites the existing skill.
Stop and inspect a conflict or user-authored destination before choosing an
explicit replacement strategy.

## Utility Commands

For a repeatable development command, use the repository utility. It is a thin
argument-safe wrapper around `gh skill install`; `gh` remains responsible for
copying skills, provenance, conflict handling, and destinations.

Install or refresh a local checkout during development. Local changes are
copied, not linked, so rerun this explicit command with `--force` after each
edit you want to test, then start a new agent session.

```bash
node scripts/skills/install-global-skill.mjs \
  --local . \
  --skill skills/base/github-pr-linkage \
  --agent codex \
  --force
```

Install every skill from a reviewed remote revision. Replace the pin with a
reviewed release tag or commit SHA from `main`; do not treat an unreviewed
branch name as a reproducible release identifier.

```bash
node scripts/skills/install-global-skill.mjs \
  --remote jizzoe/joericearchitect-ai-skills \
  --all \
  --agent codex \
  --pin <reviewed-release-tag-or-main-commit-sha>
```

The remote source may be unpinned, but the utility prints a warning because
GitHub CLI then resolves its normal mutable version. Preview any command
without starting `gh`:

```bash
node scripts/skills/install-global-skill.mjs \
  --local . \
  --all \
  --agent claude-code \
  --dry-run
```

Use `--help` to see the required explicit source, skill selection, and agent.
The utility always passes `--scope user`; it never configures credentials,
profiles, or project-scope skills. Direct `gh skill install` commands remain a
supported alternative.

## Verify and Activate

Check the pair first. `doctor` reports installed skill revision, runtime
revision, contract compatibility, Node version, and activation state as one
machine-readable record:

```bash
ai-skills-runtime doctor
ai-skills-runtime doctor --agent claude --agent codex
```

A contract-version mismatch is a fail-closed pause with the required and active
versions. A source-revision difference within one satisfied contract version is
reported and not fatal, so Claude Code and Codex may hold different skill
revisions and still share one runtime. Run `doctor` once per session rather
than revalidating on every dispatch.

Dispatch a helper through the launcher with an explicit absolute target:

```bash
ai-skills-runtime run sdd-lifecycle-hygiene \
  --repository "$(pwd)" -- --stdin <<< '{"operation":"build-lifecycle-reconciliation-report","payload":{}}'
```

The launcher accepts only manifest-declared helpers and verbs, requires an
absolute canonical target that is a Git work tree root, and makes no
authorization decision: helper-level checks remain the only authority.

Then list the recorded skill installations and confirm the source URL, user
scope, pin, version, and path:

```bash
gh skill list --agent claude-code --scope user \
  --json skillName,sourceURL,scope,version,pinned,path

gh skill list --agent codex --scope user \
  --json skillName,sourceURL,scope,version,pinned,path
```

With `gh 2.97.0`, user-scope destinations were observed as
`~/.claude/skills` for Claude Code and `~/.codex/skills` for Codex. Treat
paths as version-sensitive output from `gh skill list`, not as a path to
hard-code in scripts.

Start a new Claude Code or Codex session after installation. Invoke one known
skill in each selected agent and confirm it loads from the listed path. The
repository's disposable fixture verifies install/list behavior without using a
real user profile; a release support claim additionally requires invocation in
an authenticated disposable profile.

For autonomous SDD, confirm both `autonomous-sdd-delivery` and
`autonomous-sdd-lifecycle` appear in the same agent inventory. Resolve the
delivery skill's lifecycle link relative to its installed `SKILL.md`; the target
must be the listed lifecycle `SKILL.md`, not a source-checkout workflow path.

## Updates and Recovery

Update the pair with the same installer, not with a bare `gh skill update`.
Updating skills alone silently breaks the pair when the new skills require a
contract version the active runtime does not provide:

```bash
scripts/install-ai-skills.sh \
  --remote jizzoe/joericearchitect-ai-skills \
  --pin <new-release-tag> \
  --agent claude --agent codex
```

If a phase fails, the entrypoint reports the failed phase and the previously
active runtime stays active; it does not claim a complete update.

### Rollback

Runtime rollback is local and needs no network, no `gh`, and no remaining
source checkout:

```bash
ai-skills-runtime activate --previous
```

The installation retains the active and the immediately prior runtime and never
prunes automatically. Skill rollback stays separate: reinstall the prior pin
recorded in your receipt with `gh skill install --pin <prior>`.

If you took the unpaired `gh skill update` path anyway, `ai-skills-runtime
doctor` detects the resulting drift. For unpinned skills, inspect updates before
applying them with `gh skill update --dry-run`. Pinned skills are skipped until
explicitly unpinned. If a skill is not listed,
the destination conflicts, or a new session cannot discover it, record the
exact `gh` and agent versions, inspect the path shown by `gh skill list`, and
review the source content. Do not solve a discovery problem by copying files,
changing global agent configuration, or overwriting user-owned files.

If Codex CLI reports `invalid peer certificate: UnknownIssuer`, first test it
without any custom certificate-bundle overrides:

```bash
env -u SSL_CERT_FILE -u SSL_CERT_DIR \
  codex exec --skip-git-repo-check --ephemeral \
  "Reply with exactly: connection test passed"
```

This retains TLS verification and returns Codex to the platform trust store for
that process. If it still fails, stop and investigate local certificate,
network-inspection, VPN, or CLI installation configuration; do not bypass TLS
verification.

## Verification Fixture

Run the local, disposable installer fixture after metadata validation:

```bash
node scripts/validation/validate-skill-metadata.mjs
node scripts/validation/validate-runtime-references.mjs
node evals/skills/global-skill-installation/run-fixtures.mjs
node --test scripts/skills/test/install-global-skill.test.mjs
node evals/skills/global-skill-installation/run-install-utility-fixtures.mjs
node evals/skills/global-skill-installation/run-runtime-completeness.mjs
node --test scripts/runtime/test/
```

The runtime-completeness fixture installs the pair into a disposable profile,
discovers every helper named by the installed canonical skills, and proves each
one resolves through the installed launcher. A helper named by a skill but
absent from the runtime is a failure, not a passing Markdown match. Without an
authenticated disposable agent profile it records the skill half as unavailable
evidence rather than reporting installation success.

### Cross-platform coverage

The `Shared Runtime Matrix` workflow runs the network-free surface on Ubuntu
and Windows: builder determinism, launcher preflight and failure
classification, dry-run receipt parity, and PowerShell script analysis. The
`gh`-authenticated installed-profile fixtures remain operator-run and are
recorded with their tool versions.

The install/list fixture covers user-scope local-source installation for Claude
Code and Codex, discovery/listing, no-mutation skill discovery, rerun behavior,
an existing destination conflict, paths with spaces, and an alternate source
layout. It also proves that autonomous delivery and lifecycle are installed as
sibling packages and that delivery's canonical dependency resolves inside the
disposable installed root. The utility fixture covers local and remote dry-run
rendering with a second checkout path. Neither uses global assistant directories
or credentials.
Run the documented per-agent invocation manually from an authenticated
disposable profile before claiming the tested agent/version pair is supported.

The optional authenticated invocation accepts only a pre-provisioned disposable
profile path, never your normal `$HOME`. It isolates `gh` configuration and
removes only the fixture skill that it installed in that disposable profile.

## Boundary

`gh skill` remains responsible for skill discovery, source metadata, and
user skill-directory conflict behavior. The repository utility only validates
and invokes its argument array. The runtime installer owns only its own
versioned runtime directory, launcher shim, and non-secret activation metadata.

Installing the runtime broadens no boundary. The launcher performs mechanical
target validation only, adds and removes no credential, exposes no command that
returns an importable module path, and changes no approval, sandbox, network,
review, or cleanup policy. Missing, invalid, incompatible, or drifted runtime
state is a classified pause, never a fallback to a script in the open
workspace.

Sources: [GitHub CLI skill-install manual](https://cli.github.com/manual/gh_skill_install),
[GitHub CLI skill preview manual](https://cli.github.com/manual/gh_skill_preview),
[OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills), and
[Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands).
