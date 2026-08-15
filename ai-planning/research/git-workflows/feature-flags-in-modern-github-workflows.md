# Feature Flags in a Modern GitHub Workflow

Date: 2026-08-09

## Purpose

Explain how feature flags support the `main`-centric workflow recommended in [GitHub Workflow Options for Libraries and Deployed Applications](github-workflow-options.md), including:

- What feature flags do and do not do.
- How they interact with GitHub Issues, pull requests, Actions, Environments, and deployments.
- The technologies and evaluation architectures involved.
- Managed, self-hosted, cloud-native, GitOps, and simple configuration options.
- Security and reliability constraints for a financial mobile application.
- A practical adoption path for a solo maintainer who may accept outside contributions.

## Executive Summary

A feature flag is a named runtime decision that selects application behavior without requiring a new code deployment. The code for both paths may already be deployed, while configuration determines which path a particular environment, tenant, user, device, or request receives.

```text
deploy code != release feature
```

That separation is what makes short-lived branches and frequent integration into `main` practical for work that cannot be exposed to every user immediately.

GitHub does not act as the runtime feature-flag service. Its role is the delivery and governance workflow:

```text
GitHub issue
  -> branch and pull request
  -> tests for flag off and on
  -> merge to main
  -> GitHub Actions deployment
  -> runtime flag system controls exposure
  -> telemetry informs rollout or rollback
  -> cleanup issue removes the temporary flag
```

For the future bookkeeping application, the recommended direction is:

1. Put an application-owned feature-decision interface around flag checks.
2. Use [OpenFeature](https://openfeature.dev/) where its SDK and provider support are mature for the selected language.
3. Select one managed or cloud-native control plane after the hosting and mobile stacks are known.
4. Evaluate security-sensitive and financial decisions on the server.
5. Treat mobile flags as untrusted presentation or rollout inputs, never authorization.
6. Give every temporary flag an owner, issue, expected outcome, and removal date.

Do not build a database-backed flag administration system as an early application feature. The hidden cost is not the `if` statement; it is reliable distribution, caching, targeting, audit history, access control, telemetry, approvals, and cleanup.

## Core Mental Model

Without a flag:

```text
code merged -> code deployed -> feature visible
```

With a release flag:

```text
code merged -> code deployed with flag off
                         |
                         +-> internal users
                         +-> 1% cohort
                         +-> 10% cohort
                         +-> 50% cohort
                         +-> everyone
                         +-> remove flag and old path
```

Feature flags decouple deployment from release, but they do not make unsafe code safe. Code merged to `main` must still:

- Compile and pass required tests.
- Preserve backward-compatible data and API behavior.
- Leave the flag-off path functional.
- Fail predictably if the flag service is unavailable.
- Avoid incomplete side effects before the flag decision is made.

Pete Hodgson's feature-toggle taxonomy identifies release, experiment, operations, and permissioning toggles and emphasizes that flags add complexity that must be actively constrained. See [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html).

## Flag Types

The flag type determines its lifetime, governance, and implementation.

| Type | Purpose | Typical lifetime | Example |
|---|---|---:|---|
| Release | Hide incomplete or not-yet-launched work | Days or weeks | `transaction-categories-v2` |
| Progressive rollout | Limit initial exposure and expand gradually | Hours to weeks | Enable for 1%, then 10%, then 100% |
| Experiment | Compare variants using defined metrics | Until statistically useful result | Two onboarding flows |
| Operational | Disable or degrade a risky/nonessential function | Temporary; some kill switches remain | Disable receipt OCR during an outage |
| Entitlement | Select functionality by plan or contractual access | Long-lived | Premium reporting access |
| Migration | Control stages of a data or service migration | Until migration and cleanup complete | Read old/write both/read new |

Important distinctions:

- A **release flag** is temporary code scaffolding and should be removed after rollout.
- An **operational kill switch** may deliberately remain, but it needs an owner and periodic test.
- An **entitlement** is a durable product rule. It belongs in an authorization or entitlement design, even if a flag platform helps distribute the decision.
- A **migration flag** often needs more than boolean on/off behavior. Data compatibility, dual writes, backfill, rollback, and irreversible steps require a migration design.

## Feature Flags Versus Related Techniques

| Technique | Selects | Primary use |
|---|---|---|
| Feature flag | Application code path or value | Release control, targeting, experiments, kill switches |
| Git branch | Source-code history | Isolated development and review |
| GitHub Environment | Deployment target and protections | Development, staging, production governance |
| Canary deployment | Application instances or artifact version | Test a new deployment on part of the traffic |
| Blue/green deployment | Complete runtime stack | Switch traffic between old and new deployments |
| Configuration | Application value | Runtime tuning; may or may not perform targeting |
| Authorization | Permitted action | Security boundary |

A canary deployment routes users to a different artifact or set of instances. A percentage feature rollout usually runs one artifact and selects a code path inside it. They can be combined, but they solve different problems.

## Technology Layers

A production feature-management system normally has five layers.

### 1. Decision Point

Application code asks a business-oriented question:

```text
shouldUseNewCategorization(accountContext)
```

Prefer that over scattering vendor calls and flag-key strings throughout domain code:

```text
vendorClient.getBooleanValue("transaction-categories-v2", false, context)
```

The decision layer makes tests clearer and limits vendor coupling.

### 2. Evaluation API or SDK

The application evaluates typed flags such as boolean, string, number, or structured variants. [OpenFeature](https://openfeature.dev/docs/reference/concepts/provider/) defines a vendor-neutral evaluation API whose providers can wrap a vendor SDK, call a custom service, or read a local file.

The application should always supply a deliberate default value. OpenFeature uses the supplied default when no provider is configured or evaluation cannot produce a usable result.

### 3. Provider and Evaluation Engine

The provider applies rules using evaluation context such as:

- Environment and application version.
- Stable anonymous targeting key.
- Tenant or account identifier.
- Internal/beta cohort membership.
- Region or platform.
- Percentage bucket.

OpenFeature calls this the [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context/). Context may be sent to or persisted by a provider, so personal data must be minimized, hashed where appropriate, and reviewed against the provider's privacy behavior.

### 4. Control Plane and Distribution

An administration service stores flag definitions, environment-specific rules, variants, approvals, roles, and change history. SDKs receive those definitions through polling, streaming, a relay/edge proxy, files, Kubernetes resources, or remote API calls.

### 5. Telemetry and Lifecycle

Evaluation events, application metrics, errors, traces, and business outcomes show whether a rollout is healthy. The control plane or repository workflow should also identify stale flags and drive their removal.

## Evaluation Architectures

### Server-Side Local Evaluation

The server SDK periodically downloads flag rules, caches them, and evaluates requests in process.

**Advantages**

- No network request on each business request.
- Low latency and resilience during control-plane outages.
- User context can remain within the application.

**Costs**

- Configuration changes are eventually consistent.
- Every service needs SDK lifecycle, cache, and health handling.

Unleash documents this architecture for its backend SDKs: rules are cached in memory and evaluated locally, while configuration changes propagate asynchronously. See [Unleash architecture](https://docs.getunleash.io/get-started/unleash-overview).

**Recommended for:** backend transaction and accounting services.

### Remote or Relay Evaluation

The application or client sends context to a flag service, edge service, or application-owned proxy and receives evaluated values.

**Advantages**

- Rules and sensitive targeting logic stay off untrusted clients.
- Centralized evaluation semantics.
- Useful for browser and mobile clients.

**Costs**

- Requires caching, timeouts, rate controls, and offline behavior.
- Context crosses a process or trust boundary.
- A poorly designed synchronous request can add user-facing latency.

**Recommended for:** mobile/client flags when the provider's client architecture uses a secure frontend or relay API.

### Client-Side or Mobile Evaluation

A mobile or browser SDK downloads values or permitted rules and evaluates locally.

**Advantages**

- Fast UI decisions and offline use with cached/default values.
- Direct support for app version, platform, and device cohorts.

**Costs**

- Flag keys, values, client credentials, and possibly rules can be inspected.
- Clients may remain offline or on old application versions.
- A malicious user can alter local behavior.

Firebase Remote Config is an example designed for mobile and web clients. It supports defaults, cached remote values, targeting, percentage rollouts, and integration with Crashlytics and Analytics. Google explicitly warns not to store confidential data in Remote Config or use it for changes that should require user authorization. See [Firebase Remote Config](https://firebase.google.com/docs/remote-config).

**Recommended for:** presentation, navigation, staged UI exposure, and non-sensitive client behavior only.

### Static or Deployment-Time Configuration

The flag value comes from an environment variable, configuration file, Helm value, or deployment parameter.

**Advantages**

- Minimal technology and operational cost.
- Configuration can be versioned and reviewed.

**Costs**

- Usually requires restart or redeployment.
- No per-user targeting, consistent percentage rollout, or built-in lifecycle management.
- Environment variables on GitHub runners exist during workflows, not as a general runtime control plane for deployed applications.

**Recommended for:** a few deploy-wide operational switches during an early prototype, not a mature progressive-delivery system.

## Technology Options

### Option 1: Managed Feature-Management SaaS

Examples include LaunchDarkly, managed Unleash, managed Flagsmith, and ConfigCat.

Typical capabilities include:

- Multi-environment flag configuration.
- Server, browser, mobile, and edge SDKs.
- Targeting and percentage rollout.
- Roles, audit history, and sometimes change approval.
- Experiments and telemetry integrations at higher capability levels.

LaunchDarkly provides official OpenFeature providers for selected server SDKs and broader direct SDK coverage for mobile, client, server, and edge platforms. Provider availability is not identical across languages, so verify the actual application stack before standardizing. See [LaunchDarkly OpenFeature providers](https://launchdarkly.com/docs/sdk/openfeature) and [LaunchDarkly SDKs](https://launchdarkly.com/docs/sdk).

**Best when:** operational simplicity, SDK breadth, governance, and rapid rollout matter more than minimizing vendor cost.

**Tradeoffs:** subscription cost, provider-specific advanced features, data-governance review, and potential lock-in beyond the evaluation API.

### Option 2: Managed or Self-Hosted Open-Source Platform

Examples include Unleash and Flagsmith.

**Best when:** source availability, deployment control, private networking, or self-hosting is important.

**Tradeoffs:** self-hosting makes the feature control plane part of your production infrastructure. You own upgrades, backups, availability, security patches, monitoring, and disaster recovery. For a solo developer, this work can exceed the value saved in subscription fees.

Unleash supports cloud-hosted, self-hosted enterprise, Docker, and Helm deployment models and separates backend local evaluation from frontend/edge evaluation. Flagsmith documents OpenFeature providers for Go, Java, .NET, web and server JavaScript, and Python, while some mobile-language providers remain planned. See [Unleash architecture](https://docs.getunleash.io/get-started/unleash-overview) and [Flagsmith OpenFeature support](https://docs.flagsmith.com/integrating-with-flagsmith/openfeature).

### Option 3: Cloud-Native Configuration Service

Examples:

- [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html)
- [Azure App Configuration](https://learn.microsoft.com/en-us/azure/azure-app-configuration/overview)
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)

**Best when:** most workloads already run in that cloud and its identity, audit, monitoring, and deployment services are the natural operational boundary.

**Tradeoffs:** cloud coupling, differing server/mobile support, and possible fragmentation if one system is chosen for mobile and another for backend services.

AWS AppConfig supports flags, variants, gradual configuration deployment, validation, monitoring, and automatic rollback tied to CloudWatch alarms. Azure App Configuration centralizes configuration and flags and offers feature-management libraries for several common server stacks. Firebase Remote Config is particularly strong for mobile rollout and client analytics.

### Option 4: OpenFeature With `flagd`

[`flagd`](https://flagd.dev/) is an OpenFeature-oriented flag evaluation daemon. It can consume definitions from files, HTTP, Kubernetes custom resources, and compatible gRPC sources.

**Best when:** open standards, local development, GitOps-managed definitions, Kubernetes, or a small self-controlled data plane are primary goals.

**Tradeoffs:** it is a building block rather than a complete commercial feature-management operating model. The team must design access control, approvals, user interface needs, audit, telemetry, high availability, and flag cleanup around it.

### Option 5: Application Configuration or Database Table

This can start as a typed configuration object, environment variables, or a small database table.

**Best when:** there are only a few global switches, changes are rare, and restart/redeploy latency is acceptable.

**Tradeoffs:** requirements expand quickly toward caching, targeting, audit logs, approvals, SDKs, availability, and an administration UI. A database read on every request is not an acceptable evaluation architecture.

Use this only as a deliberately limited starting point with an application-owned decision interface. Do not let it become an accidental feature-management product.

## Option Matrix

| Option | Solo overhead | Runtime targeting | Governance | Mobile fit | Portability | Recommended use |
|---|---:|---:|---:|---:|---:|---|
| Environment/config values | Low | Low | Git review | Low | High | Prototype or deploy-wide switches |
| Managed SaaS | Low | High | High | Usually high | Medium; improve with OpenFeature/wrapper | Strong default for a small team |
| Managed open-source platform | Low to moderate | High | Medium to high | Product-dependent | Medium to high | Managed service with open-source option |
| Self-hosted platform | High | High | Product-dependent | Product-dependent | High operational control | Only with a concrete hosting requirement |
| Cloud-native service | Low to moderate | High | Cloud-native | Cloud-dependent | Low to medium | Application committed to one cloud |
| OpenFeature + `flagd` | Moderate to high | Medium to high | Must be assembled | Provider-dependent | High | GitOps, Kubernetes, or standards-first platform |
| Homegrown database/UI | Initially low, eventually high | Whatever is built | Whatever is built | Whatever is built | High source control, low ecosystem leverage | Not recommended |

## GitHub's Role

GitHub coordinates the lifecycle around a flag but normally does not evaluate the flag in production.

### Issues

The implementation issue should record:

- Flag key and type.
- Owner.
- Default and failure value.
- Target environments/cohorts.
- Success and rollback metrics.
- Expected removal condition and target date.
- Cleanup issue when removal is not part of the original change.

### Pull Requests

The implementation PR should:

- Link the issue with `Closes #<number>` when appropriate.
- Introduce the flag in its safe default state.
- Include both code paths only for as long as necessary.
- Test the flag-off and flag-on behavior.
- Describe data and API compatibility.
- State how to disable the feature safely.

For a temporary release flag, closing the implementation issue should not lose the cleanup obligation. Either keep a cleanup checklist item attached to the feature issue or open a specific flag-removal issue before general release.

### GitHub Actions and Environments

Actions can:

- Validate checked-in flag manifests or naming rules.
- Run tests with controlled providers for off/on variants.
- Create or update flags through a provider API or infrastructure-as-code tool.
- Deploy the application and record the deployment.
- Gate production flag changes behind a reviewed workflow.
- Search for stale flag references and fail a cleanup check.

GitHub Environments can protect deployment jobs with approvals, branch/tag restrictions, secrets, and variables. Those values configure workflows and deployment jobs; they do not replace a low-latency runtime flag service. See [GitHub deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

### Runtime Activation

Turning on a production flag is a production change even when no Git commit occurs. Preserve:

- Actor and timestamp.
- Previous and new rules.
- Issue and PR reference.
- Approval, if required.
- Rollout cohort and percentage.
- Observed metrics.
- Rollback action.

Use the provider's audit and approval capabilities or route changes through a controlled GitHub Actions workflow. Do not use an unreviewed general-purpose API token from a developer workstation for sensitive production flag changes.

## Recommended Lifecycle

```text
1. Design
   issue defines purpose, type, owner, default, metrics, and removal

2. Create safely
   flag exists in each environment with safe defaults before code depends on it

3. Implement
   short-lived branch and PR add both paths and tests

4. Deploy dark
   merge to main; deploy same artifact with flag off

5. Verify
   enable for developers/test tenant; verify telemetry and recovery

6. Roll out
   expand deterministic cohorts while monitoring defined metrics

7. Decide
   release fully, roll back, or end experiment

8. Remove
   delete losing path and flag checks, then archive/delete control-plane flag
```

Create the control-plane flag before deploying code that evaluates it, or ensure the SDK's missing-flag default is explicitly safe. Remove code references before deleting the flag from the control plane.

## Testing Strategy

Feature flags multiply possible system states. Avoid testing every combination indiscriminately; define coverage by risk.

At minimum:

- Unit-test the decision logic.
- Unit-test behavior with the flag off and on.
- Test the production default configuration.
- Test the planned rollout configuration.
- Include contract tests where different deployable units consume the same decision.
- Run end-to-end tests for the currently supported production combination.
- Exercise operational kill switches periodically.
- Verify the old path is removed after rollout.

For interacting flags, use pairwise or risk-based combinations and avoid flag dependencies when a clearer domain decision can replace them.

## Reliability Requirements

Every flag needs an explicit failure policy:

- Safe default value in code.
- Last-known-good cache where supported.
- Bounded initialization and refresh timeouts.
- No unbounded synchronous dependency on the control plane in request handling.
- Stable cohort assignment so users do not switch variants unpredictably.
- Observable evaluation errors without logging sensitive context.
- Runbook for control-plane outage and bad configuration.

For availability, stale but valid configuration is usually safer than failing every request because the flag control plane is unreachable. That is an architectural decision to document per critical flag, not a universal assumption.

## Security Rules for the Bookkeeping Application

Feature flags are not security boundaries.

- Enforce authorization, ownership, subscription entitlements, and financial rules on the backend.
- Assume mobile and browser users can inspect flag keys and returned values.
- Never place credentials, private business rules, or confidential data in client flag values.
- Do not send raw financial data, email addresses, or unnecessary personal data as evaluation context.
- Prefer stable opaque account/user identifiers or approved hashes for targeting.
- Use least-privilege server credentials and separate read/evaluation credentials from administrative credentials.
- Separate production flag-change permissions from development access.
- Audit production changes and require approval for high-impact flags.
- Design database and event-schema changes for old and new application versions simultaneously.
- Treat a flag that changes accounting calculations, posting rules, balances, or data ownership as a high-risk domain change requiring specification and migration evidence, not merely a rollout switch.

Mobile clients can be offline and remain on old versions for long periods. Server APIs must remain authoritative and compatible even after a client-side flag is changed.

## Recommendation for These Projects

### AI-Assets Repository

This repository has no long-running application runtime, so it does not currently need a feature-flag platform. Use versioned releases and documented compatibility for its assets. A feature flag becomes relevant only inside a consuming application or execution platform.

### Full-Stack Bookkeeping Application

Adopt in stages:

1. Define an application-owned `FeatureDecisions` boundary from the first flag.
2. Use an in-memory/test provider for deterministic automated tests.
3. Use OpenFeature on server runtimes where supported and mature.
4. Choose a managed provider aligned with the eventual cloud, backend language, web framework, and mobile framework.
5. Prefer managed operation while the project is maintained mostly by one person.
6. Keep backend decisions authoritative; use mobile flags only for safe client behavior.
7. Add percentage rollout, approvals, and experimentation only when there is enough production usage and telemetry to make them useful.

### Provider Shortlist Decision

Do not select a provider until these are known:

- Backend language and framework.
- Mobile framework and supported platforms.
- Hosting cloud and regions.
- Expected monthly active users and evaluation volume.
- Data residency and privacy requirements.
- Need for self-hosting.
- Required audit, approval, RBAC, and experimentation features.
- Acceptable control-plane outage behavior.
- Current pricing for the expected usage.

Then compare at least:

- One managed cross-platform service, such as LaunchDarkly.
- One managed/open-source option, such as Unleash or Flagsmith.
- The selected cloud's native offering.
- Firebase Remote Config if mobile rollout and Firebase telemetry are central.
- OpenFeature/`flagd` if GitOps or self-controlled infrastructure is an explicit requirement.

Run a small proof of concept using one backend flag and one mobile presentation flag. Test offline behavior, propagation delay, audit history, automated tests, and provider failure before adopting it broadly.

## Decision Checklist

- [ ] Flag purpose and type are explicit.
- [ ] GitHub issue, owner, and cleanup condition exist.
- [ ] Safe default and missing-provider behavior are defined.
- [ ] Flag-off and flag-on paths are tested.
- [ ] Targeting context contains no unnecessary personal data.
- [ ] Client-visible flags carry no secrets or authorization decisions.
- [ ] Rollout and rollback metrics are defined before activation.
- [ ] Production flag changes are auditable and appropriately approved.
- [ ] Control-plane outage behavior is tested.
- [ ] Temporary flag removal is tracked and completed.

## Sources

- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)
- [OpenFeature](https://openfeature.dev/)
- [OpenFeature providers](https://openfeature.dev/docs/reference/concepts/provider/)
- [OpenFeature evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context/)
- [`flagd`](https://flagd.dev/)
- [GitHub deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [LaunchDarkly OpenFeature providers](https://launchdarkly.com/docs/sdk/openfeature)
- [LaunchDarkly SDKs](https://launchdarkly.com/docs/sdk)
- [Unleash architecture](https://docs.getunleash.io/get-started/unleash-overview)
- [Unleash feature flag practices](https://docs.getunleash.io/guides/feature-flag-best-practices)
- [Flagsmith OpenFeature support](https://docs.flagsmith.com/integrating-with-flagsmith/openfeature)
- [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html)
- [Azure App Configuration](https://learn.microsoft.com/en-us/azure/azure-app-configuration/overview)
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)
