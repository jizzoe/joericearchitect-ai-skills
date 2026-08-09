import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { checkAdapterDrift } from "../../../scripts/sdd/check-adapter-drift.mjs";

test("lifecycle scenarios cover required gates and outcomes", () => {
  const scenarios = JSON.parse(
    fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8")
  ).scenarios;
  const gates = new Set(scenarios.map((scenario) => scenario.gate));
  const kinds = new Set(scenarios.map((scenario) => scenario.kind));

  for (const gate of ["propose", "apply", "verify", "delivery", "sync", "archive"]) {
    assert.equal(gates.has(gate), true, `missing ${gate} gate`);
  }

  for (const kind of ["complete", "incomplete", "ambiguous", "no-op", "stop"]) {
    assert.equal(kinds.has(kind), true, `missing ${kind} outcome`);
  }
});

test("external mutation fixtures cover boundary failures", () => {
  const fixtures = JSON.parse(
    fs.readFileSync(new URL("./fixtures/external-mutations.json", import.meta.url), "utf8")
  ).fixtures;
  const cases = new Set(fixtures.map((fixture) => fixture.case));

  for (const requiredCase of ["unauthorized", "partial", "duplicate", "untrusted", "credential"]) {
    assert.equal(cases.has(requiredCase), true, `missing ${requiredCase} fixture`);
  }
});

test("Claude and Codex adapters identify canonical sources", () => {
  const result = checkAdapterDrift(new URL("../../..", import.meta.url).pathname);
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});
