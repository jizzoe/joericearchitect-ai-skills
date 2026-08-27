#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { resolveReviewAdapterDispatch } from "../../sdd/review-adapter-dispatch.mjs";

runAsMain({
  helper: "review-adapter-dispatch",
  invocation: "payload",
  operations: {
    resolve: (payload) => resolveReviewAdapterDispatch(payload?.configurationSnapshot)
  }
});
