import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { validateReviewAdapterCapabilities } from "./review-adapter-contract.mjs";

export function probeIndependentReviewAdapter(adapter) {
  const result = validateReviewAdapterCapabilities(adapter);
  return result.valid ? { available: true, code: result.code } : { available: false, code: result.code };
}

export async function executeIndependentReview({ package: reviewPackage, adapter, configuredReviewer, implementerSession, invoke }) {
  const packageValidation = validateReviewPackage(reviewPackage);
  if (!packageValidation.valid) return { status: "unavailable", code: packageValidation.issues[0].code };
  const probe = probeIndependentReviewAdapter(adapter);
  if (!probe.available) return { status: "unavailable", code: probe.code };
  if (typeof invoke !== "function") return { status: "unavailable", code: "independent-reviewer-invocation-unavailable" };
  const result = await invoke(Object.freeze(structuredClone(reviewPackage)));
  const resultValidation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer, implementerSession });
  return resultValidation.valid ? { status: result.status, result } : { status: "unavailable", code: resultValidation.issues[0].code };
}
