import path from "node:path";

const classifications = new Set(["required", "recommended", "repository-selected", "not-applicable"]);
const secret = /(password|secret|token|api[_-]?key|authorization|bearer|oauth|otp|mfa|private[_-]?key)/i;
const id = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const workspace = (value) => typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..");

export function validateStandardsPack(value) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, issues: [{ code: "invalid-record" }] };
  const allowed = new Set(["schemaVersion", "target", "rules", "overrides", "expectedEvidence", "gaps"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push({ code: "unknown-field", subject: key });
  if (value.schemaVersion !== 1) issues.push({ code: "unsupported-schema-version", subject: "schemaVersion" });
  if (!value.target || !workspace(value.target.path)) issues.push({ code: "unsafe-target-path", subject: "target.path" });
  if (!Array.isArray(value.rules) || !value.rules.length) issues.push({ code: "missing-rules", subject: "rules" });
  for (const rule of value.rules ?? []) {
    if (!id.test(rule?.id ?? "")) issues.push({ code: "invalid-rule-id", subject: "rules" });
    if (!classifications.has(rule?.classification)) issues.push({ code: "invalid-classification", subject: rule?.id ?? "rules" });
    if (typeof rule?.source !== "string" || !rule.source || secret.test(rule.source)) issues.push({ code: "unsafe-source", subject: rule?.id ?? "rules" });
    if (!/^https?:\/\//.test(rule?.source ?? "") && !workspace(rule?.source)) issues.push({ code: "unsafe-source", subject: rule?.id ?? "rules" });
    if (rule?.classification === "not-applicable" && !rule.reason) issues.push({ code: "missing-not-applicable-reason", subject: rule?.id ?? "rules" });
  }
  if (!Array.isArray(value.overrides)) issues.push({ code: "invalid-overrides", subject: "overrides" });
  for (const override of value.overrides ?? []) {
    if (!id.test(override?.ruleId ?? "") || !override?.reason || !workspace(override?.scope ?? "")) issues.push({ code: "invalid-override", subject: "overrides" });
    if (override?.status !== "resolved") issues.push({ code: "unresolved-conflict", subject: override?.ruleId ?? "overrides" });
  }
  for (const gap of value.gaps ?? []) if (!gap?.id || !gap?.reason) issues.push({ code: "invalid-gap", subject: "gaps" });
  return { valid: issues.length === 0, issues };
}
