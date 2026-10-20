# Nya Paceable-versioner för Play och TestFlight

## Versionshöjning
- Android: **6.5 → 6.6**, versionskod **26 → 27**.
- iOS: **1.3 → 1.4**, byggnummer **15 → 16**, i både Debug och Release.
- Kontrollera före uppladdning att numren är högre än de senaste i Play Console och App Store Connect; butikernas senaste nummer är ännu inte verifierade.

## Bevara det som fungerar
- Behåll Paceable-namn, godkända ikoner, Android-ID `app.myflove.mobile` och iOS-ID `se.myflove.app`.
- Behåll den nuvarande webbhosten `https://www.paceable.se`, befintlig signering, inloggning, påminnelser, synk och användardata.
- Ingen ändring av appens utseende eller funktioner, inga nya paket och ingen webbpublicering.
- Apparna laddar den publicerade webbversionen. Nya mobilpaket gör inte opublicerade webbändringar tillgängliga.

## Bygg och kontroll
- Använd de befintliga Codemagic-flödena med den befintliga Android-uppladdningsnyckeln och Apple-signeringen.
- Android: skapa signerad **AAB**, kontrollera identitet/version och native-tester. Ingen automatisk uppladdning till Play.
- iOS: skapa signerad **IPA**, kontrollera identitet/version. Det befintliga flödet skickar automatiskt till TestFlight; en byggkörning får därför startas först när även den uppladdningen är godkänd. Ingen App Store-release.
- Uppdatera bygginstruktioner och båda ändringsloggarna; redovisa faktiska resultat och kvarstående fysisk telefonkontroll.

## Tillgång som behövs
Den här miljön saknar för närvarande Java/Android SDK och Xcode. Ingen Codemagic-anslutning eller Codemagic-token hittades. Versionsändringar kan förberedas här, men signerade paket kräver tillgång till den befintliga byggtjänsten och dess signering. Om tillgång inte kan ordnas lämnas tydliga instruktioner för att starta båda befintliga flödena i Codemagic; inget paket påstås vara byggt innan det faktiskt finns.

## Teknisk avgränsning
Versionsändringarna görs i `android/app/build.gradle` och `ios/App/App.xcodeproj/project.pbxproj`. Återanvänd `codemagic.yaml`, `mobile-webroot` och befintlig Capacitor-konfiguration. Inga ändringar av hemligheter, domän, lagringsnycklar eller appidentifierare.