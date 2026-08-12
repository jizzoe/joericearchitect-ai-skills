## Context

See `proposal.md` for motivation. The existing checker uses exact target
strings, and the checkpoint helper understands only ordered step status. Both
are intentionally portable and must remain so while supporting a deterministic
program delivery chain.

## Goals / Non-Goals

**Goals:** add a data-only derived-target declaration, deterministic matching,
durable entry checkpoints, operational independent-review evidence, and
synthetic coverage for valid and invalid delivery chains.

**Non-Goals:** discover targets by loose naming patterns; create credentials;
perform external delivery without a configured adapter and runtime permission;
or add product constants to canonical assets.

## Decisions

### Record-derived data instead of pattern-based authorization

The authorization accepts an ordered queue and one selected entry. A delivery
target is valid only after a checkpoint records its kind and exact identifier,
plus repository/base/head linkage where relevant. This is safer than accepting
a branch or PR name generated from a convention, because a collision or
human-created lookalike cannot become authorized by resemblance alone.

### Keep the operation checker a pure portable evaluator

The checker receives authorization, runtime/configuration, an operation
request, and the selected entry checkpoint. It verifies existing gates first,
then derived linkage for delivery operations. It returns structured failures
rather than invoking GitHub, OpenSpec, or Git directly. Existing callers that
do not declare derived targets retain their exact-match behavior.

### Extend checkpoints as a validated delivery chain

Checkpoint input gains queue-entry identity, derived records, head/evidence
references, and ordered lifecycle steps. Inspection reports conflicts, stale
evidence, or the first incomplete step, enabling idempotent resume. The model
is local JSON data, so adapters own the actual persistence and external action.

### Explicitly scope public research

`read-source` remains available only to the read-only profile. A public-source
rule is a declarative boundary checked before local source-record writes; it
does not permit sign-in, downloaded-code execution, private access, or writes
outside the authorized workspace target.

### Validate independent review as immutable delivery evidence

For `production-rapid`, an adapter first invokes a configured reviewer only
with an immutable package: canonical full base and head SHA object IDs,
accumulated diff, relevant
OpenSpec artifacts, and current validation evidence. The evaluator never
mutates workspace/GitHub state; its configured adapter may perform only a
read-only Git base-to-head comparison. It requires the adapter to declare a
non-interactive, isolated, read-only reviewer distinct from the
implementing session. It rejects evidence lacking reviewer identity/type,
execution and invocation references, timestamp, exact reviewed SHAs,
findings, dispositions, a clear final status, or a deterministic manifest of
that immutable input package. It also requires a uniquely identified durable
selected-entry review record that retains the transition and complete evidence.
At delivery, the adapter derives the review diff with a read-only Git
base-to-head comparison and rejects a supplied package whose diff differs; it
does not trust a caller-provided diff string. Duplicate review record IDs are a
durable-state conflict and are rejected by both checkpoint inspection and the
delivery boundary.
Each derived record retains a current evidence reference and, for a
branch- or PR-bound record, the evidence head equal to its recorded head. The
operation request must name that evidence; an exact target cannot bypass this
rule, and Sync follows the same durable derived-record chain.
The delivery evaluator matches reviewer type and identity to a configured
reviewer with adapter-attested non-interactive, isolated, read-only capability;
request flags do not create reviewer authority. It resolves each supplied
lowercase full object ID through read-only Git as a commit and requires the
resolved canonical object ID to be identical.

Any blocker or high `objective-fix` finding blocks delivery. A bounded,
behavior-preserving fix reruns affected checks and produces new review evidence
for the new exact head; stale prior evidence is rejected. The normal
three-materially-different-fixes budget and material-decision pause rule remain
in force. GitHub review publication can supplement this record but cannot
replace it.

## Risks / Trade-offs

- [A loosely specified record shape could broaden delivery authority] → require
  exact record kind, identifier, entry, repository, and applicable linkage.
- [A caller could reuse stale evidence] → require current evidence and head
  matching for high-impact delivery operations.
- [An implementer could label its own review independent] → reject matching
  implementer/reviewer identities and require an isolated read-only reviewer.
- [New fields could break existing consumers] → preserve exact-target fallback
  and cover it with regression fixtures.

## Migration Plan

1. Add pure validation, checkpoint, and independent-review helpers with
   synthetic inputs.
2. Update canonical runner policy and progressive reference documentation.
3. Run focused evaluator tests, full repository validation, and strict
   OpenSpec validation.
4. On recovery, reread checkpoint and external state; update only the first
   incomplete record and never recreate an already durable target.

## Attribution and Licensing

This change is repository-authored policy and test data. It copies no external
implementation and adds no dependency.

## Verification Strategy

- Run valid and invalid derived-delivery, public-source, checkpoint, and
  independent-review evaluator fixtures through the focused Node suite.
- Run repository validation tests, artifact-quality validation, strict OpenSpec
  validation, and a diff/secret review.
- Confirm exact-target compatibility remains covered by regression fixtures.

## Recovery

On an interrupted delivery, reread the selected entry checkpoint and durable
external state. Resume only from its first incomplete current-evidence step;
record conflicts for human review and never recreate a durable target.

## Reuse Plan

Canonical helpers accept all repository, project, branch, reviewer, record,
and timing data as input. The runner skill links to the portable policy; platform adapters
remain thin consumers. A second synthetic workspace configuration uses
different identifiers to demonstrate that no product-specific value is needed.
The security boundary forbids credentials and untrusted-code execution, while
portability is preserved by supplying all product values as input.
