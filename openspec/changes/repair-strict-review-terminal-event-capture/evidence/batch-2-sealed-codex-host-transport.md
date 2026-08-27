# Batch 2 — sealed Codex host transport

Implementation base: `537b983ce27acd9ca6c7a2167cdc9fa622ca02b3`.

## Implemented scope

- A fixed capture entrypoint authenticates bounded raw request bytes against an independently supplied digest before parsing any operational field.
- Strict and authorized-degraded Codex requests seal the Node, capture adapter, event contract, Codex executable, fixed argument vector, isolated environment, package binding, owned paths, CLI capability classification, and expiry.
- The capture process launches only the sealed executable and arguments, parses only a separate JSONL stdout pipe, drains and discards stderr, and ignores the parent tool's combined output.
- The host creates and hard-link-publishes the findings artifact and metadata-only receipt. Parent consumers require both, verify their byte/digest binding, recheck runtime identities and expiry, preserve canonical result and assurance validation, and require exact-owned view cleanup.
- One fresh retry is permitted only after a zero-exit incomplete terminal stream, with current expiry and identities and absent destinations. Attempt one remains in the receipt; malformed, ambiguous, schema-invalid, over-bound, nonzero-exit, identity, expiry, and publication failures do not retry.
- Direct Codex launch paths fail closed. Claude invocation, normalization, and assurance behavior remain unchanged.

## Evidence

- Focused Batch 2 suite: 77 passed, 0 failed.
- `git diff --check`: passed.
- Node syntax checks for all four changed runtime modules: passed.
- The validated local review result is `/private/tmp/repair-strict-review-batch-2-local-review.json`; `validate-implementation-quality` reported `valid: true` with no issues.
- Parent integration tests distinguish request and runtime-state substitution, missing or mismatched receipts, result tampering or absence, changed identities, expiry, nonzero child exit, cleanup failure, strict assurance, authorized-degraded assurance, and ignored combined tool output.
- Capture tests distinguish raw-request substitution, stdout from stderr, eligible retry lineage, malformed and ambiguous streams, empty and complete-stream nonzero exits, receipt/result publication failure, and metadata minimization.

## Review and corrections

The bounded implementation review found two receipt-state inconsistencies. First, a schema-valid complete stream followed by a nonzero child exit could describe its parse as completed even though no result was accepted. The process classifier and receipt invariants now require a completed attempt to have exit status zero and the canonical complete diagnostic. Second, the CLI capability classification was present in the sealed request and receipt but not compared by the parent. It is now bound through prepared runtime state and checked at acceptance in both assurance paths.

A fresh rereview after both corrections found no remaining objective Batch 2 finding. The required real installed-Codex multi-step probe remains intentionally pending until runtime distribution, capsule, and dispatch work are complete; fixture results are not used to claim that acceptance evidence.

No raw JSONL, stderr, combined tool output, candidate text, finding content, package content, path, command, environment value, or credential is retained in receipt or diagnostic evidence.
