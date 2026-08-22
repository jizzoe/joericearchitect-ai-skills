## Context

See [proposal.md](proposal.md) for the motivation. The v2 domain contract
already models a terminal child summary and `archiveTerminalRun`, but the
installed controller exposes admission and inspection only. M1-S2's bootstrap
run therefore completed its GitHub/OpenSpec lifecycle while its active v2
bundle still contained an active claim.

The repair must close that exact run without creating another v2 run, editing
records by hand, or making an archived audit bundle disappear. It must also be
portable: no product repository, PR number, state-root path, or credential may
be embedded in reusable code.

## Goals / Non-Goals

**Goals:**

- add a controller terminalization subcommand that validates a structured,
  exact request against the active v2 bundle;
- record immutable terminal summary and claim-release evidence, archive only a
  fully reconciled bundle, and return an idempotent result;
- make the command available through the installed runtime after its repair PR
  is delivered; and
- prove a later v2 admission can proceed once no active run remains.

**Non-Goals:**

- general lifecycle orchestration, automatic stale-owner takeover, a daemon,
  GitHub mutation, cleanup inference, or a replacement for M2/M4;
- accepting a terminalization request based on timeout alone or caller-chosen
  paths; and
- altering any legacy record or automatically terminalizing arbitrary runs.

## Decisions

### 1. One explicit controller transition, not direct file manipulation

Add `terminalize-v2-run` to the existing `autonomous-sdd-controller` runtime
subcommands. The wrapper receives one JSON object and delegates to a canonical
controller function. It resolves the repository state root itself and never
accepts an active-bundle filesystem path from the caller.

This keeps the installed runtime boundary intact. Importing
`archiveTerminalRun` directly would bypass manifest validation and make a
workspace checkout authoritative. A generic filesystem repair command is
rejected because it would make it too easy to target the wrong run.

### 2. Bind the request to all identities and completion evidence

The request contains a `terminalization` envelope with the canonical repository
ID, parent run ID, work-unit ID, claim ID, selected change, a terminal summary,
and non-secret lifecycle/cleanup evidence. The controller reloads the active
bundle and requires every immutable identity, provider binding, selected change,
and active claim to match. It rejects unknown fields and mismatches before
writing.

For this bootstrap repair, owner authorization is supplied outside the runtime
as an exact, time-bounded record. The runtime does not treat that record as a
credential or standing approval; it verifies only the request's structural and
state consistency. The lifecycle controller remains responsible for checking
the active authorization before invocation.

This mirrors the existing evidence-bound legacy-reconciliation model while
avoiding a false claim that a raw CLI invocation is self-authorizing.

### 3. Write new terminal records, then archive atomically

After validation, the controller writes new immutable terminalization evidence
inside the active bundle: a terminal summary, a released-claim disposition, and
a request/result digest. It then uses the local-store archive operation while
the exact active claim is still held. The archive operation moves the whole
bundle atomically and rebuilds the index. The active directory therefore stops
advertising the claim, while the archive retains every original record and the
new closure evidence.

The operation only claims success after rereading the archive/index result. A
repeat request first checks the archive for the same identity and request digest
and returns `already-terminalized`; it does not create a second archive bundle.

### 4. Use a narrow status vocabulary

Results are one of:

- `terminalized`: the exact active bundle converged and moved to archive;
- `already-terminalized`: the same exact terminalization receipt is already in
  archive;
- `paused`: evidence, identity, active-claim state, authorization freshness, or
  terminal preconditions are missing or mismatched; or
- `failed`: a write/archive operation could not preserve a valid bundle.

The result includes safe IDs, archive/index references, and recovery guidance;
it excludes credentials, raw environment data, arbitrary configuration text,
and absolute user paths except the controller-derived state location already
used by its existing structured result.

### 5. Repair delivery precedes one-time execution

The code and specs travel through a narrow repair change on
`fix/m1-s2-v2-terminalization-repair`. Its PR is validated and merged before a
new shared runtime is built and installed. Only then may the one-time bootstrap
record invoke terminalization for M1-S2's exact run. A fresh admission then
proves M1-S3 is unblocked; it does not reuse the repair authorization.

## Risks / Trade-offs

- **Forged or stale lifecycle evidence** → require exact identity matching,
  current controller authorization, an expiry, and a typed pause before writes.
- **Archiving a still-active run** → require terminal status, released claim
  disposition, completed cleanup, and no unresolved attempt/recovery state.
- **Duplicate closeout after interruption** → bind and retain request digest;
  reread archive evidence before creating anything.
- **Creating a permanent back door** → keep the operation narrow, structured,
  controller-gated, and covered by negative tests; it never accepts arbitrary
  paths or manual state edits.
- **Bootstrap deadlock** → the separately authorized bridge is limited to the
  exact repair lifecycle and target M1-S2 run. Normal v2 admission resumes only
  after terminalization succeeds.

## Migration Plan

1. Implement and test the controller/local-store terminalization behavior in
   the isolated repair branch.
2. Deliver the repair PR, Sync its delta specs, and archive the repair change.
3. Build and install the released runtime from the delivered default-branch
   revision; retain the prior runtime as rollback evidence.
4. Inspect M1-S2's exact active bundle and independently confirm its delivered
   implementation, Sync, Archive, issue, and cleanup evidence.
5. Invoke `terminalize-v2-run` once with the exact bootstrap binding; retain
   the result and archive/index references.
6. Inspect the state root and run fresh M1-S3 v2 admission. If any predicate
   fails, preserve state and return a typed pause rather than retrying with a
   changed target.

Rollback before terminalization is normal repair-PR rollback: keep the
currently active runtime and do not invoke the new operation. After a successful
terminalization, rollback never restores the active claim; archive evidence and
the terminal receipt remain the recovery source.

## Reuse Plan

- **Canonical assets:** controller, local-store contract, payload wrapper, and
  runtime manifest remain repository-neutral canonical assets.
- **Product configuration:** the repair's repository identity, run IDs, PR
  evidence, state root, and expiry live only in the local one-time bootstrap
  record and invocation input.
- **Platform exposure:** Claude and Codex continue through the same installed
  runtime launcher and thin canonical skill adapters; no assistant-specific
  code path is added.
- **Portability check:** fixtures use temporary state homes and arbitrary
  canonical remotes, proving no M1-S2 or this repository's constants are needed
  for terminalization behavior.
- **Intentional product-specific behavior:** the one-time M1-S2 invocation is
  governed by the exact owner record, not committed reusable code.
