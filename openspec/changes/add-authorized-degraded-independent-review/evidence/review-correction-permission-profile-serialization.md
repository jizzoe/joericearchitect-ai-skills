# Permission Profile Serialization Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-reviewer/codex/permission-profile-serialization`
- Failed review head: `e7de61cfeb358fe2743e42200dfe28edc2464f2c`
- Failed review manifest:
  `7f15d28f22f4a7d0caa49207ded970ecbe929ffa12926906bf63aec5fe02d45d`
- Stable unavailable code: `independent-reviewer-codex-execution-unavailable`
- Non-sensitive runtime detail: Codex rejected the split inline filesystem
  overrides because they did not deserialize as `FilesystemPermissionToml`.
- Authorization: this is an evidence-backed, behavior-preserving recovery
  inside the owner's authorized reviewer-home-access correction and active
  three-corrections-per-failure-signature budget.

## Disposition

Disposition: `objective-fix`.

The permission rules, authentication boundary, environment policy, and network
denial are unchanged. The correction serializes the same named permission
profile as one TOML inline table, which Codex accepts while loading the existing
ChatGPT authentication. The adapter retains `--strict-config`, so an unknown or
future-incompatible key still fails closed before reviewer execution.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 5.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- Codex loaded the corrected inline permission table and reported the existing
  ChatGPT login without a configuration error.
- Focused adapter, authorization, and launcher tests — 26 passed.
- `node --test` — 203 passed.
- `openspec validate add-authorized-degraded-independent-review --strict` —
  passed.
- `openspec validate --all --strict` — 22 passed, 0 failed.
- `git diff --check` — passed.
