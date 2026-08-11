# Skill Authoring

Canonical reusable skills live under `skills/base/<skill-name>/SKILL.md`.
Claude and Codex discovery wrappers are not canonical skill definitions and
must stay thin.

Every canonical `SKILL.md` starts with YAML frontmatter:

```yaml
---
name: example-skill
description: Describe what the skill does, when to use it, and when not to use it.
---
```

`name` must be unique, lowercase kebab-case, and exactly match `<skill-name>`.
`description` must be non-empty and give an activation boundary. Do not add
this metadata contract to generated OpenSpec files or unrelated Markdown.

Validate canonical metadata before review:

```bash
node scripts/validation/validate-skill-metadata.mjs
node --test scripts/validation/test/skill-metadata.test.mjs
```
