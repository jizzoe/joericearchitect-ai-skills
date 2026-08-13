## MODIFIED Requirements

### Requirement: Production-rapid delivery requires independent review evidence
The runner SHALL require strict independent review in a configured
non-interactive fresh, separate, enforced read-only execution context after
Apply and after every behavior-preserving objective fix before it authorizes a
`production-rapid` high-impact delivery transition. The reviewer input MUST be
a validated sealed package containing only immutable canonical base/head object
IDs, the exact re-derived diff, relevant OpenSpec artifacts, and current
validation evidence; it MUST NOT contain inherited implementation-session
history or a desired conclusion. The runner MUST reject self-review, writable
reviewers, malformed or stale evidence, and unresolved blocker, high, or
`objective-fix` findings. If and only if strict review produces durable
unavailability, the runner MAY accept `authorized-degraded` evidence under the
exact bounded authorization defined by the degraded-review capability. It MUST
retain the strict result, authorization, risk reason, capability ledger,
assurance level, reviewer identity, package/base/head, findings, dispositions,
transition, and expiration in a unique durable review record. It MUST retry
strict review first for every new head and MUST pause on an absent, expired,
mismatched, malformed, broad, or out-of-envelope degraded authorization.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** an isolated configured reviewer returns current passed evidence for
  the immutable base and head after Apply
- **THEN** the runner may use `strict-isolated` review only for the named
  authorized transition

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded `objective-fix` and the runner
  applies the behavior-preserving fix and reruns affected evidence
- **THEN** the prior result is stale, strict review is attempted for the new
  exact head, and degraded review is eligible only inside its derived envelope

#### Scenario: Warning or false positive remains reviewable
- **WHEN** the implementer records a warning or false-positive disposition with
  cited evidence
- **THEN** the runner gives it to the next fresh strict or degraded reviewer as
  challengeable evidence rather than an intended conclusion

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** strict review is unavailable but the degraded authorization, sealed
  package, result, capability ledger, reviewer freshness, or detached view is
  missing, stale, mismatched, or mutation-capable
- **THEN** the runner pauses without downgrading the production-rapid gate

#### Scenario: Explicit degraded evidence authorizes exact-head delivery
- **WHEN** strict review is durably unavailable and an exact active degraded
  authorization permits a fresh separate fallback result for the same package
- **THEN** the runner may use only `authorized-degraded` evidence for that
  named transition while preserving the reduced-assurance record
