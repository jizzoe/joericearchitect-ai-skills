# Strict Review Correction: Platform Code Trust

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `6f6f2c33bb3f21e81248e38e58a220236be6b569`.
- Manifest:
  `b29213ac3ced17d9853d3a3255784666d9f6b87178f6256c4deaf44e6cfed3e3`.
- Strict review record:
  `strict-d6762754-641c-4fd4-9b08-a14073c74f9e`.
- Strict transport and owned-view cleanup: passed.

The validated strict result retained one blocker: managed Seatbelt write denial
does not itself prove that a same-user Homebrew installation is host-owned.
This is the second bounded correction for the same executable-trust failure
signature.

## Finding and disposition

- Finding: `IR-001` — authenticate the elevated executable through OS ownership
  and mode or an OS-protected signing mechanism.
- Failure signature:
  `independent-review/blocker/caller-selected-elevated-codex-path/merge-pr`.
- Correction attempt: 2 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

The fixed path allowlist, no-follow content hash, filesystem identities, and
managed-process write-denial checks remain. They are no longer treated as the
host-ownership proof.

On macOS, request preparation and result acceptance now ask the OS `codesign`
validator to enforce an explicit requirement: the binary identifier must be
`codex`, its Developer ID certificate must chain through Apple, and the leaf
certificate team identifier must be OpenAI `2DC432GLL2`. The installed Codex
0.147.0 binary passed strict on-disk, designated-requirement, and explicit-
requirement validation and reports hardened-runtime signing by `Developer ID
Application: OpenAI OpCo, LLC (2DC432GLL2)`.
The adapter compares the no-follow content hash and all bound path identities
both immediately before and after the OS trust check, then repeats the complete
procedure during result acceptance.

On Linux, where that signing mechanism is unavailable, strict preparation
requires the canonical target and every relevant containing path to be owned
by root and not writable by group or others. Other platforms fail closed.

Apple documents that code-signature verification establishes whether signed
code remains unaltered and that designated requirements identify code by its
Apple-issued signer and identifier. The implementation uses the supported
`codesign` verifier rather than parsing signature internals.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; neither earlier failed result can authorize
delivery.
