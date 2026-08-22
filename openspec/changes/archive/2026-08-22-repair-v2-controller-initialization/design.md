## Context

See [proposal.md](proposal.md) for motivation. The current controller has the
domain functions needed to create and persist a record, but its installed
wrapper and manifest expose only later transition verbs. The v2 admission
state is outside the repository in the local state store, while the controller
checkpoint is in the repository's Git common directory. A single operating-
system atomic file write cannot cover both locations.

## Goals / Non-Goals

**Goals:**

- provide one installed-runtime start operation that produces matching durable
  admission and controller context before any lifecycle action;
- make a crash or write failure recoverable without leaving an orphaned active
  claim; and
- preserve strict identity, expiry, authorization-digest, ownership, and
  legacy-record boundaries.

**Non-Goals:**

- changing claim-provider selection, takeover policy, ordinary lifecycle
  semantics, legacy bootstrap records, or historical archived runs;
- adding a general state editor, cross-machine transaction coordinator, or
  direct workspace-module execution path.

## Decisions

### 1. Expose one `initialize-v2-delivery` controller subcommand

The runtime wrapper will expose a single structured initialization subcommand.
It will be the only path used by the autonomous lifecycle skill for a new v2
delivery. It receives resolved authorization and the typed repository/provider
bindings already required by admission, generates or validates one controller
run identity, and returns both durable identities.

This replaces the unsafe two-command caller sequence of “admit, then somehow
persist a record.” A standalone record-creation command was rejected because a
caller could bind it late, to another run, or after a claim had already become
stranded.

### 2. Use a recoverable two-phase durable protocol, not a false cross-directory atomic claim

The controller checkpoint and v2 state store are different directories, so an
OS-level all-or-nothing rename is impossible. The initializer will therefore
first persist a pending exact controller context that cannot select lifecycle
work or own resources. It will then admit the v2 run and durably bind the
returned identities. If the second phase fails, the request stays recoverable
but no active claim is considered usable; the implementation must either roll
back the newly created claim through its exact bounded recovery path or return
only after durable context is present. A reread verifies both stores before a
success result.

The observable guarantee is stronger than the current behavior: no lifecycle
selection can occur without both records, and no failed start may leave an
unrecoverable active claim. Direct calls to admission remain a low-level
contract operation for tests and must not be used by canonical lifecycle
skills.

### 3. Bind both identities in immutable evidence

The pending and completed controller records will bind selected entry,
repository identity, authorization digest, expiry, controller run ID, v2
parent/work-unit/claim IDs, provider binding, and state-generation evidence.
The initializer accepts retries only when these values are exact. It rejects
foreign, expired, partially forged, legacy, or differently-authorized retries
without updating either durable store.

### 4. Make the installed runtime the only public execution boundary

The wrapper and manifest will enumerate the initializer. Canonical lifecycle
and delivery skills will invoke it through `ai-skills-runtime`; neither will
import a workspace source file or hand-write `.git/sdd-delivery-runs`.

## Risks / Trade-offs

- **Crash between durable writes** → retain a typed pending record and exact
  resume/rollback path; test interruption at every write boundary.
- **A claim is released incorrectly during recovery** → permit recovery only
  for the exact newly initialized identity and generation; leave all other
  active or legacy claims blocked.
- **A caller bypasses the new operation** → update canonical skills and add
  installed-runtime integration tests that prove the declared verb is used.
- **Stale authorization is replayed** → bind and validate expiry and
  authorization digest on every retry.
- **Product-specific behavior leaks into a reusable asset** → use temporary
  state roots and arbitrary canonical remotes in fixtures; no real repository,
  issue, token, or path is committed.

## Migration Plan

1. Add the initializer contract, wrapper/manifest declaration, and focused
   tests in an isolated implementation branch.
2. Exercise success, mismatch, collision, injected interruption, exact resume,
   and no-orphan-claim cases against temporary state roots.
3. Update canonical lifecycle guidance and the handoff roadmap, then run the
   full suite, local review, Verify, and strict OpenSpec validation.
4. Deliver implementation, Sync, and Archive through their independently
   registered resources.
5. Build and activate the released runtime, then begin the pending M1-S2
   terminalization-repair closure through the new initializer rather than a
   manual record or a raw admission call.

Rollback before a real delivery begins is a normal implementation rollback.
For an interrupted real initialization, use only the exact retry/recovery
receipt; do not delete a controller record or release a claim manually.

## Reuse Plan

- **Canonical assets:** controller domain logic, runtime wrapper/manifest, and
  lifecycle-skill invocation are assistant-neutral and shared.
- **Product configuration:** repository remotes, provider configuration,
  authorization, and expiry remain typed inputs or local durable state.
- **Platform exposure:** existing Claude and Codex thin adapters call the same
  launcher; no platform-specific controller implementation is introduced.
- **Second-product portability check:** fixtures use an arbitrary second
  canonical remote and a fresh temporary repository/common Git directory to
  prove identities and paths are not hard-coded.
- **Intentional product-specific behavior:** none is added; historical M1-S2
  evidence is referenced only in change-local execution evidence after release.
