# Pace – gemensamt designsystem för Paceable

## Mål
Skapa ett färdigt, återanvändbart designsystem baserat på appens redan godkända Paceable-utseende. Det ska vara enkelt att anpassa varje sida och formulär utan nya engångsstilar eller ändrade funktioner. Paceable förblir platsen; Pace följeslagaren, separat från Din takt.

## Inventering
- Godkända ljusa/mörka ytor, plommonfärger, diskreta accentfärger och två skuggdjup finns redan.
- Kort, formulär, Uppgifter och Mer har delvis egna stilregler. Dessa bör återanvända samma grund i stället för att få fler parallella regler.
- Befintliga knappar, inmatningsfält, dialoger och hopfällbara block kan återanvändas. Ett nytt parallellt kontrollsystem behövs inte.
- Vissa äldre formulär återstår att granska i visad app; de ska inte markeras anpassade enbart utifrån färgklassernas namn.

## Leverans
### 1. En gemensam grund
- Namngivna roller för bakgrund, yta, upphöjd yta, text, sekundär text, kant, fokus, markering och betydelsebärande status.
- Bevara befintlig varm off-white/plommonpalett och godkända accenttoner i båda teman; ingen ny färgriktning.
- Gemensamma skalor för mellanrum, mjuka radier, ikonstorlek, touchyta och djup. Skillnaden mellan vanlig yta och dialog ska vara tydlig men diskret.
- Inter för funktionell text, formulär, knappar och kalender. Fraunces endast med explicit orienterande rubrikroll; inga globala rubrikbyten.

### 2. Återanvändbara mönster
- Sidram och rubrik med valfria befintliga åtgärder; sektioner utan onödiga kapslade kort.
- Kort och hopfällbara block med gemensamma presentationsvarianter, men samma befintliga innehåll och lagrade öppet/stängt-lägen.
- Formulärfält med etikett, hjälp och fel; valgrupper, formuläråtgärder och inline-hjälp.
- Befintliga knappar, fält, väljare, switchar och dialoger får uttryckliga Pace-presentationsvarianter där det behövs. De tidigare anropen behåller sitt beteende.
- Standarder för tomt läge, laddning, sparning, fel och avstängt läge — visuella roller, inte ny sparningslogik.
- Ingen automatisk sparning, återställning av utkast eller ny lagring införs av designsystemet.

### 3. Referens och användningsguide
- En isolerad granskningsyta med realistiska exempel på rubriker, kort, formulär, val, dialoger och samtliga tillstånd; ingen ny länk i huvudnavigationen och inga kontodata.
- Kort dokumentation med tokenroller, tillåtna varianter, exempel och checklista för att anpassa en sida.
- Inventeringslista: redan godkända sidor, kvarvarande avvikelser och vilket gemensamt mönster varje kandidat ska använda.

## Minsta första etapp
Bygg grund, presentationsmönster, referensyta och guide. Använd de redan anpassade äldre formulären som pilot; behåll deras nuvarande utseende och funktion. Kontrollera att systemet räcker innan fler sidor konverteras. Befintliga godkända Idag-, Kalender-, Tankar-, Min plats- och Mer-ytor är jämförelseunderlag, inte omdesignprojekt.

Att skapa systemet är inte samma sak som att alla sidor redan är konverterade. Kvarvarande sidor anpassas därefter i små, redovisade grupper med samma system och separat visuell verifiering.

## Skydd
Ingen ändring av navigation, länkar, logotyper, godkända stenar, maskot/scenbilder, native, tekniska identifierare eller paket. Inga ändringar av data, auth, synk, behörigheter, kalendergeometri, Capacity, Load, Pace, familj eller notiser. Betydelsebärande områdesfärger och destruktiva varningar behålls. Ingen publicering.

## Verifiering
- Ljust/mörkt, 360/390/430/768/1024/1280/1440 px och 200 % text.
- WCAG AA för text och relevanta kontroller, synligt fokus, tangentbord, etiketter, dialogfokus, minst 44×44 px åtgärdsytor och reduced motion.
- Långa namn, långa etiketter och feltexter utan ellips eller textminskning; flexibel radbrytning och inga överlapp.
- Regressionstester för sparning, utkast och hopfällning samt hela befintliga testsviten och automatiskt bygge.
- Redovisa ändrade filer, bilder och begränsningar; fysisk mobil/skärmläsare anges som ej verifierad om sådana tester saknas.

## Tekniskt upplägg och insats
Behåll Tailwind v4 och befintliga HSL-tokenformat; ingen global färgformatsmigration. Samla gemensamma semantiska alias i `src/styles.css`, återanvänd befintliga UI-komponenter och lägg tunna presentationsmönster under befintlig Paceable-komponentyta. Aktivering är uttrycklig för att undvika oavsiktliga ändringar i kalender eller godkända formulär. Ingen global massersättning av klasser.

Insats: medelstor för grund, återanvändbara mönster, guide och QA; större och beroende av antalet verkliga avvikelser för full sidkonvertering. Kostnaden hålls nere genom gemensamma ändringar först, små piloter och inga nya paket eller assets.

## Godkännande
Planen inväntar godkännande före appkodändringar. Första godkännandet avser designsystemet och piloten ovan, inte en obegränsad omdesign av hela appen.