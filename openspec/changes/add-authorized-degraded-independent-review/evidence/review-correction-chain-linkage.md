# Correction Chain Linkage Evidence

## Failure and authorization

- Failure signature:
  `independent-review/correction-chain-linkage-not-validated/scripts/sdd/checkpoint.mjs/merge-pr`.
- Failed review head: `b184f29df02cfae36070b7943553efee57f8eb13`.
- Failed review manifest:
  `d700bbbafff76162b64cd6c9f14213eb0958b334fe445a532e5c52a95d8e9449`.
- Failed review record:
  `degraded-9c960793-8fc4-4cc4-aeba-73fef7875ff9`.
- Previous correction head: `52a9f98e1e4facde46485b5892d2776ba05cad77`.
- Previous correction manifest:
  `d6e30270ce9adb497fa364b80e46441167170b98501e2f7441792394ae2f4686`.
- Finding severity: `high`.
- Disposition: `objective-fix`; the complete correction is deterministic and
  requires no human judgment.
- Authorization: the owner authorized disposition-driven continuation for
  this turn. Existing autonomous correction authorization, scope, accepted
  degraded risks, expiration, and per-signature budget remain unchanged.

## Correction

A shared correction-chain validator now requires a canonical anchor containing
the chain base, initial head, and initial 64-hex manifest. Every record must use
that base, link its `previousHead` and `previousManifestDigest` to the preceding
record (or anchor for attempt one), use canonical commit and 64-hex manifest
values, preserve sequential attempts and unique IDs, and remain inside the
per-signature budget. Checkpoint inspection and degraded authorization use the
same validator and reject disconnected, reordered, or malformed chains.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 13.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and package.

## Verification

- Focused checkpoint tests reject a disconnected prior head and a noncanonical
  manifest digest.
- Degraded authorization and delivery-gate tests prove valid anchored chains
  still pass and remain bounded per failure signature.
