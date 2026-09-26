# Android Production Build & Play Store Readiness

Android release procedure for the React Native mobile app. (Prompts 225–226.)

## 1. Signing (Prompt 225)

The upload keystore is a **secret** — never committed to Git and never baked
into the repo. It lives in the CI secret store / a developer's secure local
store only.

```bash
# Generate the upload keystore once (kept offline / in secret store):
keytool -genkeypair -v -keystore vepari-upload.keystore \
  -alias vepari -keyalg RSA -keysize 2048 -validity 10000
```

`android/gradle.properties` references the keystore via environment/secret
values (`VEPARI_UPLOAD_STORE_FILE`, `VEPARI_UPLOAD_KEY_ALIAS`,
`VEPARI_UPLOAD_STORE_PASSWORD`, `VEPARI_UPLOAD_KEY_PASSWORD`) — never literals.

## 2. Production build

```bash
cd mobile/android
./gradlew clean
./gradlew bundleRelease      # produces app/build/outputs/bundle/release/app-release.aab
```

The `.aab` (Android App Bundle) is the artifact uploaded to Play; Play
re-signs per-device with the app signing key.

## 3. Pre-submission checklist

- [ ] `versionCode` incremented; `versionName` matches the release tag.
- [ ] No secrets in the JS bundle (`env.ts` resolves at runtime; AI/Sarvam keys are server-side only — see `CLAUDE.md §Security`).
- [ ] Release build points at the **production** API base URL, not staging/localhost.
- [ ] ProGuard/R8 minification enabled; crash-free start verified on a physical device.
- [ ] All 23 language packs load; Indic fonts render (see `docs/decisions/DL-010`).
- [ ] Offline-first flows verified with airplane mode (queue → sync on reconnect).

## 4. Play Store submission readiness (Prompt 226)

- [ ] Data safety form: declares what is collected (phone number for OTP, business data) and that data is encrypted in transit and at rest.
- [ ] Privacy policy URL live (in-app: `PrivacyPolicyScreen`).
- [ ] Permissions justified: microphone (voice input), network. No unused permissions.
- [ ] Target API level meets the current Play requirement.
- [ ] Store listing: title, short/full description, screenshots per form factor, feature graphic.
- [ ] Content rating questionnaire completed.
- [ ] Internal testing track validated before production rollout (staged rollout %).

## 5. Rollback

Play supports halting a staged rollout and rolling back to the previous
release track. Keep the previous `.aab` and its `versionCode` available. The
backend must remain backward-compatible with the previous app version for the
duration of any staged rollout (see backend expand/contract migration rules).
