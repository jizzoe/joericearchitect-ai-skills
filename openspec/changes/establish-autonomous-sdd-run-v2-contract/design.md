## Context

See [proposal.md](proposal.md) for motivation and the delta specifications for
observable behavior. Today, `autonomous-sdd-controller.mjs` and
`checkpoint.mjs` maintain incompatible records, controller discovery is tied to
worktree paths, and the installed controller wrapper can create but cannot
persist an initial record. The M1-S1 brief is the accepted source for the
contract boundaries; M2-S1 will select the concrete native lock adapter.

## Goals / Non-Goals

**Goals:**

- Introduce one validated, portable v2 domain schema for a parent run, one
  child work unit in v1, attempts, claims, immutable history, projections,
  archive manifests, and legacy classifications.
- Make an initial v2 admission a durable controller transition before lifecycle
  selection, without putting durable state in a removable worktree.
- Provide read-only legacy decoding, migration inventory/classification, and
  strict write-denial so a new run never has two authorities.
- Define a provider interface and capability contract that M2-S1 can bind to a
  pinned cross-platform lock implementation without changing the domain model.

**Non-Goals:**

- Implement a daemon, scheduler, automatic restart, multi-host failover,
  Temporal deployment, native lock adapter selection, or transition execution.
- Auto-migrate ambiguous legacy records, delete audit evidence, or alter the
  separate OpenSpec Sync/Archive lifecycle actions.

## Decisions

### V2 records are append-only history with projections outside worktrees

The domain module will validate canonical JSON records and digests for the
following scopes: repository, parent run, work unit, transition attempt,
resource claim, evidence, projection, archive manifest, and legacy
classification. It will keep child data in `children/<work-unit-id>/` and
limit parent summaries to the M1-S1 allowlist. Records and evidence are
published as uniquely named immutable entries; indexes and projections are
explicitly rebuildable from history.

The local v1 layout is:

```text
${XDG_STATE_HOME:-$HOME/.local/state}/ai-skills/autonomous-sdd/
  repositories/<readable-name>--<repository-id-prefix>/
    repository.json
    locks/mutation.lock
    active/<parent-run-id>/{parent,children/<work-unit-id>}/
      manifest.json
      records/
      evidence/
      projection.json
    index/{repository-status.json,runs/<parent-run-id>.json}
    archive/YYYY/MM/DD/<parent-run-id>/{archive-manifest.json,parent,children}
```

This is not a new general workflow engine: it is the sole local substrate for
the contract. The alternative—continuing existing controller/checkpoint files
and translating at runtime—would preserve competing authorities and
location-dependent discovery.

### Admission uses remote-derived identity and an immutable provider binding

`repositoryId` is `r1-<sha256(canonical-remote-identity)>`, computed from a
configured canonical remote's normalized credential-free fetch URL. Admission
requires a validated repository configuration and a single named claim
provider. The parent run freezes history/claim provider identities and their
safe configuration digest. Every later mutating write presents the active
ownership generation.

Paths, remote URLs with credentials, raw environment values, and credentials
are never included in portable history records. Repository configuration
authority and source precedence remain M1-S3 work; this slice consumes a
validated input contract rather than inventing one.

### M1 defines lock semantics; M2 selects the adapter

M1-S1 exposes a provider capability protocol that requires Windows `LockFileEx`
and POSIX advisory-lock equivalence, crash release, explicit takeover proof,
and ownership-generation fencing. It rejects timeout/mkdir/PID fallbacks. M2-S1
will perform the source/license/Node-20.19/platform assessment and pin the
adapter; the M1 code uses deterministic fake providers for schema and recovery
tests only. This keeps the domain model portable while refusing silent weaker
admission on any supported platform.

### Safe publication and archive are failure-aware boundaries

The storage adapter writes a record to a unique temporary sibling, invokes the
provider's durable-write hooks, atomically renames it, then invokes the
provider's directory-metadata durability hook where supported. The provider
reports unavailable durability explicitly rather than pretending POSIX `fsync`
semantics apply on Windows. Archive first validates terminal/reconciled state
and rebuilt projection; it then moves the complete verified bundle and rebuilds
the index. Any interruption leaves or reconstructs one valid bundle and never
guesses a partial archive outcome.

### Cutover is explicit and read-only for legacy state

New code will provide legacy decoders for controller/checkpoint shapes and an
inventory classifier. It will not rewrite legacy files. V2 admission checks a
no-active-legacy inventory result, and legacy writers return an actionable
write-denied classification after cutover. Existing cleanup helpers remain
behind child-owned v2 resource/cleanup records; v2 status comes from rebuilt
indexes, not old locations.

### Controller and wrappers adapt rather than duplicate policy

The canonical controller adds a durable `admit-v2-run` transition backed by
the v2 contract. Runtime manifest exposure adds that exact operation; it does
not expose workspace module paths. The autonomous lifecycle skill and generated
Claude/Codex wrappers remain thin: they invoke the canonical entrypoint and
pause on invalid/unavailable admission. M1-S2 and M1-S3 later adapt resolver,
operation, and configuration semantics behind this boundary.

## Affected boundaries

| Area | Ownership and change |
| --- | --- |
| `scripts/sdd/` | Canonical v2 schema, repository identity, storage/provider interface, legacy decoder, and controller adapter. |
| `scripts/runtime/` | Declared runtime entrypoint for durable admission; no credentials or product constants. |
| `scripts/sdd/test/` | Contract, migration, repository identity, publication, archive, fencing, and wrapper-entrypoint fixtures. |
| `skills/base/` and generated wrappers | Thin canonical instructions only; regenerate rather than hand-maintain OpenSpec generated assets. |
| `.git/sdd-delivery-runs/` | Existing legacy data is read-only input during cutover, not a new v2 state root. |
| GitHub / Projects | No direct mutation in this change's domain contract; later lifecycle phases use configured bindings. |

## Test and evaluation strategy

- Unit fixtures validate each record kind, unknown/duplicate identity rejection,
  parent/child allowlists, history/provider immutability, and no cross-unit
  evidence leakage.
- Repository fixtures cover moved worktrees, removed worktrees, fresh clones,
  non-colliding same-name remotes, missing/credential-bearing/changed remotes,
  and single-claim admission.
- Fake-provider fault tests cover write-ahead recovery, atomic-publication
  failures, incomplete archive recovery, explicit-takeover liveness,
  generation-fenced stale writes, and all uncertain-takeover rejections.
- Serializers round-trip the same fixtures through local and mock future
  adapters. Native Windows/macOS/Linux lock conformance stays a hard M2-S1
  qualification task after adapter selection.
- Legacy fixtures prove read-only decode, write denial, ambiguous-classification
  preservation, no-active-legacy admission, and rollback without dual authority.
- Focused Node tests, OpenSpec strict validation, requirements mapping, local
  code/security review, and a second-product configured-fixture portability
  check are required before Verify.

## Risks / Trade-offs

- [Schema becomes a second workflow engine] → constrain v1 to one writer, one
  child, no scheduler, and a small explicit provider interface.
- [Filesystem behavior differs on Windows] → expose provider capability and
  durability proof requirements; M2 blocks admission if equivalence is absent.
- [Cutover creates two authorities] → inventory first, disable legacy writes,
  test rollback and refuse ambiguous migration.
- [History leaks secrets or product constants] → canonical validation rejects
  secret-shaped fields and all providers receive configured identifiers only.
- [Archive loses evidence] → archive never deletes and validates manifest plus
  digest reconstruction before moving the bundle.

## Migration Plan

1. Add v2 contract validators, serializers, providers, and read-only legacy
   decoder behind non-default entrypoints.
2. Build inventories and fixtures for all known legacy controller/checkpoint
   records; classify unknown or ambiguous records without rewrites.
3. Add `admit-v2-run` and wrapper routing only after no-active-legacy evidence;
   keep legacy inspection available and deny legacy creation/advancement.
4. Qualify v2 on the local fake provider, then have M2-S1 select and qualify
   the concrete cross-platform lock provider before enabling real mutation.
5. Roll back by disabling v2 admission before any legacy writer is restored;
   retain all v2 and legacy records as read-only audit evidence.

## Reuse Plan

The domain schema, validation, provider contract, controller transition, tests,
and canonical lifecycle instructions are reusable global assets. Product-owned
configuration supplies canonical remote, claim provider, state root policy,
GitHub/Project targets, and environment-specific capability facts. Claude and
Codex get generated thin exposure to the same canonical behavior. A second
configured fixture repository will verify that no current repository path,
remote, label, branch, Project, or credential is embedded in reusable code.
