# MyFloves visuella kalender

## Resultat och avgränsning
Vidareutveckla **den befintliga kalendern på /kalender** enligt din mockup: Månad, Vecka och Dag med mjuka lavendel-/rosa ytor, tydliga ikoner, lättläst text och synlig luft mellan aktiviteter. Inga parallella kalenderposter, ingen automatisk publicering och ingen ändrad åtkomst till familjens privata information.

## Kartläggning – de sju punkterna

### 1. Befintliga delar som återanvänds
- `useTasks` och `useReminders`: egna uppgifter och kalenderposter, med befintlig sparning, påminnelser och redigering.
- `useFlowItems`: gemensamma källor för uppgifter, kalenderposter, studier, rutiner, QuickFlow och egna familjeåtaganden; dess avbockningslogik ska inte dupliceras.
- `useCapacityMode` och befintlig FlowPlan: användarens val Fullt/Mellan/Lågt förblir planeringens enda kapacitetskälla.
- `useCalendarConnection`, `useExternalEvents`, `CalendarAccount`: befintliga Google-/Outlook-kopplingar och datumintervall.
- Befintliga familjefrågor, `useChildren` och `OwnChildCalendar`: ägda poster, delade poster och begränsat föräldraägt schema hålls isär.
- Snabbtillägg, kopiera dag, befintliga dialoger, pictogram, språkstöd och MyFloves designkomponenter.

### 2. Det som behöver ändras
Nuvarande `CalendarContent` är en stor komponent. Månad/vecka ligger bakom en hopfälld sektion; veckan visar listor snarare än tidsblock och dagslistan använder en annan sammanställning av källorna. Batteri och veckomål ligger före själva kalendern.

Bryt ut en kompakt gemensam kalenderheader, månadsvy, veckotidsgrid, dagstidslinje, balansöversikt och oschemalagd lista. Gör vyval och Lägg till direkt synliga. Behåll kategori-/bildstödsval, kopiera dag, kalenderkopplingar och veckomål under diskret fördjupning – funktionerna tas inte bort.

### 3. Datamodell
**Ingen ny tabell, migration eller RLS-ändring föreslås.** Uppgifter har redan datum, start-/sluttid och de fyra värdena för energipåverkan. Kalenderposter har datum, start-/sluttid, upprepning och påminnelseinställningar.

För energipåverkan på egna kalenderposter behövs samma valfria fält som uppgifter redan använder. Det läggs i den befintliga kontoägda postmodellen, inte i separat energilagring. Gamla poster förblir oförändrade och räknas som okända. Kontrollera befintlig synk/delning innan fältet används; det får inte bredda innehållet som delas med familjen.

En presentationsmodell behåller källans ID, förekomstdatum, tid, eventuell verklig sluttid, energipåverkan och tillåtna handlingar. Den är en läsvy över befintlig data, inte ny lagring. För källor utan stödda tids-/längdfält ska kalendern inte låtsas kunna spara dem; deras befintliga redigering återanvänds.

### 4. Energi utan falsk precision
`useCapacityMode.percent` är uttryckligen en intern kompatibilitetssiffra som inte ska visas. Den får därför inte bli mockupens “42 %”.

- Visa **Ditt valda kapacitetsläge** som Fullt/Mellan/Lågt, med möjlighet att ändra det genom befintlig kontroll.
- Visa registrerad energi separat och endast när den finns; en äldre registrering ska inte framstå som dagens.
- Visa **Uppskattad belastning** kvalitativt och med diskreta segment. Utgå från befintlig FlowPlan/friktionsmodell, kända tidslängder och användarens val av energipåverkan. Okänd påverkan förblir okänd; tom plan betyder inte uppmätt full energi.
- Framtida datum får inte ärva dagens kapacitetsvärde som om det vore en framtidsprognos.
- Schemalagd återhämtning kan identifieras genom användarens val, men får inte presenteras som garanterad återvunnen energi.

Balansbudskap är försiktiga: “Det ser ut som en ganska full dag” och “Vill du se om vi kan skapa lite mer luft?”. Visa detaljer om uppskattningen vid klick, inte som lång förklaring i kalendern.

### 5. Samma data i alla vyer
Skapa en periodselektor som återanvänder befintliga källor och repetitionsregler, och grupperar samma poster per datum. Dag, vecka och månad läser samma resultat och reagerar på befintliga lagrings-/queryuppdateringar.

- Bevara datumlogik för återkommande poster, flerdagshändelser, slutförda uppgifter och försenade uppgifter; försenat visas som sådant och räknas inte som en ny historisk förekomst.
- Deduplicera QuickFlow-kopplingar och studiegenererade poster med befintliga ursprungs-ID:n.
- Föräldraägt schema och uttrycklig delning hålls separata från egen kalender. Samma barnaktivitet visas inte dubbelt när den nås genom båda vägarna.
- Externa poster märks med källa och stabilt externt ID. Titelmatchning räcker inte för att radera verkliga separata händelser.

### 6. Mobilinteraktion och design
**Månad:** ren sju-kolumners grid, olika markering för idag/vald dag, högst ett litet antal synliga aktiviteter och +N. Diskreta belastningssegment. Vald dag visas direkt under grid med knapp till dagsvyn.

**Vecka:** gemensam tidsskala och mjuka block med ikon, namn och tid. Horisontell scroll med 1–3 dagar på mobil och hela veckan på större skärmar. Okänd längd visas som en tidpunkt, inte en påhittad varaktighet. Överlappande aktiviteter får separata spår.

**Dag:** kompakt kapacitetsöversikt nära toppen, vertikal tidslinje, aktuell NU-linje endast idag och synliga relevanta mellanrum mellan kända sluttider/starttider. Att få gjort är separat och kan fällas ihop. På större skärmar ligger listan och balansinformationen bredvid tidslinjen.

Tryck på post öppnar detaljer och tillåtna handlingar. Mobil planering sker genom **Planera tid** med datum/tid/längd; **Ta bort tid** behåller uppgiften. Dragning aktiveras försiktigt på större skärmar, med tangentbords-/formuläralternativ och Ångra. På touch ska vanlig scroll aldrig flytta en post.

Mockupens befintliga Plus Jakarta Sans/Inter, 24px huvudkort, lavendel/violett/rosa tokens och dämpade källaccenter återanvänds. Inga emoji ersätter riktiga UI-ikoner. Stora tryckytor, tillgängliga namn, fokusmarkering, större text, reduced motion och befintligt mörkt läge ingår.

### 7. Säkerhet och RLS
Inga ändringar av autentisering, familjeroller, RLS eller delningspublik. Befintliga säkra läsvägar är gränsen även för den nya kalendern. Kopplingen till en barnprofil påverkar bara det begränsade föräldraägda schemat, inte användarens egna funktioner.

Varje presentationspost får källspecifika redigeringsrättigheter. Föräldraägt schema för kopplat konto förblir skrivskyddat, inklusive avbockning. Explicit delning öppnar inte profilen bakom aktiviteten. Privata anteckningar, dokument, stödbehov och syskonprofiler hämtas inte för att skapa tidsblock eller belastningsbedömningar.

## Stegvis implementation
1. **Gemensam datavy och grundutseende:** periodselektor, header, månad och visuella vecka/dag; bevara äldre redigeringsflöden tills motsvarande handling är verifierad.
2. **Kapacitet och luft:** kvalitativ balans, relevanta tidsluckor, NU-linje, oschemalagd lista och tomma dagar utan skuld.
3. **Säker planering:** snabbtillägg för uppgift/aktivitet/påminnelse/återhämtning, valfri energipåverkan, planera/ta bort tid, flytta dag/tid och ändra stödd längd med Ångra. Påminnelser ändras bara genom sina befintliga inställningar; nya poster får inte automatiskt slå på notiser.
4. **Flow-förslag:** diskreta, avvisningsbara förslag vid kända täta/krävande block. Visa konkret förslag, be om godkännande och spara först därefter i samma datakälla. Gissa inte restid eller längd för okända poster.
5. **Verifiering:** återkomst, tidsöverlapp, deduplicering, tillägg/flytt/ångra, avbockning, synk, kontobyte, familjegränser, språk och tillgänglighet. Visuell kontroll på mobil och dator samt fokuserade regressionstester. Uppdatera arkitekturregler och båda ändringsloggarna.

## Prestanda och kända begränsningar
Externa kalenderfrågor har redan intervallstöd och ska få synlig dag/vecka/månad inklusive nödvändiga kantdagar. Befintliga egna uppgifter och rutiner lagras som kontoägda dokument och läses redan av gemensam synk – de kan inte få verklig serverpaginering utan ett separat lagringsarbete. Kalendern ska inte skapa fler historikhämtningar; den indexerar dokumenten och beräknar endast synlig period. Periodhämtning av familjedata införs bara om befintliga frågor stöder det utan behörighetsändring; annars redovisas begränsningen.

Ingen kalenderintegration, mobilappbehörighet eller säkerhetsregel ska ändras för att efterlikna mockupen. Verifiering på fysiska iOS-/Androidtelefoner kräver användartest; webbläsartest får inte beskrivas som ett sådant test.

**Ingenting publiceras.**