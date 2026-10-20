# Sammanhängande Tankar och tydligare energiöverblick

## Vad bilderna visar
- **Fånga:** extra horisontella stenar upprepar stenarna i logotypen.
- **För & emot:** flikarna ligger innanför en extra inramad yta med andra marginaler än Fånga. Anteckningsboken har dessutom en egen regel för bottenmenyn som kan göra att innehållet inte fyller bredden.
- **Hälsa i Mer:** flera ingångar beskriver energi och mående utan att deras olika uppgifter framgår. Min plats är en samlingssida, inte en separat energi­funktion.

## Föreslagna ändringar
### 1. Fånga och reflektionsboken
- Ta bort enbart de extra horisontella stenarna på Fånga. Logotypen och originalbilderna behålls.
- Ge Fånga, Dagbok och För & emot samma yttre marginaler och flikplacering. Behåll papperskänslan och handstilen inne i själva anteckningsboken.
- Rätta anteckningsbokens bottenmeny så att samma fem val fyller skärmbredden som på övriga sidor. Ingen mindre text eller mindre tryckyta.

### 2. Energi: en sammanhängande funktion, olika tydliga delar
Samla presentationen kring befintligt **Mitt batteri**, med tydliga delar:
- **Just nu:** dagens registrerade energi och befintlig incheckning.
- **Historik:** tidigare energi och mående; välj mellan dem utan flera upprepade rubriker.
- **Vad påverkar min energi:** sådant som ger och tar energi samt befintliga mönster.

Återanvänd innehållet som redan finns i batteriets flikar och Energimönster. Ta bort dubblerade presentationer där samma innehåll visas, inte registreringar eller funktioner. Egna energiloggar och aktiviteters energipåverkan ska fortsatt gå att skilja åt. Uppskattningar hålls åtskilda från registrerad energi.

**Min plats** fortsätter vara ingången till batteri, återhämtning och personliga stöd. **Insikter** behåller den bredare jämförelsen över tid, men behöver inte återge hela batterifunktionen.

### 3. Återhämtning och Mer
- Återhämtning och Stop-paus kompletterar varandra: visa Stop-paus som ett tydligt val inom återhämtning, med samma befintliga funktion och egen direktadress kvar.
- Rutiner & medicin och träning förblir egna funktioner, inte delar av batteriet.
- Behåll Mers godkända utseende. Förtydliga de berörda länkbeskrivningarna och samla närliggande genvägar utan att tappa sökning, direktlänkar eller behörighetsfilter.

## Skydd
Inga ändringar i kontodata, registreringar, beräkningar, lagringsnycklar, synk, familjedelning, autentisering, databas eller mobilversioner. Befintliga adresser och äldre länkar fortsätter fungera. Ingen publicering.

## Kontroll och leverans
- Ta före-/efterbilder av Fånga, För & emot, batteriet och berörda Mer-val.
- Kontrollera 360/390/411/430 px, surfplatta och dator, båda teman och större text.
- Kontrollera fullbred bottenmeny, minst 44 px tryckytor, flikbyte och befintliga inchecknings-/historik-/pausöppningar utan att skriva testdata till ditt konto.
- Kör berörda befintliga tester, kontrollera aktuellt byggresultat och uppdatera båda ändringsloggarna. Verklig sparning får endast testas i ett isolerat testkonto.
- Visa förhandsgranskningen innan eventuell separat publicering.

## Tekniskt
- Stenvisningen finns i `src/pages/dump.tsx`; ta bort just den användningen och dess oanvända import.
- Flikarnas placering samordnas genom befintlig `BookNavigation` och notebook-workspace. Editorernas utkast och sparägande lämnas orörda.
- `src/components/notebook/notebook.css` sätter bottenmenyn till flex på notebook-sidor. Rätta den lokala regeln/bredden, inte navigationens funktion eller appens textskala.
- `src/pages/battery.tsx` återanvänder redan `MoodContent`, `EnergyContent`, `EnergyFlowInsights` och `PatternsCard`. Kartlägg exakt innehållsöverlapp innan dessa omgrupperas; sammanhåll presentationen över befintliga hooks och formulär, utan en ny datamodell.

Genomförs i två kontrollerbara steg: först Tankar-layout och bottenmeny, sedan energiingångar och kompletterande återhämtning.