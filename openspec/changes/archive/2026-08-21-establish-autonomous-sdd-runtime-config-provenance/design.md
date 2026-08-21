## Context

The approved M1-S3 brief requires one canonical resolver and immutable,
non-secret provenance. Ambient environment and conversation never become
runtime configuration after admission.

## Decisions

1. `config/ai-skills.json` gains a versioned `runtime` namespace containing
only allowlisted relative paths, provider/adapter IDs, evidence destinations,
and safe policy defaults.
2. `resolveRuntimeConfiguration` validates exact keys, rejects secret-shaped
values and unsafe paths, and returns a canonical snapshot plus digest.
3. `admitV2Run` consumes the snapshot and persists its digest and redacted
provenance in the immutable work-unit record. It never rereads config later.
4. Later external gates receive live probe facts separately; those facts cannot
mutate sealed authority or configuration.

## Risks

Unknown keys, conflicts, unsafe paths, secrets, and stale capability proof
fail closed before persistence. Fixtures use temporary repositories only.
