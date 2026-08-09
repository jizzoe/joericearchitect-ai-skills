#!/usr/bin/env node

import fs from "node:fs";

import { planPullRequestProjectStatus } from "./lib/pr-status-sync.mjs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function parseArgs(argv) {
  const args = { eventName: "pull_request" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.config = readJson(argv[++index]);
    else if (arg === "--event") {
      const payload = readJson(argv[++index]);
      args.action = payload.action;
      args.pullRequest = payload.pull_request;
      args.issue = payload.issue;
      args.repository = payload.repository;
    } else if (arg === "--event-name") args.eventName = argv[++index];
    else if (arg === "--observed-project") args.observedProject = readJson(argv[++index]);
    else if (arg === "--current-status") args.currentStatus = argv[++index];
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = planPullRequestProjectStatus(args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

