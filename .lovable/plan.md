# Expanderbara block på Hem

## Mål
Alla huvudsakliga innehållsblock på Hem ska kunna minimeras och öppnas igen, utan att funktioner eller data ändras.

## Genomförande
- Återanvänd appens befintliga hopfällningsfunktion så varje blocks läge sparas.
- Lägg en tydlig öppna/stäng-kontroll i rubriken för dagsresans tre steg, Flow, nästa steg, kvällscheck och övriga fristående block.
- Behåll hälsningen och knappen för enkelt läge synliga, så användaren aldrig tappar orienteringen eller möjligheten att återställa innehållet.
- Säkerställ att enkelt läge fortsatt döljer sekundära block och att vanlig vy fortsatt visar allt.
- Uppdatera ändringsloggen och kontrollera mobil samt desktop.

## Tekniska detaljer
Befintlig `useCollapsible`/`CollapsibleSection` används med unika id:n. Ingen bakomliggande logik, lagring av användardata eller navigation ändras.
