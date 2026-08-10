# Dependency-Aware Work Selection

Use this skill to classify OpenSpec SDD work and recommend the next change from
dependency, status, priority, sequence, and shared-resource evidence.

Canonical scripts:

- `scripts/github/lib/dependencies.mjs`
- `scripts/github/project-status.mjs`
- `scripts/github/select-next-work.mjs`
- `scripts/github/dependency-report.mjs`

The skill is read-only. It reports in-flight, actionable, blocked, parallel,
and next work and never switches changes without an explicit target.

