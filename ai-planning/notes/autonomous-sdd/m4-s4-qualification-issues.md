# M4-S4 Qualification Issues Log

Running log of issues found during the M4-S4 single-change reliability
qualification (production-rapid / strict-only, autonomous). Material defects are
promoted to GitHub Issues in the owning repo (label `qualification-finding`);
this file is the fast in-flight capture.

## Format

Each entry: run #, slice, phase, symptom, classification
(`defect` | `gap` | `observation`), evidence, status (`open` | `promoted` |
`resolved`), and GitHub issue link when promoted.

## Entries

| # | Run | Slice | Phase | Symptom | Classification | Status |
|---|---|---|---|---|---|---|
| 1 | 1 | add-claude-cross-tool-repo-hygiene | Propose | Work pre-exists (commit `4e81901`: `CLAUDE.md` + `check-adapter-drift.mjs` + test already present and passing) with no formal OpenSpec change; this run formalizes + verifies + delivers | observation | open |
| 2 | 1 | add-claude-cross-tool-repo-hygiene | Review | `ai-skills-runtime doctor` reports claude+codex `available:false` because `scripts/runtime/launcher.mjs` `doctor()` runs `gh skill list --agent <agent> --json` with two defects: (a) `claude` is not a valid `--agent` value (valid id is `claude-code`), (b) `--json` requires a field list (e.g. `skillName,scope`). Both agents ARE installed+available: `gh skill list --agent claude-code --json skillName,scope` and `--agent codex --json skillName,scope` return JSON. NOT a `gh` auth issue (auth OK as jizzoe, scopes fine). Blocks strict-review admission fail-closed. Same defect in `install-runtime.mjs` (`SUPPORTED_AGENTS=["claude","codex"]` L24; `currentSkillPin` bare `--json` L146) | gap | resolved |
| 3 | 1 | add-claude-cross-tool-repo-hygiene | Review | `scripts/runtime/test/launcher.test.mjs` (L380-382) stubs the `gh` `run` with a mock that hardcodes the same wrong `claude` id and never validates the `gh skill list` arg vector or `--json` field list, so the probe bug is invisible to the suite | gap | resolved |
| 4 | 1 | add-claude-cross-tool-repo-hygiene | Review | Strict codex reviewer fails closed with `independent-reviewer-codex-sandbox-unavailable`: `buildCodexReviewInvocation` uses `--strict-config` + `codexRestrictedReviewArguments()` (`--config permissions.sealed-review={filesystem={...}}` + `shell_environment_policy.inherit="none"`), which triggers codex's macOS `sandbox-exec` helper → `sandbox-exec: execvp() of '/opt/homebrew/bin/codex' failed: Operation not permitted` (exit 71). Isolation: `codex exec --strict-config` alone works; `shell_environment_policy.inherit="none"` alone works; the trigger is `default_permissions="sealed-review"` + `permissions.sealed-review={filesystem={...}}` (read-only filesystem profile), which routes codex's AGENTS.md read through `sandbox-exec`. `sandbox-exec -p '(version 1) (allow default)' codex --version` succeeds, so the failure is the sealed-review profile's re-exec under Seatbelt, not the binary or the Homebrew symlink | gap | resolved |

| 5 | 1 | add-claude-cross-tool-repo-hygiene | Review | Claude strict reviewer (`runClaudeReviewAdapter` → `buildClaudeReviewInvocation`) passes its sandbox (`--safe-mode` + settings) but fails at `--json-schema`: `Error: --json-schema is not a valid JSON Schema: no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`. The schema `schemas/independent-review-findings-v1.schema.json` declares `$schema: draft/2020-12`, which Claude Code 2.1.220's validator cannot resolve. Codex's `--output-schema <FILE>` accepts the same file (it failed later at sandbox-exec). Net: codex fails at OS sandbox, claude fails at schema dialect | gap | resolved |

| 6 | 1 | add-claude-cross-tool-repo-hygiene | Review | Claude strict reviewer has a second blocker beyond the schema dialect: `claude auth status` → `{loggedIn:false, authMethod:"none"}` and `claude --print` returns `Failed to authenticate: OAuth session expired and could not be refreshed`. The draft-07 `$schema` is accepted by `--json-schema` (no "no schema with key or ref" error), but the run still cannot proceed without `claude auth` re-login or `ANTHROPIC_API_KEY`; resolved by user re-login (`claude auth status` → `loggedIn:true`) | gap | resolved |

| 7 | 1 | add-claude-cross-tool-repo-hygiene | Review | Claude reviewer has NO auth provisioning: `buildClaudeReviewInvocation` runs claude with `isolatedReviewerEnvironment` (fresh HOME) + `--setting-sources ""`, so the user's `~/.claude.json` OAuth is invisible and no `ANTHROPIC_API_KEY`/service credential is injected — result `Not logged in · Please run /login` even when the host user is logged in (`claude auth status` → `loggedIn:true`). Contrast: codex's `prepareCodexReviewerEnvironment` copies `~/.codex/auth.json` into the isolated `CODEX_HOME`. Claude needs an equivalent auth-provisioning step | gap | resolved |

| 8 | — | repair-runtime-gh-agent-mapping | Review | Post-fix strict-review re-run found the `install-runtime.test.mjs` stub accepts any `gh skill list` args and echoes the delegated install agent without asserting the mapped `claude-code` id or the `--json skillName,version,pinned` vector | defect | resolved |

| 9 | 3 | add-typescript-quality-overlay | Init | `initialize-v2-delivery` paused `legacy-inventory-ambiguous`: the terminalized Run #2 checkpoint `controller-3f48e2d4…` is stale (`currentPhase=propose`, 0/8 steps) because its lifecycle phases/delivery bindings were advanced manually (outside `advanceControllerLifecyclePhase` / `bindControllerLifecycleDelivery`). The fail-closed gate correctly refuses and there is no supported reconciliation path for stale schema-5 checkpoints, so Run #3 could not start. **Pause reason (owner decision):** authorize a bootstrap-bridge framework repair (`repair-stale-controller-record-recognition`) to add the reconciliation path before resuming the run | defect | open |

## Resolutions

- **#2 / #3** — Resolved. Added a `ghAgentId` mapping (`claude` → `claude-code`)
  at the three `gh` call boundaries (`launcher.mjs` `doctor`,
  `install-runtime.mjs` `currentSkillPin` + `installSkills`), fixed the bare
  `--json` flag to `--json skillName,version,pinned`, and corrected the revision
  extraction to `skill.version`. Updated the three affected test stubs to
  validate the real `gh skill list` arg vector and field names. Verified: 69/69
  runtime tests pass and `ai-skills-runtime doctor` reports both agents
  available. Delivered via issue #241 / PR #242
  (`repair-runtime-gh-agent-mapping`).

- **#4 / #5 / #7** — Resolved via `repair-independent-review-adapters` (issue
  #239 / PR #240). Codex: replaced the beta `permissions.sealed-review` profile
  with `--sandbox read-only`. Schema: `$schema` → draft-07, `$id` dropped.
  Claude: added `prepareClaudeReviewerEnvironment` (copies bounded
  `~/.claude.json` or injects `ANTHROPIC_API_KEY`/`CLAUDE_CODE_OAUTH_TOKEN`).
  Verified: 309/309 SDD tests pass; Codex completes a full strict review under
  `--sandbox read-only` and Claude accepts the draft-07 schema.

- **#8** — Resolved. Strengthened the `install-runtime.test.mjs` stub to assert
  the `gh skill list` agent id (`claude-code`/`codex`) and `--json` field list,
  and the delegated install `--agent` id (conditionally, since the build smoke
  invocation omits `--agent`). 69/69 runtime tests pass. The strict reviewer
  surfaced this on a post-fix re-run, confirming the machinery now detects real
  coverage gaps.

## Promoted-to-GitHub

| Log # | Repo | Issue |
|---|---|---|
| — | — | — |
