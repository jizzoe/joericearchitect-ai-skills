## Strict-review correction 1

The strict isolated review of commit `930f76f` returned two high findings.

- `queue-advance-retains-prior-entry-resources`: queue advancement now moves
  completed-entry resources and receipts into a validated historical partition
  before resetting the active selected entry.
- `legacy-migration-authorization-is-self-attestable`: migration now accepts
  only an exact Ed25519-signed record verified against a controlled trusted
  owner public key; approval flags and caller-computed digests are insufficient.

Validation after the correction: 210 focused tests, strict OpenSpec validation,
artifact-quality validation, tracking validation, and whitespace validation
pass. The changed head requires a fresh strict review before delivery.
