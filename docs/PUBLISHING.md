# Publishing (native builds, store submission, OTA updates)

Publishing uses **EAS** (Expo Application Services). Three things, in order of how often you do them:

| Command | What it does | How often |
|---|---|---|
| `eas update` | Push JS/asset changes over-the-air to existing installs (no store review) | often |
| `eas build` | Produce a native binary (.apk/.aab/.ipa) in the cloud | when native deps change |
| `eas submit` | Upload a production binary to the App Store / Play Store | per release |

Wrapper scripts live in `scripts/publish/` and npm scripts are in `package.json`. Check readiness any time:
```bash
scripts/publish/doctor.sh
```

## One-time setup
1. **Log in to Expo** (this is the step I can't do for you — it's interactive):
   ```bash
   npx eas-cli login        # account owner is "jljackson222" (matches app.json)
   ```
   For CI, set `EXPO_TOKEN` instead (Expo dashboard → Access Tokens).
2. The project is already linked: `app.json` has `extra.eas.projectId` + `owner`, and `updates.url`.

## Build profiles (`eas.json`)
- **development** — a dev client (`developmentClient: true`). Install it on your phone to run the app
  with all native modules and Fast Refresh. **Build it in the cloud** — no local Android NDK needed:
  ```bash
  scripts/publish/build.sh development android   # or ios, or all
  # npm run build:dev -- --platform android
  ```
  (For an iOS *simulator* dev build use the `development-simulator` profile.)
- **preview** — internal ad-hoc build (APK / ad-hoc IPA) to sideload or share for testing.
  ```bash
  scripts/publish/build.sh preview android
  ```
- **production** — store-ready binary, auto-incremented version code/build number.
  ```bash
  scripts/publish/build.sh production all
  ```

## Submit to the stores
Needs store accounts: an **Apple Developer** account + an App Store Connect app (iOS), and a
**Google Play Console** app + a service-account JSON key (Android). Then:
```bash
scripts/publish/submit.sh ios       # or android
# npm run submit:ios
```
EAS will walk you through credential setup on first run.

## Over-the-air updates (the fast path)
For JS-only changes (UI tweaks, logic, new screens that use existing native modules):
```bash
scripts/publish/update.sh production "fix: faster whistle"
# npm run ota -- --branch production --message "..."
```
This ships instantly to installed apps **on a matching runtime**. `runtimeVersion` uses the
**`appVersion` policy** (app.json), so the runtime is the app's `version` and OTA updates only reach
builds with the same version. **Bump `version` in app.json whenever you change native deps** (then
build + submit a new binary), so an OTA can't land on an incompatible native build.

## Typical release flow
1. `npm test && npm run typecheck && npm run lint` — green.
2. Native deps unchanged? → `scripts/publish/update.sh production "..."` (done — OTA).
3. Native deps changed (new module, SDK bump)? → `scripts/publish/build.sh production all` →
   `scripts/publish/submit.sh ios` + `scripts/publish/submit.sh android`.

## Notes
- `appVersionSource: remote` (eas.json) means EAS owns the build numbers — don't hand-edit
  `version`/`versionCode` for production.
- First-ever store submission of a brand-new app also needs the store listing (name, screenshots,
  privacy) filled in on App Store Connect / Play Console.

## Adding contributors (e.g. a second family member) + CI publishing

**Recommended model for this project: keys live in GitHub, people contribute via PRs.**
Nobody needs signing keys on their laptop, and a beginner can't accidentally break a release.

1. **CI does the publishing** — `.github/workflows/publish.yml` builds via EAS using a single repo
   secret `EXPO_TOKEN` (Settings → Secrets and variables → Actions). Create the token at
   expo.dev → Account settings → Access tokens. Trigger a build from the Actions tab (pick a profile)
   or by pushing a `v*` tag. Store submission can be added once store creds are configured (see below).
2. **A new contributor just needs a GitHub account** — add them as a repo collaborator
   (Settings → Collaborators) or keep `main` protected and have them open PRs from forks. They run the
   app locally and test, but never touch keys; merging to `main`/tagging triggers the CI publish.
3. **(Optional) let them run `eas build` from their own machine** — create an Expo **Organization**,
   move the project under it (Project settings → Transfer), and invite them (Organization → Members)
   with a role (Viewer / Developer / Admin). They make a free Expo account and accept the invite.
   Only needed if they want to build/publish from their laptop rather than via CI.
4. **Store accounts (Apple / Google) are separate and usually NOT needed per-person.** Let CI submit
   with shared store credentials instead of giving each person store access:
   - **Apple**: an App Store Connect **API key** (.p8 + Key ID + Issuer ID) — non-interactive, works in
     CI and for `eas build`/`eas submit`. Generate at App Store Connect → Users and Access →
     Integrations → App Store Connect API. (Requires the paid Apple Developer Program.)
   - **Google Play**: a **service-account JSON** key with Play Console access.
   Store these in EAS (`eas credentials`) or as GitHub secrets the workflow reads. If you *do* want a
   person to have direct store access, invite them with a scoped role (App Store Connect → Users and
   Access; Play Console → Users and permissions) — but prefer CI + shared keys for a hobby project.
