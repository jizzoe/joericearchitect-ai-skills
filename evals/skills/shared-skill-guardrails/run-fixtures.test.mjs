import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateSharedGuardrails } from "../../../scripts/validation/validate-shared-guardrails.mjs";

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "shared-guardrails-"));
  fs.mkdirSync(path.join(root, "_shared"), { recursive: true });
  fs.writeFileSync(path.join(root, "_shared", "guardrails.md"), "# Shared Guardrails\n");
  return root;
}
function skill(root, name, content) {
  const dir = path.join(root, name); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), content);
}
function has(result, code) { return result.issues.some((item) => item.code === code); }
const valid = "---\nname: fixture\ndescription: fixture\n---\n\n# Fixture\n\n## Guardrails\n\nSee [Shared guardrails](../_shared/guardrails.md).\n";

test("guardrail validator dynamically discovers a valid new skill", () => {
  const root = fixtureRoot();
  skill(root, "new-skill", valid.replace("name: fixture", "name: new-skill"));
  const result = validateSharedGuardrails(root);
  assert.equal(result.valid, true, JSON.stringify(result.issues));
  assert.equal(result.skillPaths.length, 1);
});

test("guardrail validator rejects missing, malformed, duplicate, broken, copied, and shared-skill cases", () => {
  const cases = [
    ["missing", "# Fixture\n", "missing-guardrails-section"],
    ["malformed", valid.replace("../_shared/guardrails.md", "../other.md"), "malformed-guardrail-link"],
    ["duplicate", valid.replace("See [Shared guardrails](../_shared/guardrails.md).", "See [Shared guardrails](../_shared/guardrails.md).\nSee [Again](../_shared/guardrails.md)."), "duplicate-guardrail-link"],
    ["copied", valid.replace("See [Shared guardrails](../_shared/guardrails.md).", "Never expose secrets."), "missing-guardrail-link"]
  ];
  for (const [name, content, expected] of cases) {
    const root = fixtureRoot(); skill(root, name, content.replace("name: fixture", `name: ${name}`));
    assert.equal(has(validateSharedGuardrails(root), expected), true, name);
  }
  const brokenRoot = fixtureRoot(); skill(brokenRoot, "broken", valid.replace("name: fixture", "name: broken"));
  fs.unlinkSync(path.join(brokenRoot, "_shared", "guardrails.md"));
  assert.equal(has(validateSharedGuardrails(brokenRoot), "broken-guardrail-link"), true);
  const root = fixtureRoot(); skill(root, "copied", valid.replace("See [Shared guardrails](../_shared/guardrails.md).", "See [Shared guardrails](../_shared/guardrails.md).\nNever expose secrets."));
  fs.writeFileSync(path.join(root, "_shared", "SKILL.md"), "# Not allowed\n");
  const result = validateSharedGuardrails(root);
  assert.equal(has(result, "copied-guardrail-policy"), true);
  assert.equal(has(result, "shared-directory-is-skill"), true);
});
