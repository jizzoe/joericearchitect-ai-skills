import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  RECEIPT_SCHEMA_VERSION, SUPPORTED_AGENTS, installAiSkills, launcherShim, parseArgs,
  parseSkillInstallResult, preflightNode, resolveSource
} from "../install-runtime.mjs";
import { activatePrevious } from "../launcher.mjs";
import { readActiveMetadata, readInstalledHistory, runtimePaths } from "../runtime-home.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryDirectory = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

/**
 * A committed copy of the repository stands in for a reviewed local checkout, so
 * installation is exercised without depending on the working tree being clean.
 */
function reviewedCheckout() {
  const root = temporaryDirectory("reviewed-checkout-");
  for (const entry of ["scripts", "quality", "skills"]) {
    fs.cpSync(path.join(repositoryRoot, entry), path.join(root, entry), { recursive: true });
  }
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "add", "-A"]);
  execFileSync("git", ["-C", root, "-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture",
    "commit", "--quiet", "-m", "fixture"]);
  return root;
}

const checkout = reviewedCheckout();

/** gh is never invoked by these tests; skill installation is stubbed. */
function stubbedRun(overrides = {}) {
  return (command, args, options) => {
    if (command === process.execPath && args[0].endsWith("install-global-skill.mjs")) {
      if (overrides.skillFailure) return { status: 1, stdout: JSON.stringify({ ok: false, tool: "install-global-skill" }) };
      if (overrides.skillUnparsable) return { status: 0, stdout: "not json" };
      const agent = args[args.indexOf("--agent") + 1];
      return {
        status: 0,
        stdout: JSON.stringify({
          schemaVersion: 1, tool: "install-global-skill", ok: true, agent,
          source: args.includes("--local") ? "local" : "remote",
          overwriteIntent: args.includes("--force"), dryRun: args.includes("--dry-run"),
          pin: args.includes("--pin") ? args[args.indexOf("--pin") + 1] : null
        })
      };
    }
    if (command === "gh" && args[0] === "skill" && args[1] === "list") {
      return overrides.priorPin
        ? { status: 0, stdout: JSON.stringify([{ name: "example", pin: overrides.priorPin }]) }
        : { status: 1, stdout: "" };
    }
    return spawnSync(command, args, options);
  };
}

function isolatedHome(prefix = "install-home-") {
  const home = temporaryDirectory(prefix);
  return { home, environment: { ...process.env, HOME: home, USERPROFILE: home } };
}

test("a reviewed local source installs skills and the matching runtime as one pair", () => {
  const { home, environment } = isolatedHome();
  const receipt = installAiSkills({
    local: checkout, agents: ["claude", "codex"], environment, platform: "linux",
    workspace: temporaryDirectory("install-workspace-"), run: stubbedRun({ priorPin: "v0.9.0" })
  });

  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(receipt.schemaVersion, RECEIPT_SCHEMA_VERSION);
  assert.equal(receipt.phase, "complete");
  assert.equal(receipt.mode, "installed");
  assert.deepEqual(receipt.agents, ["claude", "codex"]);
  assert.equal(receipt.source.kind, "local");
  assert.match(receipt.source.revision, /^[0-9a-f]{40}$/);
  assert.equal(receipt.priorSkillPin, "v0.9.0");
  assert.equal(receipt.skills.length, 2);
  assert.equal(receipt.runtime.contractVersion, 1);
  assert.match(receipt.runtime.digest, /^[0-9a-f]{64}$/);

  // runtime-<digest12> naming, active metadata, and append-only history.
  const paths = runtimePaths(environment, "linux");
  assert.equal(receipt.runtime.path, path.join(paths.runtimeRoot, `runtime-${receipt.runtime.digest.slice(0, 12)}`));
  assert.equal(fs.existsSync(path.join(receipt.runtime.path, "runtime-manifest.json")), true);
  assert.equal(readActiveMetadata(paths).activePath, receipt.runtime.path);
  assert.equal(readInstalledHistory(paths).history.length, 1);

  // The launcher shim is installed, and PATH is reported, never modified.
  assert.equal(fs.existsSync(paths.launcherPath), true);
  assert.equal(receipt.activation.onPath, false);
  assert.equal(receipt.activation.pathEntryToAdd, path.join(home, ".ai-skills/bin"));
  assert.deepEqual(fs.readdirSync(home).sort(), [".ai-skills"]);
  assert.equal(fs.existsSync(path.join(home, ".bashrc")), false);
  assert.equal(fs.existsSync(path.join(home, ".profile")), false);
});

test("a second install retains the prior runtime and rollback restores it offline", () => {
  const { environment } = isolatedHome("retention-home-");
  const workspace = temporaryDirectory("retention-workspace-");
  const first = installAiSkills({ local: checkout, agents: ["claude"], environment, platform: "linux", workspace, run: stubbedRun() });
  assert.equal(first.ok, true);

  // A changed source produces a different digest and therefore a new version.
  const changed = temporaryDirectory("changed-checkout-");
  fs.cpSync(checkout, changed, { recursive: true });
  fs.appendFileSync(path.join(changed, "scripts/runtime/registry.mjs"), "\n// revision two\n");
  execFileSync("git", ["-C", changed, "add", "-A"]);
  execFileSync("git", ["-C", changed, "-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture",
    "commit", "--quiet", "-m", "revision two"]);

  const second = installAiSkills({
    local: changed, agents: ["claude"], environment, platform: "linux",
    workspace: temporaryDirectory("retention-workspace-2-"), run: stubbedRun()
  });
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.notEqual(second.runtime.digest, first.runtime.digest);
  assert.equal(second.runtime.priorPath, first.runtime.path);

  const paths = runtimePaths(environment, "linux");
  assert.equal(readActiveMetadata(paths).activePath, second.runtime.path);
  // Both versions are retained; nothing is pruned automatically.
  assert.equal(fs.existsSync(first.runtime.path), true);
  assert.equal(fs.existsSync(second.runtime.path), true);
  assert.equal(readInstalledHistory(paths).history.length, 2);

  const rolledBack = activatePrevious({ environment, platform: "linux" });
  assert.equal(rolledBack.ok, true, JSON.stringify(rolledBack));
  assert.equal(rolledBack.activated, first.runtime.path);
  assert.equal(readActiveMetadata(paths).activePath, first.runtime.path);
});

test("a pinned remote source is required and an unpinned one is refused", () => {
  assert.equal(resolveSource({ remote: "owner/repo" }).code, "remote-source-unpinned");
  const pinned = resolveSource({ remote: "owner/repo", pin: "v1.2.3" });
  assert.equal(pinned.ok, true);
  assert.equal(pinned.kind, "remote");

  const { environment } = isolatedHome("remote-home-");
  const receipt = installAiSkills({
    remote: "owner/repo", pin: "v1.2.3", agents: ["claude"], environment, platform: "linux",
    workspace: temporaryDirectory("remote-workspace-"),
    run: (command, args, options) => {
      if (command === "gh" && args[0] === "repo" && args[1] === "clone") {
        const destination = args[3];
        fs.cpSync(checkout, destination, { recursive: true });
        return { status: 0, stdout: "" };
      }
      if (command === "git" && args.includes("checkout")) return { status: 0, stdout: "" };
      return stubbedRun()(command, args, options);
    }
  });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(receipt.source.kind, "remote");
  assert.equal(receipt.source.pin, "v1.2.3");
  assert.match(receipt.source.revision, /^[0-9a-f]{40}$/);
});

test("an unclean local checkout needs the documented development override", () => {
  const dirty = temporaryDirectory("dirty-checkout-");
  fs.cpSync(checkout, dirty, { recursive: true });
  fs.writeFileSync(path.join(dirty, "scripts/runtime/uncommitted.mjs"), "// uncommitted\n");
  assert.equal(resolveSource({ local: dirty }).code, "local-source-unclean");
  assert.equal(resolveSource({ local: dirty, allowDirty: true }).ok, true);
  assert.equal(resolveSource({ local: "relative/path" }).code, "local-source-not-absolute");
  assert.equal(resolveSource({ local: temporaryDirectory("not-a-checkout-") }).code, "local-source-not-a-runtime-checkout");
  assert.equal(resolveSource({}).code, "source-required");
  assert.equal(resolveSource({ local: dirty, remote: "owner/repo" }).code, "source-mode-ambiguous");
});

test("explicit overwrite intent is carried into the delegated skill installation", () => {
  const { environment } = isolatedHome("overwrite-home-");
  const receipt = installAiSkills({
    local: checkout, agents: ["claude"], force: true, environment, platform: "linux",
    workspace: temporaryDirectory("overwrite-workspace-"), run: stubbedRun()
  });
  assert.equal(receipt.overwriteIntent, true);
  assert.equal(receipt.skills[0].overwriteIntent, true);
});

test("installer accepts the final receipt after GitHub CLI advisory output", () => {
  const receipt = { schemaVersion: 1, tool: "install-global-skill", ok: true };
  assert.deepEqual(parseSkillInstallResult(`warning from GitHub CLI\n${JSON.stringify(receipt, null, 2)}\n`), receipt);
  assert.equal(parseSkillInstallResult("warning only"), null);
});

test("a failed skill installation activates no runtime and retains the prior one", () => {
  const { environment } = isolatedHome("skill-failure-home-");
  const workspace = temporaryDirectory("skill-failure-workspace-");
  const first = installAiSkills({ local: checkout, agents: ["claude"], environment, platform: "linux", workspace, run: stubbedRun() });
  assert.equal(first.ok, true);

  const failed = installAiSkills({
    local: checkout, agents: ["claude"], environment, platform: "linux",
    workspace: temporaryDirectory("skill-failure-workspace-2-"), run: stubbedRun({ skillFailure: true })
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.phase, "skills");
  assert.equal(failed.code, "skill-install-failed");
  assert.match(failed.recovery, /previously active runtime remains active/);

  const paths = runtimePaths(environment, "linux");
  assert.equal(readActiveMetadata(paths).activePath, first.runtime.path);
  assert.equal(readInstalledHistory(paths).history.length, 1);

  const unparsable = installAiSkills({
    local: checkout, agents: ["claude"], environment, platform: "linux",
    workspace: temporaryDirectory("skill-failure-workspace-3-"), run: stubbedRun({ skillUnparsable: true })
  });
  assert.equal(unparsable.code, "skill-install-result-unreadable");
});

test("a failed runtime build reports the phase and leaves the active runtime alone", () => {
  const { environment } = isolatedHome("build-failure-home-");
  const broken = temporaryDirectory("broken-checkout-");
  fs.cpSync(checkout, broken, { recursive: true });
  fs.rmSync(path.join(broken, "quality"), { recursive: true, force: true });
  execFileSync("git", ["-C", broken, "add", "-A"]);
  execFileSync("git", ["-C", broken, "-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture",
    "commit", "--quiet", "-m", "remove declared asset root"]);

  const receipt = installAiSkills({
    local: broken, agents: ["claude"], environment, platform: "linux",
    workspace: temporaryDirectory("build-failure-workspace-"), run: stubbedRun()
  });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.phase, "build");
  assert.equal(receipt.code, "declared-root-missing");
  assert.equal(fs.existsSync(runtimePaths(environment, "linux").activePath), false);
});

test("an unsupported Node runtime or agent is refused before anything is installed", () => {
  const { home, environment } = isolatedHome("preflight-home-");
  const unsupportedNode = installAiSkills({ local: checkout, environment, platform: "linux", nodeVersion: "18.20.4" });
  assert.equal(unsupportedNode.ok, false);
  assert.equal(unsupportedNode.code, "node-version-unsupported");
  assert.deepEqual(unsupportedNode.detail, { required: ">=20", active: "18.20.4" });

  const unsupportedAgent = installAiSkills({ local: checkout, agents: ["gemini"], environment, platform: "linux" });
  assert.equal(unsupportedAgent.code, "agent-not-supported");
  assert.deepEqual(unsupportedAgent.detail, ["gemini"]);

  assert.equal(preflightNode("20.0.0").ok, true);
  assert.equal(preflightNode("22.11.0").ok, true);
  assert.deepEqual(fs.readdirSync(home), []);
});

test("a dry run reports the full paired receipt and changes nothing", () => {
  const { home, environment } = isolatedHome("dry-run-home-");
  const receipt = installAiSkills({
    local: checkout, agents: ["claude", "codex"], dryRun: true, environment, platform: "linux",
    workspace: temporaryDirectory("dry-run-workspace-"), run: stubbedRun()
  });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(receipt.phase, "dry-run");
  assert.equal(receipt.dryRun, true);
  assert.match(receipt.runtime.digest, /^[0-9a-f]{64}$/);
  assert.equal(receipt.skills.every((skill) => skill.dryRun === true), true);
  assert.deepEqual(fs.readdirSync(home), []);
});

test("an occupied version directory without a manifest is never activated", () => {
  const { environment } = isolatedHome("occupied-home-");
  const paths = runtimePaths(environment, "linux");
  const workspace = temporaryDirectory("occupied-workspace-");

  // Learn the digest this source produces, then occupy that directory with
  // content carrying no manifest.
  const planned = installAiSkills({ local: checkout, agents: ["claude"], dryRun: true, environment, platform: "linux", workspace, run: stubbedRun() });
  fs.mkdirSync(planned.runtime.path, { recursive: true });
  fs.writeFileSync(path.join(planned.runtime.path, "unexpected.txt"), "not a runtime\n");

  for (const force of [false, true]) {
    const receipt = installAiSkills({
      local: checkout, agents: ["claude"], force, environment, platform: "linux",
      workspace: temporaryDirectory("occupied-workspace-2-"), run: stubbedRun()
    });
    assert.equal(receipt.ok, false, `force=${force} should not activate an unverifiable directory`);
    assert.equal(receipt.code, "runtime-version-directory-occupied");
    assert.equal(fs.existsSync(paths.activePath), false);
  }
});

test("the launcher shim resolves the active runtime rather than a fixed version", () => {
  const paths = runtimePaths({ HOME: "/home/example" }, "linux");
  const posix = launcherShim("linux", paths);
  assert.match(posix, /^#!\/usr\/bin\/env sh/);
  assert.match(posix, /active\.json/);
  assert.doesNotMatch(posix, /runtime-[0-9a-f]{12}/);

  const windows = launcherShim("win32", paths);
  assert.match(windows, /@echo off/);
  assert.match(windows, /active\.json/);
  assert.doesNotMatch(windows, /runtime-[0-9a-f]{12}/);
});

test("argument parsing defaults to both supported agents and rejects the unknown", () => {
  assert.deepEqual(parseArgs([]).agents, SUPPORTED_AGENTS);
  const parsed = parseArgs(["--local", ".", "--agent", "codex", "--force", "--dry-run"]);
  assert.deepEqual(parsed.agents, ["codex"]);
  assert.equal(parsed.force, true);
  assert.equal(parsed.dryRun, true);
  assert.equal(path.isAbsolute(parsed.local), true);
  assert.throws(() => parseArgs(["--unknown"]), /unexpected argument/);
});

test("the Bash entrypoint refuses an absent source and a bad argument without touching the host", () => {
  const missingSource = spawnSync("bash", [path.join(repositoryRoot, "scripts/install-ai-skills.sh")], { encoding: "utf8" });
  assert.equal(missingSource.status, 2);
  assert.equal(JSON.parse(missingSource.stdout).code, "source-required");

  const unexpected = spawnSync("bash", [path.join(repositoryRoot, "scripts/install-ai-skills.sh"), "--nope"], { encoding: "utf8" });
  assert.equal(unexpected.status, 2);
  assert.match(unexpected.stderr, /unexpected-argument/);

  const help = spawnSync("bash", [path.join(repositoryRoot, "scripts/install-ai-skills.sh"), "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /gh attestation verify/);
});

test("each available shell entrypoint reproduces the Node receipt contract", () => {
  const { environment } = isolatedHome("parity-home-");
  const reference = installAiSkills({
    local: checkout, agents: ["claude"], dryRun: true, environment, platform: "linux",
    workspace: temporaryDirectory("parity-workspace-"), run: stubbedRun()
  });
  assert.equal(reference.ok, true);
  const referenceKeys = Object.keys(reference).sort();

  const shells = [];
  if (process.platform !== "win32") {
    // The Bash entrypoint targets POSIX hosts; Windows uses the PowerShell one.
    shells.push({
      name: "bash",
      command: "bash",
      args: [path.join(repositoryRoot, "scripts/install-ai-skills.sh"), "--local", checkout, "--agent", "claude", "--dry-run"]
    });
  }
  shells.push({
    name: "pwsh",
    command: "pwsh",
    args: ["-NoProfile", "-File", path.join(repositoryRoot, "scripts/install-ai-skills.ps1"),
      "-Local", checkout, "-Agent", "claude", "-DryRun"]
  });

  let asserted = 0;
  for (const shell of shells) {
    const result = spawnSync(shell.command, shell.args, { encoding: "utf8", env: environment });
    if (result.error?.code === "ENOENT") continue;
    const diagnostics = `${shell.name} exited ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;
    let receipt = null;
    try {
      receipt = JSON.parse(result.stdout || "null");
    } catch {
      receipt = null;
    }
    assert.ok(receipt, `${shell.name} produced no receipt.\n${diagnostics}`);
    assert.deepEqual(Object.keys(receipt).sort(), referenceKeys, `${shell.name} receipt keys differ`);
    assert.equal(receipt.tool, "install-ai-skills");
    assert.equal(receipt.dryRun, true);
    assert.equal(receipt.runtime.contractVersion, reference.runtime.contractVersion);
    assert.deepEqual(receipt.agents, ["claude"]);
    asserted += 1;
  }
  // At least one shell must exist on any supported host.
  assert.ok(asserted >= 1, "no supported shell entrypoint was available");
});
