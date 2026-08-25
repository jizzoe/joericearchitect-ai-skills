## ADDED Requirements

### Requirement: Explore to Propose requires owner-approved open questions
The runner SHALL resolve every open design question surfaced during Explore
before entering Propose. For each open question the runner SHALL present the
question in official terminology, a plain-English translation and explanation,
the candidate options with pros, cons, and tradeoffs, and a recommendation.
Propose SHALL NOT proceed until the owner explicitly approves a recommendation
or supplies an answer, and that resolution SHALL be durably recorded as
owner-approved.

#### Scenario: Open questions remain unapproved
- **WHEN** Explore surfaces open questions and the owner has not approved a resolution
- **THEN** the runner pauses before Propose and presents the questions for owner decision

#### Scenario: Owner approves a recommendation
- **WHEN** the owner explicitly approves the runner's recommendation for every open question
- **THEN** the runner records each resolution as owner-approved and may proceed to Propose

#### Scenario: Presentation is incomplete
- **WHEN** a question is presented without a plain-English explanation, options, tradeoffs, or a recommendation
- **THEN** the runner does not treat it as a valid resolution request and does not proceed to Propose

#### Scenario: A prototype run encounters open questions
- **WHEN** any production or prototype run reaches Propose with open questions
- **THEN** the same owner-approval gate applies; the prototype profile cannot bypass it

### Requirement: Review uses a shared checklist and severity-tagged findings
The runner SHALL self-review each diff with a shared canonical checklist before
independent review. The independent reviewer SHALL apply the same checklist plus
a material-only freeform pass and SHALL tag every finding with the review
contract's severity, where `blocker`, `high`, and `objective-fix` are material
and `warning` and `false-positive` are advisory. Only material findings SHALL
drive a correction loop; advisory findings SHALL be recorded and non-blocking. A
completeness second pass SHALL be used only as an escalation after two
consecutive rounds still produce material findings, and the correction budget
SHALL remain three materially-different fixes per failure signature before a
fail-closed pause.

#### Scenario: Self-review precedes independent review
- **WHEN** an implementation batch is ready for review
- **THEN** the runner self-reviews with the shared checklist and fixes its own findings before invoking the independent reviewer

#### Scenario: Findings are severity-tagged
- **WHEN** the reviewer reports findings
- **THEN** each finding carries a review-contract severity, and only material severities (`blocker`, `high`, `objective-fix`) open a correction loop

#### Scenario: Advisory findings do not block
- **WHEN** a review returns only advisory severities (`warning`, `false-positive`)
- **THEN** the review passes and the advisory findings are recorded without a correction loop

#### Scenario: Completeness pass is an escalation
- **WHEN** two consecutive rounds still produce material findings
- **THEN** the next round includes the reviewer completeness second pass

#### Scenario: Correction budget is exhausted
- **WHEN** the same failure signature still has material findings after three materially-different fixes
- **THEN** the runner pauses fail-closed for owner decision and does not silently accept the change
