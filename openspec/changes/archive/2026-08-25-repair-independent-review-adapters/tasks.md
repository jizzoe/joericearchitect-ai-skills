## 1. Codex sandbox

- [x] 1.1 Replace `codexRestrictedReviewArguments()` (beta `default_permissions`
      + `permissions.sealed-review` profile) with `--sandbox read-only` in both
      the strict and degraded Codex invocations
- [x] 1.2 Keep `--strict-config` and the remaining ephemeral/ignore flags

## 2. Findings schema dialect

- [x] 2.1 Change `schemas/independent-review-findings-v1.schema.json` `$schema`
      to a draft-07 URI (or remove it) and remove the non-resolvable `$id`
- [x] 2.2 Confirm the revised schema is accepted by both `codex --output-schema`
      and `claude --json-schema`

## 3. Claude authentication provisioning

- [x] 3.1 Add a `prepareClaudeReviewerEnvironment` (or extend `prepareReviewerHome`)
      that copies the host's bounded `~/.claude.json` into the isolated `HOME` or
      injects `ANTHROPIC_API_KEY`/`CLAUDE_CODE_OAUTH_TOKEN`
- [x] 3.2 Fail closed with a stable diagnostic when the auth artifact is absent,
      oversized, or not a regular file
- [x] 3.3 Wire the provisioned environment into `buildClaudeReviewInvocation` and
      `buildClaudeDegradedReviewInvocation`

## 4. Tests

- [x] 4.1 Add/update adapter tests: codex invocation contains `--sandbox read-only`
      and omits the beta profile; schema dialect is draft-07; Claude auth is
      provisioned into the isolated environment
- [x] 4.2 Add a fail-closed test for absent/oversized Claude auth artifact

## 5. Verification

- [x] 5.1 Run the `scripts/sdd/test/` suites
- [x] 5.2 Run `openspec validate --all --strict`
- [x] 5.3 Re-run the strict Codex and Claude reviewers against a sealed package
      and confirm a schema-valid findings artifact is produced (or a stable
      unavailable diagnostic, never a sandbox/schema/auth failure)
