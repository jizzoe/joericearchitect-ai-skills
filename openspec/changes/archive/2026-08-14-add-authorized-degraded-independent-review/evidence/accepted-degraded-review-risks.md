# Accepted Degraded-Review Risks

Status: accepted-risk (not resolved)

Decision time: 2026-08-13

Expiration: 2026-08-13T20:57:51Z

Current zero-touch delivery renewal: explicitly authorized for
`add-authorized-degraded-independent-review` through
`2026-08-14T11:22:00.000Z`. The earlier decision remains historical evidence;
this renewal does not extend authorization to any other change.

The owner explicitly accepts the following findings for authorized degraded
independent review only:

- `IR-001` — Parent-launch and runtime evidence is ordinary caller-readable
  JSON without an OS-protected signature or authenticated IPC capability. A
  sufficiently adversarial implementation process could forge evidence that a
  degraded review occurred.
- `IR-002` — The degraded launcher accepts a reviewer executable path when its
  basename is the expected `codex`/`codex.exe` or `claude`/`claude.exe`. A
  malicious executable using that name could impersonate the reviewer and run
  outside the managed implementation sandbox.

The owner accepts these risks because degraded fallback remains an explicit,
change- and transition-bound, time-bounded best-effort quality check after
strict review is objectively unavailable. It still attempts a fresh reviewer
with a sealed exact-head package and no implementation-session history, but its
independence, non-mutation boundary, launch evidence, and executable identity
are not security-verifiable.

This decision:

- does not mark either finding resolved;
- does not permit the degraded result to be described as strict, OS-isolated,
  read-only-enforced, or security-verified;
- does not alter strict review, which remains strict-by-default and is always
  attempted first;
- does not waive any other blocker/high finding, validation gate, exact-head
  review requirement, correction limit, or scope control; and
- applies only to `add-authorized-degraded-independent-review` and
  `add-research-and-planning-base-skills` through the stated expiration.

The deferred hardening option is an external trusted launcher with authenticated
IPC or an OS-protected key/capability, host-owned executable pinning,
provisioning/rotation/audit lifecycle, and equivalent CI setup.
