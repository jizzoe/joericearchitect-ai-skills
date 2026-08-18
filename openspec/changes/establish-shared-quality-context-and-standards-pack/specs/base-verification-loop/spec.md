## MODIFIED Requirements

### Requirement: The loop progresses through evidence-gated stages
The capability SHALL select focused deterministic checks and proportional
broader checks, perform only approved implementation work, run focused checks
before profile checks, conduct code and security review, classify every
finding, apply only separately authorized behavior-preserving `objective-fix`
corrections within the active correction budget, rerun affected evidence, and
report remaining risk. It MUST NOT skip or relabel a failed required check as
passed. When stack standards are in scope, it MUST map a validated selection
record to repository-declared available evidence, preserve selected rule IDs and
overrides, and report a gap rather than invent a command or coverage claim when
selection or required evidence is absent.

#### Scenario: Focused check fails objectively
- **WHEN** a focused check identifies a behavior-preserving objective defect
  and the active authorization permits that correction
- **THEN** the capability applies the bounded correction, reruns affected
  evidence, and records the attempt and outcome

#### Scenario: Failure needs a material decision
- **WHEN** a failed check or finding requires changed behavior, architecture,
  compatibility, security, licensing, governance, data ownership, or scope
- **THEN** the capability pauses without applying the change or claiming ready

#### Scenario: Standards selection maps to available evidence
- **WHEN** a valid record identifies required checks declared available by the
  target repository
- **THEN** verification records matching rule IDs and runs only those declared
  command evidences

#### Scenario: Standards selection requires unavailable evidence
- **WHEN** a valid record identifies required evidence unavailable in target
- **THEN** verification reports the gap and does not invent a command or pass
