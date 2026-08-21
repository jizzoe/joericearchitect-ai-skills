## Context

See proposal.md for the bootstrap failure. The active M1-S3 record is
immutable and was admitted before its own snapshot-provenance behavior was
released. The normal v2 validator correctly rejects it today; changing that
record would create false admission evidence.

## Goals / Non-Goals

**Goals:**

- Close only the named M1-S3 bootstrap run through the released terminalizer.
- Preserve the old work-unit record unchanged while retaining a truthful
  terminal receipt and released claim.
- Keep normal v2 validation strict for every other record.

**Non-Goals:**

- Backfill configuration snapshots, create a new run, weaken general record
  validation, or create a generic legacy escape hatch.

## Decisions

1. Add a separate terminalization-only compatibility validator. It recognizes
   only the old work-unit shape and only after the request carries a verified
   exact bootstrap binding. This keeps general admission/resume validation
   unchanged.
2. Bind compatibility to the repository identity, parent/work-unit/claim IDs,
   approved change, released Archive head, and a short expiry. A caller cannot
   select a storage path or reuse the binding for another record.
3. Add an explicit terminal receipt marker describing the preserved pre-feature
   configuration shape, rather than claiming a snapshot existed. The marker is
   non-secret and carries no configuration value.

Alternatives rejected: editing the old work-unit record would falsify history;
accepting every old work-unit format would weaken recovery protections; using
the pre-M1-S3 runtime would violate the accepted bridge.

## Risks / Trade-offs

- Exact binding could be too broad → validate every identity, expiry, and
  released Archive head before any durable write.
- Compatibility logic could leak into future admission → keep it private to
  terminalization and test that ordinary missing-snapshot records still pause.
- Terminal evidence could imply a snapshot → test the receipt contains only an
  explicit compatibility classification, never a reconstructed snapshot.

## Migration Plan

Deliver the repair through one linked PR, Sync the modified terminalization
specification, Archive the repair, install that released runtime, then rerun
only the exact M1-S3 terminalization request. If any precondition fails, leave
the active record untouched and retain the compatibility binding for recovery.

## Reuse Plan

The controller and run-contract remain canonical, assistant-neutral assets;
the binding takes repository and IDs as input. Claude and Codex continue to
call the same declared runtime helper. The M1-S3 identifiers and bridge record
remain product-local evidence rather than reusable constants.
