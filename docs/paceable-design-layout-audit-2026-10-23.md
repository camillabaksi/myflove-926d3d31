# Paceable – genomgående design- och layoutgranskning

Datum: 2026-10-23.

**Metod:** systematisk granskning av källkod för 48 sidmoduler, den gemensamma appnavigeringen, delade kort och headerkomponenter samt de viktigaste kalender-, barn-, Tankar-, energi- och insiktskomponenterna. Detta är **inte** fullständig screenshotverifiering av alla inloggade tillstånd. Riktiga mobil- och skärmläsartester återstår.

## Godkänd riktning – behåll

- Varm ivory canvas, plum som primär text/handling, nedtonad lavendel/salvia/aprikos; områdesfärg betyder livsområde, inte energibetyg.
- Gemensam typografi, kort, sidhuvuden, sidbredder och touchytor från src/styles.css, src/app-typography.css, PacePageHeader och MyFlovePageGrid.
- Inga parallella användardata, extra inställningssteg eller onödiga dubbla Lägg till-knappar.
- Skyddade egenvyer: kalenderns tidslinjer, barnens bildstöd och integritet, Tankars pappersredigerare och kvällsstundens medvetet avvikande varma fullskärmslayout.

## Inventering av 48 sidmoduler

| Del | Granskade moduler | Bedömning |
| --- | --- | --- |
| Dagsvy och planering | today, calendar, day-hub, planning, daily-flow, week-flow, overview | Modern gemensam aktivitetsprojektion och skyddad kalendergeometri finns redan. |
| Tankar och Pace | notes, assistant, flow, flowplan, notebook-page och flow-komponenter | Tankars redigerare har avsiktlig papperslayout, inte ett felaktigt vanligt kort. |
| Familj och relationer | family, children, family-flow, relations, visual-child-schedule och family-day-perspectives | Områdesfärger, separata perspektiv och mobil scroll finns; sjudagarsrad måste provas vid stor text. |
| Energi, hälsa och analys | battery, energy-flow, energy-map, mood, health, history, insight, stats, friction-index, npf | Gemensam komposition på flertalet sidor; verifierade avvikelser rättas nedan. |
| Vardag | tasks, reminders, routines, shopping, finances, meal-planner, cleaning, medication, pause, pomodoro, stop-paus | Sidhuvuden och mobilformulär är i stor utsträckning redan omgjorda. |
| Övriga | settings, profile, life-profile, work, workflow, studies, studyflow, flowstudy, flow-settings, training, achievements, admin | Äldre filnamn är ofta redirects eller integrerade delkomponenter; bedöm faktisk navigering och aktuell sida. |

## Verifierade avvikelser och förändringar

1. **Energikarta:** fem fasta smala kolumner och 11px nivåetiketter på telefon har ersatts med utrymmesanpassat kolumnantal och läsbarare radbrytning. Samma fem nivåer och sparlogik.
2. **Mående:** synlig äldre text ”Hitta mitt flow” i knapp och modal har bytts till ”Se mina mönster”. Ingen ändring i beräknad insikt.
3. **Temaytor:** vanliga inre vita ytor på Mående, dagens privata anteckning, Det osynliga arbetet och Din energiresa använder nu delade card/secondary-bakgrunder. Varma områdesytor, datakurvor, toner och kvällsstundens avsiktliga helskärmsdesign lämnas intakta.
4. **Tryckytor:** Din energiresas punktinformationsruta kan stängas via en minst 44×44 px-knapp; morgon-/kvällsenergis Spara har minst 44 px höjd.

## Kontrollerat som redan fungerar – ingen ny omskrivning

- Äldre delade MyFloveBlock-kort har redan en kompakt modern variant på sekundära sidor genom data-pace-refresh: CSS nollställer min-höjd och tar bort enradig klippning. Rör inte detta igen utan faktisk skärmbild som visar ett kvarvarande fel.
- De flesta sekundärsidor använder pace-compact-page och PacePageHeader, varför ny global ombyggnad vore onödig.
- Kalenderns tidslinjer och familjens aktiviteter ägs av befintliga komponenter; de får ingen ny CSS i den här etappen.
- Den separata kvällsritualen med egen bakgrund och illustration är avsiktlig och ska inte omfärgas av generiska temaändringar.

## Verifiering som återstår (potentiella risker, ej konstaterade fel)

- **Mobil 320/360/390/430 px:** Din dag med långa aktivitetsnamn, alla tre kalenderlägen, barnens sjudagarsrad och bildstöd, energival och menyer.
- **Stort textläge (200 %) och tablet 768 px:** knappar, sektionstitlar, längre texter, kalenderns koordinatbundna händelser och formulärens nedersta handlingar.
- **Ljus/mörk tema + personliga färger:** energihistorik, tankar/anteckningar, dialoger och områdeskort. Kvällsstundens medvetet fasta ljusa tema måste särskilt kontrastgranskas.
- **Mobilens tangentbord öppet:** Lägg till, QuickFlow, privata anteckningar, barnschema och kvällsreflektion. Spara, Avbryt och Stäng ska fortfarande nås utan att tappa utkast.
- **Kalenderns pågående-period-nyanser och SVG-punkter:** mät läsbarhet/44px tryckmål i riktiga screenshots innan ändrad färg eller geometri.
- **WCAG och enheter:** AA-kontrast, fokus, reducerad rörelse, 44×44 mål, långa namn och felmeddelanden. Validera på Android och iPhone, inte bara med Vitest.

## Avgränsning

Presentation-only TSX och denna rapport. Ingen kontomigrering, användardataändring, kalendergeometri, energilogik, maskot/varumärkesasset, kryptering, familjedelning eller native release. Nya visuella ändringar publiceras bara separat när de är granskade.
