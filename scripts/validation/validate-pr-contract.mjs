#!/usr/bin/env node

import fs from "node:fs";

export function validatePrContract({ body, changedPaths = [] }) {
  const issues = [];
  const issueMatch = body.match(/\b(?:Closes|Fixes|Resolves|Related to)\s+#(\d+)\b/i);
  const changeMatch = body.match(/OpenSpec change:\s*`?([a-z0-9-]+)`?/i);
  if (!issueMatch) {
    issues.push({
      ruleId: "pr.issue_link",
      message: "PR body must include an issue reference such as Closes #123 or Related to #123.",
      correction: "Add a GitHub issue reference to the PR body."
    });
  }
  if (!changeMatch) {
    issues.push({
      ruleId: "pr.openspec_change",
      message: "PR body must include OpenSpec change: `change-name`.",
      correction: "Add the OpenSpec change name to the PR body."
    });
  }
  return {
    valid: issues.length === 0,
    issues,
    issue: issueMatch ? Number(issueMatch[1]) : null,
    change: changeMatch ? changeMatch[1] : null,
    requiresOpenSpecValidation: changedPaths.some((file) => /^(openspec\/|skills\/|\.agents\/|\.claude\/|workflows\/|scripts\/|evals\/|\.github\/workflows\/)/.test(file))
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
    const result = validatePrContract(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (result.valid) console.log("PR contract validation passed");
    else for (const issue of result.issues) console.error(`${issue.ruleId}: ${issue.message} ${issue.correction}`);
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
