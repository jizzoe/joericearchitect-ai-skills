import fs from "node:fs";
import path from "node:path";

import { ghCommand } from "./gh.mjs";
import { stringifyTracking } from "../../validation/lib/tracking.mjs";

export function renderManagedIssueBlock({ markers, changeName, changeDir }) {
  const start = markers.start;
  const end = markers.end;
  return [
    start,
    `OpenSpec change: \`${changeName}\``,
    "",
    `- Proposal: \`${changeDir}/proposal.md\``,
    `- Specifications: \`${changeDir}/specs/\``,
    `- Design: \`${changeDir}/design.md\``,
    `- Tasks: \`${changeDir}/tasks.md\``,
    `- Tracking: \`${changeDir}/tracking.yaml\``,
    end
  ].join("\n");
}

export function replaceManagedBlock(body, block, markers) {
  const startIndex = body.indexOf(markers.start);
  const endIndex = body.indexOf(markers.end);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const afterEnd = endIndex + markers.end.length;
    return `${body.slice(0, startIndex)}${block}${body.slice(afterEnd)}`;
  }
  const separator = body.trim() ? "\n\n" : "";
  return `${body}${separator}${block}`;
}

export function findIssueByExactTitle({ repo, title, existingIssues, dryRun = false }) {
  if (!title) return { ok: false, error: "title is required" };
  if (existingIssues) {
    const issue = existingIssues.find((candidate) => candidate.title === title);
    return { ok: true, dryRun, issue: issue ?? null };
  }
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      issue: null,
      command: ["gh", "issue", "list", "--repo", repo, "--state", "all", "--search", `in:title ${title}`, "--json", "number,title,url,state"]
    };
  }
  const result = ghCommand(["issue", "list", "--repo", repo, "--state", "all", "--search", `in:title ${title}`, "--json", "number,title,url,state"], { json: true });
  if (!result.ok) return result;
  return { ok: true, issue: (result.json ?? []).find((candidate) => candidate.title === title) ?? null };
}

export function createOrFindIssue({ repo, title, body, labels = [], existingIssues, dryRun = false }) {
  const found = findIssueByExactTitle({ repo, title, existingIssues, dryRun: Boolean(existingIssues) && dryRun });
  if (!found.ok) return found;
  if (found.issue) {
    return { ok: true, action: "found", issue: found.issue };
  }
  const args = ["issue", "create", "--repo", repo, "--title", title, "--body", body];
  for (const label of labels) args.push("--label", label);
  if (dryRun) {
    return { ok: true, dryRun: true, action: "create", command: ["gh", ...args] };
  }
  const result = ghCommand(args);
  return result.ok ? { ok: true, action: "created", url: result.stdout.trim() } : result;
}

export function buildIssueToOpenSpecIntake({ config, issue, changeName, title, outputRoot = "openspec/changes" }) {
  const missing = [];
  if (!issue?.number) missing.push("issue.number");
  if (!issue?.url) missing.push("issue.url");
  if (!title) missing.push("title");
  if (!changeName) missing.push("changeName");
  if (missing.length) return { ok: false, error: "missing required issue data", missing };

  const changeDir = path.posix.join(outputRoot, changeName);
  const block = renderManagedIssueBlock({
    markers: config.managedIssueBlockMarkers,
    changeName,
    changeDir
  });
  const tracking = {
    schema_version: 1,
    openspec: { change: changeName },
    github: {
      repository: `${config.repository.owner}/${config.repository.name}`,
      issue: issue.number,
      issue_url: issue.url,
      project_owner: config.project.owner,
      project_number: config.project.number
    },
    implementation_repositories: [
      {
        repository: `${config.repository.owner}/${config.repository.name}`,
        default_branch: config.repository.defaultBranch,
        paths: [`${changeDir}/`]
      }
    ]
  };

  return {
    ok: true,
    changeDir,
    files: {
      [path.posix.join(changeDir, "proposal.md")]: `## Why\n\n${title}\n\n## What Changes\n\n- TODO\n\n## Non-Goals\n\n- TODO\n\n## Impact\n\n- Primary issue: ${issue.url}\n- Compatibility: TODO\n- Security: TODO\n\n## Reuse Plan\n\n- TODO\n`,
      [path.posix.join(changeDir, "tracking.yaml")]: `${stringifyTracking(tracking)}\n`
    },
    managedBlock: block,
    tracking
  };
}

export function writeIntakeFiles(files, root) {
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
