#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED_ADAPTERS = [
  {
    adapter: ".claude/skills/autonomous-goal-runner/SKILL.md",
    canonical: "skills/base/autonomous-goal-runner/SKILL.md",
    phrases: ["canonical autonomous goal runner", "must not duplicate"]
  },
  {
    adapter: ".agents/skills/autonomous-goal-runner/SKILL.md",
    canonical: "skills/base/autonomous-goal-runner/SKILL.md",
    phrases: ["canonical autonomous goal runner", "must not duplicate"]
  },
  {
    adapter: ".claude/skills/autonomous-sdd-lifecycle/SKILL.md",
    canonical: "workflows/autonomous-sdd-lifecycle/workflow.md",
    phrases: ["canonical autonomous SDD lifecycle", "must not duplicate"]
  },
  {
    adapter: ".agents/skills/autonomous-sdd-lifecycle/SKILL.md",
    canonical: "workflows/autonomous-sdd-lifecycle/workflow.md",
    phrases: ["canonical autonomous SDD lifecycle", "must not duplicate"]
  },
  {
    adapter: ".claude/skills/independent-review/SKILL.md",
    canonical: "skills/base/independent-review/SKILL.md",
    phrases: ["canonical instructions", "must not duplicate"]
  },
  {
    adapter: ".agents/skills/independent-review/SKILL.md",
    canonical: "skills/base/independent-review/SKILL.md",
    phrases: ["canonical instructions", "must not duplicate"]
  }
];

function exists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

export function checkAdapterDrift(root = process.cwd()) {
  const issues = [];

  for (const item of REQUIRED_ADAPTERS) {
    const adapterPath = path.join(root, item.adapter);
    if (!exists(root, item.adapter)) {
      issues.push({ code: "missing-adapter", adapter: item.adapter });
      continue;
    }
    if (!exists(root, item.canonical)) {
      issues.push({ code: "missing-canonical", canonical: item.canonical });
      continue;
    }
    const text = fs.readFileSync(adapterPath, "utf8");
    if (!text.includes(item.canonical)) {
      issues.push({ code: "missing-canonical-reference", adapter: item.adapter });
    }
    for (const phrase of item.phrases) {
      if (!text.includes(phrase)) {
        issues.push({ code: "missing-adapter-phrase", adapter: item.adapter, phrase });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? process.cwd();
  const result = checkAdapterDrift(root);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
