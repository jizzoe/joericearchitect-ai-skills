## MODIFIED Requirements

### Requirement: Production-rapid lifecycle preserves independent rereview
The lifecycle SHALL invoke and validate strict isolated independent review
after Apply and after every behavior-preserving objective fix before a
`production-rapid` delivery transition. It MUST bind the record to the exact
base/head and sealed manifest, retain execution evidence, findings, and
dispositions under a unique transition record, and pause on material findings,
three materially different fixes for one signature, or strict unavailability
unless an exact active degraded authorization applies. A degraded transition
MUST retain strict unavailable evidence, `authorized-degraded` assurance, the
authorization/risk record, expiration, and capability ledger; it MUST never be
normalized to strict isolation. A new head MUST invalidate both prior strict
and degraded review and repeat strict-first evaluation.

#### Scenario: Rereview follows an objective fix
- **WHEN** an independent-review finding is corrected without changing approved
  behavior
- **THEN** the lifecycle reruns affected evidence and retries strict review for
  the complete new diff before any eligible fresh degraded review

#### Scenario: Rereview challenges a prior disposition
- **WHEN** a prior finding was dispositioned as a warning or false positive
- **THEN** the next fresh strict or degraded reviewer independently evaluates
  the finding, disposition, and cited evidence and may return it unresolved

#### Scenario: Authorized degraded lifecycle evidence is current
- **WHEN** an exact change- and transition-bound authorization remains active
  after durable strict unavailability for the same sealed package
- **THEN** the lifecycle may retain a fresh degraded record as reduced-assurance
  evidence for that one transition

#### Scenario: Rereview cannot be performed safely
- **WHEN** strict review is unavailable and no valid degraded authorization or
  constrained fresh fallback can be established
- **THEN** the lifecycle pauses without self-review or a silent downgrade
