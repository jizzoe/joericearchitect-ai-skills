# Skill Authoring

Canonical reusable skills live under `skills/base/<skill-name>/SKILL.md`.
Claude and Codex discovery wrappers are not canonical skill definitions and
must stay thin.

Every direct `skills/base/<skill-name>/SKILL.md` package requires matching
repository-owned discovery adapters at `.claude/skills/<skill-name>/SKILL.md`
and `.agents/skills/<skill-name>/SKILL.md`. Each adapter must reference its
canonical skill, state that it must not duplicate canonical policy, and remain
at most 1024 bytes. The adapter-drift check discovers the canonical catalog
deterministically, so a new package is automatically required to have both
adapters:

```bash
node scripts/sdd/check-adapter-drift.mjs
```

OpenSpec-generated `openspec-*` skills and `opsx` commands are deliberately
excluded: they are not `skills/base` packages and must be refreshed through
OpenSpec rather than hand-edited as repository-owned adapters.

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

## Shared Runtime Helpers

Canonical skills are distributed to user profiles without this repository's
`scripts/` tree, so a skill must never instruct an agent to run a
workspace-relative helper path. Every shared helper is reached through the
installed launcher:

```markdown
`ai-skills-runtime run <helper> [verb] --repository <absolute-target-repository>`
```

A runtime-dependent skill has four obligations:

1. **Register the helper.** Add it to `scripts/runtime/manifest.json` with its
   module path, `invocation` shape (`cli` or `subcommand`), the permitted verb
   list for a subcommand helper, and any `readsAssetRoots` it loads packaged
   data from. An unregistered helper name or verb cannot be dispatched.
2. **Reference it through the launcher.** No `scripts/sdd/...`,
   `scripts/github/...`, `scripts/validation/...`, or `scripts/skills/...`
   path may appear in a canonical skill, a progressive reference, or a thin
   platform adapter.
3. **Declare the contract version.** Include the standard `## Shared runtime`
   section with `Required runtime contract version: <n>` matching the
   manifest's `contractVersion`. A mismatch is a fail-closed pause at dispatch.
4. **Prove installed completeness.** The completeness fixture discovers every
   helper each installed skill names and requires it to resolve through the
   installed launcher, so a newly referenced helper needs a manifest entry and,
   where it is harmless to run, a representative request.

A helper that exports functions but has no command line gains an executable
entrypoint under `scripts/runtime/bin/`: a uniform `--input <file>` / `--stdin`
JSON payload wrapper, or an enumerated subcommand set when it exposes many
operations. Never expose a command that resolves or returns an importable
module path.

Packaged data a helper reads must resolve through `RUNTIME_HOME` using
`scripts/runtime/asset-root.mjs`, keeping the checkout-relative default for
in-repository invocation and failing closed when the resolved root is absent.

Validate the runtime contract before review:

```bash
node scripts/validation/validate-runtime-references.mjs
node --test scripts/validation/test/validate-runtime-references.test.mjs
node --test scripts/runtime/test/
node --test evals/skills/global-skill-installation/run-runtime-completeness.test.mjs
```
