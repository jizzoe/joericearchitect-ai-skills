## 1. Boundary mapping

- [x] 1.1 Map `claude` → `claude-code` in `doctor()`, `currentSkillPin()`, and
      `installSkills()` (internal `claude` id retained elsewhere)
- [x] 1.2 Use `--json skillName,version,pinned` in both `gh skill list` probes
- [x] 1.3 Read revision/pin from `skill.version`

## 2. Tests

- [x] 2.1 Update the three runtime test stubs to validate the real arg vector
      and field names
- [x] 2.2 Keep the revision-skew and prior-pin assertions passing

## 3. Verification

- [x] 3.1 Run `scripts/runtime/test/*.test.mjs`
- [x] 3.2 Reinstall the runtime and confirm `ai-skills-runtime doctor` reports
      both agents available
- [x] 3.3 Run `openspec validate --all --strict`
