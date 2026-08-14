# Failure Signature Binding Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-review/correction-budget-signature-renaming/scripts/sdd/check-operation-authorization.mjs/merge-pr`.
- Failed review head: `b184f29df02cfae36070b7943553efee57f8eb13`.
- Failed review manifest:
  `d700bbbafff76162b64cd6c9f14213eb0958b334fe445a532e5c52a95d8e9449`.
- Failed review record:
  `degraded-9c960793-8fc4-4cc4-aeba-73fef7875ff9`.
- Finding severity: `high`.
- Disposition: `objective-fix`; no new product, architecture, security posture,
  compatibility, licensing, governance, data-ownership, or scope judgment is
  needed.
- Authorization: the owner authorized disposition-driven continuation for
  this turn. Existing autonomous correction authorization, scope, accepted
  degraded risks, expiration, and per-signature budget remain unchanged.

## Correction

The operation checker now derives the immutable failure signature from a
durable review record's exact finding ID, repository-relative evidence path,
and transition. A caller-supplied signature is optional input for consistency
checking only and is rejected when it differs. Every correction record carries
that typed failure source, and checkpoint and degraded-authorization validation
rederive the signature rather than trusting the record's string.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 12.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and package.

## Verification

- Focused tests prove signature renaming is rejected, the source finding must
  exist exactly once in the durable review record, and per-signature counting
  uses the derived value.
- Finding tests prove severity and disposition remain independent: a high
  objective fix continues while a lower-severity human decision pauses.
