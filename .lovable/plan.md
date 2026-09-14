# Studier – en samlad sida

## Vad som finns idag (genomgång)

Studier är idag utspritt på två sidor plus en tredje som bara visas inuti den ena:

- **/studyflow ("Studier")** – en lång sida med en flik "Nu" (nio hopfällbara block: rimligt att plugga, prov & repetition, bäst att göra nu, "Jag har … minuter", övergångar, föreläsningsläge, avslutningscheck, "Jag hann inget idag", QuickFlow) och en flik "Kurser". Här ligger också schemaimport, nästa lektion och veckoschema.
- **/studybuddy ("Studiehjälp")** – egen sida i menyn med flashcards/quiz från uppladdat material, provdatum och repetition.
- **/studier och /flowstudy** – gamla adresser som bara skickar vidare.
- Uppgifts- och kursdelen ("Kurser"-fliken) är en egen komponent som återanvänds.

Befintliga delar som kan återanvändas rakt av: schemauppladdning med avläsning via Flow (bild, PDF, dokument, text, ICS), sparade originalfiler, veckoschema med lektioner, nästa lektion-kort, kalendersynk, uppgiftsnedbrytning ("bryt ner uppgift"), flashcards/quiz, kurser och QuickFlow.

Idag sparas **inte** lunch och rast: avläsningen är instruerad att hoppa över raster, och en lektion har ingen typ.

## Målbild

En sida, `/studyflow`, med denna ordning:

```text
STUDIER
  Mitt schema        [Öppna schema] [Lägg till/byt schema]
  Dina lektioner idag / kommande
    08:15  Lektion ...
    10:00  Rast
    12:00  Lunch
    13:00  Lektion ...
  [ ] Visa nästa lektion på Hem

STUDIEHJÄLP
  "Vad behöver du hjälp med?"
  [Kom igång] [Bryt ner uppgift] [Flashcards & quiz] [Mina kurser]

MER (hopfällt)
  Veckoschema och tider · Prov & repetition · Plugga nu · Övergångar och avslut
```

## Så byggs det

1. **Mitt schema** – ett kompakt kort överst med senast uppladdade schemafil (öppnas i befintlig visningsruta) och en knapp för att lägga till/byta. Går filen inte att tolka sparas originalet ändå och användaren kan lägga in lektioner manuellt, som idag. Inga nya format-begränsningar: samma lista som resten av appen (bild, PDF, Word/ODT/PowerPoint, text, ICS).
2. **Avläsning med lunch och rast** – schemaposter får ett fält för typ (lektion / rast / lunch) och Flow instrueras att ta med dem. Granskningslistan före sparning finns redan; raster visas där med egen liten markering. Raster och lunch blir hållpunkter i dagens lista men synkas inte som uppgifter att bocka av.
3. **Dagens/kommande lektioner** – en enkel lista i samma visuella språk som dagvyn, byggd på befintliga lektioner. Ingen ny kalendermodell; kalendersynken ligger kvar oförändrad under "Mer".
4. **Visa nästa lektion på Hem** – en sparad av/på-inställning i befintliga schemainställningar. Är den på visas nästa lektion som en diskret rad på Hem (samma stil som Paus-ingången), annars ingenting.
5. **Studiehjälp på samma sida** – innehållet från /studybuddy flyttas in som en kompakt sektion med val i stället för en egen vy: "Kom igång" (Flow/QuickFlow), "Bryt ner uppgift" (befintlig AI-nedbrytning), "Flashcards & quiz" och "Mina kurser". Varje val fälls ut på plats. Adressen /studybuddy blir en vidarebefordran till /studyflow så inga länkar dör, och menyposten "Studiehjälp" tas bort.
6. **Förenkling** – de nio blocken på "Nu" slås ihop: "plugga nu", "jag har … minuter", övergångar, föreläsningsläge, avslutningscheck och "hann inget idag" samlas under en hopfälld "Mer i studier"-sektion i stället för nio jämnstora block. Ingen funktion tas bort, ingen data raderas.

## Teknisk sammanfattning

- Nya/ändrade filer: `src/pages/studyflow.tsx` (omstrukturerad sida), ny `src/components/study/my-schedule.tsx` och `src/components/study/study-help.tsx`, `src/components/schedule-import.tsx` (rast/lunch i granskning), `src/lib/schedule-import.functions.ts` (prompt tar med raster + typ), `src/lib/study-calendar.ts` (`kind: "lecture" | "break" | "lunch"` på `Lecture`, default "lecture" för befintliga poster), `src/hooks/use-study-schedule.ts` (ny sparad inställning `showNextLectureOnHome`), `src/pages/home.tsx` (villkorad rad), `src/routes/_app.studybuddy.tsx` (redirect), `src/components/layout.tsx` + `src/lib/app-guide.ts` (en studieingång).
- `src/pages/flowstudy.tsx` behålls som komponent och renderas inuti Studiehjälp-sektionen; bara routen försvinner.
- Ingen ändring i datamodeller för uppgifter/kalender/cloud sync; lektioner ligger kvar under samma nycklar, så befintliga scheman och filer följer med.
- Efteråt: typecheck, tester, lint, build samt kontroll på 360/375/390/430 px och desktop utan sidoscroll. CHANGELOG.md, `src/lib/changelog.ts` och roadmap.md uppdateras.
