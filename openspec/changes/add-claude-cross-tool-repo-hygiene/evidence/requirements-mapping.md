# Requirements Mapping

| Requirement and scenario | Implementation evidence |
|---|---|
| Canonical policy changes | `scripts/sdd/check-adapter-drift.mjs` discovers every direct `skills/base/*/SKILL.md` package in lexical order and derives both platform adapters. |
| Platform copy diverges | `scripts/sdd/test/check-adapter-drift.test.mjs` proves missing canonical references and policy-sized adapters fail with path-specific diagnostics. |
| Generated OpenSpec files are refreshed | The same focused test proves an `openspec-*` platform asset is ignored when no `skills/base` package owns it; `docs/skill-authoring.md` documents the ownership boundary. |
| A canonical skill is added | The focused fixture adds a canonical package without modifying an inventory and requires both generated adapter paths. |
| A repository-owned adapter is missing or not thin | Focused fixtures cover a missing Claude/Codex path, absent canonical reference, absent no-policy-duplication declaration, and over-limit adapter content. |
| Claude starts at repository root | `CLAUDE.md` contains only `@AGENTS.md`; the focused test asserts the exact one-line import. |

The implementation uses repository-relative paths only. UI, browser, and
accessibility behavior are not applicable because this change is guidance,
documentation, and deterministic Node validation.
