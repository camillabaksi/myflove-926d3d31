# Kompaktare sidlayout – etapp 3, 2026-10-20

## Genomfört
- Planera och Mitt batteri använder samma opt-in valstil, med befintliga route-länkar, tryckta knappar respektive Radix-flikar. Ingen ny tillståndsägare.
- Planera, Mitt batteri, Historik och Återhämtning har tätare sektionsavstånd. Historik har datum på egen rad vid smal bredd; veckoknappar och frivilliga energisvar använder befintlig Button med minst 44 px tryckyta.
- Återhämtning kan stapla eget tidsfält och Starta vid liten tillgänglig bredd. Samma startfunktion och val kvarstår.
- Planeringsprovens inaktuella mocks/regionsnamn uppdaterade mot befintliga funktioner; inga produktfunktioner återinförda eller ändrade.

## Verifierat
- Automatisk byggkontroll: build OK, senaste avlästa 2026-10-20T11:31:16Z.
- 8/8 tester: planning-workspace, page-header och block-presentation. Planeringsproven kontrollerar bevarade granskade aktiviteter, separata utkast, sparfel/retry och kontobyte.
- Inloggad webbläsare: fyra sidor × 360/390/430/768/1280/1600 px × båda teman × 16/32 px rottext. Ingen horisontell dokumentoverflow enligt mätning; synliga val och veckoknappar minst 44 px höga.
- Osparad planeringstext överlever Idag → Imorgon och Granska → Ändra listan. Ingen aktivitet sparad. Batteriets Energi-flik aktiveras och Historik går till föregående vecka med Nästa tillgänglig.
- Före-/efterbilder under `/tmp/browser/compact-stage-three/`, visuellt granskade på mobil. Jämförelsen är inte pixelidentisk: aktuell veckoperiod och påminnelsebanners skiljer sig.

## Begränsningar och kvarstående fel
- **Ingen dokumentoverflow är inte samma sak som läsbarhet.** Bilden vid 768 px och 32 px rottext visar att den befintliga desktop-sidomenyn upptar nästan hela bredden. Sidans rubrik blir bokstavsvis och innehållet oanvändbart. Detta är ett kvarstående gemensamt layoutfel, inte löst av denna sidlokala etapp.
- Mörk/stor-text-bilden visar också svag rubrikkontrast mot mörk yta; den samlade temapresentationen behöver fortsatt kontroll. Denna etapp kan inte beskrivas som fullständigt tillgänglig vid stor text på surfplatta.
- Batteriets äldre check-in-test har två felaktiga förväntningar (formuläret finns inte längre på batterisidan; fliktestet använder en klicksimulering som inte aktiverar Radix-fliken). Appens Energi-flik har verifierats i riktig webbläsare. Äldre tester är inte gröna och har inte skrivits om för att återinföra borttagna funktioner.
- Fysisk mobil, verklig OS-textförstoring, skärmläsare och molnskrivning är inte testade i denna presentationsetapp.
- Pace, Mer, kalendergeometri, kontodata, lagring, synk, auth, native och routes oförändrade. Ingen publicering.