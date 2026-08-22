## Context

See `proposal.md` for motivation. The current initializer persists its own schema-5 controller before admission and internally excludes that one exact checkpoint. It then inventories every other `controller.json` through the legacy decoder, which deliberately recognizes only schemas 1–4. The result is safe but incomplete: a prior schema-5 controller remains ambiguous after its associated v2 run has been terminalized and archived.

The repair must operate before new admission and cannot depend on caller assertions. Its only trustworthy completion source is the configured local v2 state root, where terminalization atomically publishes validated terminal records and moves the exact run from `active/` into a contained date-partitioned archive.

## Goals / Non-Goals

**Goals:**

- Derive a read-only set of evidence-verified terminal schema-5 controller candidates before ordinary legacy classification.
- Require mutual controller/archive identities and domain-record digests, not controller status alone.
- Exercise the installed wrapper with real Git-common and state-home directory layouts.
- Preserve current fail-closed behavior and byte-for-byte historical audit state.

**Non-Goals:**

- Reclassifying schema-5 controllers from a caller-provided flag or path.
- Supporting active-state migration, reconciliation, takeover, or repair.
- Deleting terminal controllers or moving controller checkpoints into the v2 archive.
- Changing terminalization format, runtime installation policy, or assistant wrappers.

## Decisions

### Derive compatibility from the configured archive before legacy decoding

Admission will inspect schema-5 controller candidates discovered beneath the canonical Git-common controller root. For each candidate, it will derive the repository state path from the configured state home, readable repository name, and canonical repository ID. It will accept at most one contained archive bundle for the controller's recorded parent run and otherwise return no compatibility evidence.

The derived evidence is passed to legacy classification as an internal exact-reference-and-byte-digest binding. A schema-5 record without a matching derived binding remains `legacy-schema-unknown`.

Alternative considered: allow the legacy decoder to treat every completed schema-5 controller as terminal. Rejected because controller fields are mutable local metadata and do not independently prove claim release or terminal convergence.

### Validate the full terminal bundle and its cross-record identities

The verifier will require validated archived parent-run, work-unit, resource-claim, terminalization-receipt, claim-release, and projection records. It will verify controller admission identifiers, authorization digest, expiry, repository and selected change, provider bindings, terminal receipt digest, released claim disposition, terminal work-unit summary, cleanup disposition, and absence of an active directory for that parent.

Alternative considered: trust the repository run index. Rejected because the index is a rebuildable projection; it may locate evidence but cannot replace validation of the immutable source records.

### Keep compatibility evidence non-public and non-authoritative

Neither the wrapper request nor the public admission input gains a compatibility override. Internal evidence changes only legacy-inventory classification. It never becomes a new v2 authority record and never mutates the controller or archive.

Alternative considered: publish another reconciliation receipt. Rejected because schema-5 is native v2 state with an existing terminal receipt; duplicating it as legacy reconciliation would blur ownership and repeat the bootstrap exception pattern.

### Test through source modules and the installed-runtime boundary

Focused tests will cover valid terminal evidence plus missing, mismatched, symlinked, active, pending, and malformed variants. A critical-flow integration will build/install a runtime from the exact repair head into an isolated runtime home, invoke the manifest-declared initializer against a real temporary Git repository and state home, verify admission and retry, and confirm all fixtures remain byte-identical.

## Risks / Trade-offs

- **Archive traversal could accept an escaped or duplicated target** → canonicalize the configured archive root, reject symlink components and multiple matches, and require exact derived parent-run identity.
- **A superficially complete controller could be forged** → require validated immutable terminal records, mutual identities, and digest linkage.
- **Additional read work occurs before each admission** → bound traversal to one repository archive and schema-5 controller candidates; correctness is preferred over an unsafe cache.
- **Future controller schemas will remain unknown** → preserve fail-closed behavior until their evidence contract is explicitly designed.

## Migration Plan

1. Deliver and archive this repair through the retained pre-v2 bootstrap lane without creating a claim.
2. Build and install only the runtime from the exact final merged default-branch head.
3. Reinvoke the pending planning controller through the installed initializer and verify exact identity reuse.
4. Roll back with the runtime launcher's retained previous-runtime activation if installed-wrapper verification fails; leave the pending controller and all terminal audit evidence unchanged.

## Verification Strategy

- Run the focused admission/controller suites and the staged-runtime launcher
  test against real temporary Git-common and v2 archive state.
- Run the complete Node suite, tracking and artifact-quality validators,
  adapter-drift check, strict OpenSpec validation, and diff/security scans.
- Map every scenario to focused assertions, then perform a fresh bounded
  same-session local review and formal OpenSpec Verify.

## Security and Portability

- Treat all controller and archive JSON as untrusted structured data and validate before comparing it.
- Accept no credential, arbitrary command, caller-selected archive path, or compatibility override.
- Use platform path containment rather than POSIX-only string assumptions; reject symbolic-link escapes.
- On any read, validation, identity, digest, or ambiguity failure, return the existing typed pause and create no claim.
- The change adds no dependency or licensed third-party content.

## Recovery

Every mismatch returns the existing typed pause before a new v2 bundle is
written. The verifier changes no historical controller or archive bytes. If
runtime activation or the live retry conflicts, activate the retained prior
runtime and leave the pending planning controller unchanged for inspection.

## Attribution and Licensing

No third-party source, dependency, generated asset, or copied implementation
is introduced. Attribution and repository licensing remain unchanged.

## Reuse Plan

- Canonical behavior remains assistant-neutral under `scripts/sdd`; the existing runtime wrapper remains a thin enumerated dispatcher.
- Repository identity, state roots, changes, providers, and paths remain configured inputs or derived durable identities.
- A second repository with the same record contracts can reuse the verifier without this repository's owner, Project, branch names, or absolute paths.
- Product-specific issue #193 and bootstrap bridge evidence remain outside reusable runtime assets.
