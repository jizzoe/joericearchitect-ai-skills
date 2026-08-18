## ADDED Requirements

### Requirement: Installed autonomous delivery resolves its lifecycle
The canonical autonomous lifecycle required by globally installed
`autonomous-sdd-delivery` SHALL be distributable through the supported
all-skills installation flow and SHALL resolve from the installed skill
namespace without depending on the source repository's checkout-relative
workflow layout.

#### Scenario: All canonical skills are installed
- **WHEN** a user installs all canonical skills at user scope for Claude Code or Codex
- **THEN** `autonomous-sdd-delivery` and its canonical lifecycle dependency are both discovered and the delivery reference resolves within that agent's installed skill root

#### Scenario: Required lifecycle is absent
- **WHEN** installation verification finds that delivery's canonical lifecycle target is absent from the installed skill namespace
- **THEN** verification fails with the delivery skill and unresolved lifecycle target rather than claiming a complete autonomous SDD installation
