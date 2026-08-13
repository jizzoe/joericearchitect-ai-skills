export const requiredReviewDenials = Object.freeze([
  "workspaceWrite",
  "gitWrite",
  "githubMutation",
  "credentialAccess",
  "authenticatedNetwork",
  "externalSend",
  "deployment",
  "release",
  "delegatedMutation"
]);

const denied = (value) => requiredReviewDenials.every((name) => value?.[name] === true);

/**
 * Normalize an adapter capability record. The caller must obtain this record
 * from the adapter's installed runtime check, never from reviewer output.
 */
export function validateReviewAdapterCapabilities(value) {
  if (!value || value.freshContext !== true || value.nonInteractive !== true ||
      value.readOnlyView !== true || value.runtimeEnforced !== true || !denied(value.denied)) {
    return { valid: false, code: "independent-reviewer-not-isolated-read-only" };
  }
  if (typeof value.adapter !== "string" || !value.adapter ||
      typeof value.attestationRef !== "string" || !value.attestationRef ||
      typeof value.probeReference !== "string" || !value.probeReference) {
    return { valid: false, code: "independent-reviewer-capability-evidence-missing" };
  }
  return { valid: true, code: "independent-reviewer-ready" };
}

export function normalizedReviewAdapterCapabilities(value) {
  const validation = validateReviewAdapterCapabilities(value);
  if (!validation.valid) return validation;
  return {
    valid: true,
    code: validation.code,
    capabilities: {
      freshContext: true,
      nonInteractive: true,
      readOnlyView: true,
      runtimeEnforced: true,
      denied: Object.fromEntries(requiredReviewDenials.map((name) => [name, true]))
    }
  };
}
