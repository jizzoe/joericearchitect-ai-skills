## ADDED Requirements

### Requirement: Runtime-only installation is supported
The installer SHALL provide a runtime-only installation mode that builds,
verifies, retains, activates, and rolls back the shared runtime without
invoking or changing global skills. The existing paired installer SHALL remain
the default. The runtime-only mode MUST verify the manifest, content digest,
and contract version, retain the previously active runtime, and support
rollback without network access or GitHub CLI.

#### Scenario: Runtime installs without global skills
- **WHEN** the runtime-only installer runs from a released source revision
- **THEN** it activates the verified runtime, retains the prior runtime, and leaves global skills unchanged

#### Scenario: Runtime-only installation fails verification
- **WHEN** manifest, digest, or contract verification fails during runtime-only installation
- **THEN** the installer retains the prior runtime, reports the failed phase, and does not claim completion
