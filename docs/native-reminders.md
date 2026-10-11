# Paceable: native reminders

Native reminders use Capacitor Local Notifications, not a Web Push subscription. The existing `useReminderSync` computes the same explicit reminder choices for both transports. Nothing is scheduled until the active account opts in on this device. Permission checks never prompt automatically; the settings buttons request notification permission and Android exact-alarm access separately.

The OS queue holds the closest 60 occurrences within the existing 14-day projection (minus unrelated pending notifications). It refills on app resume, edits and the existing 15-minute foreground refresh. Pauses/night defer alarms using the saved IANA zone. Cancelling/completing an occurrence removes it; medication snoozes use the same device queue. Encrypted-but-unreadable stores and unavailable family queries preserve their already queued sources until data can be loaded.

All native writes, cancellation and logout are serialized. Owner/epoch checks invalidate an in-flight schedule when the account changes. Logout removes pending and delivered Paceable notifications; another account does not inherit the previous account's consent. Notification taps check the current authenticated owner before opening a same-origin route. Foreground alarms consult native pending/delivered notifications to avoid playing a second sound.

## Build

Install the committed dependencies with `bun install --frozen-lockfile`. Android requires JDK 21, Android SDK 36 and network access for Gradle dependencies. Keep the existing Android application id `app.myflove.mobile`, iOS bundle id `se.myflove.app` and signing identities.

- Android: `npm run android:aab` prepares WAVs from the existing alarm generator, syncs Capacitor and runs `bundleRelease`. Sign with the existing `android/keystore.properties` or `MYFLOVE_KEYSTORE_*` / `MYFLOVE_KEY_*` environment variables. Never distribute an unsigned bundle or replace the keystore. Version is 6.5 / code 24; confirm the store has not already used that code. The new Codemagic `android-release` workflow builds a signed AAB once the secret group `paceable_android_signing` contains `MYFLOVE_KEYSTORE_BASE64` (the **existing** keystore encoded as base64), `MYFLOVE_KEYSTORE_PASSWORD`, `MYFLOVE_KEY_ALIAS` and `MYFLOVE_KEY_PASSWORD`. It fails before building if credentials are absent and does not publish to Google Play automatically.
- iOS: start `ios-release` in the existing Codemagic project on the merged `main` commit. The workflow now generates the WAV resources before `cap sync ios`, then resolves Swift packages, signs with the existing `MyFlove ASC` integration and submits to TestFlight. Version is 1.3 / build 14; check the latest uploaded build number before starting.

`npm run cap:sync` and `npm run cap:sync:ios` can prepare each native project locally. The ignored sound files are generated deterministically; Xcode copies individual WAVs into the app bundle root. The new shell opens `https://www.paceable.se` directly, avoiding a redirect that can lose the native bridge. Old installed shells display an update-required message rather than claiming native support.

## Physical-device acceptance

On both Android and iOS, install the new signed build, open Notifications and enable them. On Android also allow exact times using the explicit button. Start `Testa notis`, lock the screen and wait 10 seconds. Confirm the selected audio signal, notification text and tap destination.

Then create an opted-in reminder 2 minutes ahead and test with the app in background/closed and the screen locked. Check editing its time, cancelling, marking complete, taking/snoozing a medication, and changing the chosen sound. A reminder during quiet mode should arrive after the pause/night, not sound during it. Test a device restart (Android), offline operation after scheduling, and turning OS permissions off/on. Sign out and switch accounts: the previous account's alarms must not appear, and the new account must opt in separately.

## Limits and current verification

This is local OS scheduling, not server-to-native APNs/FCM. A change made on another device while the mobile app is closed reaches this phone's queue next time it opens. Notifications follow the device's notification settings, Focus/Do Not Disturb and power-management rules. Android's idle exact-alarm quota can delay closely spaced alarms; iOS vibration is controlled by the system rather than an Android-style channel flag. No notification can bypass a user's force-stop/disabled notification settings.

Capacitor sync and JavaScript checks can run in this workspace. Actual Android/iOS compilation, store submission and locked-screen acceptance remain required in the signed build environment; a successful web deployment does not update the installed native plugin.
