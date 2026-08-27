# Batch 3 — bounded digest-indexed package capsule

Implementation base: `0fe7f9eea53fe815253dbcbe88b03d493dc5c3fe`.

## Implemented scope

- The canonical `independent-review-package-v1` and its original `manifestDigest` remain unchanged and authoritative.
- The legacy one-line package file is replaced by the exclusive read-only `.ai-independent-review-package/` capsule containing a canonical bounded index and ordered digest-addressed chunks.
- The index binds representation revision, package schema version, base, head, manifest digest, canonical byte count, chunk count, and each chunk's ordinal, safe relative path, semantic section, UTF-8 byte count, and SHA-256.
- Metadata, artifacts, and validation evidence use canonical valid-JSON fragment envelopes; diff chunks preserve exact UTF-8 patch bytes and prefer newline boundaries without exceeding 64 KiB.
- The writer and inspector enforce 16 MiB canonical package, 64 KiB content chunk, 512 chunk, and 1 MiB index bounds. Complete reconstruction and package validation occur before reviewer launch.
- Inspection rejects noncanonical indexes or JSON fragments, missing, extra, duplicate, reordered, oversized, changed, symlinked, non-regular, or directory-replaced content.
- Codex and Claude strict and authorized-degraded prompts now name the capsule index and its fixed reconstruction rules. The legacy path is not referenced.
- Transport-owned capsule paths are reserved in the canonical findings contract and both output schemas, so they cannot be accepted as committed-file evidence.
- Exact-owned archive and detached-view cleanup safely reopens capsule directories before removal after marker verification.

## Evidence

- Focused Batch 3 integration suite after corrections: 90 passed, 0 failed.
- `git diff --check`: passed.
- Node syntax checks for the capsule, view lifecycle, capture, and platform modules: passed.
- OpenSpec strict change validation: passed.
- The validated local review result is `/private/tmp/repair-strict-review-batch-3-local-review.json`; `validate-implementation-quality` reported `valid: true` with no issues.
- Capsule tests cover deterministic output, exact reconstruction, a prior-size 140 KiB multibyte long-line patch, a 100 KiB single JSON value, total bounds, legacy and pre-existing paths, directory identity replacement, every required index/chunk tamper class, and read-only cleanup.
- Parent, recovery, and lifecycle tests prove both archive and actual Git worktree cleanup remain exact-owned after capsule injection.
- Exact implementation head `9bd768dfb109895c2ff38a40bd76e641f2001595` passed the GitHub runtime matrix on both supported hosts:
  - [Ubuntu job 98403876419](https://github.com/jizzoe/joericearchitect-ai-skills/actions/runs/33037659862/job/98403876419): success.
  - [Windows job 98403876276](https://github.com/jizzoe/joericearchitect-ai-skills/actions/runs/33037659862/job/98403876276): success.

## Review and corrections

The bounded review corrected four coherence issues before the fresh rereview:

1. JSON arrays were initially split only between elements; canonical fragment envelopes now safely split a single large value while preserving exact bytes.
2. Capsule inspection now retains and rechecks capsule and chunk-directory identities, and requires canonical index and JSON-fragment bytes.
3. Read-only capsule directories initially prevented existing macOS cleanup helpers from removing their owned views; marker-verified cleanup now reopens only the reserved capsule directories before exact-owned removal.
4. The injected capsule could otherwise appear to satisfy a review finding's file-existence check; canonical payload/result validation and schemas now reject both current and legacy transport-owned evidence paths.

A fresh rereview after these corrections found no remaining objective Batch 3 source finding.

## Portability evidence

The runtime matrix selected the capsule module, schema, and focused capsule tests on Ubuntu and Windows. Both jobs passed against the exact implementation head above, so task 3.4 is complete without relying on local fixtures as cross-platform evidence.
