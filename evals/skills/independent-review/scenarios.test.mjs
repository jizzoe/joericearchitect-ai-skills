import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("scenario matrix covers strict and authorized-degraded safety boundaries", () => {
  const matrix = JSON.parse(fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8"));
  assert.equal(matrix.skill, "independent-review");
  assert.deepEqual(matrix.scenarios.map((scenario) => scenario.kind).sort(), ["automatic-rereview", "autonomous-allowed-action", "autonomous-pause", "missing-input", "non-trigger", "output-path-safety", "portable-second-workspace", "trigger", "untrusted-content"]);
  for (const id of ["autonomous-exact-fallback", "autonomous-expired-fallback", "objective-correction-rereview"]) {
    const scenario = matrix.scenarios.find((item) => item.id === id);
    assert.ok(scenario, `missing ${id}`);
    assert.doesNotMatch(scenario.expected, /ask the owner|run host-debug|copy the request/i);
  }
});
