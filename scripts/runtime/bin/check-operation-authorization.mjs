#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import {
  checkDeliveryPreapproval, checkOperationAuthorization, profileOperations
} from "../../sdd/check-operation-authorization.mjs";

// This helper is the authorization authority the launcher deliberately does not
// duplicate. Exposing it as a declared entrypoint keeps that authority in one
// place while making it reachable from an installed skill.
runAsMain({
  helper: "check-operation-authorization",
  invocation: "payload",
  operations: {
    "check-operation-authorization": (payload) => checkOperationAuthorization(payload ?? {}),
    "check-delivery-preapproval": (payload) => checkDeliveryPreapproval(payload ?? {}),
    "profile-operations": () => Object.fromEntries(
      Object.entries(profileOperations).map(([profile, operations]) => [profile, [...operations]])
    )
  }
});
