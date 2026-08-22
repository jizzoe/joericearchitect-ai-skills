## Context

See [proposal.md](proposal.md). The controller-first initializer correctly
persists a non-operational schema-5 checkpoint before admission, but its
installed wrapper passes the entire Git-common controller-state tree to a
legacy walker. That walker currently decodes every JSON file as a schema 1–4
legacy controller. The safe ordering therefore creates the exact input that
blocks the next step.

The pending M1-S2 controller proves the production path and must remain
unchanged until a released repair is installed. This repair itself must use the
owner-approved pre-v2 bridge and cannot manufacture a native claim or legacy
controller.

## Goals / Non-Goals

**Goals:**

- preserve controller-first persistence while allowing its matching admission;
- constrain legacy discovery to real controller candidates and exclude only
  the initializer's internally derived current checkpoint;
- preserve fail-closed behavior for every other ambiguous or active legacy
  controller; and
- prove the installed wrapper path against a real Git common directory, not
  only direct domain-function calls.

**Non-Goals:**

- treating schema 5 generally as legacy terminal state;
- allowing request payloads to suppress arbitrary legacy paths;
- changing reconciliation receipts, provider selection, controller identity,
  terminalization, cleanup, runtime manifest verbs, or existing durable state;
- updating global skills or creating v2/legacy ownership state for this repair.

## Decisions

### 1. Filter candidate filenames before decoding content

`inventoryLegacyDirectory` will walk only files named `controller.json`.
Initializer requests, receipts, indexes, and other JSON are different record
kinds and cannot become legacy authority merely because they share a directory.
The alternative—teaching the decoder about every non-controller schema—would
couple legacy policy to unrelated formats and would keep growing.

Malformed or unknown-schema content named `controller.json` remains a genuine
candidate and stays ambiguous. Candidate filtering therefore removes false
positives without weakening the fail-closed guard.

### 2. Exclude only the initializer-derived pending checkpoint

After resolving the Git-common root and persisting the deterministic pending
controller, `initializeV2Delivery` knows its exact absolute checkpoint path. It
will pass that path through an internal admission option used only for this
call. The legacy walker canonicalizes and excludes only exact matches inside
the configured inventory root.

The public installed `admit-v2-run` wrapper will discard or reject any caller-
supplied exclusion. Glob, prefix, directory, symlink, missing, or outside-root
exclusions are invalid. Globally accepting schema 5 was rejected because an
unrelated or forged current controller must still stop raw admission.

### 3. Exercise the staged installed wrapper with real Git topology

A critical-flow test will build the runtime, initialize a temporary Git
repository with a real common directory and repository configuration, then
invoke the staged launcher and declared `initialize-v2-delivery` verb. It will
assert a successful first initialization, matching deterministic identities,
one active claim, and an exact resumed retry. A companion fixture will place an
unknown-schema `controller.json` outside the exact exclusion and prove admission
still pauses with no v2 claim.

Direct domain tests remain for candidate filtering, path containment, and
caller-exclusion rejection; they cannot substitute for the wrapper test.

### 4. Preserve the bootstrap and runtime ownership boundaries

Implementation, Sync, Archive, issue/Project convergence, and exact local
cleanup are bound to the recorded pre-v2 bridge. Runtime activation uses the
released final mainline commit and updates only the shared runtime, not global
skill installations. The existing pending M1-S2 controller is retried only
after activation and must bind the same deterministic identities already
stored in its checkpoint.

## Risks / Trade-offs

- **A non-controller legacy filename is missed** → legacy controller ownership
  in this repository is already represented by `controller.json`; retain tests
  for every supported schema and document the boundary explicitly.
- **An exclusion suppresses unrelated authority** → derive it internally from
  the persisted checkpoint, require exact contained path equality, and strip it
  from the public raw-admission wrapper.
- **Direct tests pass while packaging regresses** → require a built/staged
  launcher test using real Git-common state and the manifest-declared verb.
- **A repair changes historical bytes** → inventory remains read-only; tests
  compare candidate bytes and no migration or deletion operation is added.
- **Credential or product constants leak** → fixtures use arbitrary remotes and
  temporary paths; evidence stores only normalized non-secret GitHub results.

## Migration Plan

1. Add failing candidate-selection and staged-wrapper regressions.
2. Implement exact filename filtering, contained exclusion, and raw-wrapper
   suppression; rerun focused and critical-flow checks.
3. Complete local review, formal Verify, strict validation, implementation,
   Sync, and Archive delivery through bridge-owned resources.
4. Build and activate only the runtime from the final merged mainline commit.
5. Retry the existing pending M1-S2 initializer and verify exact admitted
   identities before any lifecycle phase.

Rollback before runtime activation is the normal reviewed code rollback. After
activation, restore the retained previous runtime if the staged or live
initializer evidence conflicts; leave the pending controller and all legacy
records unchanged.

## Reuse Plan

- **Canonical assets:** candidate selection, admission, and initialization stay
  under assistant-neutral `scripts/sdd`; the runtime wrapper remains thin.
- **Product configuration:** repository identity, Git paths, authorization,
  provider binding, and expiry remain typed runtime inputs.
- **Platform exposure:** Claude and Codex call the same installed launcher and
  declared controller verb.
- **Second-product portability:** tests use a second arbitrary remote and fresh
  temporary repository/state roots with no repository-specific values.
- **Intentional product-specific behavior:** only the bridge-owned post-release
  receipt refers to the pending M1-S2 controller; reusable code and tests do not.

## Attribution and Licensing

No third-party source, dependency, or asset is introduced. Existing repository
license and generated/runtime provenance remain unchanged.
