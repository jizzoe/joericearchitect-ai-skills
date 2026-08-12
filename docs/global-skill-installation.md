# Global Skill Installation

Install the repository's canonical skills with the preview `gh skill` command.
This command copies skills and records source metadata; it does not configure
Claude Code, Codex, OpenSpec, MCP servers, credentials, approvals, or product
settings.

## Prerequisites

- GitHub CLI with `gh skill` available. This guide was exercised with `gh`
  `2.97.0`.
- Claude Code `2.1.220` and/or Codex CLI `0.147.0` installed separately.
- GitHub authentication when required by the source or rate limits. Do not put
  credentials in skill files or command history.

`gh skill` is preview behavior. Check the installed command contract first:

```bash
gh skill install --help
```

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

## Install

Install every canonical skill for one agent at user scope. The commands use
the selected GitHub source; they do not install hidden repository wrappers.

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

List the recorded installations and confirm the source URL, user scope, pin,
version, and path:

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

## Updates and Recovery

For unpinned skills, inspect updates before applying them:

```bash
gh skill update --dry-run
gh skill update
```

Pinned skills are skipped until explicitly unpinned. If a skill is not listed,
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
node evals/skills/global-skill-installation/run-fixtures.mjs
node --test scripts/skills/test/install-global-skill.test.mjs
node evals/skills/global-skill-installation/run-install-utility-fixtures.mjs
```

The install/list fixture covers user-scope local-source installation for Claude
Code and Codex, discovery/listing, no-mutation skill discovery, rerun behavior,
an existing destination conflict, paths with spaces, and an alternate source
layout. The utility fixture covers local and remote dry-run rendering with a
second checkout path. Neither uses global assistant directories or credentials.
Run the documented per-agent invocation manually from an authenticated
disposable profile before claiming the tested agent/version pair is supported.

The optional authenticated invocation accepts only a pre-provisioned disposable
profile path, never your normal `$HOME`. It isolates `gh` configuration and
removes only the fixture skill that it installed in that disposable profile.

## Boundary

`gh skill` remains the installer for this repository. The utility only validates
and invokes its argument array; it does not copy files, manage provenance, or
modify agent configuration. Direct `gh skill` commands remain authoritative.

Sources: [GitHub CLI skill-install manual](https://cli.github.com/manual/gh_skill_install),
[GitHub CLI skill preview manual](https://cli.github.com/manual/gh_skill_preview),
[OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills), and
[Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands).
