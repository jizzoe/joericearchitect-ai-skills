#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import {
  buildReviewPackage, packageDigest, validateReviewPackage, validateReviewResult
} from "../../sdd/independent-review-contract.mjs";
import { validateCloseoutReviewReuse } from "../../sdd/independent-review.mjs";

runAsMain({
  helper: "independent-review-contract",
  invocation: "payload",
  operations: {
    "build-review-package": (payload) => buildReviewPackage(payload ?? {}),
    "package-digest": (payload) => packageDigest(payload?.package ?? payload),
    "validate-review-package": (payload) => validateReviewPackage(payload?.package ?? payload),
    "validate-review-result": (payload) => validateReviewResult(payload?.result, {
      expectedPackage: payload?.expectedPackage,
      configuredReviewer: payload?.configuredReviewer,
      implementerSession: payload?.implementerSession,
      seenRecordIds: new Set(payload?.seenRecordIds ?? [])
    }),
    "validate-closeout-review-reuse": (payload) => validateCloseoutReviewReuse(payload ?? {})
  }
});
