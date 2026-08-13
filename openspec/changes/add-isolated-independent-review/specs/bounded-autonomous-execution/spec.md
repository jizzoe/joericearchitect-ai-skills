## MODIFIED Requirements

### Requirement: Production-rapid delivery requires independent review evidence
The runner SHALL require a configured non-interactive reviewer in a fresh,
separate, enforced read-only execution context after Apply and after every
behavior-preserving objective fix before it authorizes a `production-rapid`
high-impact delivery transition. The reviewer input MUST be a validated sealed
package containing only immutable canonical full base and head SHA object IDs,
the accumulated diff re-derived from that exact range, relevant OpenSpec
artifact identities, and current test or validation evidence; it MUST NOT
contain inherited implementation-session history or the implementer's desired
conclusion. The runner MUST reject self-review, unavailable or writable
reviewers, malformed evidence, stale or wrong SHA evidence, and unresolved
blocker, high, or `objective-fix` findings. It MUST record reviewer type and
identity, platform adapter, execution and invocation references, reviewed SHAs,
timestamp, findings, evidence-backed implementer dispositions, and final status.
The evidence MUST bind to a deterministic manifest of the immutable review
input package and a uniquely identified durable transition review record. The
runner MUST derive and compare the accumulated diff from the recorded base and
head through a read-only configured repository adapter, and reject a package or
duplicated durable review record whose provenance is not exact. It MUST compare
reviewer identity and type to a configured reviewer with an enforced read-only
isolation attestation, and resolve recorded base/head identifiers as canonical
lowercase full commit object IDs before accepting evidence. The reviewer input
MUST exactly match configured relevant OpenSpec artifact identities and the
durable current Apply validation-evidence list for the reviewed head. The
selected-entry checkpoint MUST durably store exactly one uniquely identified
current Apply evidence record; the request and review record MUST exactly
reference that record, whose completion time is no later than the review
timestamp. Every finding MUST remain durably visible: objective fixes require
affected validation and a fresh review for the new head, warning and
false-positive dispositions remain challengeable evidence for the next fresh
reviewer, and material findings pause. GitHub review publication MAY supplement
but MUST NOT replace this evidence.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** a distinct configured isolated read-only reviewer returns complete
  clear evidence for the current immutable base and head after Apply
- **THEN** the runner may treat independent review as current evidence only for
  the named authorized delivery transition

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded `objective-fix` and the runner
  applies the behavior-preserving fix and reruns affected evidence
- **THEN** the runner rejects the prior review and requires a fresh reviewer
  record for the exact new head before delivery

#### Scenario: Warning or false positive remains reviewable
- **WHEN** the implementer records a warning or false-positive disposition with
  cited evidence
- **THEN** the runner includes it as challengeable evidence in the next fresh
  review and does not present the disposition as a required conclusion

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** the reviewer is unavailable, is the implementation session, can
  mutate the workspace or GitHub, lacks enforced isolation, or produces
  malformed or stale evidence
- **THEN** the runner pauses without downgrading the `production-rapid` gate

