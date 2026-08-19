#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const canonicalSkillsRoot = "skills/base";
const platforms = [".claude", ".agents"];
const maximumAdapterBytes = 1024;

function canonicalSkillNames(root) {
  const directory = path.join(root, canonicalSkillsRoot);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function requiredAdapters(root) {
  return canonicalSkillNames(root).flatMap((name) => {
    const canonical = `${canonicalSkillsRoot}/${name}/SKILL.md`;
    return platforms.map((platform) => ({
      adapter: `${platform}/skills/${name}/SKILL.md`,
      canonical
    }));
  });
}

export function checkAdapterDrift(root = process.cwd()) {
  const issues = [];

  for (const item of requiredAdapters(root)) {
    const adapterPath = path.join(root, item.adapter);
    if (!fs.existsSync(adapterPath)) {
      issues.push({ code: "missing-adapter", adapter: item.adapter });
      continue;
    }
    if (!fs.existsSync(path.join(root, item.canonical))) {
      issues.push({ code: "missing-canonical", canonical: item.canonical });
      continue;
    }
    const text = fs.readFileSync(adapterPath, "utf8");
    if (!text.includes(item.canonical)) {
      issues.push({ code: "missing-canonical-reference", adapter: item.adapter });
    }
    if (!/must\s+not duplicate/.test(text)) {
      issues.push({ code: "missing-no-policy-duplication-statement", adapter: item.adapter });
    }
    if (Buffer.byteLength(text, "utf8") > maximumAdapterBytes) {
      issues.push({ code: "adapter-exceeds-thinness-limit", adapter: item.adapter, maximumAdapterBytes });
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
