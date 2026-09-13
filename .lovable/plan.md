# Förenklad första upplevelse i MyFlove

## Mål

Hem ska direkt svara på **”Vad behöver jag just nu?”**. Användaren möter en tydlig första handling och fyra jämna vägar vidare, medan dagens detaljer och övriga funktioner finns kvar bakom klick eller hopfällda block.

## Ändringar

### 1. En lugn första skärm

- Behåll den personliga hälsningen, Flow-maskoten, MyFlove-färgerna, glöden och de mjuka formerna.
- Korta huvudtexten till frågan **”Vad behöver du just nu?”**.
- Gör **QuickFlow – ”Vad snurrar i huvudet?”** till den enda tydliga huvudhandlingen på första skärmen.
- Ta bort konkurrerande förklaringar och adaptiva ordningsmeddelanden från första vyn.

### 2. Fyra jämna kärnkort på Hem

Visa samma kompakta korttyp i ett stabilt 2 × 2-rutnät på både mobil och desktop:

1. **Kalender** — ”Vad händer?” / ”Se och lägg till.”
2. **QuickFlow** — ”Vad snurrar i huvudet?” / ”Få ur dig det som snurrar.”
3. **Mitt batteri** — aktuell nivå och ”Hur mycket ork har jag?”
4. **Logga energi & mående** — ”Hur är det just nu?”

Varje kort öppnar sin redan befintliga funktion. Ingen ny lagring, route eller logik skapas.

### 3. Visa → klicka → fördjupa

- Ta bort separata batteri-, Idag- och nästa-steg-sammanfattningar från den första synliga ytan när samma väg redan finns i kärnkorten.
- Samla den befintliga dagsresan, nästa rimliga steg, lugna val och sekundära hemsammanfattningar längre ned i tydligt namngivna, förvalt hopfällda block.
- Behåll kvällscheck, veckoöversikt, rutiner/medicin, områden, installation och anpassning, men låt dem visas först när de är relevanta eller öppnas.
- Behåll sparat öppet/stängt läge med den befintliga mekanismen.

### 4. En enda enkel onboarding

- Ersätt den långa introduktionen med en kort första fråga: **”Vad snurrar i huvudet?”**
- Primärknappen öppnar befintliga QuickFlow direkt; ett diskret alternativ går vidare till Hem.
- Undvik att automatiskt visa ännu en introduktionsdialog vid nästa besök. Befintliga Flow-inställningar och sparade val bevaras och kan nås från sina nuvarande platser.

### 5. Enhetlighet utan ombyggnad

- Återanvänd befintliga MyFlove-komponenter, ikoner, tokens, kort, routes och hooks.
- Behåll nuvarande globala typografi och designsystem; ingen ny visuell riktning införs.
- Ändra inte autentisering, data, modeller, analys eller bakomliggande flöden.
- Uppdatera båda ändringsloggarna.

## Verifiering

- Kontrollera Hem vid 360, 375, 390 och 430 px samt desktop: 2 × 2-rutnät, ingen horisontell scroll, läsbar text och tydlig första handling.
- Klicktesta Kalender, QuickFlow, Mitt batteri, Logga energi & mående, Idag/Min dag och Flow.
- Kontrollera första besöket och återbesök så att endast ett onboardinglager visas.
- Kontrollera att sekundära block finns kvar, kan öppnas och minns sitt läge.
- Kör relevanta tester, typkontroll och kontrollera den färdiga förhandsvisningen.
