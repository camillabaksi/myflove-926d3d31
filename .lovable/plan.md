# Mer sorterad efter livsområden

## Resultat
Mer använder samma livsområden och färger som kalendern. Familj och Barn delar ett kort, och Hälsa och Egen tid delar ett kort. Ingen funktion, länk eller sparad inställning försvinner.

## Ny indelning
**Dina livsområden**
- Hem & vardag: Uppgifter, Påminnelser, Daglig rutin, Matlista, Inköp, Städning
- Arbete: Jobb
- Studier: Studier
- Ekonomi: Ekonomi
- Hälsa & egen tid: Min plats, Mitt batteri, Energiflöde, Återhämtning, Stopp & paus, Träning, Fokustimer
- Familj & barn: Familjeflöde, Familj, Barn, Relationer

**Övergripande**
- Stöd & reflektion: Pace, Fånga, Anteckningar, Flow och Flowplan
- Insikter & historik: Insikter, Historik, Statistik, FlowScore, Friktionsindex, Belöningar
- Inställningar (kugghjul), och Admin bara för administratörer
- Äldre funktioner finns kvar, ihopfällda längst ner

## Beteende som behålls
- Sökningen i Mer och enkelt läge fungerar som förut
- Behörigheter (Admin, Pace) filtreras som idag
- Livsområden som är avstängda i kalendern visas ihopfällda under "Fler livsområden", så att inget blir otillgängligt
- Inga ändringar i adresser, data eller den nedre menyn

## Tekniskt
- Ändra endast `src/components/paceable/more-view.tsx`, tillhörande CSS och `more-view.test.tsx`
- Gruppfärger hämtas från `AREA_META`/`areaColor` i `life-areas.ts` (vardag, jobb, studier, ekonomi, halsa, privat)
- Testet för att alla befintliga adresser täcks behålls; nya tester för gruppernas ordning och innehåll
- Kontroll på 360/390/430 px och desktop, ljust/mörkt läge och stor text
- Uppdatera CHANGELOG.md och src/lib/changelog.ts; ingen publicering
