# Kvarvarande äldre formulär – samma godkända Paceable-design

## Avgränsad anpassning
- Anpassa samtliga formulär som fortfarande har äldre utseende, inklusive Logga just nu i bilden och dess omgivande dialog, till befintligt Paceable-uttryck: varm ljus yta i stället för stora rosa/lila formytor, tunn neutral kant och diskret djup. Mörkt läge följer samma befintliga färgroller. Bilden visar avvikelsen, inte en ny målbild.
- Behåll rubrik, fält, ikoner, ordning och funktion. All funktionell text använder Inter; inga nya serifrubriker i formuläret.
- Gör valkontroller lugnare med befintlig lavendelmarkering och plommonkontur. I Logga just nu behålls nivåerna Fullt/Mellan/Lågt, färgmarkörer och måendeansikten; andra formulär behåller sina alternativ och betydelsebärande färger.
- Anpassa textfält, hjälplänkar, Visa mer och sparknapp till samma befintliga kontrollstil. Hjälpen blir diskret men lika tillgänglig. Minst 44 px klickytor och tydligt fokus.
- Uppdatera endast gamla synliga produktnamn i berörda formulär: MyFlove → Paceable och följeslagaren Flow → Pace. Övriga texter och förklaringar behålls. Interna identifierare och Din takt berörs inte.

## Skydd
Ingen ändring av registrering, sparning, utkast, hopfällning, förval, påverkansfaktorer, kontodata, synk, Capacity/Din takt, kalender, familj, notiser eller navigation. Redan godkända formulär lämnas visuellt orörda, särskilt kalenderns kompakta kapacitetsstöd, Fånga och visningsnamnsdialogen. Inga ändringar av logotyper, stenar eller globala grundstilar. Inga paket eller publicering.

## Tekniska detaljer
Logga just nu är `src/components/simple-checkin.tsx` och återanvänds bland annat från Idag, Hem och Mitt batteri. `MyFloveBlock` väljer en uttrycklig pastellyta som inte får den befintliga neutrala kortmarkeringen; detta är en verifierad orsak till avvikelsen. Övriga formulär kartläggs per familj före ändring: loggning/hälsa, lägga till/redigera, familj/vardag, profil/inställningar och planering.

Återanvänd befintliga semantiska Paceable-tokens och designkontroller. Börja med små gemensamma presentationsval för berörda formulär, därefter enbart nödvändiga lokala avvikelser. Ingen bred CSS-regel som automatiskt stylar alla inputfält eller färgade kort. Gemensamma block, hjälplänkar och dialoger ändras endast genom ett uttryckligt presentationsval om det behövs; andra användningar lämnas orörda. Dialogernas befintliga öppning, stängning och fokus bevaras. Samma återanvända formulär får samma uttryck på sina olika ingångar, utan dubblering av formulär eller data.

## Kontroll före leverans
- Mobil 360/390/430 px och desktop, ljust/mörkt och 200 % text: radbrytning, rullning, synlig sparknapp och inget överlapp eller sidledsöverflöde.
- Tangentbord, skärmläsaretiketter, fokus, hjälplänkar, valkontroller och utfällningar i varje berörd formulärfamilj.
- Befintliga tester för registrering/sparning och kontroll av att presentationsändringen inte återställer osparade val; inga testregistreringar i användarens konto.
- Kör relevanta formulärtester och hela befintliga testsviten. Kontrollera uttryckligen att redan godkända formulär förblir oförändrade.
- Visa mobilbild av Logga just nu, representativa före-/efterbilder för övriga ändrade formulärfamiljer samt desktop- och mörkerkontroll. Redovisa exakt vilka formulär som ändrats och eventuella kvarstående begränsningar. Uppdatera båda ändringsloggarna efter genomförandet.

Genomförandet inväntar godkännande. Ingen publicering ingår.