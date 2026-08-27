## Context

See `proposal.md` and `context/design-brief.md`. The current Codex transport
launches the pinned CLI directly with `--output-schema` and
`--output-last-message`; the parent tool receives a successful process receipt
and then inspects the expected file. Real multi-step reviews have exited `0`
without that file, producing the correct
`review-launcher-codex-result-artifact-missing` unavailable result.

Two read-only probes against installed `codex-cli 0.149.1` establish the
replacement contract. With `--json`, a tool-using turn emitted intermediate
agent messages and tool events, then a final `item.completed` whose item type
was `agent_message`, followed by `turn.completed`. The same sequence remained
available when `--output-schema` used the repository's existing findings
schema. An intermediate agent message was itself schema-valid but represented
pre-tool commentary, proving that the first schema-valid message cannot be
accepted.

The shell-tool receipt combines process output and is not an evidence channel.
The capture process must therefore own separate child stdout and stderr pipes,
parse only Codex's bounded JSONL stdout, and write both the result artifact and
a safe receipt before the parent consumes either one.

## Goals / Non-Goals

**Goals:**

- Make Codex responsible for emitting its final structured response and a
  fixed installed-runtime host adapter responsible for artifact creation.
- Preserve the current exact-package, reviewer-identity, isolation,
  authorization, downstream result-validation, and cleanup boundaries.
- Give strict and authorized-degraded Codex transports the same reliable
  event-capture mechanism without changing their assurance labels.
- Replace the line-unbounded package representation with a byte-bounded,
  digest-indexed capsule without changing the canonical review package.
- Deliver the repair without allowing the new Codex capture code to certify
  itself.

**Non-Goals:**

- Do not parse the parent shell-tool transcript or combined process output.
- Do not accept a reviewer-written repository file, intermediate response,
  command output, or event body as durable review evidence.
- Do not change the sealed review package's semantic schema, correction
  history, controller phases, the paused requirements-to-plan delivery's
  behavior, or Claude result transport.
- Do not add an external package, service, credential, or network dependency.

## Decisions

### C1 — Run a fixed installed-runtime capture adapter at the host boundary

Add one canonical host entrypoint under `scripts/sdd/` that is included in the
verified installed runtime. The existing platform adapter resolves and hashes
that installed entrypoint, the host Node executable, and the already pinned
Codex executable during managed preflight. The sealed parent request records
all three identities, the event-contract revision, fixed child argument vector,
owned request/result/receipt paths, package binding, and expiry.

The elevated shell tool starts only `/usr/bin/env -i` with the sealed
environment, host Node executable, installed capture entrypoint, one sealed
request file, and the request digest independently sealed into the parent tool
invocation. Before parsing JSON or reading any executable, argument, path, or
expiry field, the capture entrypoint reads the bounded request bytes through a
non-following descriptor and compares their digest with that independent
expected digest. A digest copied from inside the request is never accepted as
self-authentication. It then validates owned regular-file paths and spawns only
the sealed Codex executable and arguments. It never loads code from the active
repository or review archive and accepts no caller-selected command,
executable, destination, event type, digest, or extra argument.

The Codex child retains `--output-schema`, adds `--json`, and removes
`--output-last-message`. The fixed capture adapter writes the findings artifact;
the reviewer cannot write it.

Alternative: parse `toolResult.output` in the implementing parent. Rejected
because the tool result can combine stderr and stdout and is not a separated,
bounded, host-owned event channel.

Alternative: keep `--output-last-message` and parse JSONL only when the file is
missing. Rejected because a fallback would preserve two competing delivery
contracts and could accidentally accept transcript material.

### C2 — Use a bounded terminal-event state machine, not a generic transcript parser

The capture adapter incrementally reads newline-delimited JSON from child
stdout and applies terminal-event contract `codex-jsonl-final-agent-v1`:

1. exactly one `thread.started` begins the stream;
2. exactly one `turn.started` begins the reviewed turn;
3. allowlisted item lifecycle events may occur while the turn is active;
4. each completed `agent_message` replaces the in-memory final candidate;
5. exactly one `turn.completed` closes the turn;
6. the stream must then end without another event; and
7. the last completed agent message before `turn.completed` is the sole
   candidate payload.

Codex supports terminal-only item records: an allowlisted `item.completed`
event may be the first event for its item ID. That event establishes the
item's immutable completed state; a later duplicate, type change, start, or
update for that ID is ambiguous and fails closed. `item.updated` still
requires a prior matching `item.started`, and any started item must complete
before the turn can complete. This preserves the observed Codex JSONL shape
without accepting an unconstrained or reusable item identity.

Failed or incomplete turns, missing candidates, duplicate lifecycle events,
post-terminal events, malformed lines, unknown top-level event types, and
unsupported contract revisions are typed unavailable. Tool commands and
outputs are counted but never retained or interpreted. Intermediate agent
messages are discarded when replaced and never written.

The fixed strict prompt requires one short non-findings progress message before
the first inspection tool call. This makes the live production acceptance
probe exercise intermediate-message replacement without accepting a
caller-selected prompt or a test-only transport. The progress message remains
non-authoritative and is never schema-validated or written unless the stream
incorrectly ends with it, in which case final-payload validation fails closed.

Initial fixed bounds are 16 MiB for the complete event stream, 2 MiB per JSONL
line, 100,000 events, 1 MiB for the final candidate (matching the existing
artifact bound), and the request's existing fifteen-minute expiry. These are
transport safety limits, not product configuration. The parser stops on the
first bound violation and never silently raises a limit.

Alternative: accept the first schema-valid agent message. Rejected by the live
probe, which emitted a schema-valid intermediate message before tool use.

Alternative: allow unknown events and search for the last JSON object.
Rejected because CLI drift would become silent behavior drift at a review trust
boundary.

### C3 — Validate before an atomic host-owned artifact write

Move the findings-payload validator into one reusable canonical function shared
by event capture and existing artifact inspection. After a valid terminal
sequence, parse only the selected agent-message text, validate the complete
findings payload and bounds, and create a mode-`0600` temporary sibling with
`O_CREAT|O_EXCL` inside the already owned result directory. Flush and close it,
then publish it with the platform's atomic same-filesystem hard-link operation.
That operation is the no-clobber commit point: an existing file, symlink, or
concurrent creator at the sealed destination causes `EEXIST` and no replacement.
The host opens the destination without following links, verifies that it is the
same regular-file identity and content as the temporary sibling, removes the
temporary name, syncs the owned directory where supported, and performs final
inspection through the existing reader. Platforms or filesystems that cannot
prove these semantics fail typed unavailable; ordinary rename is not an
acceptable substitute.

The capture adapter also atomically writes one metadata-only receipt keyed by
execution ID and request digest. It records transport revision, CLI identity
and version classification, exit status, event and byte counts, terminal
classification, candidate count, artifact receipt state, and safe diagnostic
code. It never records raw JSONL, stderr, commands, paths, package content,
candidate text, findings, environment values, or credentials. If the capture
process exits without a valid receipt, the parent records a distinct
missing-receipt unavailable result.

The parent continues to accept only the inspected owned artifact plus all
existing immutable package/result bindings. The event stream and receipt are
transport evidence, not review findings.

### C4 — Permit one narrow transport retry

One fresh retry is allowed only when a supported stream ends without a final
completed agent message or without `turn.completed`, cleanup succeeded, and
the exact package, identities, authorization, and expiry remain current. The
first unavailable attempt remains in the review lineage. The retry has a
separate one-attempt transport budget and does not consume or reset an
objective-correction budget.

Malformed, ambiguous, schema-invalid, over-bound, identity-mismatched,
write-unsafe, expired, or cleanup-incomplete outcomes do not retry. Repeated
transport failure returns the final safe unavailable state.

Alternative: retry every artifact failure. Rejected because security and
contract failures are deterministic and retrying them adds cost without new
evidence.

### C5 — Route both Codex assurance paths through one capture primitive

Strict and authorized-degraded Codex requests use the same host capture
entrypoint and event contract. Their existing request builders, runtime
receipts, result sealers, assurance labels, strict-unavailable precursor,
authorization checks, and capability ledgers remain distinct. Claude keeps its
current structured-result path and does not inherit Codex parsing or identity
requirements.

The canonical independent-review protocol is updated to explain that JSONL is
untrusted transport input while the validated host-owned file remains the only
findings artifact. Thin Claude and Codex skill wrappers remain unchanged unless
generated exposure actually references the modified protocol.

### C6 — Bind durable adapter selection to dispatch and bootstrap with N-1 Claude

This change cannot use its new Codex capture path as the independent evidence
that authorizes its own merge. Add one allowlisted review-dispatch resolver that
consumes the immutable work-unit configuration snapshot's `reviewAdapter` and
maps it to the corresponding strict and authorized-degraded launcher
definition, reviewer identity class, and installed-runtime helper. Request
construction, prepared recovery, parent invocation, runtime receipt, and result
acceptance all require that same adapter identifier. A missing, unsupported, or
mismatched selection fails before reviewer launch. No later caller may replace
the snapshotted selection with a direct launcher object.

For the repair delivery, product configuration temporarily selects
`claude-detached-restricted-v1`. Because the normal controller slot is occupied
by the paused requirements-to-plan delivery and candidate dispatch code cannot
certify itself, the separately
owner-authorized bootstrap record must additionally bind the exact base, head,
manifest, expiry, N-1 installed-runtime digest, Claude launcher definition,
reviewer, and review-worktree lifecycle. The existing N-1 Claude helper is
invoked directly through that fixed bootstrap binding; the candidate Codex
capture entrypoint is excluded from accepted review evidence. The exact-head
result and runtime receipt must identify Claude and the sealed N-1 generation.
A current capability probe reports Claude Code 2.1.220 with fresh,
noninteractive, read-only sandbox support; authentication and a real isolated
invocation still must pass at the exact-head review gate.

The authorized `strict-first-degraded` policy may use only the existing Claude
fallback after durable exact-package strict unavailability. It may not switch
to the new Codex capture code for self-certification. If the N-1 Claude path
cannot return eligible evidence, delivery pauses for a separate owner decision.

After this repair is merged and its runtime generation installed, controller
recovery PR #246 is rebased onto it. PR #246's existing configuration change
selects `codex-detached-read-only-v1`, providing the first production use of the
new installed Codex capture transport. No accepted review record is rewritten.

### C7 — Expose the unchanged package as a bounded digest-indexed capsule

Keep `independent-review-package-v1` and its `manifestDigest` authoritative, but
replace `.ai-independent-review-package.json` with an exclusively created,
read-only capsule directory. Its bounded index names the original base, head,
manifest digest, total canonical bytes, representation revision, and every
ordered chunk's relative path, semantic section, byte count, and SHA-256. The
capsule uses valid JSON chunks for metadata, artifacts, and validation evidence,
plus ordered patch chunks whose exact byte concatenation reconstructs `diff`.
The host reassembles and validates the complete canonical package before launch;
missing, duplicate, reordered, extra, oversized, digest-mismatched, symlinked,
or non-regular entries fail closed.

Initial fixed exposure bounds are 16 MiB total canonical package bytes, 64 KiB
per content chunk, 512 chunks, and 1 MiB for the index. Splitting and every read
limit are measured in UTF-8 bytes, never lines or JavaScript character count.
Chunk boundaries preserve exact bytes and prefer newline boundaries only when
doing so stays within the byte cap. Reviewer prompts name the index and require
inspection of its ordered chunks; they no longer direct a reviewer to one
minified JSON line. Capsule identity and completeness are transport metadata,
while the original package manifest remains the result binding.

## Affected Boundaries and Files

- Canonical transport: `scripts/sdd/platform-review-adapters.mjs` and a new
  installed-runtime Codex event-capture entrypoint under `scripts/sdd/`.
- Canonical contract reuse: the findings-payload validator currently private to
  `platform-review-adapters.mjs` becomes a shared internal module or exported
  canonical function.
- Canonical package exposure: `scripts/sdd/independent-review-contract.mjs`
  retains the package schema while a package-capsule module owns bounded
  representation, reconstruction, and digest checks.
- Tests: `scripts/sdd/test/platform-review-adapters.test.mjs`, a focused parser
  test file if separation improves clarity, parent strict/degraded integration
  fixtures, and runtime distribution/smoke coverage.
- Protocol: `skills/base/independent-review/references/protocol.md` and living
  `isolated-independent-review` requirements through this delta.
- Product configuration: `config/ai-skills.json` temporarily selects the Claude
  adapter for N-1 bootstrap review; durable dispatch consumes the selection and
  PR #246 later restores the Codex adapter.
- Runtime packaging: `scripts/runtime/manifest.json` changes only if a declared
  entrypoint or smoke contract is required; source-root distribution must prove
  the capture file is installed and content-verified either way.
- External state: issue #247 and the eventual change-owned branch/PR only. PR
  #246 and the paused requirements-to-plan delivery remain unchanged until this
  repair is delivered.

## Paused Roadmap Dependency

The later roadmap step is not the `C1` design decision above. It is the exact
durable delivery run
`controller-e45c82049d4f6606bcfc1abbef4ad8cc` in repository
`jizzoe/joericearchitect-ai-skills`, selected entry
`repair-requirements-to-plan-outcome-validation`, parent run
`parent-e45c82049d4f6606bcfc1abbef4ad8cc`, work unit
`workunit-e45c82049d4f6606bcfc1abbef4ad8cc`, and claim
`claim-e45c82049d4f6606bcfc1abbef4ad8cc`. Its durable record is
`.git/sdd-delivery-runs/runs/controller-e45c82049d4f6606bcfc1abbef4ad8cc/controller.json`;
it expired at `2026-08-26T23:47:21.999Z` with `currentPhase: propose` and every
step still pending. This repair may inspect but must not rewrite, retire,
release, or advance that record. After PR #246 is delivered and installed, a
fresh owner authorization must reconcile this exact identity and resume only
its first incomplete `propose` phase.

## Verification Strategy

- Pure replay tests cover successful no-tool and multi-tool streams,
  intermediate schema-valid messages, findings-bearing final messages,
  malformed and unknown events, failed/incomplete/duplicate/post-terminal
  sequences, every size/count/time bound, and platform newline variants.
- Artifact tests cover exclusive paths, symlinks, pre-existing destinations,
  concurrent destination creation, atomic hard-link publication and
  final-inspection failures, receipt loss, cleanup, unsupported filesystem
  semantics, and absence of raw data in diagnostics.
- Capsule tests prove byte-bounded splitting and reconstruction, all chunk and
  index bounds, exact manifest preservation, newline and multibyte UTF-8 cases,
  and rejection of missing, duplicate, reordered, extra, symlinked, or changed
  chunks.
- Parent integration tests prove fixed argv and identity sealing, no active-repo
  code execution, pre-parse request-digest rejection, authoritative adapter
  dispatch, strict/degraded label preservation, Claude non-regression, one
  eligible retry, and no retry for unsafe classes.
- Runtime tests build and install a candidate runtime, verify its digest, and
  prove the capture entrypoint is present only from verified source roots.
- A live acceptance probe uses the installed candidate CLI with
  `--json --output-schema`, requires at least one tool call and an intermediate
  message, and passes only when the host-created artifact contains the final
  schema-valid payload and the safe receipt records a completed turn.
- Run the focused tests, complete SDD/runtime suites, repeatability check,
  `openspec validate --all --strict`, OpenSpec Verify, exact-head CI, bounded
  local code/security/coherence review, and N-1 Claude independent review.

Completion requires all evidence to bind the same final head and no unresolved
objective or coherence finding. A simulated event fixture alone cannot satisfy
the live acceptance requirement.

## Risks / Trade-offs

- [Codex changes its JSONL schema] → version the allowlist, capability-probe the
  installed CLI, require a live multi-step probe, and fail typed unavailable on
  unknown events.
- [The wrapper becomes a new elevated trust boundary] → distribute it only in a
  verified installed runtime; preflight and seal its content identity, Node
  identity, child executable, arguments, paths, independently supplied request
  digest, and expiry.
- [An intermediate answer looks final] → retain only the last completed agent
  message and accept it only after one valid `turn.completed` and end of stream.
- [Raw tool or repository data leaks through diagnostics] → count and discard
  noncandidate bodies; persist only allowlisted metadata and safe codes.
- [Atomic publication differs across platforms] → require atomic same-filesystem
  hard-link no-clobber publication, Windows and POSIX race tests, and fail closed
  when those semantics cannot be proven.
- [Capsule representation omits or changes package bytes] → reconstruct and
  validate the complete canonical package before launch and reject any index,
  chunk, byte-count, ordering, or digest mismatch.
- [Claude bootstrap review is unavailable] → preserve implementation and pause;
  do not let changed Codex transport certify itself.
- [Temporary Claude configuration conflicts with PR #246] → rebase PR #246
  after runtime installation and intentionally resolve the single configured
  adapter back to Codex, with config provenance reviewed on both heads.

## Migration Plan

1. Implement and verify the capture transport on a change branch based on
   current `main`, leaving PR #246 and the exact paused requirements-to-plan
   controller record unchanged.
2. Create the exact bootstrap authorization binding and capability-probe the
   pre-existing N-1 Claude adapter for the repair's exact-head production review.
3. Deliver issue #247 through CI, OpenSpec Verify, strict validation, and the
   eligible N-1 Claude review path; archive through the normal lifecycle.
4. Build and install the merged runtime generation and rerun the live
   multi-step Codex capture probe from that installed generation.
5. Rebase PR #246 onto the repaired mainline, resolve its intended Codex
   adapter configuration, and obtain a fresh exact-head review through the new
   transport.
6. Merge and install PR #246, then obtain fresh owner authorization to
   reconcile controller `controller-e45c82049d4f6606bcfc1abbef4ad8cc` and
   resume only its durable first incomplete `propose` phase.

Rollback activates the prior verified runtime generation and restores the
prior adapter configuration through a reviewed change. PR #246 stays draft and
the exact requirements-to-plan controller stays paused; no existing review
evidence is relabelled or deleted.

## Recovery

On interruption, reread issue #247, the OpenSpec task state, the exact branch
head, candidate-runtime digest, adapter configuration, test/validation
evidence, review records, PR #246 state, and controller
`controller-e45c82049d4f6606bcfc1abbef4ad8cc`. Resume
at the first incomplete task. Never reuse a live probe, CI result, or review
whose head, runtime, package, configuration, or changed-path binding differs.

An incomplete capture attempt preserves its safe receipt and removes only its
marker-proven owned review resources. Missing receipt, cleanup failure,
unsupported CLI contract, unavailable Claude bootstrap review, or expired
authorization pauses with the exact prerequisite; none authorizes transcript
acceptance, self-review, runtime activation, PR #246 mutation, or retirement of
the paused requirements-to-plan controller.

## Reuse Plan

- Canonical assets: one assistant-neutral event state machine, artifact writer,
  and diagnostics contract under `scripts/sdd/`.
- Product configuration: adapter selection, repository, branches, issues,
  executable identities, and authorization remain configured inputs.
- Platform exposure: Codex owns only its event classification and invocation;
  Claude continues to use the shared result contract without Codex behavior.
- Second-product portability: tests use a second repository with different
  paths and no project-specific constants; the capture contract depends only on
  sealed paths and package metadata.
- Intentional product-specific behavior: temporary adapter selection and issue
  #247 linkage live only in this repository's configuration and tracking.
- Attribution/licensing: Node built-ins and existing repository code only; no
  third-party dependency or new license notice is expected.

## Attribution and Licensing

Implementation uses Node.js built-ins and existing repository-owned code. No
new third-party dependency, copied source, generated vendor asset, or license
notice is expected. If implementation introduces any external code or schema,
record its source, version, license compatibility, and local modifications
before acceptance.
