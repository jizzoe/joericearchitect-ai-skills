# React Native and Expo Quality Research

Date: 2026-08-15
Status: Deep research input for future code-generation and code-review skills.
Scope: React Native and Expo applications, with Android and iOS platform checks
where the changed surface makes them applicable.

## Purpose

This research establishes an evidence-oriented source baseline for future
React Native/Expo code-generation and code-review capabilities. Those
capabilities may later be composed into an independent verifier in the change
implementation workflow. This document is not itself a skill, a release gate,
or authorization to change an application.

The intended outcome is a quality profile that can distinguish:

- a deterministic repository check that can safely run in a restricted review
  environment;
- a device, emulator, simulator, or release-build observation that requires a
  suitable configured environment; and
- a judgment or production-account check that must be reported as unavailable
  or manual rather than fabricated.

## Source Policy and Confidence

Only official documentation from the organization responsible for a framework,
tool, platform, or service is used for findings. NIST, W3C, and OWASP are used
as widely adopted standards-body or security-standard sources. The complete,
dated manifest is in [sources.md](sources.md).

The document uses these labels:

- **Verified fact** — directly supported by one or more listed sources.
- **Design inference** — a proposed verifier or skill behavior derived from
  several verified facts; it is not a vendor requirement.
- **Unknown / repository decision** — must be supplied by the target project,
  its selected SDK versions, delivery policy, or its owners.

## Executive Findings

1. **The repository configuration is the first authority.** React Native and
   Expo support multiple versions, workflows, platform targets, and native
   boundaries. A future skill must inspect the target's declared React Native,
   Expo SDK, package manager, TypeScript, native directories, EAS usage, and
   configured commands before selecting checks. It must not impose a universal
   dependency version, linter preset, formatter, router, or build provider.
   [S08], [S12], [S13], [S21], [S22]
2. **Static analysis is necessary but not sufficient.** React Native documents
   linting and type checking as static analysis; React correctness can be
   checked with the official React Hooks lint plugin; TypeScript strictness and
   `typescript-eslint` can provide stronger local evidence when configured.
   They cannot prove native permission behavior, screen-reader interaction,
   store metadata, startup time, memory use, or release-update compatibility.
   [S07], [S10], [S11], [S34], [S35], [S36]
3. **A mobile verifier needs platform-specific evidence.** React Native
   accessibility maps onto Android TalkBack and iOS VoiceOver, platform code
   can intentionally diverge, and Android/iOS have separate security and
   privacy obligations. Browser-only screenshots, DOM accessibility scans, or
   web tests do not establish native behavior. [S05], [S09], [S24], [S28],
   [S33]
4. **Release-like testing is the performance baseline.** React Native says
   development mode materially affects JavaScript-thread performance and
   recommends release-build testing; profiling uses Instruments on iOS and
   Android Studio on Android. Any performance conclusion without a declared
   release-like build, representative device class, and measured scenario must
   be reported as a gap. [S01], [S04], [S27]
5. **Client code and client configuration are public.** React Native warns
   against embedding secrets in app code. Expo says the public app config and
   client-side values are readable by someone who can run the app. A reviewer
   should therefore flag apparent credentials, server secrets, or privileged
   API keys in client bundles/configuration, while avoiding a claim that a
   naming convention alone proves secrecy. [S06], [S13], [S14], [S15]
6. **Expo adds real delivery surface, not a cosmetic wrapper.** App config,
   config plugins/CNG, native dependency compatibility, EAS environment
   selection, development builds, update runtime compatibility, signing, and
   versioning are reviewable when enabled by the target repository. They are
   conditional checks, not global requirements for every React Native project.
   [S12]–[S23]

## Verified Technical Baseline

### 1. Type safety, linting, and formatting

**Verified facts**

- New React Native projects target TypeScript by default, while JavaScript
  remains supported. React Native documents extending
  `@react-native/typescript-config` and running `tsc` for type checking.
  [S08]
- TypeScript's `strict` flag enables a family of stronger checks; future
  TypeScript upgrades can add newly surfaced errors under that flag. [S34]
- React Native identifies ESLint and TypeScript as its out-of-the-box static
  analysis tools. ESLint is configurable; a rule may be auto-fixable, while a
  suggestion can change application logic and is not suitable for blind CLI
  application. [S07], [S36]
- `typescript-eslint` publishes a recommended configuration and separately
  offers `strict`, `stylistic`, and type-aware linting options. [S35]
- Prettier is a formatter, not a semantic validator: it reparses and reprints
  supported files into a consistent style. [S37]
- React's official rules require pure Components/Hooks, immutable render
  inputs, and Hooks called only in permitted React contexts. The official React
  Hooks ESLint plugin provides rules for these correctness and performance
  constraints. [S10], [S11]

**Design inference: generation profile**

Default newly generated React Native/Expo code should be TypeScript-first when
the target supports it; preserve a JavaScript project's approved configuration
rather than silently migrating it. Generated code should keep rendering pure,
avoid prop/state mutation, call Hooks at the top level, put external effects
outside render, and avoid suppressing type or lint failures without a
repository-owned rationale.

**Design inference: verifier checks**

Run only repository-declared commands, in this order when available: formatter
check, lint, type check, then focused tests. Treat an absent configuration as
`not-configured`, not as a failure to be repaired by installing tools. A
reviewer may report a broad `any`, ignored compiler error, eslint-disable,
unsafe assertion, or rule suppression as a finding only when it has
repository-relative evidence and a concrete risk; style preference alone is
not an independent-review blocker.

### 2. React and React Native correctness

**Verified facts**

- React rendering assumes component and Hook purity and immutable props/state;
  the Rules of Hooks are correctness rules, not merely conventions. [S10]
- React Native supports both small platform conditionals through `Platform` and
  platform-specific filename extensions when divergent implementations are
  appropriate. [S09]
- React Native's testing guidance spans static analysis through end-to-end
  tests and presents testability as a prerequisite for reliable change and
  dependency-upgrade behavior. [S07]

**Design inference: review checks**

- Flag conditional, looped, nested, callback, or post-return Hook calls; render
  side effects; direct prop/state mutation; and state updates during render.
- Require an explicit reason and both-platform evidence when a change introduces
  platform-specific behavior, permission, native module, deep link, or visual
  divergence. Do not require identical code where platform policy differs.
- Review async effects for cancellation/cleanup, stale-result handling, loading
  and error states, and retries that can cause duplicate actions. These are
  code-review questions, not claims that static lint can prove runtime safety.

### 3. Performance and resource use

**Verified facts**

- React Native describes a 60 FPS target and the 16.67 ms frame budget on
  devices that display at 60 Hz. It distinguishes JavaScript-thread and UI
  frame rates, and says development-mode results are not suitable performance
  evidence. [S01]
- The official performance guidance identifies expensive JavaScript-thread
  work, release `console.*` calls, list rendering, animation approach, image
  resizing, and main-thread drawing as common performance concerns. [S01]
- FlatList tuning is a tradeoff among responsiveness, blank areas, and memory;
  its documented knobs include batch size, batching period, initial render
  count, window size, and item layout. [S02]
- React Native recommends Hermes for code loading, describes screen-level lazy
  loading, and cautions that module side effects can break lazy loading.
  [S03]
- React Native profiling points to Instruments and Android Studio profiling and
  requires development mode to be off before measurement. [S04]
- Android's quality guidance includes main-thread/ANR avoidance, current SDK and
  dependency review, StrictMode, battery behavior, and device-state
  interruption testing. [S27]

**Design inference: review checks**

For changes on large lists, images, animations, navigation, startup paths,
or high-frequency input, ask for scoped evidence rather than asserting a
universal optimization:

| Changed surface | Code-review questions | Minimum evidence when performance-sensitive |
| --- | --- | --- |
| Large or unbounded list | stable keys; bounded item work; list tuning justified; layout known where applicable | representative scroll scenario on a physical device or emulator; profiler trace when a regression is alleged |
| Initial route or large feature | eager dependency cost; module side effects; unnecessary startup work | release/development-build startup observation and package/config review |
| Animation or gesture | work on JS vs UI thread; blocking state updates; memory impact of rendering flags | release-like trace or interaction observation on affected platform |
| Images/media | decoded image size, resizing/caching strategy, lifecycle cleanup | representative device memory/scroll evidence if image-heavy |

Do not prescribe `memo`, `useCallback`, `getItemLayout`, lazy loading, or a
specific list prop merely because it exists. Require a measured or
scenario-specific reason; unnecessary memoization and speculative tuning can
obscure correctness.

### 4. Security, privacy, and data handling

**Verified facts**

- React Native says not to store sensitive API keys in app code and recommends
  a server-side orchestration layer when a secret is needed to access a
  resource. It distinguishes persistent device storage by sensitivity. [S06]
- Expo says most app config is accessible at runtime, provides `expo config
  --type public` to inspect embedded public configuration, and advises against
  sensitive information in app configuration. [S13]
- Expo says client-side code should be considered public; an EAS secret does
  not make a value safe when it is embedded in client code. [S14], [S15]
- Expo SecureStore provides encrypted local key-value storage, but its official
  documentation includes platform-specific availability and backup behavior;
  a skill must consult the selected SDK's documentation before making a storage
  guarantee. [S17]
- Expo permissions are configured through app configuration/native projects and
  require platform-aware review. [S16]
- Android's official security guidance covers least privilege, secure network
  communication, Keystore/platform crypto, secure authentication, dependency
  maintenance, exported components, debug features, WebView and deep-link
  risks. Android maps common risk guidance to OWASP MASVS categories. [S24]–
  [S27]
- Apple directs developers to request only data needed for a feature, make
  permission purpose clear, provide precise user control, and report applicable
  privacy practices for App Store distribution. [S28], [S29]
- OWASP MASVS supplies a mobile security verification taxonomy, while MASTG
  supplies testing guidance; NIST SSDF provides secure-development practices
  across the software lifecycle. [S30]–[S32]

**Design inference: security review profile**

The future verifier should inspect the following only when the diff or
repository configuration makes each item relevant:

| Area | Candidate high-signal checks | Evidence boundary |
| --- | --- | --- |
| Client secrets | credential-like literals, private keys, production tokens, secrets copied into app config or `EXPO_PUBLIC_*` values | report a likely exposure; never print the value in review evidence |
| Authentication/session | no password or long-lived privileged secret stored in ordinary client storage; logout/expiry/error behavior is deliberate | source and test evidence; server-side authorization remains outside client-only proof |
| Network | HTTPS/cleartext policy, certificate/pinning design when chosen, safe URL/deep-link handling, untrusted WebView/native-bridge inputs | Android/iOS configuration plus platform testing when touched |
| Storage | data classification, SecureStore/platform keystore use for the selected SDK, backup and logout/retention implications | source/config plus device observation if behavior depends on native storage |
| Permissions/privacy | minimum declared permissions, feature-timed requests, understandable purpose strings, app-store privacy declaration impact | manifest/app config plus Android/iOS device behavior where applicable |
| Native boundary | config plugins, native modules, `android:exported`, intents, URL schemes, debug flags, update/code-signing changes | platform configuration and, for release state, owner-controlled store/build evidence |
| Dependencies | changed package compatibility, lockfile integrity, Expo Doctor findings, unsupported/unmaintained native packages | declared package manager and repository tooling; no invented vulnerability claim |

An independent verifier must **not** expose a suspected secret, make network
calls using it, download unknown code, inspect protected account settings, or
claim mobile penetration testing from source review. It should produce a
redacted finding and pause for authorized remediation or security testing.

### 5. Expo and managed-workflow delivery

**Verified facts**

- Expo app config drives Prebuild, Expo Go loading, and OTA manifests; the
  resolved public view can be inspected with Expo CLI. [S13]
- Expo Doctor analyzes app config, `package.json`, dependency compatibility,
  configuration files, and project health. It can also check React Native
  Directory package metadata and native-directory/app-config synchronization.
  [S12], [S20]
- Development builds provide a development environment that more closely
  reflects native-runtime behavior than Expo Go for applications requiring
  custom native code or production-like update behavior. [S38]
- EAS Update requires runtime compatibility: a JavaScript update that expects a
  different native runtime can fail or crash. Expo recommends a distinct runtime
  version when native runtime changes. [S18]
- EAS code signing protects updates only under its configured trust model;
  private-key protection, rotation, and runtime-version handling are part of
  the delivery surface. [S19]
- EAS credentials and environment variables have distinct visibility behavior,
  and EAS's own docs maintain that client-bundled values are public. [S14],
  [S15], [S20]
- CNG/config plugins and New Architecture configuration can affect generated
  native projects, compatibility, and build behavior. [S21], [S22]

**Design inference: Expo review gates**

- If `expo`, `app.json`/`app.config.*`, `eas.json`, config plugins, native
  directories, `expo-updates`, or an Expo SDK upgrade change, run the
  repository's Expo-aware validation (`expo-doctor` when configured) and
  inspect the resolved configuration. Treat an unconfigured command as a
  reported gap, not a permission to install or upgrade dependencies.
- For changed native configuration, modules, permissions, runtime version,
  signing, or update channel, require an appropriate development build or
  release-like build. Expo Go, unit tests, and static scans do not prove that
  changed native runtime behavior works.
- For EAS Update changes, verify runtime-version/channel/environment intent and
  test a compatible binary/update pair. Publishing an update, handling signing
  keys, or reading EAS account settings are external actions outside a
  read-only verifier.

### 6. Accessibility and inclusive interaction

**Verified facts**

- React Native's accessibility APIs integrate with VoiceOver and TalkBack;
  platform implementations differ. Accessible controls benefit from a suitable
  accessibility label and role/state/value semantics. [S05]
- Android's quality material identifies touch target, contrast, content
  descriptions, state restoration, and form-factor behavior as quality
  criteria. [S27]
- WCAG 2.2 is a W3C Recommendation. It provides an external standard reference
  for perceivable, operable, understandable, and robust content, but a native
  app's specific implementation evidence must come from its platform tools and
  assistive technologies. [S33]
- Apple privacy/HIG guidance reinforces requesting access only at the relevant
  time and explaining the purpose clearly. [S28]

**Design inference: accessibility checks**

For every changed interactive flow, require source review for meaningful labels,
roles, states, errors, loading feedback, focus order, touch target/contrast
considerations, and platform-specific behavior. Require VoiceOver and/or
TalkBack evidence for material native interaction changes when a configured
simulator/device exists. A web accessibility scanner may complement a React
Native Web target but cannot substitute for native assistive-technology
evidence.

### 7. Test and validation ladder

The following is a proposed **evidence ladder**, not a mandatory command list.

| Level | Use when configured/applicable | What it can establish | What it cannot establish |
| --- | --- | --- | --- |
| Static | formatter check, ESLint, TypeScript, React Hooks rules, Expo Doctor | syntax, configured style/rule violations, declared dependency/config health | actual native runtime behavior |
| Focused automated | unit/component/integration tests for changed logic | stated code behavior and regressions captured by tests | OS permissions, real app lifecycle, performance |
| Native functional | emulator/simulator/device critical-path interaction | affected platform rendering, navigation, state/lifecycle, permission prompt path | production store/release conditions unless build matches them |
| Release/performance | release-like build, profiler trace, measured scenario | frame, startup, memory, jank or update-compatibility evidence for the scenario | broad device-fleet guarantees |
| Security/release operations | owner-authorized secret scanning, signed-build/update, store/privacy review | configured delivery and account evidence | evidence a restricted reviewer cannot access |

The independent verifier should return `unavailable` or `gap` when required
evidence cannot be generated under its read-only sandbox. It must never turn
the absence of a simulator, signing credential, production account, or
performance trace into a passing result.

## Recommended Future Skill Shape

### Code-generation skill

A future generator should accept a repository-owned profile containing: React
Native/Expo SDK versions, TypeScript/JavaScript policy, package manager,
platforms, configured checks, navigation/state conventions, permission and
privacy policy, native-module/CNG policy, update policy, and test/device
expectations. It should pause where that profile is absent or contradictory.

It should generate the smallest change that fits the profile, use official
APIs for the pinned versions, add or update focused tests where the repository
has a compatible harness, preserve platform-specific boundaries, and avoid
placing secrets in code/config. It should not configure a new formatter,
security product, EAS project, store account, or native dependency merely to
make a generic checklist pass.

### Code-review skill

The review skill should compose a general code-review contract with the
conditional checks above. Findings need stable identifiers, severity, concrete
repository-relative evidence, impact, confidence, and a disposition boundary.
It should separate:

- source-proven defects (for example, a secret-like value in a public app
  config, an invalid Hook call, or an unchecked platform branch);
- configuration gaps (for example, no declared type-check command);
- required but unavailable runtime evidence (for example, no release-like
  iOS/Android validation for changed permissions); and
- advisory opportunities that must not be inflated to defects.

### Independent-verifier composition

The independent verifier should consume a sealed, exact-head review package
and execute only trusted, repository-declared, deterministic commands. It may
read the target's quality profile and emit redacted findings/gaps. It must not
write code, auto-fix lint output, create credentials, publish updates, install
tools, mutate package locks, inspect EAS/Apple/Google accounts, or certify
performance/security without the required evidence.

## Open Questions Before a Proposal

1. Which target repositories and Expo/RN SDK ranges are first-release scope?
2. Is the intended first overlay React Native only, Expo only, or one base
   mobile layer plus an Expo add-on?
3. Which configured check names and trusted argument vectors may an independent
   verifier execute in a sealed package?
4. What is the minimum device matrix: Android/iOS, simulator/emulator/physical
   device, OS versions, form factors, and accessibility technologies?
5. Which changes require release-like evidence versus a development build?
6. Does the product policy permit static secret-pattern scanning, and how are
   false positives redacted and retained?
7. Which OWASP MASVS level or control subset is appropriate for the products in
   scope? This is a risk decision, not a default the skill may invent.
8. How will app-store privacy declarations, signing, and EAS project settings
   be verified without granting the independent reviewer account access?

## FYI: Potentially Useful, Non-Normative Sources

The following are **not used for findings or recommendations above** because
they are not first-party framework/platform documentation or a standards-body
source under this research policy. They may be evaluated later, separately,
for tooling interoperability or test implementation details:

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) (Callstack).
- [Detox](https://wix.github.io/Detox/) (Wix).
- [Maestro](https://maestro.mobile.dev/) (Mobile.dev).
- [OpenSSF Scorecard and Best Practices Badge](https://www.bestpractices.dev/) (OpenSSF / Linux Foundation).
- [SLSA](https://slsa.dev/) (OpenSSF / Linux Foundation).

Any future use must document ownership, version compatibility, licensing,
maintenance, and why its guidance is supplemental rather than authoritative.
