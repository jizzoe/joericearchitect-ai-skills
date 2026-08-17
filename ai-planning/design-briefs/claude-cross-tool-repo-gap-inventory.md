# Claude Cross-Tool Repo Gap Inventory

Date: 2026-08-15
Status: Design brief. Inventory and proposed fixes only — nothing in this
document has been implemented. Propose an OpenSpec change per accepted fix
before touching governed assets, per `AGENTS.md` and `docs/sdd-workflow.md`.

## Purpose and scope

Audit the repository against
`ai-planning/research/cross-assistant-ai-assets-best-practices.md` (updated
2026-08-15) and identify anything that would block or degrade Claude Code's
ability to make full use of this repo, its skills, and the OpenSpec SDD
framework. Special focus, per request: the independent-review strict and
degraded modes, since substantial effort went into hardening
`review-launcher-recovery` and there was a stated concern that work is
Codex-specific.

Method: read the canonical skill (`skills/base/independent-review/`), both
thin adapters, every script in the review-launcher chain
(`scripts/sdd/platform-review-adapters.mjs`,
`scripts/sdd/execute-independent-review.mjs`,
`scripts/sdd/review-launcher-host.mjs`,
`scripts/sdd/review-launcher-recovery.mjs`,
`scripts/sdd/degraded-independent-review-authorization.mjs`), their tests, the
in-flight OpenSpec changes on this branch, and the repo's docs. Cross-checked
every Claude CLI flag and `sandbox.*` settings key cited in the code against
(a) the actually-installed `claude` CLI's own `--help` output (v2.1.220 on
this machine) and (b) Anthropic's current published docs
(`code.claude.com/docs/en/{cli-reference,sandboxing,settings,memory}`).

## Headline conclusion

**Independent-review is not Codex-only.** Both `codex-detached-read-only-v1`
and `claude-detached-restricted-v1` launchers are implemented end to end and
symmetrically: the protocol doc, `platform-review-adapters.mjs`,
`review-launcher-host.mjs`, `review-launcher-recovery.mjs`, the authorization
policy, `docs/autonomous-run-enablement.md`, and the deterministic test suite
all cover Claude with dedicated logic and dedicated tests, not an afterthought
bolted onto a Codex design. A repo-wide grep for `codex` outside the
independent-review files found nothing Codex-only left unpaired with Claude.

The real gaps are narrower and fall into two buckets: (1) two small,
easy-fix repo-hygiene issues unrelated to independent review, and (2) one
specific, well-evidenced **verification gap** in the Claude strict-isolation
path — not a confirmed bug, but an unproven security-relevant assumption that
the current test suite cannot catch because it mocks the CLI process instead
of exercising the real binary.

## Gap inventory

### G1 — No root `CLAUDE.md`; Claude gets zero automatic repo guidance

**Severity:** High
**Confidence:** High (directly confirmed against repo state and official docs)

`AGENTS.md` exists at the repo root; no `CLAUDE.md` exists anywhere in the
tree. Claude Code reads `CLAUDE.md`, not `AGENTS.md` (confirmed against
`code.claude.com/docs/en/memory`). Every Claude Code session in this repo
currently starts with none of the guardrails in `AGENTS.md` loaded
automatically — "read `docs/sdd-workflow.md` before changing governed
assets," "keep adapters thin," "run `openspec validate --all --strict` before
delivery," "do not commit product-specific constants into reusable global
assets." Codex gets this every session; Claude silently does not.

**Fix:** Add a root `CLAUDE.md`:

```markdown
@AGENTS.md
```

Zero duplication risk, one-line file, matches Anthropic's documented pattern.
Already recommended in the 2026-08-15 audit pass of
`cross-assistant-ai-assets-best-practices.md`.

### G2 — `check-adapter-drift.mjs` only covers 5 of ~16 canonical skills

**Severity:** Medium
**Confidence:** High (direct code read)

`scripts/sdd/check-adapter-drift.mjs`'s `REQUIRED_ADAPTERS` array hardcodes 5
skills × 2 adapters (`autonomous-goal-runner`, `autonomous-sdd-lifecycle`,
`independent-review`, `base-code-review`, `base-verification-loop`).
`skills/base/` currently has 16 skill directories, and `.claude/skills/` /
`.agents/skills/` each have adapters for most of them, including several new
in this working tree (`design-brief-from-research`, `research-topic-workflow`,
`sdd-requirements-to-plan`, `base-skill-authoring`,
`dependency-aware-work-selection`, the `github-*` skills,
`openspec-github-sync`, `project-pr-status-sync`). None of those have
drift coverage.

**Impact:** If a canonical skill changes, or an adapter is hand-edited to
duplicate policy (which canonical skills explicitly forbid), nothing in this
repo's validation catches it for 11 of 16 skills. This undermines the "thin
adapter, no duplicated policy" guarantee for most of the skill surface, not
just a corner case.

**Fix:** Replace the hardcoded array with a generated list: enumerate
`skills/base/*/SKILL.md`, require a matching `.claude/skills/<name>/SKILL.md`
and `.agents/skills/<name>/SKILL.md`, and apply the same
canonical-reference/"must not duplicate" phrase checks to all of them. Keep an
explicit, commented exclude list only for skills legitimately owned and
regenerated by the OpenSpec CLI itself, if those are validated by OpenSpec's
own tooling instead (see OQ2).

### G3 — Claude independent-review "strict-isolated" sandbox enforcement is unverified against the live CLI

**Severity:** High (security-relevant claim; currently unverified, not
confirmed broken)
**Confidence:** Medium — every individual fact below is directly confirmed;
the conclusion that this is a live gap (rather than working-as-intended
behavior I simply couldn't find documented) is inference. This is why it is
also listed as OQ1 below rather than applied as a fix outright.

**Evidence chain:**

- `runClaudeReviewAdapter` / `buildClaudeReviewInvocation`
  (`scripts/sdd/platform-review-adapters.mjs`) writes a settings-file via
  `createClaudeReviewSettings()` containing `sandbox.enabled`,
  `sandbox.failIfUnavailable`, `sandbox.filesystem.{denyRead,allowRead,
  denyWrite,allowWrite}`, `sandbox.network.{allowedDomains,strictAllowlist}`,
  `sandbox.credentials.{files,envVars}`, then invokes:
  `claude --print --safe-mode --no-session-persistence --setting-sources ""
  --settings <path> --tools Bash --disallowed-tools <list>
  --permission-mode dontAsk --output-format json --json-schema <schema>`.
- I confirmed every sandbox field name against Anthropic's current
  sandboxing docs — all are real keys, correctly nested.
- I confirmed every CLI flag against the actually-installed `claude --help`
  (v2.1.220) — all real. `--tools`/`--disallowedTools` both explicitly accept
  comma-joined strings, so the argument formatting in the code (a single
  comma-separated string per flag) is correct — an initial suspicion of mine
  that this was a parsing bug turned out to be wrong once checked against the
  live binary.
- But `claude --help` also states, verbatim: **"Settings files that fail
  validation are silently ignored in this mode [`--print`] (no error dialog
  is shown)."** And Anthropic's sandboxing docs' only fully-worked examples of
  `sandbox.enabled` / `sandbox.failIfUnavailable` being set are in a
  **managed-settings** deployment context. The docs explicitly confirm only
  `strictAllowlist`, `allowManagedDomainsOnly`, and `allowAppleEvents` as
  honored specifically from `--settings`/CLI scope, and explicitly state
  `strictAllowlist` has **no effect** from project-level
  `.claude/settings.json`. Whether the CLI's `--settings <file>` flag is a
  scope that actually activates `sandbox.enabled` /
  `sandbox.failIfUnavailable` (versus silently doing nothing, or being
  silently dropped if anything else in the same generated file fails
  validation) is not confirmed by any source I could reach.
- No test in this repo exercises the real `claude` binary end to end for this
  path. `scripts/sdd/test/platform-review-adapters.test.mjs` mocks the `run`
  function; it verifies argument construction and result parsing, correctly
  and thoroughly, but never confirms the real CLI applies the generated
  sandbox.

**Impact if the gap is real:** a Claude `strict-isolated` review result could
be produced by a process running with no sandbox at all — ordinary default
permissions — while `assuranceLevel` still claims `strict-isolated`. That is
exactly the class of silent-downgrade risk this whole protocol exists to
prevent, just potentially present in an unverified corner of the Claude path
rather than the (heavily hardened) Codex path.

**Fix (proportional to the evidence, not speculative):**

1. Add a one-time, documented live smoke test (not CI — it needs an
   authenticated `claude` binary) that runs the real strict-mode command
   against a canary detached view and asserts *observable* proof of sandbox
   engagement — e.g., have the reviewer's fixed instruction include
   "attempt to write a file outside the allowed path and report whether it
   was denied," and require that denial before trusting the path at all.
2. Until that smoke test exists and passes, do not describe the Claude
   strict-isolated path in user-facing docs more confidently than "implemented,
   pending live verification." `docs/autonomous-run-enablement.md` currently
   reads more confidently than the test evidence supports.
3. Longer term, validate `createClaudeReviewSettings()`'s output against the
   installed Claude Code's own settings schema before invocation, so a bad
   config fails closed locally instead of depending on the CLI's silent-ignore
   behavior in `--print` mode.

### G4 — Possibly-invalid `"Agent"` tool name in Claude deny lists

**Severity:** Low
**Confidence:** Low-medium (could not fully confirm from available sources)

`createClaudeReviewSettings().permissions.deny` and
`buildClaudeDegradedReviewInvocation`'s `--disallowed-tools` both list
`"Agent"` alongside `"Task"`. Claude Code's built-in subagent-delegation tool
is named `Task`; I could not confirm `"Agent"` is also a recognized built-in
tool name in the installed CLI. If it isn't, it's a harmless no-op deny entry
— not a security hole, since `--tools "Bash"` / `--tools "Read,Glob,Grep"`
already allowlists everything else out — but worth cleaning up for audit-trail
correctness.

**Fix:** Confirm the current built-in tool name list and either drop
`"Agent"` or replace it with whatever it was meant to reference.

### G5 — Strict vs. degraded Claude invocations aren't equally explicit about MCP lockdown

**Severity:** Low (cosmetic/audit-trail; not functional)
**Confidence:** High for the observation

`buildClaudeDegradedReviewInvocation` adds an explicit
`--strict-mcp-config --mcp-config "{}"`; `buildClaudeReviewInvocation`
(strict) does not, relying instead on `--safe-mode` — which the live CLI help
confirms already disables MCP servers entirely — plus the `--tools Bash`
allowlist. Functionally fine, but an auditor reading the two functions side by
side could reasonably ask why one path is more explicit than the other about
a security-relevant control.

**Fix:** Add the same explicit `--strict-mcp-config --mcp-config "{}"` to the
strict invocation for consistency, even though it is currently redundant.

## Checked and confirmed *not* gaps

Worth stating explicitly, since the concern driving this inventory was
"maybe it's all Codex-specific":

- **Protocol and authorization docs are symmetric.**
  `skills/base/independent-review/references/protocol.md`,
  `scripts/sdd/review-launcher-recovery.mjs`'s `launcherDefinitions`,
  `skills/base/autonomous-goal-runner/references/authorization-policy.md`,
  and `docs/autonomous-run-enablement.md` all define and document the Codex
  and Claude paths side by side, including OS-specific Claude guidance
  (macOS Seatbelt, Linux/WSL2 `bubblewrap`/`socat`, native-Windows
  unsupported).
- **Skill discovery itself works for Claude, verified directly.** This very
  session's tool listing shows essentially every skill in `.claude/skills/*`
  as available and invocable, including the ones that are untracked/new in
  this working tree (`design-brief-from-research`, `research-topic-workflow`,
  `sdd-requirements-to-plan`, `base-code-review`, `base-verification-loop`).
  Extra frontmatter keys (`license`, `canonical`) do not break loading.
- **CLI argument syntax is valid.** Every flag the Claude adapters pass
  (`--tools`, `--disallowed-tools`, `--permission-mode dontAsk`,
  `--json-schema`, `--strict-mcp-config`, comma-joined tool lists) matches the
  live installed CLI's own `--help` output.
- **Test coverage is roughly 1:1.** `platform-review-adapters.test.mjs` has
  dedicated Claude-specific tests (sandbox config shape, degraded transport,
  launcher-recovery codes), not just Codex ones.
- **Skill installation tooling is symmetric.** `docs/global-skill-installation.md`
  documents `gh skill install --agent claude-code` and `--agent codex` as
  parallel, equally-supported paths.
- **No other Codex-only references exist.** A repo-wide grep for `codex`
  outside independent-review files (`skills/base`, `workflows/`) found only
  paired "Codex or Claude" mentions.

## Open questions

**OQ1 — Run the G3 live smoke test now, and against what?**
I did not spawn a live `claude` subprocess to test this myself, since it
touches a security-relevant, currently-unverified path and I didn't want to
guess at what "success" should look like without your input. Do you want this
run before or independent of opening an OpenSpec change for it? My
recommendation: run it first as a quick, standalone check (it doesn't need
OpenSpec machinery) — the result determines whether the follow-up change is
"fix a real isolation bug" or "add a permanent smoke test plus tone down a doc
claim." I'd like your go-ahead before anyone runs a live authenticated
`claude` invocation for this.

**OQ2 — Should OpenSpec-generated skill pairs be in scope for G2's drift check?**
`.claude/skills/openspec-*` and `.agents/skills/openspec-*` (and the
`.claude/commands/opsx/*.md` slash commands) appear to be generated by the
OpenSpec CLI itself, per `openspec/config.yaml`'s "OpenSpec owns its generated
commands and skills." I lean toward explicitly excluding them from the
repo's own drift check (with a comment explaining why), rather than silently
omitting them the way the current hardcoded list does — but whether OpenSpec's
own tooling actually re-validates their Claude/Codex parity is something I
haven't verified, and the scope call is yours.

**OQ3 — Should the new `CLAUDE.md` (G1) stay a bare `@AGENTS.md` import, or carry Claude-only additions?**
I don't have a specific Claude-only instruction to add today (e.g., plan-mode
triggers, artifact-publishing rules). I recommend starting with the one-line
import and adding to it only when a real Claude-specific need appears, rather
than inventing content to fill a section — flagging this rather than silently
deciding it, since "what belongs only in CLAUDE.md" is a product decision, not
a technical one.

**OQ4 — How should G3/G4/G5 be grouped for delivery?**
All three touch `platform-review-adapters.mjs`. I'd bundle them into one
"harden Claude independent-review live verification" change, separate from
G1/G2 (unrelated repo-hygiene fixes), and sequence it alongside or after the
two `harden-independent-review-*` changes already in flight in this working
tree. Confirm this grouping, or tell me if you'd rather fold G4/G5 into
whichever of those two existing changes ends up touching the same file.

## Recommended next step

- G1 and G2 are low-risk, independently actionable, and don't depend on any
  open question except OQ2/OQ3's scope calls. Once you weigh in on those, an
  OpenSpec Propose for a small "cross-tool repo hygiene" change (root
  `CLAUDE.md` + generated adapter-drift coverage) is ready to draft.
- G3 is the one that matters most given the stated concern, and it hinges on
  OQ1: get your go-ahead, run the live smoke test, then propose the
  appropriate follow-up change based on what it shows.
- G4/G5 are small enough to ride along with whichever change ends up touching
  `platform-review-adapters.mjs` next, per OQ4.
