# Batch 1 — terminal-event contract and artifact creation

Current implementation head: `ff128bb9c9fe4298a42435932a38678251fa1669`.

## Implemented scope

- One exact findings-payload parser and validator is shared by event capture and existing artifact inspection.
- `codex-jsonl-final-agent-v1` accepts only the last completed agent message in one completed turn at end of stream.
- Fixed UTF-8 byte, line, event, and candidate bounds fail closed with metadata-only diagnostics.
- Result and receipt publication use same-filesystem hard-link creation as the no-clobber commit point, revalidate the payload immediately before publication, and remove only identity-matched owned output after receipt loss.
- Replay tests cover no-tool and multi-tool sequences, intermediate schema-valid messages, findings, malformed and ambiguous lifecycle events, invalid UTF-8, all bounds, CRLF, final lines without newlines, publication races, symlinks, unsupported hard links, parent-directory identity changes, partial writes, and cleanup.

## Evidence

- Local focused compatibility suite after corrections: 50 passed, 0 failed.
- Exact matrix command after the CI-selection correction: 23 passed, 0 failed locally.
- OpenSpec change validation: passed with `--strict`.
- Pull request linkage and strict OpenSpec validation passed for draft PR #248.
- Ubuntu matrix passed for head `ff128bb`: https://github.com/jizzoe/joericearchitect-ai-skills/actions/runs/33031636493/job/98385258004
- Windows matrix passed for head `ff128bb`: https://github.com/jizzoe/joericearchitect-ai-skills/actions/runs/33031636493/job/98385257826

## Review and corrections

The first bounded review identified malformed UTF-8 acceptance, ambiguous duplicate item lifecycles, missing publication-time payload revalidation, and insufficient parent-directory identity continuity. All four received scoped behavior-preserving corrections and focused regression coverage. A fresh rereview found no remaining objective source finding.

The first matrix run selected an older environment-dependent adapter test file. Its failures were classified as a focused CI-selection error: the new capture tests passed on Windows, while the unrelated file assumed POSIX `/tmp` and a locally installed Codex executable. One correction narrowed the matrix command to the portable batch contract. The exact-head rerun passed on both supported runners.

No transcript, raw JSONL, tool output, stderr, candidate text, package content, path, command, environment value, or credential was retained as diagnostic evidence.
