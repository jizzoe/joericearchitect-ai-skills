## 1. Delivery Boundary

- [x] 1.1 Confirm or create the primary GitHub issue before delivery and add
  validated tracking metadata for this change.
  - Depends on: planning review approval.
  - Evidence: proposal, `tracking.yaml`, and delivery PR reference the same
    issue without storing credentials or mutable state.
- [x] 1.2 Inspect existing script, test, documentation, and fixture conventions
  before selecting the utility location and CLI contract.
  - Depends on: planning review approval.
  - Evidence: implementation uses existing Node and validation patterns without
    adding an installer that copies files independently of `gh`.

## 2. Utility Behavior

- [x] 2.1 Implement a thin Node utility that validates explicit local or remote
  source mode, agent, and skill selector, then builds the `gh skill install`
  argument array at user scope.
  - Depends on: 1.2.
  - Evidence: local and remote command construction matches the delta spec and
    never uses shell interpolation.
- [x] 2.2 Add explicit force, remote pin, dry-run, help, and failure behavior
  while rejecting invalid or ambiguous option combinations before execution.
  - Depends on: 2.1.
  - Evidence: dry-run starts no child process; local pins and implicit
    overwrite behavior fail deterministically.

## 3. Tests and Documentation

- [x] 3.1 Add focused regression tests with a stubbed `gh` executable for
  local, remote, all-skills, pin, force, dry-run, failure, and malformed input
  scenarios.
  - Depends on: 2.1, 2.2.
  - Evidence: tests inspect exact argument arrays and nonzero propagation
  without calling the network or a real installer.
- [x] 3.2 Add a disposable second-checkout fixture that validates local and
  remote command rendering, source paths with spaces, and no product-specific
  constants.
  - Depends on: 3.1.
  - Evidence: fixture output is deterministic and proves no user profile or
    real skill destination is mutated in dry-run mode.
- [x] 3.3 Document the development loop and reviewed remote-install workflow,
  including force, pin, dry-run, session reload, and recovery boundaries.
  - Depends on: 2.2.
  - Evidence: documentation commands correspond to tested utility behavior and
    retain direct `gh skill` commands as an alternative.

## 4. Review and Lifecycle

- [x] 4.1 Review security, portability, recovery, attribution, canonical
  ownership, and the absence of secrets or custom file-copy behavior.
  - Depends on: 3.2, 3.3.
  - Evidence: review confirms `gh` remains the installer and all external
    inputs are argument values rather than shell code.
- [x] 4.2 Run focused tests, utility fixtures, strict change and all-spec
  validation, artifact-quality validation, and `git diff --check`.
  - Depends on: 4.1.
  - Evidence: all commands pass, or blocked external behavior removes the
    corresponding support claim.
- [x] 4.3 Complete formal Verify, delivery, Sync, and Archive as separately
  authorized lifecycle checkpoints.
  - Depends on: 4.2.
  - Evidence: verification maps requirements to objective tests; delivery links
  the issue and `OpenSpec change: add-skill-install-utility`; later Sync and
  Archive preserve specification and history boundaries.
