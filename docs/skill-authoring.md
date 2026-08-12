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

Use unquoted YAML plain scalars for both values. They may contain ordinary
spaces, but not mapping syntax such as `: ` or comment syntax such as ` #`.
Quoted, multiline, list, and nested YAML values are intentionally unsupported
by the repository's deterministic validator.

Validate canonical metadata before review:

```bash
node scripts/validation/validate-skill-metadata.mjs
node --test scripts/validation/test/skill-metadata.test.mjs
```

Every canonical skill also ends with exactly this shared-policy reference:

```markdown
## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
```

Do not copy the shared policy into a skill. The dynamic validator rejects a
missing, malformed, duplicate, broken, or copied guardrail section:

```bash
node scripts/validation/validate-shared-guardrails.mjs
```

New reusable skills return `skill-result-v1` and may consume the optional
`config/ai-skills.json` contract. Use workspace-relative paths only, reject
unsupported versions and unknown keys, and require explicit destinations when
the optional configuration is absent. Validate synthetic inputs with:

```bash
node --test evals/skills/base-skill-contracts/run-fixtures.test.mjs
```
