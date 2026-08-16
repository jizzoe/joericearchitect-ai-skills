# Strict review correction: sealed-shell inspection tools

- Attempt: 1 of 3 for `strict-artifact-delivery/missing-final-artifact`
- Review request: `71ba7a159b116ea2f9a3daff343ad3d2b5d25153b6c5ba6cdc8974f645c7c052`
- Reviewed head: `309f488aec5bf3d61d2189648e33b53997d278a9`
- Result: `review-launcher-codex-result-artifact-missing`; owned-view cleanup
  completed.

The strict process was confirmed read-only and network-disabled. Its transcript
showed that the neutral sealed shell did not resolve ordinary `sed`, `ls`, or
`git`; the archive intentionally has no Git metadata. The prior prompt did not
identify the available absolute read tools, so the reviewer did not complete a
valid final artifact.

The fixed prompt now directs Codex to use only zsh builtins or `/bin/cat`,
`/usr/bin/awk`, and `/usr/bin/perl`, states that Git metadata is unavailable,
and continues to prohibit mutations and transcript acceptance. A fresh exact-
head strict review is required after this objective correction.

## Follow-up strict review finding

- Review record: `strict-c057fa1c-235c-46d3-8ac6-fdd25402f1f5`
- Reviewed head: `6bd1ebdfbcb64ca77380bc2edc4abc6a0a996296`
- Assurance: `strict-isolated`; the parent-owned final artifact was present,
  schema-valid, and the owned view was removed.
- Finding: high severity. The initial repair emitted the dedicated
  preflight-boundary diagnostic for every unresolved default executable, which
  could conceal a missing candidate, failed platform trust check, or unstable
  identity.

The correction preserves the dedicated boundary diagnostic only when every
otherwise viable fixed candidate fails the managed mutation-denial proof.
Missing candidates, trust failures, identity instability, invalid inputs, and
mixed failures retain the executable-identity diagnostic. Focused deterministic
coverage exercises both the production resolver classification and the parent
strict-request mapping. A fresh exact-head strict review is required after this
objective correction.
