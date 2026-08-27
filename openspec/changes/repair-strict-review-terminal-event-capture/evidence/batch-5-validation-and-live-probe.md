# Batch 5 — validation and live-probe evidence

## Live Codex acceptance attempt 1 — unavailable

This attempt is retained as unavailable evidence and does not satisfy task 5.4.
No raw JSONL, stderr, reviewer text, command, package content, credential, or
temporary path is retained.

- Source head: `e900fa7a8ff94a9f63f3a995fc1d71bda1746698`
- Candidate runtime digest:
  `37ce61402f0325bb5e38e9093966b5164457402c9ecd0fb03c8ee2e14d1640c8`
- Package base: `aa2439116cbff2eb2477fda961b15813a4bf2131`
- Package manifest:
  `979180511c60b42814c93046b85ce23e47662d162ac899d8aab03d5bff350225`
- Capsule chunks: 10
- Transport revision: `codex-jsonl-final-agent-v1`
- Exit status: unavailable
- Event bytes: 466
- Event count: 3
- Candidate count: 0
- Tool-event count: 0
- Terminal classification: `unavailable`
- Artifact receipt state: `absent`
- Diagnostic: `codex-jsonl-turn-failed`
- Attempts: 1; the failed turn was not automatically retried
- Exact-owned archive cleanup: complete
- Active installed runtime after cleanup: unchanged N-1 digest
  `5f050691d1e30a7607fd541d8fd1d339f4985fba66f7b3aee1b4b4008d10eb22`

A separate non-acceptance smoke diagnostic at the actual elevated host
boundary used the same installed Codex executable, isolated bounded auth copy,
strict configuration, read-only sandbox, ephemeral mode, JSONL output, and a
minimal output schema. It exited 0 and emitted the supported ordered event
types `thread.started`, `turn.started`, `item.completed`, and
`turn.completed`, with one agent message and no failure classification. This
proves current basic CLI/auth/schema/event capability only; because it used no
review tools and produced no capture-owned findings artifact, it is not review
or task-5.4 evidence.

## Fresh whole-system review corrections

The current-head local code/security/recovery/coherence review found two
objective defects before the next acceptance package:

1. The terminal-event state machine tracked only item state, so one item ID
   could change type across lifecycle events, and a started item could remain
   incomplete when `turn.completed` was accepted. The parser now binds item
   type to ID, rejects type substitution, and rejects terminalization with an
   incomplete item. Focused parser/capture/adapter tests pass: 48 passed, 0
   failed.
2. Runtime-matrix triggers and its portable test command did not include the
   new adapter-dispatch/bootstrap sources, tests, or the two changed findings
   schemas. Those paths and portable tests are now included. The resulting
   event/capsule/contract/dispatch/bootstrap matrix subset passes: 44 passed,
   0 failed; runtime-reference validation and `git diff --check` also pass.

Task 5.3 remains open until all changed paths are rereviewed on the final
candidate head after complete repeatable regression evidence. Task 5.4 remains
open until a real bounded large-package run records tool use, at least two
completed agent-message candidates, one completed turn, a valid safe receipt,
and the exact host-created final findings artifact.

## Live Codex acceptance attempt 2 — unavailable and diagnosed

The next exact package used source head
`e57d9ded5ecba41570cda0950faf8424207128c5`, candidate runtime digest
`ddd2100957bfca265234270c6f9a9962a25fa1f03a89a186ff8ddc8d80c12cf8`,
package manifest
`d42087a64612f1122571aa36637190a8fa1b817b1dd9dc0c647ca8a2be56a20a`,
and 10 capsule chunks. It failed with the same safe receipt shape as attempt 1:
466 event bytes, 3 events, no candidate or tool event, absent artifact,
`codex-jsonl-turn-failed`, one attempt, and complete exact-owned cleanup.

A redacted same-schema/minimal-prompt diagnostic then isolated the cause. The
installed CLI emitted `thread.started`, `turn.started`, `error`, and
`turn.failed`; it exited 1 and matched only the allowlisted `schema` failure
category. The earlier minimal-schema smoke had succeeded at the same elevated
host boundary. Inspection found an unsupported regex negative lookahead in the
two changed findings-evidence schema patterns. Codex rejected that structured
output schema before model or tool execution.

The correction removes regex lookaround from the transport-facing findings and
result schemas. The canonical findings/result validator still rejects legacy
or capsule-owned evidence paths, so the security boundary is unchanged while
the generation schema remains compatible with the installed CLI. An offline
regression assertion now rejects future lookaround in either transport schema,
and the canonical-validator test retains capsule-path rejection. Focused
contract/parser/capture/adapter tests pass: 55 passed, 0 failed. This correction
creates a new source head and package before any further acceptance attempt.

## Live Codex acceptance attempt 3 — transport success, review finding

The schema-corrected package used source head
`219e260bee8bc624f20e8656ec252fefbf93a006`, candidate runtime digest
`ddd2100957bfca265234270c6f9a9962a25fa1f03a89a186ff8ddc8d80c12cf8`,
package manifest
`313e70e5b7790047421afc1b3da45eb755a190f1d401e9d57808fd8856b060d7`,
and 10 capsule chunks. Host capture completed with exit 0, 265,419 event bytes,
32 events, 28 tool events, one completed agent-message candidate, one
completed turn, and a 627-byte host-created artifact whose SHA-256 matched the
safe receipt. The parent validated the exact package/result/runtime bindings,
preserved a one-finding `failed` result, and completed exact-owned cleanup.

This proves the repaired host-artifact path after real multi-step tool use, but
does not satisfy task 5.4 because only one completed agent message was emitted.
The finding identified that timeout/interruption paths could settle immediately
after requesting child termination. The correction now waits for the child
`close` event, escalates from `SIGTERM` to `SIGKILL` after a bounded grace
period, and never publishes a receipt for an identified child whose exit cannot
be observed. An uncooperative-child fixture proves no settlement occurs before
confirmed close.

The fixed strict prompt now also requires one short non-findings progress
message before the first inspection tool call. This exercises last-message
replacement through the production transport without a caller-selected prompt
or test-only acceptance mode. The progress message is discarded when replaced;
if it were left as the terminal candidate, normal findings-payload validation
would reject it. Focused capture/parser/adapter tests pass: 49 passed, 0 failed.

## Live Codex acceptance attempt 4 — acceptance shape met, review finding

The next exact package used source head
`850144beef52ddeef11be86c45be14982969c7b4`, candidate runtime digest
`22d018b3d31ad6b09b9c32552f04743bc410eb4159c1e7e1dd7b475204069cef`,
package manifest
`93ccd452c24c0895e069cba7983ed07f5497906061de6d9d6d9fbc267540c98c`,
and 10 capsule chunks. Its safe receipt proves the complete task-5.4 transport
shape: exit 0, 257,216 event bytes, 32 events, 3 completed agent-message
candidates, 26 tool events, one completed turn, one attempt, and a 409-byte
host-created artifact whose SHA-256
`8915bb7b420e3f48ea8e9230bdd958970cc2efa5b06eb34f11be01de85a56172`
matched the receipt. The parent validated the exact package/result/runtime
bindings, preserved the one-finding result, and completed exact-owned cleanup.

The objective finding identified that the successful authorized-degraded
dispatcher validated its runtime receipt but omitted it from the returned
terminal record. The dispatcher now returns that exact validated receipt, and
its success-path test asserts preservation. A new exact-head live probe is
still required because final evidence and unresolved-finding disposition must
bind the same corrected head.
