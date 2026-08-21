#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { evaluateOperationGate, normalizeAgentPolicy, operationRegistry, routeOperationOutcome, validateOperationRegistry, validateReviewReuse } from "../../sdd/autonomous-sdd-operation-contract.mjs";

runAsMain({ helper: "autonomous-sdd-operation-contract", invocation: "payload", operations: {
  registry: () => ({ valid: validateOperationRegistry().valid, operations: Object.values(operationRegistry) }),
  "normalize-agent-policy": (payload) => normalizeAgentPolicy(payload?.agentPolicy, payload?.agentSignals),
  "evaluate-operation-gate": (payload) => evaluateOperationGate(payload ?? {}),
  "route-operation-outcome": (payload) => routeOperationOutcome(payload ?? {}),
  "validate-review-reuse": (payload) => validateReviewReuse(payload ?? {})
} });
