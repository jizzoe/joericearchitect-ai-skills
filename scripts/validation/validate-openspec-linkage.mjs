#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { readTrackingFile } from "./lib/tracking.mjs";
import { validatePrContract } from "./validate-pr-contract.mjs";

export function validateOpenSpecLinkage({ body, changedPaths = [], repoRoot = process.cwd() }) {
  const pr = validatePrContract({ body, changedPaths });
  const issues = [...pr.issues];
  if (!pr.change) {
    return { valid: false, issues, pr };
  }
  const active = path.join(repoRoot, "openspec/changes", pr.change);
  const archivedParent = path.join(repoRoot, "openspec/changes/archive");
  const archived = fs.existsSync(archivedParent)
    ? fs.readdirSync(archivedParent).find((name) => name.endsWith(`-${pr.change}`))
    : null;
  const changeDir = fs.existsSync(active) ? active : archived ? path.join(archivedParent, archived) : null;
  if (!changeDir) {
    issues.push({
      ruleId: "openspec.change_path",
      message: `OpenSpec change path not found for ${pr.change}.`,
      correction: "Create the OpenSpec change or correct the PR body change name."
    });
    return { valid: false, issues, pr };
  }
  const trackingPath = path.join(changeDir, "tracking.yaml");
  if (!fs.existsSync(trackingPath)) {
    issues.push({
      ruleId: "openspec.tracking_exists",
      message: `tracking.yaml not found at ${trackingPath}.`,
      correction: "Add tracking metadata for the OpenSpec change."
    });
    return { valid: false, issues, pr, changeDir };
  }
  const tracking = readTrackingFile(trackingPath, { expectedChange: pr.change });
  for (const issue of tracking.validation.issues) {
    issues.push({
      ruleId: "openspec.tracking_valid",
      message: `${issue.path}: ${issue.message}`,
      correction: "Fix tracking.yaml so it validates against tracking v1."
    });
  }
  if (tracking.normalized && pr.issue !== tracking.normalized.github.issue) {
    issues.push({
      ruleId: "openspec.issue_match",
      message: `PR issue #${pr.issue} does not match tracking issue #${tracking.normalized.github.issue}.`,
      correction: "Update the PR issue reference or tracking metadata so they match."
    });
  }
  return {
    valid: issues.length === 0,
    issues,
    pr,
    changeDir,
    requiresOpenSpecValidation: pr.requiresOpenSpecValidation
  };
}

function parseArgs(argv) {
  const args = { json: false, changedPaths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") args.json = true;
    else if (arg === "--body-file") args.body = fs.readFileSync(argv[++index], "utf8");
    else if (arg === "--changed-paths-file") args.changedPaths = fs.readFileSync(argv[++index], "utf8").split(/\r?\n/).filter(Boolean);
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.body) throw new Error("--body-file is required");
    const result = validateOpenSpecLinkage(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (result.valid) console.log("OpenSpec linkage validation passed");
    else for (const issue of result.issues) console.error(`${issue.ruleId}: ${issue.message} ${issue.correction}`);
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
