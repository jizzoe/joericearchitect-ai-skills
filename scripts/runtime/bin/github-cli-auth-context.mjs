#!/usr/bin/env node
import { probeGithubCliAuthContext } from "../../github/lib/auth-context.mjs";
import {
  authorizeGithubAuthContextEvidence,
  createGithubAuthContextBinding,
  evaluateGithubAuthContextContrast,
  validateGithubAuthContextEvidence
} from "../../sdd/github-cli-auth-context.mjs";
import { runAsMain } from "../payload-wrapper.mjs";

runAsMain({
  helper: "github-cli-auth-context",
  invocation: "payload",
  operations: {
    "create-binding": (payload) => createGithubAuthContextBinding(payload),
    "probe": (payload) => probeGithubCliAuthContext(payload),
    "evaluate-contrast": (payload) => evaluateGithubAuthContextContrast(payload),
    "validate-evidence": (payload) => ({ valid: validateGithubAuthContextEvidence(payload?.evidence) }),
    "authorize-evidence": (payload) => authorizeGithubAuthContextEvidence(payload)
  }
});
