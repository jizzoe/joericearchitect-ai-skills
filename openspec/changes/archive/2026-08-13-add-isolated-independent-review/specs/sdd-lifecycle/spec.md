## MODIFIED Requirements

### Requirement: Production-rapid lifecycle preserves independent rereview
The lifecycle SHALL invoke and validate its configured isolated-independent-
review channel after Apply and after every behavior-preserving objective fix
before a `production-rapid` delivery transition. It MUST tie the review record
to the exact full base and current head object IDs and sealed-package manifest,
retain the reviewer execution record, findings, and evidence-backed dispositions
durably under a unique transition record, and pause on a material finding,
three materially different fixes for one signature, or unavailable reviewer.
It MUST use an enforced read-only adapter to verify that the reviewed diff is
the exact base-to-head range and treat duplicate review record IDs as durable
conflicts. It MUST obtain reviewer isolation capability from configured adapter
attestation and reject inherited implementation context, unresolvable or
noncanonical commit identifiers, or mutation capability. A new head MUST
invalidate the prior review. Warning and false-positive dispositions MUST be
provided to the next fresh reviewer as challengeable evidence rather than a
desired conclusion.

#### Scenario: Rereview follows an objective fix
- **WHEN** an independent reviewer finding is corrected without changing
  approved behavior
- **THEN** the lifecycle reruns affected evidence and a fresh independent
  reviewer reviews the complete diff for the new exact head before it continues

#### Scenario: Rereview challenges a prior disposition
- **WHEN** a prior finding was dispositioned as a warning or false positive
- **THEN** the next fresh reviewer independently evaluates the finding,
  disposition, and cited evidence and may return it as unresolved

#### Scenario: Rereview cannot be performed safely
- **WHEN** no configured adapter can prove fresh context and enforced read-only
  isolation for the exact current package
- **THEN** the lifecycle pauses without substituting implementer self-review or
  weakening the delivery profile
