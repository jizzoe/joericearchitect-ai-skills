#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const skillName = "github-pr-linkage";
const deliverySkillName = "autonomous-sdd-delivery";
const lifecycleSkillName = "autonomous-sdd-lifecycle";
const args = process.argv.slice(2);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "global-skill-installation-"));
const home = path.join(tempRoot, "fixture home");
const source = path.join(tempRoot, "second product source");
const env = { ...process.env, HOME: home, GH_CONFIG_DIR: path.join(home, ".config", "gh") };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: "utf8", env, ...options });
  if (result.error) throw result.error;
  return result;
}

function expectSuccess(label, command, args) {
  const result = run(command, args);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function install(agent) {
  return expectSuccess(`install for ${agent}`, "gh", [
    "skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"
  ]);
}

function list(agent) {
  const result = expectSuccess(`list for ${agent}`, "gh", [
    "skill", "list", "--agent", agent, "--scope", "user", "--json", "skillName,agentHosts,path,scope,sourceURL,version,pinned"
  ]);
  return JSON.parse(result.stdout);
}

function listedSkill(agent, expectedSkillName = skillName) {
  const installed = list(agent).find((item) => item.skillName === expectedSkillName);
  assert.ok(installed, `${agent} should list ${expectedSkillName}`);
  assert.equal(installed.scope, "user");
  assert.equal(typeof installed.path, "string");
  return installed;
}

function listedSkillPath(installed) {
  return path.resolve(installed.path, "SKILL.md");
}

function verifyDeliveryDependency(agent) {
  const delivery = listedSkill(agent, deliverySkillName);
  const lifecycle = listedSkill(agent, lifecycleSkillName);
  const deliveryPath = listedSkillPath(delivery);
  const expectedLifecyclePath = listedSkillPath(lifecycle);
  const text = fs.readFileSync(deliveryPath, "utf8");
  const match = text.match(/\[the canonical lifecycle\]\((\.\.\/autonomous-sdd-lifecycle\/SKILL\.md)\)/);
  assert.ok(match, `${agent} delivery must declare its sibling lifecycle dependency`);
  const resolved = path.resolve(path.dirname(deliveryPath), match[1]);
  assert.equal(resolved, expectedLifecyclePath, `${agent} delivery dependency must resolve to its listed lifecycle skill`);
  assert.equal(fs.existsSync(resolved), true, `${agent} installed lifecycle dependency must exist`);
}

function skillFilesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return skillFilesUnder(entryPath);
    return entry.isFile() && entry.name === "SKILL.md" ? [entryPath] : [];
  });
}

function version(command) {
  const result = run(command, ["--version"]);
  return result.status === 0 ? result.stdout.trim() : `unavailable: ${result.stderr.trim()}`;
}

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function authenticatedInvocation(agent, fixturePath) {
  const isClaude = agent === "claude-code";
  const resolvedFixturePath = fs.realpathSync(fixturePath);
  const resolvedHome = fs.realpathSync(os.homedir());
  if (resolvedFixturePath === resolvedHome) {
    return { status: "blocked", reason: `${agent} requires a disposable profile path, not the current user's HOME` };
  }

  const fixtureEnv = { ...process.env };
  // Use the platform trust store for agent calls, not a caller's custom CA bundle.
  delete fixtureEnv.SSL_CERT_FILE;
  delete fixtureEnv.SSL_CERT_DIR;
  Object.assign(fixtureEnv, {
    GH_CONFIG_DIR: path.join(resolvedFixturePath, ".config", "gh"),
    ...(isClaude
      ? { CLAUDE_CONFIG_DIR: resolvedFixturePath }
      : { HOME: resolvedFixturePath, CODEX_HOME: path.join(resolvedFixturePath, ".codex") })
  });
  const workspace = path.join(tempRoot, `${agent} invocation workspace`);
  fs.mkdirSync(workspace, { recursive: true });

  let installedSkillPaths = [];
  let installedByFixture = false;
  try {
    const auth = spawnSync(
      agent === "claude-code" ? "claude" : "codex",
      agent === "claude-code" ? ["auth", "status"] : ["login", "status"],
      { cwd: workspace, encoding: "utf8", env: fixtureEnv }
    );
    if (auth.status !== 0) {
      return { status: "blocked", reason: `${agent} disposable profile is not authenticated` };
    }

    const installArgs = isClaude
      ? ["skill", "install", source, "--from-local", "--all", "--dir", path.join(fixturePath, "skills")]
      : ["skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"];
    const installResult = spawnSync("gh", installArgs, {
      cwd: workspace,
      encoding: "utf8",
      env: fixtureEnv
    });
    if (installResult.status !== 0) {
      return { status: "blocked", reason: `${agent} fixture installation failed` };
    }
    installedByFixture = true;
    const listArgs = isClaude
      ? ["skill", "list", "--dir", path.join(fixturePath, "skills"), "--json", "skillName,path,scope,sourceURL,version,pinned"]
      : ["skill", "list", "--agent", agent, "--scope", "user", "--json", "skillName,path,scope,sourceURL,version,pinned"];
    const listed = spawnSync("gh", listArgs, { cwd: workspace, encoding: "utf8", env: fixtureEnv });
    if (listed.status !== 0) {
      return { status: "blocked", reason: `${agent} could not verify its installed skill with gh skill list` };
    }
    const listedItems = JSON.parse(listed.stdout);
    const installed = listedItems.find((item) => item.skillName === skillName);
    if (!installed?.path) return { status: "blocked", reason: `${agent} could not find its fixture skill in gh skill list` };
    installedSkillPaths = [skillName, deliverySkillName, lifecycleSkillName]
      .map((name) => listedItems.find((item) => item.skillName === name)?.path)
      .filter(Boolean)
      .map((installedPath) => path.resolve(installedPath));

    const invocation = agent === "claude-code"
      ? spawnSync("claude", [
          "-p", "/github-pr-linkage State in one sentence what this skill is for.",
          "--no-session-persistence", "--tools", ""
        ], { cwd: workspace, encoding: "utf8", env: fixtureEnv })
      : spawnSync("codex", [
          "exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only",
          "-C", workspace, "$github-pr-linkage State in one sentence what this skill is for."
        ], { cwd: workspace, encoding: "utf8", env: fixtureEnv });
    if (invocation.status !== 0 || !invocation.stdout.trim()) {
      const transportFailure = /invalid peer certificate|stream disconnected|http\/request failed/i.test(invocation.stderr);
      return {
        status: "blocked",
        reason: transportFailure
          ? `${agent} could not reach its service because the configured TLS trust chain rejected the peer certificate`
          : `${agent} invocation failed; inspect the disposable-profile command output`
      };
    }

    return {
      status: "passed",
      output: invocation.stdout.trim().replaceAll(/\s+/g, " ").slice(0, 240)
    };
  } finally {
    if (installedByFixture) {
      for (const installedSkillPath of installedSkillPaths) {
        fs.rmSync(installedSkillPath, { recursive: true, force: true });
      }
    }
  }
}

try {
  fs.mkdirSync(path.join(source, "skills", "base"), { recursive: true });
  for (const sourceSkill of [skillName, deliverySkillName, lifecycleSkillName]) {
    fs.cpSync(path.join(repoRoot, "skills", "base", sourceSkill), path.join(source, "skills", "base", sourceSkill), { recursive: true });
  }

  const discoveryOnly = expectSuccess("local-source skill discovery", "gh", ["skill", "install", source, "--from-local"]);
  assert.match(discoveryOnly.stdout, new RegExp(skillName));
  assert.deepEqual(skillFilesUnder(home), [], "discovery must not install a skill in the fixture home");

  for (const agent of ["claude-code", "codex"]) {
    install(agent);
    const installed = listedSkill(agent);
    const installedPath = listedSkillPath(installed);
    assert.equal(fs.existsSync(installedPath), true, `${agent} destination should contain SKILL.md`);
    verifyDeliveryDependency(agent);

    const rerun = run("gh", ["skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"]);
    assert.notEqual(rerun.status, 0, `${agent} rerun must not silently overwrite an existing skill`);

    const skillsDirectory = path.dirname(installed.path);
    const updateCheck = run("gh", ["skill", "update", "--dry-run", "--dir", skillsDirectory]);
    assert.equal(updateCheck.status, 0, `${agent} update dry run must not mutate or fail`);
    assert.equal(fs.existsSync(installedPath), true, `${agent} update dry run must preserve the installed skill`);
  }

  const conflictHome = path.join(tempRoot, "conflict home");
  const conflictSkillsDirectory = path.join(conflictHome, "skills");
  const conflictSkillPath = path.join(conflictSkillsDirectory, skillName, "SKILL.md");
  fs.mkdirSync(path.dirname(conflictSkillPath), { recursive: true });
  fs.writeFileSync(conflictSkillPath, "# User authored\n", "utf8");
  const conflict = spawnSync("gh", ["skill", "install", source, "--from-local", "--all", "--dir", conflictSkillsDirectory], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...env, HOME: conflictHome, GH_CONFIG_DIR: path.join(conflictHome, ".config", "gh") }
  });
  assert.notEqual(conflict.status, 0, "user-authored destination conflict must not be overwritten");
  assert.equal(fs.readFileSync(conflictSkillPath, "utf8"), "# User authored\n");

  const claudeConfigDir = option("--authenticated-claude-config-dir");
  const codexHome = option("--authenticated-codex-home");
  const agentInvocation = {
    "claude-code": claudeConfigDir
      ? authenticatedInvocation("claude-code", path.resolve(claudeConfigDir))
      : "blocked: an authenticated macOS Claude Code account and disposable CLAUDE_CONFIG_DIR were not provided",
    codex: codexHome
      ? authenticatedInvocation("codex", path.resolve(codexHome))
      : "blocked: an authenticated disposable Codex profile was not provided"
  };

  console.log(JSON.stringify({
    gh: run("gh", ["--version"]).stdout.split("\n")[0],
    claudeCode: version("claude"),
    codex: version("codex"),
    fixtureHome: home,
    source,
    agents: ["claude-code", "codex"],
    agentInvocation,
    result: "install/list fixtures passed"
  }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
