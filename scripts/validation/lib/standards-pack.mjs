import path from "node:path";

const classifications = new Set(["required", "recommended", "repository-selected", "not-applicable"]);
const secret = /(password|secret|token|api[_-]?key|authorization|bearer|oauth|otp|mfa|private[_-]?key)/i;
const id = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const workspace = (value) => typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..");
const text = (value) => typeof value === "string" && value.trim().length > 0 && !secret.test(value);
const only = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.has(key));

export function validateStandardsPack(value) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, issues: [{ code: "invalid-record" }] };
  const allowed = new Set(["schemaVersion", "target", "rules", "overrides", "expectedEvidence", "gaps"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push({ code: "unknown-field", subject: key });
  if (value.schemaVersion !== 1) issues.push({ code: "unsupported-schema-version", subject: "schemaVersion" });
  if (!only(value.target, new Set(["path"]))) issues.push({ code: "invalid-target", subject: "target" });
  if (!workspace(value.target?.path)) issues.push({ code: "unsafe-target-path", subject: "target.path" });
  if (!Array.isArray(value.rules) || !value.rules.length) issues.push({ code: "missing-rules", subject: "rules" });
  for (const rule of value.rules ?? []) {
    if (!only(rule, new Set(["id", "classification", "source", "scope", "reason"]))) issues.push({ code: "invalid-rule", subject: "rules" });
    if (!id.test(rule?.id ?? "")) issues.push({ code: "invalid-rule-id", subject: "rules" });
    if (!classifications.has(rule?.classification)) issues.push({ code: "invalid-classification", subject: rule?.id ?? "rules" });
    if (typeof rule?.source !== "string" || !rule.source || secret.test(rule.source)) issues.push({ code: "unsafe-source", subject: rule?.id ?? "rules" });
    if (!/^https?:\/\//.test(rule?.source ?? "") && !workspace(rule?.source)) issues.push({ code: "unsafe-source", subject: rule?.id ?? "rules" });
    if (!workspace(rule?.scope)) issues.push({ code: "unsafe-rule-scope", subject: rule?.id ?? "rules" });
    if (rule?.classification === "not-applicable" && !text(rule.reason)) issues.push({ code: "missing-not-applicable-reason", subject: rule?.id ?? "rules" });
    if (rule?.reason !== undefined && !text(rule.reason)) issues.push({ code: "unsafe-rule-reason", subject: rule?.id ?? "rules" });
  }
  if (!Array.isArray(value.overrides)) issues.push({ code: "invalid-overrides", subject: "overrides" });
  for (const override of value.overrides ?? []) {
    if (!only(override, new Set(["ruleId", "scope", "reason", "status"])) || !id.test(override?.ruleId ?? "") || !text(override?.reason) || !workspace(override?.scope ?? "")) issues.push({ code: "invalid-override", subject: "overrides" });
    if (override?.status !== "resolved") issues.push({ code: "unresolved-conflict", subject: override?.ruleId ?? "overrides" });
  }
  if (!Array.isArray(value.expectedEvidence) || !value.expectedEvidence.length) issues.push({ code: "missing-expected-evidence", subject: "expectedEvidence" });
  for (const evidence of value.expectedEvidence ?? []) if (!id.test(evidence ?? "")) issues.push({ code: "invalid-expected-evidence", subject: "expectedEvidence" });
  if (!Array.isArray(value.gaps)) issues.push({ code: "invalid-gaps", subject: "gaps" });
  for (const gap of value.gaps ?? []) if (!only(gap, new Set(["id", "reason"])) || !id.test(gap?.id ?? "") || !text(gap?.reason)) issues.push({ code: "invalid-gap", subject: "gaps" });
  return { valid: issues.length === 0, issues };
}
