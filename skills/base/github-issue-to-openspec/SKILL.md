---
name: github-issue-to-openspec
description: Link an existing GitHub issue to a local OpenSpec change and tracking metadata. Use after the issue is known; do not create partial tracking data or mutate GitHub without authorization.
---

# GitHub Issue To OpenSpec

Use this skill when an existing GitHub issue should be connected to a local
OpenSpec change and tracking metadata.

## Inputs

- `config/sdd-github.json`
- Issue number, URL, title, and target OpenSpec change name
- Existing issue body when managed-block replacement is needed

## Procedure

1. Validate required issue data before writing files.
2. Build conventional OpenSpec change paths and managed issue-block content
   with `scripts/github/lib/issues.mjs`.
3. Write or review `tracking.yaml` that validates against tracking v1.
4. Update only configured managed-block markers when editing issue bodies.
5. Run OpenSpec, artifact-quality, and tracking validation before delivery.

## Safety

- Do not mutate GitHub unless the current authorization explicitly permits it.
- Do not overwrite human-authored issue content outside managed markers.
- Do not create partial artifacts when required issue data is missing.
- Do not duplicate OpenSpec artifact generation logic beyond minimal scaffold
  paths and tracking metadata.
