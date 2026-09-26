# Phase 1 — Android Native Build Verification

> **Document:** `docs/audit/phase1-android-build-verification.md`
> **Date:** 2026-09-26
> **Scope:** Real Android build of the bare React Native 0.73.6 app (`mobile/`).
> **Related:** DL-011 (MySQL), DL-012 (op-sqlite 9.3.0), `docs/audit/trl6-implementation-plan.md`

## Summary

The mobile app builds to **real, signed Android APKs** from the committed source.
All three debuggable product flavors were assembled successfully in a JDK 17 +
Android SDK (NDK 25.1.8937393, CMake 3.22.1) environment:

| Variant | Task | Artifact | applicationId |
|---|---|---|---|
| Development | `assembleDevelopmentDebug` | `app-development-debug.apk` (56.7 MB) | `ai.vepari.app.dev` |
| Staging | `assembleStagingDebug` | `app-staging-debug.apk` (56.7 MB) | `ai.vepari.app.staging` |
| Production | `assembleProductionDebug` | `app-production-debug.apk` (56.7 MB) | `ai.vepari.app` |

Each APK is debug-signed (`debug.keystore`, generated locally and **git-ignored** —
never committed), `versionName 1.0-dev`, `minSdkVersion 21`, `compileSdkVersion 34`,
label **"Vepari AI"**.

### APK content verification (development-debug)

- **`libop-sqlite.so`** present for **all four ABIs** (`arm64-v8a`, `armeabi-v7a`,
  `x86`, `x86_64`) — the encrypted local database module compiled and linked
  against React Native 0.73.6's native libraries.
- **`libcrypto.so`** (OpenSSL, `com.android.ndk.thirdparty:openssl:1.1.1q-beta-1`)
  present for all four ABIs — the SQLCipher crypto backend is compiled in
  (`-DOP_SQLITE_USE_SQLCIPHER=1`, `-DUSE_SQLCIPHER=1`).
- **`libhermes.so`**, `libjsi.so`, `libreact_nativemodule_core.so`,
  `libturbomodulejsijni.so` present — Hermes engine + the RN 0.73 split prefab
  targets op-sqlite links against.
- 6 `classes*.dex` (multidex) and `AndroidManifest.xml` packaged.

## Key resolution — op-sqlite / React Native version alignment (DL-012)

The mobile app pulled `@op-engineering/op-sqlite` at 18.x, whose Android CMake
build unconditionally requires the **unified `ReactAndroid::reactnative` prefab
target** introduced in React Native 0.76. React Native is locked at **0.73.6**
(product-owner directive: do not upgrade RN), which exposes the older **split
targets** (`jsi` / `turbomodulejsijni` / `react_nativemodule_core`). The 18.x CMake
`configure` therefore failed against 0.73.6.

**Resolution:** pin `@op-engineering/op-sqlite` to **9.3.0** (exact). Its
`CMakeLists.txt` version-guards the link step —
`if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76) … else () …` — so on RN 0.73.6 it
links the split targets the prefab actually provides. SQLCipher encryption at rest
is retained via the `"op-sqlite": { "sqlcipher": true }` block in
`mobile/package.json` (pulls the official NDK OpenSSL prebuilt).

op-sqlite 9.3.0 exposes only the async `execute()` API (no `executeSync`), so the
local database layer (`db.ts`, `SyncCheckpointRepository`, `syncEngine`,
`memoryRepository`, and the one screen caller) was converted to `async`/`await`.
Mobile `tsc --noEmit` and ESLint pass clean.

## Monorepo hermesc fix (release builds)

The React Native Gradle plugin auto-detects `hermesc` relative to the `react.root`
directory (`mobile/`), but in this npm-workspaces monorepo `react-native` is
hoisted to the repository root, so the auto-detected path does not exist and
release JS→bytecode compilation failed with *"Couldn't determine Hermesc
location"*. Fixed by setting `react.hermesCommand` in `mobile/android/app/build.gradle`
to the hoisted binary (`../../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc`;
the plugin substitutes `%OS-BIN%`). This makes release builds work in CI and on dev
machines, not just here. The release JS bundle + Hermes bytecode step
(`createBundleProductionReleaseJsAndAssets`) then completes successfully.

## Container-environment notes (reproducibility)

These are properties of the cloud build container, **not** of the app; they do not
affect CI or developer machines.

1. **`JAVA_TOOL_OPTIONS`.** The container's agent proxy injects TLS/proxy config
   via `JAVA_TOOL_OPTIONS`. Every child JVM then prints `Picked up
   JAVA_TOOL_OPTIONS: …` to stderr, and AGP 8.1.1's prefab task treats non-empty
   prefab-CLI stderr as fatal (`IllegalStateException`). Building with
   `JAVA_TOOL_OPTIONS` unset avoids this. No app files change.
2. **Offline vs. downloads.** With `JAVA_TOOL_OPTIONS` unset there is no proxy, so
   uncached artifacts cannot download. Debug builds use warm caches and build
   with `--offline`. Release variants pull distinct `*-release.aar` artifacts;
   these are cache-warmed with the proxy on (a dependency-resolution task that does
   not invoke the native prefab), after which the full release build runs offline.
3. **Maven Central 429.** Earlier in the effort Maven Central returned HTTP 429
   through the proxy; the dependency cache is now warm and recent builds show zero
   429s.

## Honest limitations

- **Runtime launch is not verified here.** This cloud container has no emulator
  (no `/dev/kvm`) and no physical device, so on-device launch and native-module
  runtime initialization (op-sqlite open + SQLCipher key) cannot be exercised in
  this environment. This must be validated on a real device / CI emulator.
- **Production release signing.** Release builds fall back to the debug keystore
  unless `VEPARI_UPLOAD_STORE_FILE` (and related) are provided. A Play-Store
  upload build requires the real upload key supplied from secure CI credentials —
  never committed to Git.

## How to reproduce (this container)

```bash
cd mobile/android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ANDROID_HOME=/root/android-sdk
# Debug APKs (warm cache):
env -u JAVA_TOOL_OPTIONS ./gradlew :app:assembleDevelopmentDebug \
  :app:assembleStagingDebug :app:assembleProductionDebug --offline --console=plain
# Release AAB (two-phase): warm release AARs with proxy on, then build offline:
./gradlew :app:mapProductionReleaseSourceSetPaths --console=plain
env -u JAVA_TOOL_OPTIONS ./gradlew :app:bundleProductionRelease --offline --console=plain
```
