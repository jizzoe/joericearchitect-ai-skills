# Sources: React Native and Expo Quality Research

Access date: 2026-08-15

All sources in this manifest are official documentation from the organization
that owns or maintains the referenced technology, or a standards-body/security
standard source. The FYI-only sources named in the findings document are not
part of this manifest and were not used to derive findings.

| ID | Title | Publisher / source type | Relevance |
| --- | --- | --- | --- |
| S01 | [Performance Overview](https://reactnative.dev/docs/performance) | Meta / React Native official docs | JS/UI frame budgets, release-build testing, common bottlenecks. |
| S02 | [Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration) | Meta / React Native official docs | List responsiveness, memory, blank-area, and tuning tradeoffs. |
| S03 | [Optimizing JavaScript loading](https://reactnative.dev/docs/optimizing-javascript-loading) | Meta / React Native official docs | Hermes, lazy loading, and module side-effect considerations. |
| S04 | [Profiling](https://reactnative.dev/docs/profiling) | Meta / React Native official docs | Instruments, Android Studio profiling, and release-like profiling preconditions. |
| S05 | [Accessibility](https://reactnative.dev/docs/accessibility) | Meta / React Native official docs | VoiceOver/TalkBack integration and React Native accessibility semantics. |
| S06 | [Security](https://reactnative.dev/docs/security) | Meta / React Native official docs | Sensitive information, client secrets, storage, authentication, and networking. |
| S07 | [Testing](https://reactnative.dev/docs/testing-overview) | Meta / React Native official docs | Static analysis through end-to-end testing and testability. |
| S08 | [Using TypeScript](https://reactnative.dev/docs/typescript) | Meta / React Native official docs | React Native TypeScript defaults, configuration, and type checking. |
| S09 | [Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code) | Meta / React Native official docs | Supported platform-condition and file-organization mechanisms. |
| S10 | [Rules of React](https://react.dev/reference/rules) | Meta / React official docs | Purity, immutability, component invocation, and Rules of Hooks. |
| S11 | [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) | Meta / React official docs | Official React lint diagnostics for correctness and performance. |
| S12 | [Tools for development](https://docs.expo.dev/develop/tools/) | Expo official docs | Expo Doctor scope and project-health checks. |
| S13 | [Configure with app config](https://docs.expo.dev/workflow/configuration/) | Expo official docs | App config resolution, public config inspection, and sensitive-config boundary. |
| S14 | [Environment variables in EAS](https://docs.expo.dev/eas/environment-variables/) | Expo official docs | Environment visibility and client-public value boundary. |
| S15 | [Environment variables without EAS](https://docs.expo.dev/eas/environment-variables/without-eas/) | Expo official docs | `EXPO_PUBLIC_` behavior and client-side environment exposure. |
| S16 | [Permissions](https://docs.expo.dev/guides/permissions/) | Expo official docs | Native permission configuration and platform scope. |
| S17 | [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) | Expo official docs | Secure local storage API and platform-specific considerations. |
| S18 | [Using EAS Update](https://docs.expo.dev/build/updates/) | Expo official docs | Runtime-version compatibility, channels, and development-build boundary. |
| S19 | [End-to-end code signing with EAS Update](https://docs.expo.dev/eas-update/code-signing/) | Expo official docs | Update signing, key rotation, and runtime implications. |
| S20 | [package.json](https://docs.expo.dev/versions/latest/config/package-json/) | Expo official docs | Expo Doctor configuration and dependency-directory checks. |
| S21 | [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) | Expo official docs | Native generation and configuration/plugin implications. |
| S22 | [React Native's New Architecture](https://docs.expo.dev/guides/new-architecture/) | Expo official docs | New Architecture configuration and dependency validation. |
| S23 | [App version management](https://docs.expo.dev/build-reference/app-versions/) | Expo official docs | Version/build-number management. |
| S24 | [Security checklist](https://developer.android.com/privacy-and-security/security-tips) | Google / Android official docs | Android authentication, key handling, privacy, dependencies, networking, and native-code guidance. |
| S25 | [Mitigate security risks in your app](https://developer.android.com/privacy-and-security/risks) | Google / Android official docs | Android risks mapped to OWASP MASVS categories. |
| S26 | [Connect to the network](https://developer.android.com/develop/connectivity/network-ops/connecting) | Google / Android official docs | Secure network-communication practices and configuration. |
| S27 | [Core app quality](https://developer.android.com/docs/quality-guidelines/archive/core/core-app-quality-2021-05-17) | Google / Android official docs | Quality, accessibility, lifecycle, security, stability, and StrictMode checks. |
| S28 | [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy) | Apple official docs | Data minimization, permission timing, transparency, and user control. |
| S29 | [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Apple official policy | Distribution-quality, privacy, and platform-policy reference. |
| S30 | [OWASP MASVS](https://mas.owasp.org/MASVS/) | OWASP mobile security standard | Mobile application security verification taxonomy. |
| S31 | [OWASP MASTG](https://mas.owasp.org/MASTG/) | OWASP mobile security standard | Mobile application security testing guidance. |
| S32 | [NIST SP 800-218, Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final) | NIST standard | Secure software-development practices and lifecycle context. |
| S33 | [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) | W3C Recommendation | Widely adopted accessibility standard; native evidence remains platform-specific. |
| S34 | [TSConfig: `strict`](https://www.typescriptlang.org/tsconfig/strict.html) | Microsoft / TypeScript official docs | Strict type-checking behavior and upgrade implications. |
| S35 | [typescript-eslint: Getting Started](https://typescript-eslint.io/getting-started/) | typescript-eslint official docs | Recommended, strict, stylistic, and typed-lint configuration options. |
| S36 | [ESLint Core Concepts](https://eslint.org/docs/latest/use/core-concepts/) | OpenJS Foundation / ESLint official docs | Configurable lint rules, fixes versus suggestions, and plugins. |
| S37 | [What is Prettier?](https://prettier.io/docs/) | Prettier official docs | Formatter scope and distinction from semantic validation. |
| S38 | [Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/) | Expo official docs | Development-build purpose and native-runtime testing boundary. |

## Source Quality Notes

- The React Native pages are official Meta-hosted documentation; React pages
  govern React semantics, while React Native pages govern native framework
  behavior.
- Expo pages govern Expo CLI, app configuration, EAS, update, and managed/native
  workflow behavior. Their current guidance is version-sensitive and should be
  refreshed for a target Expo SDK before a skill makes a version-specific rule.
- Android and Apple pages govern their respective platform behavior. A
  React Native abstraction does not eliminate platform-specific testing,
  permission, privacy, or distribution constraints.
- OWASP MASVS/MASTG, NIST SSDF, and WCAG 2.2 are frameworks for selecting and
  assessing controls. They do not authorize a skill to claim a product meets a
  chosen assurance level without scoped evidence and an owner-approved profile.
