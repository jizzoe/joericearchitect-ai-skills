## 1. Terminal-event contract and artifact creation

- [x] 1.1 Extract one canonical findings-payload validator for event capture and existing artifact inspection.
  - Depends on: planning review.
  - Evidence: focused compatibility tests for every accepted and rejected findings payload shape.
- [x] 1.2 Implement the bounded `codex-jsonl-final-agent-v1` state machine with last-agent selection, lifecycle ordering, end-of-stream proof, fixed bounds, and safe diagnostics.
  - Depends on: 1.1.
  - Evidence: deterministic parser tests for valid, malformed, unknown, failed, incomplete, duplicate, post-terminal, and over-bound streams.
- [x] 1.3 Implement exclusive same-directory atomic findings and metadata-receipt writes with non-symlink, nonexistence, final-inspection, and cleanup handling.
  - Depends on: 1.1, 1.2.
  - Evidence: filesystem tests for atomic hard-link no-clobber publication, successful writes, pre-existing and concurrently created destinations, symlinks, unsupported filesystems, write failure, receipt loss, mismatch, and cleanup on POSIX and Windows.
- [x] 1.4 Complete portable replay coverage for no-tool and multi-tool success, intermediate schema-valid messages, findings, bounds, newline variants, and diagnostic minimization.
  - Depends on: 1.1, 1.2, 1.3.
  - Evidence: focused replay suite passing on supported Node platforms with no raw event, path, command, package, or credential content in diagnostics.

## 2. Sealed Codex host transport

- [x] 2.1 Add the fixed installed-runtime capture entrypoint that validates one sealed request, separates child stdout and stderr, launches only sealed Codex argv, and emits no raw review content.
  - Depends on: 1.2, 1.3.
  - Evidence: child-process fixtures prove the independently supplied request digest is checked before operational-field parsing, request substitution is rejected before child launch, streams stay separate, and command/path choices are fixed.
- [x] 2.2 Update strict and authorized-degraded Codex builders to retain `--output-schema`, add `--json`, remove `--output-last-message`, and seal Node, capture-adapter, Codex, event-contract, path, package, and expiry identities.
  - Depends on: 2.1.
  - Evidence: request-shape tests prove fixed argv, content identities, no active-repository executable, and no caller-selected fields.
- [x] 2.3 Require the safe capture receipt plus host-created artifact while preserving package, result, assurance, identity, and cleanup checks.
  - Depends on: 1.3, 2.2.
  - Evidence: parent-consumer tests distinguish missing/invalid receipt, artifact, identity, payload, expiry, and cleanup outcomes.
- [x] 2.4 Add one fresh transport-only retry for eligible missing-final-message or missing-completed-turn outcomes without changing objective-correction budgets.
  - Depends on: 2.3.
  - Evidence: lineage tests preserve attempt one, allow exactly one eligible retry, and reject unsafe or repeated retries.
- [x] 2.5 Complete strict/degraded integration and fault-injection coverage, including assurance labels and Claude non-regression.
  - Depends on: 2.1, 2.2, 2.3, 2.4.
  - Evidence: integration tests cover child mismatch, result/receipt tampering, active-repository exclusion, cleanup, retry policy, strict/degraded labels, and unchanged Claude behavior.

## 3. Bounded package exposure

- [x] 3.1 Implement a versioned package-capsule index and UTF-8 byte-bounded section/chunk writer without changing `independent-review-package-v1` or its manifest digest.
  - Depends on: planning review.
  - Evidence: unit tests prove fixed total, index, chunk, and count bounds plus deterministic output for metadata, artifacts, validation evidence, and patch bytes.
- [x] 3.2 Implement capsule reconstruction and pre-launch validation for exact ordering, paths, regular-file identity, byte counts, chunk digests, canonical package bytes, and original manifest digest.
  - Depends on: 3.1.
  - Evidence: adversarial tests reject missing, duplicate, reordered, extra, oversized, symlinked, non-regular, and digest-mismatched index/chunk entries.
- [x] 3.3 Route Codex and Claude prompts to the bounded capsule index and remove one-line package injection and line-only package-read guidance.
  - Depends on: 3.1, 3.2.
  - Evidence: strict/degraded invocation fixtures for both assistants reference only the capsule representation and preserve exact package/result bindings.
- [x] 3.4 Complete multibyte, newline, large-package, portability, and cleanup coverage for capsule creation and inspection.
  - Depends on: 3.1, 3.2, 3.3.
  - Evidence: replay of the prior large package plus UTF-8 boundary fixtures proves no chunk exceeds its byte limit and exact reconstruction remains stable.

## 4. Runtime, protocol, dispatch, and dependency sequencing

- [x] 4.1 Include the capture and capsule entrypoints in verified runtime distribution and prove candidate build/install contents and digest.
  - Depends on: 2.1, 2.2, 3.2.
  - Evidence: runtime build, manifest/smoke, install, content-verification, and portability tests with no importable active-workspace path.
- [x] 4.2 Add an allowlisted resolver that consumes the durable work-unit `reviewAdapter` snapshot and binds request construction, launcher recovery, runtime receipt, and result acceptance to the same adapter.
  - Depends on: 2.5, 4.1.
  - Evidence: dispatch tests prove Claude/Codex selection, reject absent/unknown/mismatched/directly substituted launchers, and preserve the selection through strict and authorized-degraded paths.
- [x] 4.3 Update the canonical independent-review protocol and verify thin Claude/Codex wrappers remain thin.
  - Depends on: 2.3, 3.3, 4.2.
  - Evidence: protocol diff and canonical/thin-wrapper drift checks distinguish JSONL and capsule transport input from the accepted host-owned artifact and durable adapter binding.
- [ ] 4.4 Temporarily select `claude-detached-restricted-v1`, create the exact owner-authorized bootstrap binding to the N-1 runtime, and preserve product configuration provenance.
  - Depends on: current Claude capability probe, 4.1, 4.2.
  - Evidence: configuration validation and bootstrap record bind exact base/head/manifest, expiry, N-1 runtime digest, Claude launcher/reviewer, and worktree lifecycle; accepted evidence identifies N-1 Claude and cannot originate from changed Codex capture code.
- [ ] 4.5 Update tracking implementation paths and record issue #247 as the blocking prerequisite for PR #246 while leaving PR #246 and controller `controller-e45c82049d4f6606bcfc1abbef4ad8cc` unchanged.
  - Depends on: 2.5, 3.4, 4.1, 4.2, 4.3, 4.4.
  - Evidence: tracking validation plus read-only PR #246 comparison and exact controller identity/current-phase/step/digest comparison before runtime installation.

## 5. Validation, review, and delivery evidence

- [ ] 5.1 Run focused parser, artifact, capsule, parent-transport, dispatch, adapter, runtime-distribution, security, and portability tests.
  - Depends on: 1.4, 2.5, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5.
  - Evidence: exact focused commands and passing results retained under the change evidence boundary.
- [ ] 5.2 Run complete SDD/runtime regression suites twice where repeatability applies, `git diff --check`, and `openspec validate --all --strict`.
  - Depends on: 5.1.
  - Evidence: current-head passing regression, repeatability, diff, and strict-validation output; every bounded correction has rerun evidence.
- [ ] 5.3 Run a fresh bounded local code, security, recovery, and whole-system coherence review over every changed path and correct objective findings.
  - Depends on: 5.2.
  - Evidence: current-head reviewed-path inventory, findings/dispositions, correction evidence, and a fresh no-objective-finding rereview.
- [ ] 5.4 Build a candidate runtime and run the real installed-Codex multi-step acceptance probe with tool use, an intermediate message, and the bounded large-package capsule.
  - Depends on: 5.1, 5.2, 5.3.
  - Evidence: candidate digest, valid safe receipt, one completed turn, and exact host-created final artifact from `--json --output-schema`.
- [ ] 5.5 Run OpenSpec Verify, exact-head CI, and a fresh N-1 Claude strict-first-degraded independent review for one final package through the exact bootstrap binding.
  - Depends on: 5.4.
  - Evidence: Verify report, CI head binding, strict/degraded lineage as applicable, N-1 runtime and Claude result identity, validated result, and dispositions; unavailable Claude evidence pauses rather than self-certifies.
- [ ] 5.6 Record final delivery evidence and verify migration coherence before runtime installation and dependent-work resumption.
  - Depends on: 5.5.
  - Evidence: issue #247 delivery/Archive record and ordered proof that repaired runtime installation precedes PR #246 rebase/review; after PR #246 installation, fresh owner authorization is required before reconciling the named requirements-to-plan controller at its first incomplete `propose` phase.
