# Completion Evidence

Date: 2026-08-19. Change `distribute-shared-sdd-runtime`, delivered under the
autonomous `prototype-rapid` authorization with `same-session-local` review.

## Runtime identity

Built from the branch head with `node scripts/runtime/build-runtime.mjs
--output <disposable>`:

- Contract version: `1`
- Content digest: `475bd9ab1f8ccdb3070f510f5ff02f7003ee049dbce08b8b32afc514e669d73f`
- Source revision: `local+475bd9ab1f8c` (working tree, so the build is labelled
  a development revision rather than a commit-pinned one)
- Staged files: 107. Declared entrypoints: 22.
- Mode: `dev` for launcher results produced through
  `AI_SKILLS_RUNTIME_ROOT`; `installed` for the disposable-profile fixture.

## Host and tool versions

| Tool | Version |
| --- | --- |
| Node | v26.7.0 (runtime floor is 20) |
| GitHub CLI | 2.97.0 |
| Claude Code | 2.1.220 |
| Codex CLI | codex-cli 0.147.0 |
| PowerShell | **unavailable on this host** |

## Commands run

```bash
node --test "scripts/**/test/*.test.mjs" "evals/**/*.test.mjs"   # 450 passed, 0 failed
node --test scripts/runtime/test/                                # builder, launcher, entrypoints, installer, cross-assistant
node --test evals/skills/global-skill-installation/run-runtime-completeness.test.mjs
node evals/skills/global-skill-installation/run-runtime-completeness.mjs
node scripts/validation/validate-skill-metadata.mjs
node scripts/validation/validate-shared-guardrails.mjs
node scripts/validation/validate-runtime-references.mjs
node scripts/sdd/check-adapter-drift.mjs
openspec validate distribute-shared-sdd-runtime --strict
openspec validate --all --strict                                 # 32 passed, 0 failed
```

All passed at the current head.

## Installed-profile completeness

`run-runtime-completeness.mjs` installed the pair into a disposable home,
discovered **17 runtime helpers** named by the canonical skills, and resolved
every one through the installed launcher. Representative harmless invocations
ran for the five payload-shaped helpers and returned machine-readable results.
Nothing was written outside the disposable profile and no credential was read.

The skill half was recorded as `unavailable: gh-not-authenticated` for both
agents: the fixture deliberately points `gh` at a disposable profile, so the
canonical packages in the reviewed source stood in for installed ones. That
substitution is recorded in the fixture output rather than presented as
installed-profile evidence. A release support claim still requires an operator
run against an authenticated disposable profile.

## Unavailable prerequisites

- **PowerShell**: `pwsh` is absent on this host, so the Bash/PowerShell receipt
  parity assertion degraded to the Bash half only. The `Shared Runtime Matrix`
  workflow runs the PowerShell entrypoint and PSScriptAnalyzer on
  `windows-latest`, and the parity test asserts the full contract wherever
  `pwsh` exists. Until that matrix has run on a pull request, the PowerShell
  path is evidenced by static analysis and shared-contract construction rather
  than by an executed parity run.
- **Authenticated agent profiles**: not provisioned in this session, as above.

## Local review

A bounded same-session `base-code-review` pass over the branch diff produced
three objective findings, all corrected at this head with regression tests:

1. `scripts/validation/validate-runtime-references.mjs` scanned whole documents
   for launcher invocations, so the ordinary word following a helper name in
   prose was read as a subcommand verb and would have failed CI on valid
   documentation. Invocation scanning is now confined to code spans and fenced
   blocks. Regression: "prose after a helper name is not mistaken for a
   subcommand verb".
2. `scripts/runtime/install-runtime.mjs` accepted an existing
   `runtime-<digest12>` directory that carried no manifest when `--force` was
   supplied, activating unverifiable content. It now fails closed regardless of
   overwrite intent and retains the previously active runtime. Regression: "an
   occupied version directory without a manifest is never activated".
3. `dispatch()` required the caller to re-supply the verb that
   `prepareDispatch` had already validated, so a subcommand dispatch could
   silently lose it. The validated plan now carries the verb.

A formal Verify pass over the four delta specs found two further gaps, also
corrected at this head:

4. The `skill-install-utility` delta requires the machine-readable result to
   state the failed phase. It stated only `ok` and `status`. The result now
   carries `phase` (`validate`, `dry-run`, `invoke`, `complete`) and a recovery
   `code`, and an argument failure is reported in the same shape when
   `--result` is requested.
5. Both receipts echoed the source reference verbatim, so a remote source
   carrying an embedded credential
   (`https://user:token@host/owner/repo`) would have written that credential
   into evidence retained on disk. Both now redact it. Regressions: "a
   credential embedded in a remote source is redacted in the result" and "a
   credential embedded in a remote reference never reaches the paired
   receipt".

This is same-session local review with `assurance: local-review`. It is
neither isolated nor independent and does not satisfy a production
independent-review gate.

## Scope, whitespace, and secret review

- No trailing whitespace or tab characters in any changed Markdown, JavaScript,
  JSON, YAML, shell, or PowerShell file.
- No credential, token, private key, or product-specific constant added. The
  launcher injects only `RUNTIME_HOME` and `AI_SKILLS_TARGET_REPOSITORY` and
  passes the caller's environment through unchanged, asserted by test.
- Changed paths stay within the runtime, validation, skills, adapters, docs,
  evals, workflows, and this change's OpenSpec directory.

## Repaired pre-existing failures

Two tests unrelated to this change's behavior were repaired because they
blocked clean evidence:

- `scripts/sdd/test/sdd-lifecycle-hygiene.test.mjs` pinned an OpenSpec change
  name that had since been archived; it now resolves an active change.
- `scripts/validation/test/pr-linkage.test.mjs` asserted the adapter text still
  named a `scripts/validation/*.mjs` path; it now asserts the launcher
  reference and rejects the legacy path.
