# Strict Review Correction: Executable Trust Boundary

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `8eb9cee33a469386a4cb9396d25ece92032965c5`.
- Manifest:
  `237ff0e5ec034e3d5f3f6490a31e1a4fa3c95ec21c31f9c3f965a2650134ad81`.
- Strict review record:
  `strict-4d2b7ecc-66c9-4516-aeda-939345df53d7`.
- Strict transport and owned-view cleanup: passed.

The validated strict result contained one blocker. It is a bounded objective
security correction and requires no product or accepted-risk decision.

## Finding and disposition

- Finding: `IR-001` — the elevated parent transport pinned a selected file but
  accepted an absolute caller-supplied executable path whose basename was
  `codex`.
- Failure signature:
  `independent-review/blocker/caller-selected-elevated-codex-path/merge-pr`.
- Correction attempt: 1 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

The strict transport now accepts only the bare `codex` adapter name and
resolves it through fixed platform installation candidates. The canonical
target must remain within the corresponding installation root. Before
preparing elevation, the managed process proves write denial for the target and
every relevant containing-path component, records ownership/mode and filesystem
identities, hashes the executable through a no-follow file descriptor, and
binds all of that evidence into the request digest. Acceptance repeats the
resolution, write-denial, identity, and content-hash checks. Workspace,
temporary, home, and other caller-selected executable paths are ineligible.

An added regression creates an executable named `codex` in a caller-selected
temporary directory and proves that preparation rejects it. A live local probe
also resolved the installed Codex from the fixed macOS candidate, proved
managed-process write denial, produced a content hash, bound six canonical path
identities, and removed its owned probe view.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; the failed result above cannot authorize delivery.
