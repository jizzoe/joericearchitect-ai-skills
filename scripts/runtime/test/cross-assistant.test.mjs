import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildRuntime } from "../build-runtime.mjs";
import { dispatch, doctor, prepareDispatch, resolveRuntime } from "../launcher.mjs";
import { SUPPORTED_AGENTS } from "../install-runtime.mjs";
import { loadManifest } from "../registry.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryDirectory = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

const runtimeRoot = path.join(temporaryDirectory("cross-assistant-runtime-"), "runtime");
const build = buildRuntime({ source: repositoryRoot, output: runtimeRoot });
assert.equal(build.ok, true, `runtime build failed: ${JSON.stringify(build)}`);

/**
 * Two unrelated target repositories with different paths and no shared
 * product-specific constant.
 */
function targetRepository(prefix) {
  const root = temporaryDirectory(prefix);
  execFileSync("git", ["init", "--quiet", root]);
  return root;
}

const firstTarget = targetRepository("product-one-");
const secondTarget = targetRepository("unrelated-product-two-");
const environment = { ...process.env, AI_SKILLS_RUNTIME_ROOT: runtimeRoot };

test("both assistants select the same helper through one shared runtime", () => {
  // The launcher contract carries no assistant identity at all: the same call
  // is what a Claude Code skill and a Codex skill each make.
  const plans = SUPPORTED_AGENTS.map(() => prepareDispatch({
    helper: "sdd-lifecycle-hygiene", target: firstTarget, environment
  }));
  assert.equal(plans.every((plan) => plan.ok), true);
  assert.equal(new Set(plans.map((plan) => plan.modulePath)).size, 1);
  assert.equal(new Set(plans.map((plan) => plan.runtimeRoot)).size, 1);
  assert.equal(new Set(plans.map((plan) => plan.digest)).size, 1);
});

test("one runtime serves two agents holding different skill revisions in one contract version", () => {
  const record = doctor({
    environment,
    run: (command, args) => {
      const agent = args[args.indexOf("--agent") + 1];
      return {
        status: 0,
        stdout: JSON.stringify([{ name: "example", revision: agent === "claude" ? "revision-a" : "revision-b" }])
      };
    }
  });
  assert.equal(record.ok, true);
  assert.equal(record.runtime.contractVersion, build.manifest.contractVersion);
  // Skew is informational; the shared runtime still serves both agents.
  const skew = record.compatibility.find((item) => item.code === "agent-revision-skew");
  assert.equal(skew.level, "info");
  assert.equal(record.agents.length, 2);
  assert.equal(record.agents.every((agent) => agent.available), true);
});

test("the same helper resolves identically against a second unrelated repository", () => {
  const first = prepareDispatch({ helper: "sdd-workspace-cleanup", target: firstTarget, environment });
  const second = prepareDispatch({ helper: "sdd-workspace-cleanup", target: secondTarget, environment });
  assert.equal(first.ok && second.ok, true);
  assert.equal(first.modulePath, second.modulePath);
  assert.notEqual(first.target, second.target);

  // The helper acts on the target it was given, not on the runtime's own root
  // or the process working directory.
  for (const target of [firstTarget, secondTarget]) {
    const result = spawnSync(process.execPath, [first.modulePath, "--stdin"], {
      encoding: "utf8",
      cwd: repositoryRoot,
      env: { ...process.env, RUNTIME_HOME: runtimeRoot, AI_SKILLS_TARGET_REPOSITORY: target },
      input: JSON.stringify({ operation: "plan-workspace-cleanup", payload: { selectedEntry: "example", repository: target } })
    });
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.helper, "sdd-workspace-cleanup");
  }
});

test("an unavailable runtime is classified identically for either assistant", () => {
  const emptyHome = temporaryDirectory("no-runtime-home-");
  // Nothing in resolution reads an assistant marker, so an assistant-specific
  // environment cannot change the classification.
  const results = [
    { HOME: emptyHome, USERPROFILE: emptyHome, CLAUDECODE: "1" },
    { HOME: emptyHome, USERPROFILE: emptyHome, CODEX_SANDBOX: "1" }
  ].map((assistantEnvironment) => resolveRuntime({ environment: assistantEnvironment, platform: "linux" }));

  assert.equal(results[0].classification, "unavailable");
  assert.equal(results[0].code, "runtime-not-installed");
  assert.deepEqual(results[0], results[1]);
});

test("the runtime contract adds no approval, sandbox, credential, or network behaviour", () => {
  const plan = prepareDispatch({ helper: "sdd-lifecycle-hygiene", target: firstTarget, environment });
  assert.equal(plan.ok, true);

  // A credential present in the caller's environment is passed through
  // untouched: the launcher neither injects nor strips one.
  const parentEnvironment = { PATH: "/usr/bin", GH_TOKEN: "caller-owned-token", HOME: "/home/example" };
  const captured = [];
  dispatch({ ...plan }, [], {
    run: (...args) => { captured.push(args); return { status: 0 }; },
    environment: parentEnvironment
  });
  const childEnvironment = captured[0][2].env;
  assert.equal(childEnvironment.GH_TOKEN, "caller-owned-token");

  // The only difference from the caller's environment is the two variables the
  // dispatch contract declares.
  const added = Object.keys(childEnvironment).filter((key) => !(key in parentEnvironment));
  assert.deepEqual(added.sort(), ["AI_SKILLS_TARGET_REPOSITORY", "RUNTIME_HOME"]);
  const removed = Object.keys(parentEnvironment).filter((key) => !(key in childEnvironment));
  assert.deepEqual(removed, []);

  // No approval, sandbox, or permission flag is added to the helper argument
  // vector, and the runtime modules open no network capability.
  const [, childArgs] = captured[0];
  assert.deepEqual(childArgs, [plan.modulePath]);
  for (const module of ["launcher.mjs", "registry.mjs", "build-runtime.mjs", "install-runtime.mjs"]) {
    const source = fs.readFileSync(path.join(repositoryRoot, "scripts/runtime", module), "utf8");
    assert.doesNotMatch(source, /node:https?|node:net|node:dgram|\bfetch\(/);
  }
});

test("every helper a canonical skill names is declared and dispatchable", () => {
  const { manifest } = loadManifest(repositoryRoot);
  const declared = new Set(manifest.entrypoints.map((entry) => entry.name));
  const skillRoot = path.join(repositoryRoot, "skills/base");

  const named = new Set();
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const next = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.name.endsWith(".md")) {
        for (const match of fs.readFileSync(next, "utf8").matchAll(/ai-skills-runtime run ([a-z0-9-]+)/g)) {
          named.add(match[1]);
        }
      }
    }
  };
  walk(skillRoot);

  assert.ok(named.size >= 10, `expected the canonical catalog to name several helpers, found ${named.size}`);
  for (const helper of named) {
    assert.ok(declared.has(helper), `canonical skills name an undeclared helper: ${helper}`);
    const plan = prepareDispatch({
      helper, target: secondTarget, environment,
      ...(manifest.entrypoints.find((entry) => entry.name === helper).invocation === "subcommand"
        ? { verb: manifest.entrypoints.find((entry) => entry.name === helper).verbs[0] }
        : {})
    });
    assert.equal(plan.ok, true, `declared helper does not resolve: ${helper} (${plan.code})`);
    assert.equal(fs.existsSync(plan.modulePath), true, `helper module missing from runtime: ${helper}`);
  }
});
