#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import { resolveRuntimeConfiguration } from "../../sdd/runtime-configuration.mjs";

runAsMain({ helper: "runtime-configuration", invocation: "payload", operations: { resolve: (payload) => resolveRuntimeConfiguration(payload) } });
