# Paceable etapp 1C — sista visuella polishen

## Mål och avgränsning
Paceable känns igen genom varm ivory, aubergine-text, den lilla mjuka accentpaletten, stenarna och formerna — inte genom en ny ensam huvudfärg. Endast presentation ändras. Ingen publicering, migration eller förändring av Core, kalenderdata, familjeskydd, sparning, routes eller tekniska identifierare.

## 1. Färger som faktiskt används
- De nuvarande grundfärgerna är redan ivory/plommon, men äldre utseendeteman överstyr dem till lila och Kalender har dessutom en egen lila överstyrning. Ge de omarbetade appytorna uttryckliga Paceable-färgtokens som inte tar över eller skriver om användarens sparade utseendeval. Behåll äldre ytor oförändrade.
- Tydliga huvudhandlingar får plum med läsbar kontrast; sekundära handlingar neutral yta/plum-text. Ingen mekanisk ändring av alla knappar.
- Aktiv navigation behåller en subtil lavender wash, men ikon/text får plum. Kalenderns vyval och valda datum använder mjuk yta, tunn kontur och tydlig vikt/markering tillsammans med befintliga tillgänglighetsegenskaper.
- Capacity behåller horisontell form och procent, men får en separat dämpad lavender-ton som är konstant oavsett procent. Den delar inte CTA-färg.
- Behåll de små flerfärgade accenterna; inga nya status- eller prestationsfärger.

## 2. Idag och Min plats
- Ta bort antal punkter under Din dag, utan att ändra listan eller data.
- Ta bort enbart bladikonen vid Dagens Pace; behåll sage-ytan, texterna och nivåerna.
- Behåll de tre små stenarna vid hälsningen utan upprepning längre ned.
- Förenkla Min plats-symbolen till två öppna spegelvända kurvor utan fingrar, mittspets eller inre detaljer. Bedöm den i faktisk 24 px menystorlek.
- Behåll Min plats-ingångar och färgade ikonbakgrunder. Dämpa headerns färgskiftning och byt undertitel till ”Din plats för energi, återhämtning och det som påverkar dagen.”

## 3. Kalenderprickarna
- Kontrollera med samma granskningskonto vilka verkliga poster som ger Hem-prickarna över månaden. Den nuvarande presentationen deduplicerar redan områden med en mängd av unika värden; återkommande aktiva rutiner projiceras på de dagar där de förekommer.
- Om de många prickarna beror på verkligt återkommande innehåll: behåll dem och rapportera orsaken. Inga rutiner eller områden döljs för att få en tommare kalender.
- Korrigera endast ett påvisat presentationsfel: högst en prick per förekommande område, inga prickar utan innehåll; behåll befintlig gräns om fyra prickar och resten-antal, familjesammanfattning och åtkomliga etiketter.
- Kalendergeometri, filter, tidslinje, drag/drop, undo och barnens read-only-schema lämnas orörda.

## 4. Tankar
- Lätta upp startsidan med färre kapslade ramar och mer luft, utan att försvaga klickytor eller flytta funktioner.
- Använd befintlig organisk Tankar-symbol i stället för hjärnan som sidans huvudsymbol. Ingen ny ikonfamilj.
- Neutralisera ”Flow hittar möten och deadlines” både på startsidan och i capture-dialogen, inklusive relevanta översättningar.
- Lämna ”Tankar utan krav bor i en egen del under Flow.” till den senare strukturetappen och redovisa kvarvarande Flow-text.
- Skriv/säg → tolkning → granska/redigera → välj destination → godkänn och befintlig lagring är oförändrat.

## Tekniska detaljer
- Presentation berör vid behov `styles.css`, `layout.tsx`, `capacity-battery.tsx`, `navigation-icons.tsx`, `today.tsx`, `today-pace.tsx`, `health.tsx`, `calendar-planner.tsx`, `dump.tsx`, import-/capture-presentation och relevanta översättningar.
- Bevara `personalization`-lagring och temaval; nya presentationsroller isoleras från äldre överstyrningar. Ingen ändring av Capacity/Pace/Load/Gaps, familjeprojektion/dedup, parser, originalposter eller auth.
- Dokumentera presentationsgränsen i AGENTS.md och uppdatera båda changelog-filerna efter implementation.

## Verifiering och granskning
- Kör hela befintliga testsviten och separat typkontroll; kontrollera plattformens automatiska bygge, utan att starta ett manuellt produktionsbygge.
- Kontrollera Idag, Kalender, Tankar och Min plats på 360/390 px och desktop med samma konto: textpassning, sidscroll, navigation, aktiva lägen, synlig fokusmarkering och kontrast i ljus/mörk vy.
- Kontrollera reduced motion, faktisk 24 px Min plats-symbol och regressioner för Core/familj/read-only och osparad Tankar-granskning.
- Slutrapport: ändrade färgtokens och ytor, CTA/selected/Capacity-separation, kalenderprickarnas verifierade orsak, textändringar, tester och kvarstående begränsningar. Appen lämnas opublicerad för din sista visuella kontroll; fysiska iOS/Android-enheter ingår inte i sandboxkontrollen.
