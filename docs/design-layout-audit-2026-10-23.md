# Paceable – design- och layoutgranskning, 23 oktober 2026

## Omfattning och metod

Genomgång av källkod för **48 appvyer** i `src/pages`, de gemensamma kort- och sidkomponenterna, mobilnavigeringen samt `styles.css`, `app-typography.css` och `docs/pace-design-system.md`. Granskningen jämför hur sidorna faktiskt använder redan etablerade komponenter: `PacePageHeader`, `MyFlovePageGrid`, `PacePage`, `PaceContent`, `MyFloveBlock`, och appens typografiska/kompakta skal.

**Avgränsning:** Det här är en statisk kod- och regressionsgranskning, **inte** en visuell kontroll av samtliga autentiserade skärmar på 320/360/390 px eller 200 % text. Inloggningskrävande tillstånd, iOS/Android WebView, tangentbord och skärmläsare behöver separat verklig visuell kvalitetssäkring. Källkodens klasser kan indikera risker, men fastställer inte ensamma skärmbuggar.

### Besökta vyer och ytor

| Område | Granskade källfiler/sidor | Bedömning |
| --- | --- | --- |
| Kärna | Idag, Kalender, Planera, Assistent/Pace, Flow/Flowplan, Daglig vy, veckovy, dagshubb och Översikt | Godkända primära vyer och kalendertidsgeometri är skyddade. Ingen redesign här. |
| Tankar/stöd | Anteckningar, Flowstudier, Workflow, Pomodoro, Paus och Stopp-paus | Flera sekundära sidhuvuden använder delat mönster; utpekade legacy-ytor bör granskas visuellt innan konvertering. |
| Familj | Familj, Barn, Familjeflow, Relationer, Livsprofil | Familjekulörer och avgränsad barninformation ska förbli oförändrade. |
| Energi/hälsa | Mitt batteri, Insikter, Historik, Energiflöde, Energikarta, Hälsa, Mående, NPF, Friktionsindex, Statistik och Medicin | Flertalet sidor använder gemensam sidmall. Några faktiska läsbarhetsrisker åtgärdade i denna PR. |
| Vardag | Uppgifter, Påminnelser, Rutiner, Inköp, Städning, Matplanering, Ekonomi och Arbete | Gemensam layout och kortskal finns; ingen datalogik eller formhantering ska flyttas. |
| Studier/träning | Studier, Studyflow, Flowstudy och Träning | Vissa äldre innehållskomponenter behöver visuell kontroll i sina riktiga destinationsvyer. |
| Profil/verktyg | Inställningar, Profil, Flowinställningar, Admin, Belöningar | Befintliga sidhuvuden och mobilanpassade admin-kort bevaras. Desktop-admins breda tabell är inte i sig ett mobilfel. |
| Gemensamma delar | Mobil-/desktopskal, Mer, PacePageHeader, MyFloveBlock, Pace-designsystem, globala typografiska roller | De flesta äldre klasser är redan normaliserade genom aktiva Paceable CSS-regler; undvik redundant global omskrivning. |

## Bekräftade förbättringar i denna etapp

1. **Energiflöde / Dagens energipåverkan:** Tre statistikrutor i en rad var för trånga på små skärmar. Nu två rutor följda av en helbreddsruta för Netto på mobil; tre i rad på större skärmar. De tidigare 11px-etiketterna var avklippta (`truncate`); nu kan de radbrytas i appens läsbara textskala.
2. **Energiflöde / aktivitetsmönster:** Tidigare ellips avbröt långa aktivitetsnamn i den smala raden. Namnet kan nu radbrytas utan att påverka värden, energihistorik eller diagram.
3. **Mående / tidigare incheckningar:** Förklarande fri text får nu krympbar flexbehållare och säkert ordomslag så långa ord/länkliknande anteckningar inte driver hela sidan i sidled.
4. **Energikarta / timmar:** Diagrammets 10px-tidsmarkörer använder den vanliga metadata-storleken. Diagramvärden, observationer och beräkningar är oförändrade.

## Kompletterande mobillayout i samma granskning

I en uppföljande kontroll av sidornas faktiska grid- och färgklasser hittades följande risker, utöver de tidigare åtgärderna:

- **Återhämtning/Paus:** Förvalda paustider hade alltid exakt tre kolumner under 640 px även vid förstorad text. `auto-fit` med lämplig minbredd samt radbrytbara knappetiketter låter rutnätet bli en eller två kolumner när det behövs. Startknappens befintliga funktion är orörd.
- **Ekonomi:** Nyckeltalen Inkomster/Utgifter/Kvar hade fasta två mobilkolumner; med större systemtext blir långa värden svåra att läsa. Nu används anpassningsbara kolumner, där Kvar spänner över den tillgängliga mobilbredden; den vanliga bredare trekolumnsvyn är kvar.
- **Energiflöde:** Samma förbättring finns för Gett energi/Tagit energi/Netto, även när en smal skärm eller hög zoom bara rymmer en kolumn. Statistikens underliggande energiberäkningar är oförändrade.
- **Energikarta och Mående:** Tidigare hårdkodade ljuslavendelfält i kollapsbara sektioner har ersatts med Paceables semantiska `bg-secondary`-färger, som kan följa anpassat och mörkt tema. Diagramfärger, bedömningsskalor och lagring har inte ändrats.

Presentationsregressioner verifierar klasskontrakt, handlingarnas befintliga koppling och avsaknad av äldre hårdkodad bakgrund. **Det bevisar inte** exakt hur varje skärm ser ut vid 200 % text; prioriterade manuella bildtester nedan kvarstår.

## Viktigt som redan fungerar – lämnat orört

- Primärnavigering, Idag, Kalender, Tankar, Min plats och Mer har särskilt godkänd design. Ingen global färg-, logotyp-, typografi- eller kortmigrering.
- `html[data-pace-refresh="true"]` ger redan sekundära sidors kort kompakt storlek, full titel och normal radbrytning. Att byta samma klasser i varje vy vore överarbete.
- Sekundära vyer använder i stor utsträckning `PacePageHeader` och `pace-compact-page`. Sidmallar ska inte få ytterligare wrapper ovanpå existerande.
- Kalenderns minuter, dragmål och 44×44-tryckytor är uttryckligen skyddade. Familje-/barnscheman ska inte tappa områdesfärger, bildstöd eller integritetsgränser.
- Energi, kapacitet, återhämtningsförslag och batteri ändrar inga värden av en visuell presentation.

## Prioriterad visuell restkontroll före bredare publicering

1. **P1 – 320/360/390 px och förstorad text:** Kontrollera lång rubrik, datumfält, feltext och valknappar i påminnelser, rutiner, studier, Inkorg/Anteckningar, Energieflöde, Fånga och Mående. Leta efter sidledes scroll och dolt innehåll. Särskilt 200 % systemtext.
2. **P1 – öppnade dialoger och mobilens tangentbord:** Incheckning, redigering, kalenderdag och delade barnscheman. Säkerställ att Spara/Avbryt och dialogstängning förblir nåbara utan att utkast försvinner.
3. **P2 – specialvyer:** Flowstudy/Workflow/Livsprofil samt äldre kursinnehåll. Kontrollera deras verkliga sidor, eftersom filnamn eller avsaknad av `PacePageHeader` inte ensamt betyder designfel.
4. **P2 – konsekventa kort och mellanslag:** Kolla kortens topp/botten när de minimeras, fulla rubriker och hjälptext i Energiflöde, Ekonomi, Rutiner och NPF. Gemensam CSS hanterar huvuddelen redan.
5. **P2 – dark mode, färgval och tillgänglighet:** Kontrollera kontrast i alla områdesfärger, fokusmarkering, zoom, tryckytor, reducerad rörelse och skärmläsaretiketter. Testa på riktiga iOS-/Android-byggningar innan native-kvalitet påstås vara verifierad.

**Princip framåt:** Ta skärmbild och reproduktionssteg från faktisk mobilskärm före en större stiländring. Blanda inte ihop statisk kodgranskning med slutgiltigt visuellt godkännande. Håll all layoutkod presentationsägd; ändra aldrig sparade ID:n, nycklar, konto-/familjegränser, kapacitet, energi eller publiceringsstatus som bieffekt.
