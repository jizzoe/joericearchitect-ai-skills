import path from "node:path";

const classifications = new Set(["required", "recommended", "repository-selected", "not-applicable"]);
const secret = /(password|secret|token|api[_-]?key|authorization|bearer|oauth|otp|mfa|private[_-]?key)/i;
const id = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const workspace = (value) => typeof value === "string" && value.trim().length > 0 && !/[\x00-\x1f\x7f]/.test(value) && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) && !value.split(/[\\/]/).includes("..");
const text = (value) => typeof value === "string" && value.trim().length > 0 && !secret.test(value);
const only = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.has(key));
const items = (value) => Array.isArray(value) ? value : [];
const publicIpv4 = (octets) => {
  if (octets.some((part) => part > 255) || octets[0] === 0 || octets[0] === 10 || octets[0] === 127 || octets[0] >= 224) return false;
  if ((octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 192 && octets[1] === 0 && octets[2] === 0) ||
      (octets[0] === 192 && octets[1] === 0 && octets[2] === 2) ||
      (octets[0] === 198 && (octets[1] === 18 || octets[1] === 19)) ||
      (octets[0] === 198 && octets[1] === 51 && octets[2] === 100) ||
      (octets[0] === 203 && octets[1] === 0 && octets[2] === 113)) return false;
  return true;
};
const ipv6Segments = (value) => {
  if (!/^[0-9a-f:.]+$/i.test(value) || value.split("::").length > 2) return null;
  const expanded = value.includes(".") ? value.replace(/((?:\d{1,3}\.){3}\d{1,3})$/, (matched) => {
    const octets = matched.split(".").map(Number);
    if (octets.length !== 4 || octets.some((part) => part > 255)) return "invalid";
    return `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }) : value;
  if (expanded.includes("invalid")) return null;
  const [left, right = ""] = expanded.split("::");
  const head = left ? left.split(":") : [];
  const tail = right ? right.split(":") : [];
  const groups = expanded.includes("::") ? [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail] : head;
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
};
const publicIpv6 = (segments) => {
  // A public source must be global-unicast, not merely syntactically valid.
  if ((segments[0] & 0xe000) !== 0x2000) return false;
  // IETF protocol, documentation, and other special-purpose allocations.
  if ((segments[0] === 0x2001 && (segments[1] < 0x0200 || segments[1] === 0x0db8)) ||
      (segments[0] === 0x3fff && (segments[1] & 0xfff0) === 0) || segments[0] === 0x5f00) return false;
  return true;
};
const publicDomain = (value) => {
  const labels = value.split(".");
  if (labels.length < 2 || ["localhost", "local", "internal", "invalid", "test", "example"].includes(labels.at(-1))) return false;
  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
};
const publicHost = (host) => {
  const value = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "localhost" || value.endsWith(".localhost")) return false;
  const ipv4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) return publicIpv4(ipv4.slice(1).map(Number));
  const ipv6 = ipv6Segments(value);
  return ipv6 ? publicIpv6(ipv6) : publicDomain(value);
};
const source = (value) => {
  if (typeof value !== "string" || !value || secret.test(value)) return false;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return workspace(value);
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && publicHost(url.hostname);
  } catch { return false; }
};

export function validateStandardsPack(value) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, issues: [{ code: "invalid-record" }] };
  const allowed = new Set(["schemaVersion", "target", "rules", "overrides", "expectedEvidence", "gaps"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push({ code: "unknown-field", subject: key });
  if (value.schemaVersion !== 1) issues.push({ code: "unsupported-schema-version", subject: "schemaVersion" });
  if (!only(value.target, new Set(["path"]))) issues.push({ code: "invalid-target", subject: "target" });
  if (!workspace(value.target?.path)) issues.push({ code: "unsafe-target-path", subject: "target.path" });
  if (!Array.isArray(value.rules) || !value.rules.length) issues.push({ code: "missing-rules", subject: "rules" });
  const ruleIds = new Set();
  for (const rule of items(value.rules)) {
    if (!only(rule, new Set(["id", "classification", "source", "scope", "reason"]))) issues.push({ code: "invalid-rule", subject: "rules" });
    if (!id.test(rule?.id ?? "")) issues.push({ code: "invalid-rule-id", subject: "rules" });
    else if (ruleIds.has(rule.id)) issues.push({ code: "duplicate-rule-id", subject: rule.id });
    else ruleIds.add(rule.id);
    if (!classifications.has(rule?.classification)) issues.push({ code: "invalid-classification", subject: rule?.id ?? "rules" });
    if (!source(rule?.source)) issues.push({ code: "unsafe-source", subject: rule?.id ?? "rules" });
    if (!workspace(rule?.scope)) issues.push({ code: "unsafe-rule-scope", subject: rule?.id ?? "rules" });
    if (rule?.classification === "not-applicable" && !text(rule.reason)) issues.push({ code: "missing-not-applicable-reason", subject: rule?.id ?? "rules" });
    if (rule?.reason !== undefined && !text(rule.reason)) issues.push({ code: "unsafe-rule-reason", subject: rule?.id ?? "rules" });
  }
  if (!Array.isArray(value.overrides)) issues.push({ code: "invalid-overrides", subject: "overrides" });
  for (const override of items(value.overrides)) {
    if (!only(override, new Set(["ruleId", "scope", "reason", "status"])) || !id.test(override?.ruleId ?? "") || !text(override?.reason) || !workspace(override?.scope ?? "")) issues.push({ code: "invalid-override", subject: "overrides" });
    if (!ruleIds.has(override?.ruleId)) issues.push({ code: "unknown-override-rule", subject: override?.ruleId ?? "overrides" });
    if (override?.status !== "resolved") issues.push({ code: "unresolved-conflict", subject: override?.ruleId ?? "overrides" });
  }
  if (!Array.isArray(value.expectedEvidence) || !value.expectedEvidence.length) issues.push({ code: "missing-expected-evidence", subject: "expectedEvidence" });
  for (const evidence of items(value.expectedEvidence)) if (!id.test(evidence ?? "")) issues.push({ code: "invalid-expected-evidence", subject: "expectedEvidence" });
  if (!Array.isArray(value.gaps)) issues.push({ code: "invalid-gaps", subject: "gaps" });
  for (const gap of items(value.gaps)) if (!only(gap, new Set(["id", "reason"])) || !id.test(gap?.id ?? "") || !text(gap?.reason)) issues.push({ code: "invalid-gap", subject: "gaps" });
  return { valid: issues.length === 0, issues };
}
