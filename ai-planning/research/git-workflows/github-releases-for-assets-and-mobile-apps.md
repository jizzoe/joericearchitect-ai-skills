# GitHub Releases for AI Assets and Full-Stack Mobile Applications

Date: 2026-08-09

## Purpose

Explain how GitHub Releases fit the `main`-centric workflow recommended in [GitHub Workflow Options for Libraries and Deployed Applications](github-workflow-options.md), including:

- The difference between commits, tags, releases, packages, artifacts, and deployments.
- How GitHub Releases should apply to this reusable AI-assets repository.
- How a GitHub Release can coordinate a full-stack mobile product with multiple deployable units.
- Versioning, release notes, automation, provenance, security, rollback, and issue traceability.
- A staged adoption path that stays lightweight for a solo maintainer and understandable to outside contributors.

## Executive Recommendation

Use GitHub Releases as the permanent, human-readable record of a versioned product state. A release should answer:

- What version was released?
- Which exact commit does it represent?
- What changed, and which issues and pull requests delivered it?
- Which distributable artifacts were produced from that source?
- Where were those artifacts published or deployed?
- What compatibility, migration, and recovery information does a consumer need?

Apply this through two profiles.

### This AI-Assets Repository

Use Semantic Versioning tags such as `v0.1.0` and GitHub Releases created from verified commits on `main`. Each release should provide:

- Generated and curated release notes.
- GitHub's automatic source archives.
- A curated installable asset bundle when the repository contains more than consumers should install directly.
- A release manifest containing compatibility and file hashes.
- Clear breaking-change and migration guidance.

### Full-Stack Mobile Application

Use one product GitHub Release as a release ledger. It should point to an exact source commit and record the independently identifiable artifacts produced from it:

- Backend and worker container image digests.
- Web artifact or image digest.
- Database migration/schema version.
- iOS marketing version and build number.
- Android version name, version code, and app-bundle identity.
- Store/TestFlight/Play Console release state.
- GitHub deployment records for development, staging, and production.

Start with a unified product version while the application is maintained by a small team. Move to independent component versions only when components genuinely release on different schedules. Even then, retain a product release manifest that records the exact combination delivered together.

## Current Repository State

As of 2026-08-09:

- The repository is public: `jizzoe/joericearchitect-ai-skills`.
- `main` is the GitHub default branch.
- The repository has no Git tags.
- The repository has no published GitHub Releases.
- There is no release-note configuration, changelog, version file, or release workflow.
- Reusable assets currently include Claude and Codex/OpenSpec skills and commands plus project documentation and planning material.

This research does not create a tag, release, release workflow, or repository setting.

## GitHub Release Model

GitHub describes releases as deployable software iterations based on Git tags. A release can include notes and uploaded assets, while GitHub automatically provides source ZIP and tar archives for the tagged commit. See [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).

The relevant objects have different responsibilities:

| Object | Meaning | Mutability and lifetime |
|---|---|---|
| Commit SHA | Exact repository state | Content-addressed and permanent while reachable |
| Branch | Moving development reference | Changes as work is merged |
| Git tag | Named reference to a commit | Should be immutable after publication |
| GitHub Release | Published metadata around a tag | Notes and assets; can be made immutable where supported |
| Workflow artifact | Output retained for CI/debugging | Normally temporary under a retention policy |
| Release asset | File attached to a GitHub Release | Long-lived distribution artifact |
| GitHub Package | Versioned package or container in a registry | Pulled by package/container tooling |
| Deployment | Record that a source/artifact reached an environment | Environment-specific operational history |
| App-store release | Apple or Google distribution record | Controlled by the store's review and rollout system |

A release is not automatically a deployment, and a deployment is not automatically a release.

```text
commit -> tag -> GitHub Release
             \-> build artifacts/packages
                 -> deployments and app stores
```

## Tags and Versioning

### Semantic Versioning

Use [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) when the project can define a compatibility contract:

```text
MAJOR.MINOR.PATCH
```

- Increment **MAJOR** for incompatible public contract changes.
- Increment **MINOR** for backward-compatible functionality.
- Increment **PATCH** for backward-compatible fixes.
- Use prerelease suffixes such as `-beta.1` or `-rc.1` for meaningful previews.

SemVer requires a declared public API. For this AI-assets repository, the public contract is broader than executable code and should include:

- Skill names and discovery locations.
- Supported invocation and input/output behavior.
- Command and workflow names.
- Required configuration and environment contracts.
- Generated-asset and canonical-source relationships.
- Supported Claude, Codex, and OpenSpec compatibility.
- Installation layout expected by consuming repositories.

Until that contract is stable, begin with `v0.x.y`. Moving to `v1.0.0` should mean the compatibility and installation contract is documented and intended to remain stable.

### Tag Rules

- Tag only a verified commit reachable from `main`.
- Use annotated tags when tags are created manually.
- Use the `v` prefix consistently, for example `v0.1.0`.
- Never move or reuse a published version tag.
- Publish a new patch version to correct a release.
- Protect version tags with a tag ruleset when release automation is introduced.
- Prefer exact version tags or commit SHAs for consumers that require reproducibility.

Moving major tags such as `v1` are common for GitHub Actions, but this repository is a collection of AI assets rather than one GitHub Action. Exact immutable versions are clearer unless a future distribution contract explicitly introduces moving compatibility tags.

## GitHub Release States

### Draft

A draft release is visible only to people with appropriate repository access and allows notes and assets to be assembled before publication.

Use drafts to:

- Review generated notes.
- Upload all intended assets.
- Verify checksums and provenance.
- Wait for mobile-store approval or a coordinated launch.

### Prerelease

A prerelease communicates that a version is not the recommended stable release.

Examples:

```text
v0.2.0-beta.1
v1.4.0-rc.1
```

Do not publish a GitHub prerelease for every CI build. Use it for a version that external testers or downstream consumers need to identify and reproduce.

### Latest Stable Release

GitHub can determine the latest release using semantic version ordering, or a maintainer can explicitly mark a release as latest. Stable consumers should normally resolve to the latest non-prerelease version only when they intentionally accept updates.

### Immutable Release

GitHub's immutable-release feature locks a published release's tag and assets against modification. If the repository plan and settings support it, enable it after the release process can assemble and verify all assets in a draft before publication. See [Immutable releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases).

If immutable releases are not available, enforce the same policy operationally and with tag rulesets: never replace a published tag or asset; publish a corrective patch version.

## Release Notes and Issue Traceability

GitHub can generate release notes containing merged pull requests, contributors, and a comparison link. A `.github/release.yml` file can group or exclude entries using pull-request labels. See [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes).

The traceability chain should be:

```text
issue -> pull request -> commit on main -> version tag -> GitHub Release
                                                |
                                                +-> artifact digest
                                                +-> deployment record
                                                +-> app-store build
```

Release notes should be generated first and curated before publication. Include:

- User-visible changes.
- Breaking changes and migration steps.
- Fixed issues.
- Security notices or a link to the security advisory when appropriate.
- Supported assistant/platform versions.
- Known limitations.
- Installation or upgrade steps.
- Artifact and deployment references.

Suggested pull-request labels:

```text
release:breaking
release:feature
release:fix
release:security
release:documentation
release:internal
```

Use labels to organize notes, not to determine version numbers without human review. A change can be technically small but contract-breaking.

### Release Issue or Milestone

For a meaningful public release, create a GitHub milestone or release issue that tracks:

- Target version.
- Included issues and pull requests.
- Required validations.
- Compatibility and migration review.
- Artifact production.
- Staging evidence.
- Publication and deployment approvals.
- Post-release verification.

Do not duplicate every implementation task in the release issue. Link to the authoritative OpenSpec changes and PR evidence.

## Profile A: Reusable AI-Assets Repository

### What Is Being Released

This repository contains reusable text, configuration, scripts, skills, commands, adapters, evaluations, and templates rather than a single executable. Its release still provides value:

- Consumers can pin an exact compatible version.
- Claude and Codex behavior can be traced to a known asset set.
- Breaking prompt, schema, command, and directory-layout changes become visible.
- Installation and upgrade instructions can target a stable snapshot.
- Security or correctness fixes can identify affected versions.

### Recommended Distribution

Every release automatically has GitHub-generated source ZIP and tar archives. Those archives contain the tracked repository state, including planning and development material. They are useful for source inspection but may not be the ideal installation unit.

When the first consumer-facing assets are ready, produce a curated bundle such as:

```text
joericearchitect-ai-skills-v0.1.0.zip
release-manifest.json
SHA256SUMS
```

The bundle should contain only supported distributable assets and their required documentation. It should exclude:

- Local settings.
- IDE metadata.
- Planning scratch material.
- Active change proposals that are not part of the consumer contract.
- Secrets and machine-specific paths.

The build must derive the bundle from the tagged repository state rather than from uncommitted workspace files.

### Release Manifest

A machine-readable manifest can make a text-asset release reproducible:

```json
{
  "releaseVersion": "0.1.0",
  "sourceTag": "v0.1.0",
  "sourceCommit": "<full-commit-sha>",
  "supportedAssistants": ["claude", "codex"],
  "openspecCompatibility": "<supported-version-or-range>",
  "assets": [
    {
      "path": ".agents/skills/openspec-verify-change/SKILL.md",
      "sha256": "<digest>"
    }
  ]
}
```

The actual schema should be specified before implementation. It should identify generated versus canonical copies so consumers do not mistake synchronized assistant adapters for independent sources.

### Proposed Version Meaning

| Change | Suggested increment |
|---|---|
| Fix wording without changing expected behavior | PATCH |
| Add a backward-compatible skill or workflow | MINOR |
| Add support for another assistant without breaking existing consumers | MINOR |
| Change a command name or invocation contract | MAJOR |
| Move canonical asset paths required by consumers | MAJOR |
| Remove supported assistant/platform compatibility | MAJOR |
| Security fix with compatible behavior | PATCH, plus advisory when warranted |

Behavioral changes to prompts and agent instructions require judgment. A one-line text edit can be a major change if it invalidates a documented contract.

### Recommended Initial Process

1. Finish and archive the OpenSpec foundation change.
2. Define the supported public asset and installation contract.
3. Add focused release validation and a release-manifest schema.
4. Add `.github/release.yml` after the repository labels are stable.
5. Produce `v0.1.0` from a verified commit on `main`.
6. Start manually with `gh release create` or the GitHub UI.
7. Automate only after one or two manual releases expose the real requirements.

No server deployment or GitHub Environment is required for this repository's release. The release itself is the distribution event.

## Profile B: Full-Stack Mobile Application

### GitHub Release as Product Ledger

A full-stack mobile release rarely consists of one binary. Treat the GitHub Release as the coordination record for a tested product combination.

Example release manifest:

```yaml
productVersion: 1.4.0
source:
  tag: v1.4.0
  commit: <full-commit-sha>
components:
  api:
    image: ghcr.io/example/bookkeeping-api@sha256:<digest>
  worker:
    image: ghcr.io/example/bookkeeping-worker@sha256:<digest>
  web:
    image: ghcr.io/example/bookkeeping-web@sha256:<digest>
  database:
    migrationVersion: "2026080901"
  ios:
    marketingVersion: 1.4.0
    buildNumber: "10402"
    appStoreConnectBuildId: <id>
  android:
    versionName: 1.4.0
    versionCode: 10402
    playReleaseId: <id>
```

The manifest is a release design example, not a committed schema decision.

### Versioning Options

#### Option 1: Unified Product Version

All components participating in a public product release share `1.4.0`, while their immutable artifacts retain unique digests and build numbers.

**Advantages**

- Simple user communication.
- Simple release notes and support questions.
- Appropriate for a solo maintainer and coordinated monorepo.

**Costs**

- A backend-only fix may increment the product version even when no mobile binary changes.
- Component deployment history still needs independent artifact identities.

**Recommendation:** Start here.

#### Option 2: Independent Component Versions

Use tags such as:

```text
api-v2.3.1
web-v1.8.0
mobile-v1.4.0
```

**Advantages**

- Components release independently.
- Clear package/container lineage.

**Costs**

- More tags, releases, compatibility rules, and automation.
- Harder to answer which combination represented the product at a point in time.

**Use when:** independent team ownership or genuinely independent release cadence makes unified versions misleading.

#### Option 3: Product Release Plus Independent Component Versions

A product release such as `v1.4.0` points to a manifest containing independently versioned components.

**Advantages**

- Preserves a user-facing product version and precise component history.

**Costs**

- Highest process and tooling complexity.

**Use later:** when the application has multiple independently operated release streams.

### GitHub Packages and Container Images

Do not attach backend container archives to GitHub Releases as the primary deployment mechanism. Publish containers to a registry such as GitHub Container Registry and record their immutable digests in the release manifest. GitHub Container Registry supports Docker/OCI images and can associate packages with a repository. See [Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

Use:

- Human-friendly version tags for discovery.
- Immutable digest references for deployments.
- GitHub deployment records for environment history.

Build an artifact once, then promote the same digest through development, staging, and production.

### Apple Release Mapping

Apple associates an uploaded build with an app using its bundle ID and version, while the build string uniquely identifies the build. See [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/).

Record both:

```text
marketing version: 1.4.0
build number: 10402
source commit: <sha>
GitHub release: v1.4.0
```

Apple's phased release gradually makes an approved update available to automatic-update users over seven days, but any user can manually download it during that period. See [Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases).

Apple does not allow reverting the App Store to a prior version; a problem normally requires a new version submission. See [Create a new version](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version). This makes backward-compatible APIs, server-side kill switches, and mobile-safe feature flags essential.

### Google Play Release Mapping

Record:

```text
versionName: 1.4.0
versionCode: 10402
app bundle digest: <sha256>
source commit: <sha>
GitHub release: v1.4.0
```

Google Play requires the version code to increase for updates. Its staged rollouts distribute an update to a selected percentage that can be increased or halted. Users who already received a halted version remain on it. See [App version requirements](https://support.google.com/googleplay/android-developer/answer/9859152) and [Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149).

Neither Apple nor Google rollout records are replaced by a GitHub Release. Store identifiers and status should be linked back to the GitHub release manifest.

## Coordinated Release Flow

A safe full-stack release flow is:

```text
issues and PRs
  -> merge verified source to main
  -> select exact release commit and version
  -> create protected tag and draft GitHub Release
  -> build and sign each artifact once
  -> publish packages/images by immutable identity
  -> attach manifest, checksums, and permitted release assets
  -> deploy same server artifacts to staging
  -> upload mobile builds to internal/TestFlight/Play testing
  -> run acceptance, migration, and recovery checks
  -> obtain production/store approvals
  -> publish GitHub Release at the defined release milestone
  -> promote exact server artifacts and start store rollout
  -> monitor and record results
```

Define the publication milestone explicitly. Two reasonable policies are:

1. Publish the GitHub Release when all artifacts are approved and production rollout begins.
2. Publish it when the user-facing mobile release is available, keeping the GitHub Release as a draft during store review.

For a consumer-facing mobile product, the second policy usually gives the word "released" the clearest meaning. Backend deployments before that point remain visible in GitHub deployment history.

## Releases, Deployments, and Feature Flags

These mechanisms form separate control planes:

```text
GitHub Release: what product version and artifact set exists
Deployment:     which artifact is running in an environment
Feature flag:   which behavior a user receives at runtime
App store:      which mobile build a device can install
```

A release can be fully deployed while a feature remains off. A feature can be rolled back without changing the release. A server deployment can be rolled back to a prior artifact while mobile devices remain on the newer client.

See [Feature Flags in a Modern GitHub Workflow](feature-flags-in-modern-github-workflows.md) for runtime rollout controls.

## Recovery and Rollback

### AI Assets

- Consumers can pin or restore a previous immutable version.
- Publish a new patch release for corrections.
- Do not rewrite the affected tag or release asset.
- Document compatibility and remediation in the new release and affected release notes.

### Server and Web Components

- Redeploy a previously verified immutable image digest.
- Keep database migrations backward compatible across the rollback window.
- Prefer expand/contract schema changes over irreversible release-time changes.
- Record the rollback as a GitHub deployment linked to the incident issue.

### Mobile Components

- Halt staged rollout where the store permits it.
- Disable unsafe behavior with a server-authoritative feature flag or kill switch.
- Keep backend APIs compatible with already-installed mobile versions.
- Publish a forward-fix build because devices that installed the bad version cannot be assumed to downgrade.
- Link the incident, corrective PR, new build identifiers, and replacement release.

## Release Automation Options

### Option 1: Manual Release With GitHub UI or CLI

Example shape:

```text
gh release create v0.1.0 --verify-tag --generate-notes
```

**Advantages:** low setup cost and explicit human control.

**Risks:** inconsistent steps unless a checklist and verification evidence are required.

**Recommended now:** use for the first AI-assets releases.

### Option 2: Maintainer-Triggered GitHub Actions Workflow

A `workflow_dispatch` release workflow accepts a version and exact commit, validates them, creates a tag/draft, builds artifacts, attaches provenance, and waits for approval before publication.

**Advantages:** reproducible while retaining an explicit release decision.

**Risks:** workflow security and idempotency must be designed carefully.

**Recommended next:** after the manual process is understood.

### Option 3: Fully Automated Version and Release Tooling

Tools can infer versions and changelogs from conventional commits, labels, or release PRs.

**Advantages:** useful at high release frequency.

**Risks:** a text or prompt change may have semantic impact that automation cannot infer. Mobile store timing and coordinated multi-component releases still need state and approvals.

**Recommendation:** do not begin here. Automate mechanics, not the judgment of compatibility and release readiness.

## Security and Supply-Chain Controls

- Build releases only from protected tags or verified `main` commits.
- Pin third-party Actions by full commit SHA.
- Grant `GITHUB_TOKEN` the minimum job permissions; release creation normally needs scoped `contents: write`, while validation jobs should remain read-only.
- Use GitHub OIDC instead of long-lived cloud credentials where supported.
- Isolate signing and publication into protected GitHub Environment jobs.
- Never expose signing, package, cloud, or store credentials to untrusted pull-request code.
- Publish containers and packages using repository-scoped `GITHUB_TOKEN` where supported instead of a personal token.
- Generate checksums for downloadable release bundles.
- Generate artifact attestations for executable packages, containers, or bundled manifests that consumers will verify.
- Verify the built artifact before publication; an attestation proves origin and build process, not that the artifact is secure.
- Do not attach private signing material or unnecessarily publish signed mobile binaries as public release assets.

GitHub recommends limiting `GITHUB_TOKEN` permissions because Actions can access the token through the workflow context. See [Using `GITHUB_TOKEN`](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token).

GitHub artifact attestations can record repository, workflow, commit, environment, and other provenance for built artifacts and SBOMs. They are most useful for binaries, packages, container images, and manifests that consumers actually verify, not for individually signing every documentation file. See [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations).

## Release Quality Gates

Before publishing:

- [ ] Version and tag follow the repository policy.
- [ ] Tag points to the intended verified `main` commit.
- [ ] Required CI, security, and OpenSpec verification pass.
- [ ] Generated notes include the intended PR and issue set.
- [ ] Breaking changes and migrations are explicit.
- [ ] Compatibility matrix is current.
- [ ] Release assets were built from the tagged commit.
- [ ] Manifest and checksums match uploaded artifacts.
- [ ] No secrets, local settings, or unrelated planning artifacts are in the curated bundle.
- [ ] Attestations are generated and verified where applicable.
- [ ] Recovery procedure is tested or evidenced.
- [ ] Mobile and deployable-unit identifiers are recorded where applicable.
- [ ] Store and environment approval state meets the publication policy.

After publishing:

- [ ] Installation or upgrade smoke test passes from the published artifact.
- [ ] Production deployments reference exact artifact digests.
- [ ] Mobile rollout and server telemetry are monitored.
- [ ] Release issue or milestone records the result.
- [ ] Any follow-up, incident, or flag-cleanup issue is created.

## Recommended Adoption Decisions

### AI-Assets Repository

1. Adopt SemVer beginning with `v0.x.y`.
2. Define the public compatibility and installation contract before `v1.0.0`.
3. Release only from verified `main` commits.
4. Start with manual draft/review/publication.
5. Use generated notes plus human curation.
6. Add a curated bundle and manifest when there is a real installation consumer.
7. Add immutable releases or equivalent tag protections when supported.

### Full-Stack Mobile Application

1. Begin with a unified product version and exact component digests/build numbers.
2. Use a release manifest as the cross-system ledger.
3. Store containers in a registry, not as primary GitHub Release attachments.
4. Record GitHub Environments and app-store releases separately but link them to the product release.
5. Build once and promote immutable artifacts.
6. Keep backend compatibility and feature-flag recovery because mobile rollback is limited.
7. Move to independent component versions only when release cadence requires it.

## Sources

- [About GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
- [Immutable releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases)
- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- [Using `GITHUB_TOKEN`](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)
- [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)
- [Working with GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Viewing GitHub deployment history](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history)
- [Apple: Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
- [Apple: Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases)
- [Apple: Create a new version](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version)
- [Google Play: App version requirements](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Google Play: Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149)
