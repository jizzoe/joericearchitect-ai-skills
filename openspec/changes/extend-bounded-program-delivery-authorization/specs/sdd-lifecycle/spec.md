## ADDED Requirements

### Requirement: Autonomous program delivery proves derived-target linkage
The lifecycle SHALL advance an autonomous selected queue entry through issue,
branch, pull request, delivery, Sync, Archive, and exact merged-branch cleanup
only when each derived target is durably linked to that entry and current
evidence ties the transition to the recorded head commit. It MUST pause before
a transition when linkage, evidence, or runtime permission is missing, stale,
or conflicts with durable state.

#### Scenario: Derived delivery chain is current
- **WHEN** the selected queue entry has one durably linked issue, branch, pull
  request, Sync target, Archive target, and cleanup target with current
  transition evidence
- **THEN** the lifecycle may proceed only through the next authorized
  transition in that entry's recorded chain

#### Scenario: Derived chain is incomplete or mismatched
- **WHEN** the selected entry lacks a required record or its requested branch,
  pull request, commit, or change name differs from the durable checkpoint
- **THEN** the lifecycle pauses before delivery, Sync, Archive, or cleanup and
  reports the first unmet boundary

### Requirement: Production-rapid lifecycle preserves independent rereview
The lifecycle SHALL invoke and validate its configured independent-review
channel after Apply and after every behavior-preserving objective fix before a
`production-rapid` delivery transition. It MUST tie the review record to the
exact full base and current head object IDs, retain the reviewer execution
record and finding dispositions durably under a unique transition record, and
pause on a material finding,
three materially different fixes for one signature, or unavailable reviewer.
It MUST use a read-only adapter to verify that the reviewed diff is the exact
base-to-head range and treat duplicate review record IDs as durable conflicts.
It MUST obtain reviewer isolation capability from configured adapter attestation
and reject unresolvable or noncanonical commit identifiers.

#### Scenario: Rereview follows an objective fix
- **WHEN** an independent reviewer finding is corrected without changing
  approved behavior
- **THEN** the lifecycle reruns affected evidence and independently reviews the
  complete diff for the new exact head before it continues
