#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const usage = `Usage:
  node scripts/skills/install-global-skill.mjs (--local <directory> | --remote <owner/repository>) (--skill <path> | --all) --agent <identifier> [--force] [--pin <tag-or-commit>] [--dry-run]

Options:
  --local <directory>        Install from an explicit local checkout.
  --remote <owner/repository> Install from an explicit GitHub repository.
  --skill <path>             Install one skill path from the source.
  --all                      Install every discovered skill from the source.
  --agent <identifier>       Target agent accepted by gh skill install.
  --force                    Explicitly overwrite existing installed skills.
  --pin <tag-or-commit>      Pin a remote install. Not valid with --local.
  --dry-run                  Print the argument vector without invoking gh.
  --help                     Show this help text.
`;

function fail(message) {
  const error = new Error(message);
  error.exitCode = 2;
  throw error;
}

function requireValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${option} requires a value`);
  return value;
}

export function parseArguments(args) {
  const options = {
    all: false,
    dryRun: false,
    force: false,
    help: false,
    local: undefined,
    remote: undefined,
    pin: undefined,
    skill: undefined,
    agent: undefined
  };

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    switch (option) {
      case "--all":
        if (options.all) fail("--all may be supplied only once");
        options.all = true;
        break;
      case "--dry-run":
        if (options.dryRun) fail("--dry-run may be supplied only once");
        options.dryRun = true;
        break;
      case "--force":
        if (options.force) fail("--force may be supplied only once");
        options.force = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--local":
      case "--remote":
      case "--pin":
      case "--skill":
      case "--agent": {
        const property = option.slice(2);
        if (options[property] !== undefined) fail(`${option} may be supplied only once`);
        options[property] = requireValue(args, index, option);
        index += 1;
        break;
      }
      default:
        fail(`unknown option: ${option}`);
    }
  }

  if (options.help) return options;
  if ((options.local === undefined) === (options.remote === undefined)) {
    fail("supply exactly one of --local or --remote");
  }
  if (options.remote && !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(options.remote)) {
    fail("--remote must be an owner/repository value");
  }
  if (options.agent === undefined) fail("--agent is required");
  if (options.all === (options.skill !== undefined)) {
    fail("supply exactly one of --skill or --all");
  }
  if (options.local !== undefined && options.pin !== undefined) {
    fail("--pin is supported only with --remote");
  }

  return options;
}

export function buildInstallArguments(options) {
  const source = options.local ?? options.remote;
  const args = ["skill", "install", source];
  if (options.skill) args.push(options.skill);
  if (options.local) args.push("--from-local");
  if (options.all) args.push("--all");
  args.push("--agent", options.agent, "--scope", "user");
  if (options.force) args.push("--force");
  if (options.pin) args.push("--pin", options.pin);
  return args;
}

export function redactArguments(args) {
  return args.map((argument) => argument.replace(/(https?:\/\/)[^@\s/]+@/i, "$1<redacted>@"));
}

export function run(options, { spawn = spawnSync, stdio = "inherit" } = {}) {
  const args = buildInstallArguments(options);
  if (options.dryRun) {
    console.log(JSON.stringify({ command: "gh", args: redactArguments(args) }, null, 2));
    if (options.remote && !options.pin) {
      console.error("Remote install is unpinned; gh will resolve its normal mutable version.");
    }
    return 0;
  }

  if (options.remote && !options.pin) {
    console.error("Remote install is unpinned; gh will resolve its normal mutable version.");
  }
  const result = spawn("gh", args, { stdio });
  if (result.error) {
    console.error(`Unable to start gh: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

export function main(args = process.argv.slice(2)) {
  try {
    const options = parseArguments(args);
    if (options.help) {
      process.stdout.write(usage);
      return 0;
    }
    return run(options);
  } catch (error) {
    console.error(error.message);
    console.error("Use --help for usage.");
    return error.exitCode ?? 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = main();
