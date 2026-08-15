# GitHub Environments for AI Assets and Full-Stack Mobile Applications

Date: 2026-08-09
Status: Research recommendation; repository-owner review pending

## Purpose

Explain how GitHub Environments fit the `main`-centric workflow recommended in [GitHub Workflow Options for Libraries and Deployed Applications](github-workflow-options.md), including:

- What an Environment represents and what it does not represent.
- Deployment history, protection rules, approvals, secrets, variables, and concurrency.
- Recommended use for this AI-assets repository.
- Recommended topology for a full-stack mobile product with multiple deployable units.
- Security, failure recovery, artifact promotion, and mobile-store considerations.

This document recommends options. It does not adopt detailed Environment policy or create GitHub records. Those decisions remain pending repository-owner review.

## Executive Recommendation

Use GitHub Environments as protected deployment targets, not as substitutes for source branches.

```text
source integration: main
release identity:   Git tag and GitHub Release
deployment target:  GitHub Environment
runtime exposure:   feature flag
```

Apply that model differently to the two products:

1. **AI-assets repository:** create no development, staging, or production Environments now because the repository has no runtime deployment. Add a single protected `release` Environment later only if release automation needs protected publication credentials or an explicit publication approval.
2. **Full-stack mobile application:** use `development`, `staging`, and `production` for server-side product deployments. Add store-specific Environments such as `ios-testflight`, `ios-production`, `android-internal`, and `android-production` only when GitHub Actions actually uploads or promotes mobile builds.

Start with the smallest Environment set that represents real external targets. Split an Environment by component only when credentials, approvers, protection rules, or deployment history must differ.

## Mental Model

An Environment is a repository-level GitHub object referenced by a workflow job:

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://app.example.com
```

By default, a job that references an Environment creates a GitHub deployment record. The Environment can control whether the job starts and when it receives Environment-scoped secrets. GitHub supports protection rules, deployment branch/tag restrictions, secrets, variables, deployment history, and approvals. See [Deploying with GitHub Actions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).

An Environment is not:

- A Git branch.
- A long-lived source integration stream.
- A GitHub Project status.
- A feature flag.
- A package or container registry.
- An Apple or Google release track.
- A general-purpose configuration namespace for every test job.

## Related Objects

| Object | Question it answers |
|---|---|
| `main` branch | What source has been integrated and accepted? |
| GitHub Release | What version and artifact set was published? |
| GitHub Environment | Where was an artifact deployed, and what gates protected it? |
| Deployment record | Which commit/workflow/status reached that target? |
| Package/container digest | Which immutable artifact was promoted? |
| Feature flag | Which runtime behavior does a subject receive? |
| App-store track | Which mobile build can a tester or customer install? |
| GitHub Project `Status` | Where is the issue in the work lifecycle? |

Keeping these responsibilities separate avoids using `development`, `integration`, and `master` branches as proxies for deployments.

## Core Capabilities

### Deployment History

GitHub deployment history can show:

- Active and prior deployments.
- Environment.
- Associated commit.
- Source PR and branch when available.
- Workflow logs.
- Deployment URL.
- Deployment status.

See [Viewing deployment history](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history).

A workflow must reference the Environment with deployment tracking enabled, or use the Deployments API, for this history to exist. A successful shell command that deploys externally but never records GitHub deployment state leaves an incomplete audit trail.

### Protection Rules

Environment protection rules can include:

- Required reviewers.
- Prevention of self-review.
- Wait timers.
- Branch and tag restrictions.
- Custom protection rules supplied by GitHub Apps.
- Administrator bypass policy.

A protected job waits before it starts. Environment secrets are not supplied until required protection rules pass. See [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

Protection rules gate the workflow job; they do not prove the deployed artifact is correct. CI, artifact verification, security review, migration checks, and post-deployment health checks remain necessary.

### Required Reviewers

GitHub allows up to six users or teams as required reviewers, with one approval sufficient to proceed. An Environment may prevent the initiator from approving their own deployment.

For a mostly solo project:

- Do not enable `prevent_self_review` until another trusted maintainer is reliably available.
- A manually dispatched production workflow can serve as the explicit solo release decision.
- When trusted maintainers exist, require a production reviewer other than the initiator.
- Outside contributors should never receive automatic production approval authority.

Plan availability matters. On GitHub Free, Pro, and Team, required reviewers and wait timers are available only for public repositories. Private/internal repositories need the appropriate paid/enterprise capabilities, and detailed availability must be rechecked when the mobile repository and plan are selected. See [Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

### Deployment Branch and Tag Restrictions

An Environment can allow:

- Any ref.
- Protected branches only.
- Selected branch and tag patterns.

For the recommended workflow:

- Development deployments should originate from accepted `main` commits.
- Staging and production should promote an artifact already built from `main`.
- Product release publication may be restricted to protected version tags such as `v*` after the tag policy is defined.
- Pull-request preview deployments, if used, should target a distinct transient mechanism rather than production-capable Environments.

GitHub matches selected patterns against `GITHUB_REF`, and branch and tag rules are distinct. Pattern semantics require care because wildcards do not match `/` automatically. See [Deployment branches and tags](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments#deployment-branches-and-tags).

### Environment Secrets

Environment secrets are available only to jobs that reference the Environment. With required approval, the job cannot access them before approval.

Use Environment secrets for target-specific sensitive values that cannot use short-lived federation, such as:

- Store API credentials.
- Signing service credentials.
- Legacy deployment tokens.
- Target-specific service credentials.

Do not store:

- Non-sensitive values that belong in variables.
- Personal access tokens when `GITHUB_TOKEN`, a GitHub App, or OIDC is sufficient.
- Secrets in workflow YAML, repository files, release manifests, logs, or feature flags.

Environment secrets remain available to the runner after injection. A self-hosted runner is not made isolated merely by using an Environment. Treat runner compromise as credential compromise.

### Environment Variables

Environment variables are for non-sensitive target-specific configuration, for example:

- Cloud region.
- Deployment URL.
- Cluster or service name.
- Store application identifier when it is not sensitive.

Variables are not masked in logs and must not contain secrets. Environment-level configuration variables take precedence over repository and organization values with the same name. See [Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables).

Avoid using variables to hide critical deployment policy. Branch restrictions, approvals, and artifact verification should remain explicit controls.

### OpenID Connect

Prefer GitHub Actions OpenID Connect federation over long-lived cloud credentials. OIDC allows a cloud provider to issue a short-lived credential based on the repository, ref, Environment, workflow, and other claims.

The cloud trust policy must constrain which repository and Environment can obtain a role. Merely granting `id-token: write` does not create a safe trust policy. GitHub recommends Environment protections when Environments are part of OIDC policies. See [OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc).

### Concurrency

Use a concurrency group per Environment and deployable target to prevent overlapping mutations:

```yaml
concurrency:
  group: deploy-production-api
  cancel-in-progress: false
```

For deployments, queued execution is normally safer than canceling an in-progress production mutation. GitHub concurrency can limit a group to one running job and can queue waiting runs. See [Concurrency](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency).

## Deployment Records and Status

A deployment should move through explicit status:

```text
queued -> in_progress -> success
                       -> failure/error
```

Where applicable, record:

- Exact commit SHA.
- Immutable artifact digest.
- GitHub Release or release-manifest reference.
- Environment URL.
- Workflow log URL.
- Migration version.
- Post-deployment verification result.

The Deployments API supports states including `queued`, `pending`, `in_progress`, `success`, `failure`, `error`, and `inactive`. See [Deployment statuses](https://docs.github.com/en/rest/deployments/statuses).

Do not report success immediately after submission to an asynchronous platform. Success means the target accepted the artifact and the required health or store-processing evidence exists.

## Environment Topology Options

### Option 1: Product-Stage Environments

```text
development
staging
production
```

All server, web, and worker deployment jobs reference the product stage while using component-specific concurrency groups and artifact identities.

**Advantages**

- Simple and familiar.
- One timeline per product stage.
- Low administrative overhead.

**Costs**

- Component deployments share one Environment history.
- Environment secrets may become broader than one component requires.

**Recommended starting point for:** the full-stack application.

### Option 2: Component-by-Stage Environments

```text
api-development
api-staging
api-production
web-development
web-staging
web-production
```

**Advantages**

- Precise component history, secrets, approvers, and URLs.

**Costs**

- Environment count grows rapidly.
- Repeated policy configuration can drift.
- Product-level promotion becomes harder to view.

**Use only when:** component ownership, credentials, permissions, or deployment controls genuinely differ.

### Option 3: Product Stages Plus Mobile Distribution Targets

```text
development
staging
production
ios-testflight
ios-production
android-internal
android-production
```

**Advantages**

- Server stages remain simple.
- Mobile credentials and store approvals are isolated.
- Store uploads and promotions have explicit deployment history.

**Costs**

- GitHub and store state must be reconciled.
- Store review and rollout are asynchronous.

**Recommended mature topology for:** the full-stack mobile application after store automation exists.

## Profile A: AI-Assets Repository

### Recommendation

Create no deployment Environments now.

This repository distributes reusable assets through source, tags, and GitHub Releases. It has no development, staging, or production runtime. Adding those Environments would create terminology and configuration without a real deployment target.

Potential future Environment:

```text
release
```

Create `release` only when a release job needs one or more of:

- Protected publication approval.
- Package-registry credentials.
- Signing or attestation credentials.
- Marketplace or external catalog credentials.
- A durable GitHub deployment/audit record for publication.

If GitHub-native `GITHUB_TOKEN` permissions are sufficient and release publication requires no separate gate, a `release` Environment may remain unnecessary.

### Not Recommended

- `development`, `integration`, or `production` Environments with no deployed target.
- An Environment solely to hold general CI variables.
- An Environment per Claude or Codex adapter unless those adapters are independently published targets.
- Treating GitHub Release drafts as a staging Environment.

## Profile B: Full-Stack Mobile Application

### Recommended Initial Topology

Begin with:

```text
development
staging
production
```

Add mobile Environments when automated store delivery begins:

```text
ios-testflight
ios-production
android-internal
android-production
```

The product source still integrates through `main`. Environments record promotion of immutable artifacts rather than selecting code from long-lived stage branches.

### Suggested Server Policy

| Environment | Trigger | Source/artifact policy | Gate | Credentials |
|---|---|---|---|---|
| `development` | Automatic after merge to `main` | Build or select artifact from merged SHA | CI and deploy smoke checks | OIDC development role |
| `staging` | Promotion of successful development artifact | Same immutable digest | Integration/E2E/migration checks; optional manual approval | OIDC staging role |
| `production` | Explicit promotion | Same staging-verified digest | Manual decision; required reviewer when team permits; recovery evidence | OIDC production role |

### Suggested Mobile Policy

| Environment | Purpose | Gate | Evidence |
|---|---|---|---|
| `ios-testflight` | Upload a signed build for testing | Mobile tests, signing, upload authorization | App Store Connect build ID and processing state |
| `ios-production` | Submit/promote an approved build | Store metadata, approval, release checklist | App version/build, review and rollout state |
| `android-internal` | Upload to internal/closed testing | Android tests, signing, upload authorization | Play release ID, version code, track |
| `android-production` | Promote an approved bundle | Store metadata, approval, release checklist | Version code, rollout percentage and status |

GitHub Environment success should reflect the operation performed. An upload job can succeed when the store accepts and processes a build, while a separate production promotion deployment records customer release. Do not mark an App Store submission as a completed customer rollout.

### Multiple Deployable Units

For API, web, workers, and mobile:

- Build affected units from the same accepted commit where practical.
- Give every output an immutable digest or build identifier.
- Promote the same server artifact between stages.
- Record component identity in deployment metadata.
- Use component-specific concurrency groups.
- Split Environments only when controls or credentials differ.
- Keep a release manifest that maps product version to all deployed units.

See [GitHub Releases for AI Assets and Full-Stack Mobile Applications](github-releases-for-assets-and-mobile-apps.md).

## Pull-Request Preview Environments

Preview deployments can help external contributors and reviewers inspect web changes, but they require a distinct threat model.

Recommendations:

- Use provider-native preview deployments or transient Deployments API records.
- Do not expose staging or production secrets to forked PRs.
- Give previews isolated data and least-privilege credentials.
- Mark preview deployments transient and inactive when the PR closes.
- Do not dynamically create arbitrary Environment names with privileged defaults.
- Avoid running untrusted PR code in a privileged `pull_request_target` workflow.

Preview environments are optional and should be added only when the application has a deployable web surface and cleanup automation.

## Secrets and Trust Boundaries

Separate jobs by trust level:

```text
untrusted PR validation
  -> no deployment credentials

trusted main build
  -> package write only

staging deployment
  -> staging OIDC role/secrets

production deployment
  -> production Environment approval
  -> production OIDC role/secrets
```

Security requirements:

- Declare minimum `GITHUB_TOKEN` permissions for every job.
- Pin third-party Actions by full commit SHA.
- Use OIDC subject/audience restrictions.
- Do not share production credentials with development.
- Do not print variables that may reveal infrastructure details unnecessarily.
- Do not make environment names user-controlled inputs without validation.
- Do not deploy untrusted fork code with privileged secrets.
- Protect workflow-file changes because they define how credentials are used.
- Use repository rulesets and CODEOWNERS for deployment workflows when a team exists.

## Failure and Recovery

### Failed Deployment

- Record `failure` or `error`, not success with a warning.
- Preserve workflow logs and the exact artifact identity.
- Do not automatically promote later stages.
- Link the incident or corrective issue.
- Make retry idempotent.

### Partial Multi-Component Deployment

- Report each component result independently.
- Stop dependent promotions.
- Determine whether to roll forward or redeploy the prior compatible set.
- Preserve the previous release manifest and artifact digests.
- Do not claim the product Environment is healthy until compatibility checks pass.

### Rollback

- Redeploy a previously verified server artifact digest.
- Record rollback as a new deployment event.
- Keep migrations backward compatible for the recovery window.
- Use server-authoritative feature flags to disable unsafe behavior.
- For mobile, halt store rollout where possible and publish a forward fix; already-installed clients cannot be assumed to downgrade.

### Environment Deletion or Renaming

Deleting an Environment removes its protection configuration and secrets and can damage audit continuity. Treat rename as a migration:

1. Inventory workflows, secrets, variables, OIDC claims, branch policies, and external trust policies.
2. Create and verify the replacement.
3. Update workflows and cloud trust.
4. Perform a non-production test.
5. Retire the old Environment only after history and references are understood.

## Configuration as Code

GitHub provides REST APIs for creating and updating Environments, branch policies, and deployment statuses. See [REST API endpoints for deployment environments](https://docs.github.com/en/rest/deployments/environments).

Infrastructure as code can reduce drift, but secrets should still be written through encrypted secret APIs or external secret-management integration. Do not begin by automating every Environment setting. First establish and review the intended topology manually, then codify stable policy.

An audit tool should support read-only comparison of:

- Expected Environment names.
- Protection rules.
- Branch/tag policies.
- Secret names, not values.
- Variable names and approved non-secret values.
- Workflow references.
- OIDC trust subjects.
- Recent deployment status.

Repair mode should preview mutations and require explicit authorization.

## Decision Matrix

| Decision | AI-assets repository | Full-stack mobile application |
|---|---|---|
| Create Environments now | No | When deployment automation begins |
| Initial names | None | `development`, `staging`, `production` |
| Mobile-specific names | Not applicable | Add with store automation |
| Source branch | `main` for release source | `main` for all build/promotion source |
| Production approval | Release workflow decision if needed | Explicit promotion; second reviewer when available |
| Credentials | Prefer `GITHUB_TOKEN`; `release` Environment only if needed | OIDC per stage; store secrets per mobile target |
| Artifact policy | Tagged bundle/release assets | Immutable digests and build identifiers |
| Environment split | Only real publication target | Split only for distinct controls/history |

## Decisions Pending Owner Review

1. Whether this AI-assets repository will eventually use a protected `release` Environment.
2. Whether the mobile application repository will be public or private and which GitHub plan will provide required protections.
3. Which cloud provider and OIDC trust model will host backend workloads.
4. Whether production deployment can be self-approved while the project is solo.
5. Whether server components share product-stage Environments or require component-specific separation.
6. Which mobile targets will be automated through GitHub Actions.
7. What event defines successful mobile deployment: upload, store approval, rollout start, or rollout completion.
8. Whether GitHub Environment configuration will eventually be managed as code.

## Review Checklist

- [ ] Every Environment represents a real external target.
- [ ] Environment names do not duplicate source branches.
- [ ] Branch/tag policies permit only intended refs.
- [ ] Production cannot run from untrusted PR code.
- [ ] OIDC replaces long-lived cloud keys where possible.
- [ ] Secrets are scoped to the narrowest target.
- [ ] Variables contain no sensitive data.
- [ ] Concurrency prevents overlapping target mutation.
- [ ] Deployment success has objective evidence.
- [ ] Artifact digest/build identifier is recorded.
- [ ] Partial deployment and rollback behavior are defined.
- [ ] Store state is not confused with GitHub deployment state.

## Sources

- [Deploying with GitHub Actions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Viewing deployment history](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history)
- [Reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
- [Concurrency](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency)
- [Secrets](https://docs.github.com/en/actions/concepts/security/secrets)
- [Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)
- [OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc)
- [REST API endpoints for deployment environments](https://docs.github.com/en/rest/deployments/environments)
- [REST API endpoints for deployment statuses](https://docs.github.com/en/rest/deployments/statuses)
