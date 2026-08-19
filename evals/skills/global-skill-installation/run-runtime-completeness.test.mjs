import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { discoverHelpers, runRuntimeCompleteness, verifyHelpers } from "./run-runtime-completeness.mjs";

const temporaryDirectory = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

test("the installed pair resolves every helper the canonical skills name", () => {
  const result = runRuntimeCompleteness({ profileRoot: temporaryDirectory("completeness-") });
  assert.equal(result.ok, true, JSON.stringify(result, null, 2));
  assert.equal(result.fixture, "installed-runtime-completeness");

  // The recorded evidence names the source, runtime identity, mode, and agent.
  assert.match(result.runtime.digest, /^[0-9a-f]{64}$/);
  assert.equal(result.runtime.contractVersion, 1);
  assert.equal(result.mode, "installed");
  assert.equal(result.source.kind, "local");
  assert.deepEqual(result.agents.map((agent) => agent.agent), ["claude", "codex"]);
  assert.ok(result.toolVersions.node);

  for (const agent of result.agents) {
    assert.equal(agent.complete, true);
    assert.ok(agent.helperCount >= 10, `${agent.agent} discovered only ${agent.helperCount} helpers`);
    assert.equal(agent.helpers.every((helper) => helper.resolved), true);
    // Every discovered helper names the skills that reference it, so a failure
    // points at a skill rather than only at a helper.
    assert.equal(agent.helpers.every((helper) => helper.skills.length > 0), true);
    // A representative harmless invocation ran for the payload-shaped helpers.
    assert.ok(agent.helpers.filter((helper) => helper.invocation?.attempted).length >= 4);
  }

  // Without an authenticated disposable agent profile the skill half is recorded
  // as unavailable rather than presented as installed-profile evidence.
  for (const agent of result.agents) {
    if (agent.skillSource !== "installed-profile") assert.ok(agent.unavailable);
  }
});

test("a skill naming a helper absent from the runtime fails rather than passing on discovery", () => {
  const skillRoot = temporaryDirectory("absent-helper-skills-");
  fs.mkdirSync(path.join(skillRoot, "example"), { recursive: true });
  fs.writeFileSync(path.join(skillRoot, "example/SKILL.md"),
    "# Example\n\nUse `ai-skills-runtime run helper-that-was-never-packaged`.\n");

  const discovered = discoverHelpers(skillRoot);
  assert.deepEqual(discovered.map((entry) => entry.helper), ["helper-that-was-never-packaged"]);

  const verified = verifyHelpers({
    helpers: discovered,
    manifest: { entrypoints: [{ name: "something-else", module: "scripts/runtime/x.mjs", invocation: "cli" }] },
    environment: {},
    target: temporaryDirectory("absent-helper-target-")
  });
  assert.equal(verified[0].resolved, false);
  assert.equal(verified[0].reason, "helper-not-in-installed-runtime");
});

test("discovery records which skills name each helper and which verbs they use", () => {
  const skillRoot = temporaryDirectory("discovery-skills-");
  for (const [name, body] of [
    ["first", "Use `ai-skills-runtime run shared-helper`.\n"],
    ["second", "Use `ai-skills-runtime run shared-helper` and `ai-skills-runtime run subcommand-helper some-verb`.\n"]
  ]) {
    fs.mkdirSync(path.join(skillRoot, name), { recursive: true });
    fs.writeFileSync(path.join(skillRoot, name, "SKILL.md"), `# ${name}\n\n${body}`);
  }
  const discovered = discoverHelpers(skillRoot);
  const shared = discovered.find((entry) => entry.helper === "shared-helper");
  assert.deepEqual(shared.skills, ["first/SKILL.md", "second/SKILL.md"]);
  const subcommand = discovered.find((entry) => entry.helper === "subcommand-helper");
  assert.deepEqual(subcommand.verbs, ["some-verb"]);
});
