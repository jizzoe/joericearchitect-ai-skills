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
