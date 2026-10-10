# Slutgranskning av Insikter

## Mål och avgränsning
Genomföra en helt läsande kvalitetsgranskning av den befintliga Insikter-sidan. Ingen kod, data, inställning eller publicering ändras. Granskningen utgår från befintliga datadefinitioner och bedömer inte medicinska tillstånd.

## Genomförande
1. **Förstagångsupplevelse och pedagogik**
   - Gå igenom sidhuvud, introduktion, ”Vad Flow lärt sig om dig”, båda diagrammen, eventuella vardagsmönster, personliga insikter, tomlägen och navigation i faktisk sidordning.
   - Bedöma begriplighet för en vuxen med ADHD eller kognitiv trötthet: begrepp, informationsmängd, upprepningar, kravkänsla och skillnaden mellan energi, mående, batteriincheckningar, faktisk tid och genomförda aktiviteter.
   - Kontrollera varje sammanfattning mot den befintliga beräkning som producerar den, utan att föreslå starkare slutsatser än underlaget stödjer.

2. **Visuell helhet**
   - Bedöma hierarki, sidlängd, kortbredder, marginaler, radier, typografi, informationsdensitet och framträdandet av viktiga värden.
   - Jämföra ljust och mörkt tema som ett sammanhållet Paceable-system.
   - Granska fokusordning och om expanderade avsnitt gör helheten onödigt tung.

3. **Fördjupad diagramgranskning**
   - Energi & mående: åttaveckorsöversikt, svepbarhet, etiketter, värden, saknade registreringar, legend och skillnaden mellan de två serierna.
   - Batteri & faktisk tid: punkt/stapel, kontrast, legend, eventuell sammanblandning mellan fokusram och aktivt val, värdehierarki, kortens höjd/texttäthet, Dag/Vecka/Månad samt sammanfattningens pedagogiska stöd.
   - Kontrollera att vertikal scroll fortsatt fungerar när en horisontell tidslinje berörs.

4. **Responsivitet och tillgänglighet i webbläsare**
   - Testa 320, 360, 390, 430, 768 och 1280 px i ljust och mörkt tema, vid normal och 200 % textstorlek.
   - I varje relevant kombination kontrollera sidöversikt, dokumentoverflow, klippt/överlappande text, fokusmarkeringar, tangentbordsnavigation, periodväxling samt horisontell och vertikal scroll.
   - Kontrollera diagrammen med de befintliga periodlägena: Energi & mående i Vecka/Månad och Batteri & faktisk tid i Dagar/Veckor/Månader.
   - Granska kontrast med både visuell kontroll och beräkning av relevanta text-, kontroll- och diagramsignaler.
   - Använd endast läsande interaktioner; inga formulär skickas och inga kontovärden skrivs.

5. **Dokumentation och skärmbilder**
   - Ta mobil- och desktopbilder i både ljust och mörkt tema.
   - Ta tydliga närbilder av båda diagrammen, inklusive stor text där det visar ett problem eller bekräftar god funktion.
   - Spara en samlad granskningsrapport och bilder som leveransfiler, utan att lägga dem i appen.

## Leverans
- Samlad bedömning med tydlig markering av vad som faktiskt testats.
- Prioriterad lista:
  - **A – Måste åtgärdas:** blockerande fel eller tillgänglighetsproblem.
  - **B – Bör förbättras:** begriplighet, kognitiv belastning eller visuell kvalitet.
  - **C – Kan vänta:** mindre estetiska förbättringar.
- För varje punkt: problem, plats, användarpåverkan, exakt rekommendation, berörda filer och risk för funktion, beräkning eller tillgänglighet.
- Rekommenderad genomförandeordning i små, självständiga steg. Detta är endast förslag; inga nya etapper startas.
- Separat lista över sådant som återstår på fysisk Android/iOS: verklig touch/svepning, systemets textskalning/förstoring, safe areas, VoiceOver/TalkBack och enhetsspecifik kontrast/rendering.

## Tekniska skyddsgränser
- Ingen ändring av `src/pages/insight.tsx`, diagramkomponenterna, testerna eller någon annan projektfil.
- Ingen ändring av data, lagring, synk, auth, beräkningar, routes, designsystem, native-appar eller publiceringsinställningar.
- Ingen publicering.
