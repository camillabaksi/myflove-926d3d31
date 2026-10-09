# Logga just nu – samma godkända Paceable-design

## Avgränsad anpassning
- Anpassa formuläret i bilden och dess omgivande dialog till befintligt Paceable-uttryck: varm ljus yta i stället för det stora rosa kortet, tunn neutral kant och diskret djup. Mörkt läge följer samma befintliga färgroller.
- Behåll rubrik, fält, ikoner, ordning och funktion. All funktionell text använder Inter; inga nya serifrubriker i formuläret.
- Gör valen Fullt/Mellan/Lågt lugnare med befintlig lavendelmarkering och plommonkontur. Behåll nivåer, färgmarkörer och måendeansikten.
- Anpassa textfält, hjälplänkar, Visa mer och sparknapp till samma befintliga kontrollstil. Hjälpen blir diskret men lika tillgänglig. Minst 44 px klickytor och tydligt fokus.
- Uppdatera endast formulärets gamla synliga produktnamn: MyFlove → Paceable och Flow → Pace. Övriga texter och förklaringar behålls.

## Skydd
Ingen ändring av registrering, sparning, utkast, hopfällning, förval, påverkansfaktorer, kontodata, synk, Capacity/Din takt, kalender, familj, notiser eller navigation. Inga ändringar av logotyper, stenar, andra formulär eller globala grundstilar. Inga paket eller publicering.

## Tekniska detaljer
Formuläret är `src/components/simple-checkin.tsx` och återanvänds bland annat från Idag, Hem och Mitt batteri. Anpassningen avgränsas till just detta formulär med befintliga semantiska Paceable-tokens och designkontroller. Gemensamma block, hjälplänkar och dialoger ändras endast genom ett uttryckligt presentationsval om det behövs; andra användningar lämnas orörda. Dialogens befintliga öppning, stängning och fokus bevaras.

## Kontroll före leverans
- Mobil 360/390/430 px och desktop, ljust/mörkt och 200 % text: radbrytning, rullning, synlig sparknapp och inget överlapp eller sidledsöverflöde.
- Tangentbord, skärmläsaretiketter, fokus, hjälplänkar, alla val och Visa mer.
- Befintliga tester för registrering/sparning och kontroll av att presentationsändringen inte återställer osparade val; inga testregistreringar i användarens konto.
- Visa mobilbild av hela formuläret samt desktop- och mörkerkontroll. Uppdatera båda ändringsloggarna efter genomförandet.

Genomförandet inväntar godkännande. Ingen publicering ingår.