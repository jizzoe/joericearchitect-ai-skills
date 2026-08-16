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

## Follow-up strict review finding: combined trust failures

- Review record: `strict-23903a11-6333-4f8f-b38f-20b4dd78b00d`
- Reviewed head: `a5a807c448ce2d16b675320272ae7a522a42bb55`
- Assurance: `strict-isolated`; the parent-owned final artifact was present,
  schema-valid, and the owned view was removed.
- Finding: objective fix. A candidate that failed both platform trust and the
  mutation-denial check could be classified as a boundary-only failure because
  mutation was checked too early.

The resolver now completes identity, content-stability, and platform-trust
checks before evaluating managed mutation denial. The dedicated boundary
diagnostic can therefore occur only when every otherwise trusted candidate
fails that proof alone. A regression fixture covers the combined trust and
mutation failure. A fresh exact-head strict review is required after this
objective correction.

## Follow-up strict review finding: YAML scalar round-trip

- Review record: `strict-b6f2afce-05b8-4066-9297-e6ff50233fa9`
- Reviewed head: `447b6412237507d8dcee407eeedb8c0d3c3bbe45`
- Assurance: `strict-isolated`; the parent-owned final artifact was present,
  schema-valid, and the owned view was removed.
- Finding: objective fix. The tracking serializer emitted raw scalar-array
  values, which could misparse YAML-significant path strings.

All serialized strings now use JSON-compatible YAML quoting, and the parser
decodes quoted list values before deciding whether they are YAML mappings. The
regression test round-trips colon-bearing, boolean-looking, numeric-looking,
quoted, and backslash-containing path values.
A fresh exact-head strict review is required after this objective correction.
