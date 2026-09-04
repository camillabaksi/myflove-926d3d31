# Android / Google Play-readiness — audit (inga ändringar gjorda)

## STATUS: Redo med blockerare

Blockerarna är av typen "måste göras på din dator / i Play Console", inte kodfel.

## Vad som redan är korrekt

- Ett riktigt Capacitor Android-projekt finns i `android/` (Gradle 8.13, Capacitor 8.4.2, compileSdk/targetSdk 36, minSdk 24). Det är ett native Android-projekt, inte bara en webbapp.
- Paketnamn `app.myflove.mobile` konsekvent i `capacitor.config.ts`, `android/app/build.gradle` och `strings.xml`. Appnamn: MyFlove.
- versionName `4.1`, versionCode `1` — giltigt för första interna testet.
- Ikoner (alla mipmap-densiteter) och splash-bilder finns.
- Signeringsuppsättning finns förberedd: läser `android/keystore.properties` eller miljövariabler; inga nycklar i repot, och `keystore.properties`/`*.jks`/`*.keystore` är git-ignorerade. Bygget faller tillbaka på osignerat om nyckel saknas.
- Byggkommandon finns: `bun run cap:sync`, `bun run android:open`, `bun run android:aab` (`gradlew bundleRelease` → .aab, alltså App Bundle, inte bara APK).
- Version 4.1 och webb-MVP:n påverkas inte alls av Android-uppsättningen — ingen app-kod eller UI berörs.

## Blockerare (i tur och ordning)

1. **`cap sync` måste köras innan bygget.** `android/capacitor-cordova-android-plugins/` och `android/app/src/main/assets/` finns inte i repot (de är genererade och git-ignorerade), men `settings.gradle` inkluderar cordova-modulen. Utan `bunx cap sync android` misslyckas Gradle direkt.
2. **Java 21 + Android SDK 36** krävs lokalt (Android Studio installerar båda). Bygget har aldrig körts — denna miljö saknar Java/SDK, så första riktiga bygget sker hos dig.
3. **Keystore saknas** (avsiktligt). Utan den blir .aab osignerad och Play avvisar uppladdningen.
4. **Play Console-konto + app skapad** med exakt `app.myflove.mobile`.

## Arkitekturen: Capacitor + `server.url`

Installerar användaren appen får hon en **riktig native Android-app** (egen ikon, egen post i app-listan, installerad från Play Store) — men webbinnehållet är **inte paketerat lokalt**. `server.url = https://myflove.lovable.app` gör att WebView:en hämtar hela appen från nätet vid varje start. `mobile-webroot/` är bara en tom platshållarsida som Capacitor kräver som `webDir`; den visas i praktiken aldrig eftersom `server.url` tar över.

Konsekvenser:
- **Utan internet startar appen inte** — bara en vit/tom sida. Ingen offline-funktion.
- Fördel: alla webbändringar syns direkt utan ny Play-release.
- Risk vid granskning: Google kan i vissa fall flagga appar som enbart är ett fönster mot en webbplats. För **Internal Testing** är det ingen granskningsrisk i praktiken — internt test har minimal policygranskning.
- Stabilitet: helt beroende av att den publicerade webben är uppe och snabb; kallstart blir långsammare än en lokalt paketerad app.

**Rekommendation:** `server.url` är okej för första interna MVP-testet — det är snabbast till testarna och låter dig fixa buggar utan ny uppladdning. Inför en bredare beta/produktion bör vi byta till lokalt paketerade webbresurser (bygga webben till `dist/` och ta bort `server.url`), så appen startar utan nät och känns snabbare.

## Behörigheter — vad som faktiskt används

| Behörighet | Används? | Kommentar |
| --- | --- | --- |
| `INTERNET` | Ja, kritisk | Hela appen laddas över nätet |
| `POST_NOTIFICATIONS` | Ja | Påminnelser/push används i appen |
| `VIBRATE` | Ja | Alarmformat "Vibration"/"Ljud och vibration" |
| `health.READ_STEPS` (Health Connect) | Ja, men bara av `/traning` | Steg-hämtning via `capacitor-health` |

Att överväga (**inget borttaget nu**): `READ_STEPS` är den enda som kostar dig extra arbete — Play kräver ett separat **hälsodataformulär med skriftlig motivering** och en Health Connect-deklaration, plus länk till integritetspolicy. Om stegfunktionen inte ingår i MVP-testet är det klart enklast att tillfälligt ta bort behörigheten, `capacitor-health` från Android-bygget och intent-filtret i manifestet — då slipper du hela hälsodatagranskningen. Övriga tre behörigheter kräver inga särskilda deklarationer utöver det vanliga datasäkerhetsformuläret (konto/e-post, användargenererat innehåll, ev. hälsodata).

## Övrig native-konfiguration

Inget mer krävs för nuvarande funktioner. Noteringar:
- **Web Push fungerar inte i Capacitor-appen.** Notiser når bara PWA:n i webbläsaren. Vill du ha notiser i den installerade appen krävs `@capacitor/push-notifications` + Firebase (FCM). Det är en separat insats, inte en blockerare för att ladda upp .aab.
- Google Services-plugin är förberett men aktiveras först när `google-services.json` läggs in.

## Distribution via Internal Testing

Ja. En signerad .aab kan laddas upp till spåret **Internt test**, upp till 100 testare via e-postlista, och de installerar MyFlove från Play Store som vilken app som helst. Internt test kräver ingen fullständig granskning och blir tillgängligt inom minuter till ett par timmar.

## Exakt nästa steg, i ordning

**Du gör:**
1. Installera Android Studio (ger Java 21 + SDK 36).
2. Klona repot lokalt, kör `bun install`.
3. Skapa keystore: `keytool -genkey -v -keystore ~/myflove-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias myflove` — **säkerhetskopiera den**.
4. Skapa `android/keystore.properties` med sökväg och lösenord (git-ignorerad).
5. `bunx cap sync android`
6. `bun run android:aab` → `android/app/build/outputs/bundle/release/app-release.aab`
7. Play Console (25 USD engångsavgift): skapa app med `app.myflove.mobile`, aktivera Play App Signing.
8. Fyll i store-listing, datasäkerhetsformulär, integritetspolicy `https://myflove.lovable.app/integritet`, och hälsodatamotiveringen om `READ_STEPS` behålls.
9. Ladda upp .aab till **Internt test**, lägg in testarnas e-post, dela opt-in-länken.

**Lovable gör senare, om du vill:**
- Ta bort steg-/hälsobehörigheten inför Play om den inte behövs i MVP-testet.
- Byta från `server.url` till lokalt paketerade webbresurser inför bredare beta.
- Lägga till native push (FCM) så notiser fungerar i den installerade appen.
