## ADDED Requirements

### Requirement: GitHub CLI agent identity and fields are mapped at the boundary
The runtime SHALL translate its internal agent identifier (`claude`) to the
GitHub CLI agent identifier (`claude-code`) at every `gh skill list` and
`gh skill install` call boundary; `codex` SHALL map unchanged. Skill listings
SHALL request the explicit `--json` field list `skillName,version,pinned`, and
installed skill revision and prior-skill-pin detection SHALL read the `version`
field.

#### Scenario: Diagnostic detects each installed agent
- **WHEN** the runtime diagnostic lists installed skills for the `claude` agent
- **THEN** it invokes `gh skill list --agent claude-code --json skillName,version,pinned`
  and reports that agent available with its installed skill count and revisions

#### Scenario: Installer delegates with the GitHub CLI agent identifier
- **WHEN** the installer delegates `gh skill install` for the `claude` agent
- **THEN** it passes `--agent claude-code` rather than the internal `claude` id

#### Scenario: Prior skill pin is read from the version field
- **WHEN** the installer reads the prior skill pin from a skill listing
- **THEN** it reads the `version` field from a `--json skillName,version,pinned` listing
