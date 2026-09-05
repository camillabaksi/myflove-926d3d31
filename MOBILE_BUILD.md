# MyFlove — Native app (iOS + Android)

Appen är förberedd som en **Capacitor-app** som laddar den publicerade webben
(`https://myflove.lovable.app`). Det betyder att du bara behöver bygga om
native-projektet när du ändrar ikoner, splash, plugins eller bundle-ID —
allt annat (UI, funktioner, buggfixar) uppdateras automatiskt när du
republiserar webben i Lovable.

- **Bundle ID (App Store & Play):** `app.myflove.mobile`
- **App-namn:** MyFlove
- **Konfig:** `capacitor.config.ts`

---

## Engångs­uppsättning på din dator

Du kör detta lokalt (inte i Lovable). Du behöver:

- **Node/Bun** (samma som projektet redan använder)
- **Android:** Android Studio (Windows/Mac/Linux)
- **iOS:** en **Mac** med Xcode 15+, CocoaPods (`sudo gem install cocoapods`)

```bash
# 1. Klona projektet lokalt och installera
git clone <ditt-repo>
cd myflove
bun install

# 2. Lägg till native-plattformarna (skapar mapparna ios/ och android/)
bunx cap add ios
bunx cap add android

# 3. Synka konfig + plugins in i native-projekten
bunx cap sync
```

Efter det committar du `ios/` och `android/` till repot.

---

## Köra / testa

```bash
# Android (öppnar Android Studio)
bunx cap open android

# iOS (öppnar Xcode) — kräver Mac
bunx cap open ios
```

I Android Studio / Xcode: välj en emulator eller ansluten enhet och tryck Run.
Appen startar och laddar `myflove.lovable.app` direkt.

---

## Ingen Mac? Bygg iOS i molnet

Två bra alternativ — båda tar Capacitor-projektet som det är:

- **[Codemagic](https://codemagic.io)** — gratis-tier räcker för start,
  bygger iOS `.ipa` utan Mac.
- **[Ionic Appflow](https://ionic.io/appflow)** — samma team som bygger Capacitor.

Peka tjänsten mot ditt Git-repo, välj Capacitor-workflow, ladda upp din
Apple Developer-signeringsprofil, och du får en `.ipa` att skicka till
App Store Connect.

---

## Publicera

### Google Play (Android)

1. Skapa Play Console-konto (25 USD engångsavgift): https://play.google.com/console
2. I Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
   Skapa en keystore och **förvara den säkert** — förlorad keystore = du kan aldrig
   uppdatera appen igen.
3. I Play Console: skapa app, ladda upp `.aab`, fyll i store-listing, integritets­policy
   (`https://myflove.lovable.app/integritet`), skärmdumpar, ikon 512×512.
4. Skicka till granskning. Vanligtvis godkänd inom 1–3 dagar.

### App Store (iOS)

1. Skaffa **Apple Developer Program** (99 USD/år): https://developer.apple.com
2. I App Store Connect: skapa app med bundle-ID `app.myflove.mobile`.
3. I Xcode: välj **Any iOS Device (arm64)** → **Product → Archive** → Distribute App
   → App Store Connect → Upload.
4. I App Store Connect: fyll i metadata, skärmdumpar (6.7" och 5.5" iPhone krävs),
   integritets­policy, granskningsinfo.
5. Skicka till granskning. Vanligtvis 1–3 dagar.

---

## När du uppdaterar appen

**Ändrar du bara webb-kod (UI, funktioner, buggfixar):**
→ Publicera i Lovable. Native appen visar den nya versionen vid nästa start.
Ingen ny store-release behövs.

**Ändrar du bundle-ID, ikon, splash, Capacitor-plugin eller version:**
→ Höj `versionCode` (Android) / `CFBundleVersion` (iOS), kör `bunx cap sync`,
bygg ett nytt release-bundle och ladda upp till respektive store.

---

## Native push-notiser (senare)

Nuvarande push (Web Push med VAPID) fungerar i PWA-läge på webben, men
**inte inuti en Capacitor-app på iOS**. När du vill ha native push:

1. Lägg till `@capacitor/push-notifications`.
2. Android: koppla Firebase-projekt (FCM) — lägg `google-services.json` i `android/app/`.
3. iOS: skapa APNs-nyckel i Apple Developer, aktivera Push Notifications capability i Xcode.
4. Byt ut `src/lib/push-client.ts` mot en Capacitor-medveten variant som registrerar
   FCM/APNs-token istället för Web Push-subscription.

Säg till när du är där, så gör jag den migreringen.

---

## Steg från hälsoappen (Apple Health / Health Connect) — AVSTÄNGT i MVP

Health Connect-integrationen är **borttagen ur Android-bygget** (2026-09-04) så att
första Google Play Internal Test slipper hälsodata-deklarationer och Health
Connect-granskning. `/traning` fungerar oförändrat med manuell inmatning av steg.

Borttaget: `capacitor-health`-beroendet, `READ_STEPS`-behörigheten och Health
Connect-intent-filtret i `android/app/src/main/AndroidManifest.xml`.
`src/lib/health-steps.ts` finns kvar med samma API men returnerar "ej tillgängligt".

För att återaktivera senare:

1. `bun add capacitor-health` och återinför plugin-anropen i `src/lib/health-steps.ts`.
2. Lägg tillbaka i `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />

<!-- inuti <activity> för MainActivity -->
<intent-filter>
  <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>
```

3. iOS (Xcode): HealthKit-capability + `NSHealthShareUsageDescription` i Info.plist.
4. Kör `bun run cap:sync`.
5. I Play Console krävs då en skriftlig motivering för hälsodata-behörigheten samt
   länk till integritetspolicyn (`/integritet`).


---

## Android App Bundle (.aab) — uppdaterat 2026-09-04

Native Android-projektet ligger nu i `android/` i repot (paket `app.myflove.mobile`,
versionName `4.1`, versionCode `2`). `webDir` pekar på `mobile-webroot/` — en liten
fallback-sida, eftersom appen laddar den publicerade webben via `server.url`.

### 1. Skapa din keystore (en gång, lokalt — commit den ALDRIG)

```bash
keytool -genkey -v -keystore ~/myflove-release.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias myflove
```

Skapa `android/keystore.properties` (git-ignorerad):

```properties
storeFile=/absolut/sokvag/till/myflove-release.jks
storePassword=...
keyAlias=myflove
keyPassword=...
```

Alternativt sätt miljövariablerna `MYFLOVE_KEYSTORE_FILE`, `MYFLOVE_KEYSTORE_PASSWORD`,
`MYFLOVE_KEY_ALIAS`, `MYFLOVE_KEY_PASSWORD` (för CI).

### 2. Bygg bundlen

```bash
bun install
bun run cap:sync
bun run android:aab
```

Resultat: `android/app/build/outputs/bundle/release/app-release.aab`

Utan keystore byggs bundlen osignerad — då måste du signera via Play App Signing
eller Android Studio (**Build → Generate Signed Bundle / APK → Android App Bundle**).

### 3. Google Play Console

1. Skapa appen med paketnamn `app.myflove.mobile`.
2. Aktivera **Play App Signing** (rekommenderat) och ladda upp din upload-key.
3. Ladda upp `.aab` till ett **Internt test**-spår för testning.
4. Fyll i datasäkerhetsformuläret: appen samlar konto-/hälsodata (steg) och
   länka integritetspolicyn `https://myflove.lovable.app/integritet`.
5. Health Connect-behörigheten (`READ_STEPS`) kräver en skriftlig motivering i
   Play Console-formuläret för hälsodata.

### 4. Vid varje ny release

Höj `versionCode` (och ev. `versionName`) i `android/app/build.gradle`, kör
`bun run cap:sync` och bygg om. Rena webbändringar kräver ingen ny release —
appen hämtar den publicerade webben vid start.
