# Changelog

## 2026-09-04 – Startsidan matchar ny design (mockup)

- Tre huvudkort i en rad med centrerad ikon, rubrik och kort undertext: Quickflow, Batteriet (visar aktuell procent) och Kalendern.
- Nytt stort "Ditt batteri"-kort med tydlig procentsiffra, lugn hälsning och länk till tips/loggning.
- "Idag"-sektionen fick mockupens radlayout med tid, titel, anteckning och pil, samt länk "Visa dagsschema".
- Nytt uppmuntrande citatkort ("Små steg varje dag skapar stora förändringar") med hjärtikon längst bland huvudkorten.
- Hälsningen säger nu "Du gör ett fantastiskt jobb!" – samma varma ton som i mockupen.

## 2026-09-04 – Ny startsida: lugn personlig kontrollpanel

- Hem har nu en liten hero ("Hej! 💜 – Vad behöver du just nu?") följd av tre huvudkort: Quickflow, Ditt batteri och Kalendern.
- Ny "Idag"-sektion visar max 5 av dagens saker (påminnelser + uppgifter) med länk till hela dagen.
- "Från ditt huvud" visar de senaste öppna QuickFlow-tankarna, och ett lugnt batteri-/återhämtningskort visar energinivå och befintliga förslag.
- Insiktskortet bygger enbart på faktisk data från appen. Ingen ny datamodell – allt återanvänder befintliga hooks, vyer och routes.


## 2026-09-04 – Notiser fungerar även när appen är stängd

- Uppgifter med tid schemaläggs nu 14 dagar framåt (tidigare bara idag + imorgon), så påminnelser kommer även om appen inte öppnas på flera dagar.
- Appen synkar om påminnelserna var 15:e minut och när den öppnas igen, så inget faller bort över midnatt.
- Om notistillståndet finns men prenumerationen tappats återskapas den automatiskt.

## 2026-09-03 – QuickFlow får hjärnikon

- QuickFlow visas nu med en hjärnikon (hjärnans inkorg) i sidomenyn, bottenmenyn, toppmenyn, den flytande knappen och fångstryten – istället för plus/blixt/inkorg.
- Även den runda QuickFlow-knappen i bottennavigeringen visar nu hjärnan istället för ett plus.

## 2026-09-03 – Live-synk mellan enheter

- Kalender, Min dag och QuickFlow uppdateras automatiskt när samma konto ändras på en annan enhet.
- Batteri och energiflöde läser också in nya energiloggar, energifaktorer och sparade val utan omladdning.
- Den befintliga kontosynken och datamodellen återanvänds; inkommande ändringar skapar inga dubbletter.

## 2026-09-03 – Lägg till direkt på dagen

- I Kalender (Min dag, Vecka och Månad) öppnas lägg-till-flödet nu inline på den valda dagen – ingen separat dialog.
- Datumet är låst till den dag man klickat på; bara "Jag gjorde detta"/"Jag ska göra detta", vad och valfri tid behöver väljas.

## 2026-09-03 – Kalender först på Hem

- Hem-blocket "Min dag" är ersatt av "Kalender": tre tydliga vägar (Min dag, Vecka, Månad) öppnar rätt vy direkt.
- En stor, synlig "+ Lägg till"-knapp i blocket leder till den gemensamma lägg-till-vägen.

## 2026-09-03 – Förenklat aktivitetsflöde

- En gemensam Lägg till-väg skiljer på "Jag gjorde detta" och "Jag ska göra detta" utan krav på kategori, prioritet eller energi.
- Min dag och Kalendern prioriterar "Det här gjorde du" utan klockslag och visar "Tider" separat.
- Kalenderns dagvy använder alltid samma enkla ordning: gjort, planerat, tider och därefter sekundära kalenderposter.
- Kalenderns gemensamma Lägg till-väg använder det valda kalenderdatumet och delade kalenderhändelser visas i en egen sekundär sektion.
- Det gamla generella "Ny händelse"-flödet är borttaget ur dagvyn; vanliga aktiviteter går via den gemensamma Lägg till-vägen och specialflödena finns kvar.
- Valda datum, stabila aktivitets-ID:n och completedAt hålls separata genom QuickFlow-hydrering, sync, omladdning och navigation.
- Att markera något som klart flyttar aldrig aktiviteten till dagens datum – completedAt sparas som egen metadata.

## 2026-09-03 – Snabbval direkt i medicinpåminnelser

- Medicinnotiser (push) har nu tre knappar: "Tagit", "10 min" (ny påminnelse) och "Hoppa över" – valen fungerar även när appen är stängd.
- Larmbannern i appen har fått samma val: "Tagen" bockar av dosen direkt, "10 min" döljer larmet och påminner igen, och krysset hoppar över dosen idag.

## 2026-09-03 – Genomfört hamnar på rätt dag

- QuickFlow-poster som blir uppgifter behåller nu den dag de faktiskt gjordes i stället för att få dagens datum.
- Redan felaktiga rader flyttas automatiskt tillbaka till sin riktiga dag, så "Genomfört idag" bara visar det som gjordes idag.

## 2026-09-03 – Balanserad Hem-layout och tydligare Flow-maskot

- Hem har nu ett balanserat desktop-grid: hero i full bredd, två jämnstora huvudblock och tre jämnstora block på nästa rad utan onödiga tomrum.
- Flow-maskoten är tydligare i hälsningshero-sektionen på desktop, medan mobilens tidigare storlek och touchlayout är återställda.

## 2026-09-03 – Pitchdeck 4.0 för investerarpresentation

- Pitchdeck 4.0 behåller MyFloves visuella identitet och utökar v3.7 med founder/kompetens, vad som faktiskt är byggt, strukturerad validering och tydliga "to be validated"-markeringar.
- Nya slides täcker affärsmodell, differentiering, go-to-market, kapitalbehov/användning och roadmap utan påhittade siffror eller priser.
- Marknadssiffrorna är fortsatt märkta som externa uppskattningar; PowerPoint, PDF och förhandsbild finns på pitchsidan.

## 2026-09-02 – Kontosynk för personliga inställningar

- Föredraget visningsnamn och dagsramar (morgon/kväll) följer nu det inloggade kontot via befintlig offline-first-molnsynk.
- Utloggning rensar dessa kontobundna värden från enheten, medan rena enhetsval, cache och sessionssignaler lämnas lokala.
- Ingen ny datamodell eller parallell lagringslösning införs.

## 2026-09-02 – Avklarade poster stannar på sitt datum

- En avklarad kalenderpost eller uppgift med datum visas nu alltid på sitt planerade datum – den flyttas inte längre till dagens "Min dag" när den bockas av.
- Historiska avklarade poster ligger kvar i kalendern på sitt ursprungliga datum; återkommande händelser och flerdagsperioder fungerar som förut.
- Poster helt utan datum (fria tankar och inbox-uppgifter) hör fortfarande till den dag de bockades av, beräknat i lokal tid.

## 2026-09-02 – Kompakt desktop-layout

- Vänster sidonavigation på desktop är nu kompakt: smalare kolumn, horisontella länkrader med ikon + text i stället för stora fyrkantiga kort, mindre rubriker och knappar.
- Toppnavigationens piller (Hem, Idag, Planera, QuickFlow) är mindre på desktop – lägre höjd, mindre padding och gap, anpassade för mus i stället för touch.
- Innehållsytan får mer plats på desktop genom minskade marginaler. Mobilens touchvänliga storlekar, bottennavigering och safe-area är oförändrade.

## 2026-09-02 – Demokontot aktiverat för direkt inloggning

- Demokontots e-post (investor@myflove.se) är bekräftad i inloggningssystemet, så visningskontot loggar in direkt utan e-poststeg. Inga andra konton eller globala inställningar påverkas.
- Demokontot hoppar automatiskt över introturen – visningen börjar direkt på hemskärmen med exempeldatan.

## 2026-09-02 – Investerar-/demokonto med exempeldata

- Ett markerat demokonto fylls automatiskt en gång med syntetisk QuickFlow, dagsplan, rutiner, mående och energi, så att en visning kan börja direkt i QuickFlow → Flow → prioritering → Min dag.
- Appen visar en diskret markering "Demokonto · Exempeldata" och demoanvändningen räknas inte in i besöks- eller användarstatistiken.
- Kontot är en helt vanlig användare med normal behörighet: inga nya roller, inga lösenord i koden och ingen åtkomst till andra användares data.

## 2026-09-01 – Flow följer adressen och all lokal data skyddas

- Flow-flikarna navigerar via adressen, så uppdatering, delning och bakåtknappen öppnar samma läge som du valde.
- Manifestet över molnsynkade nycklar täcker nu även städning och energiinställningar, och ett nytt test larmar om en ny nyckel glöms bort.
- Utloggning behåller osynkad data även om sidans hook aldrig hann monteras i sessionen.

## 2026-09-01 – Flow samlar hjälp, planering och chatt

- Flow, FlowPlan och Assistant visas som lägen i samma vy med flikarna Flow, Planera och Chatta.
- De äldre adresserna finns kvar och öppnar motsvarande läge, utan att skapa separata kopior av innehållet.

## 2026-09-01 – Äldre energiposter får egna stabila id:n

- Väntande energiloggar utan UUID får ett eget id som sparas lokalt innan de skickas upp, så två identiska historiska observationer aldrig slås ihop.
- Migreringen skriver alltid med upsert på id, vilket gör den säker att köra om efter nätfel, avbrott eller utloggning utan dubbletter.

## 2026-09-01 – Kritiska data-, genvägs- och mobilfixar

- Osynkad lokal användardata och väntande energiloggar skyddas vid utloggning, med bekräftad molnsynk, retry och idempotent migrering.
- QuickFlow-, studie- och push-CTA:er går direkt till kanoniska routes och kalenderdialoger/bottom sheets får säker mobilhöjd med intern scroll.

## 2026-09-01 – Blockrubriken får ikon ovanför text

- Ikonen i varje MyFlove-block ligger nu längst upp till vänster, med rubrik, underrubrik och sammanfattning under.
- Chevron för att expandera/minimera sitter uppe till höger på samma rad som ikonen.

## 2026-09-01 – Blocken är mer fyrkantiga och horisontella

- Kollapsade block är tillbaka som kompakta kort (cirka 10 rem höga) i stället för avlånga rektanglar.
- Rubrik, underrubrik och sammanfattning håller sig på en rad så texten inte trycks ihop vertikalt.
- Rutnätet låter blocken växa horisontellt och anpassa sig efter bredden i stället för att sträckas till den högsta kolumnen.

## 2026-09-01 – Anpassa-sidan visar bara det viktigaste

- Inställningsblocken (tema, alarm, integritet m.fl.) är minimerade som standard och visar bara rubrik, underrubrik och en kort sammanfattning av ditt val.
- Detaljerna – alla teman, ljud och brytare – syns först när du öppnar blocket.

## 2026-09-01 – Blocken ligger två i bredd igen

- Sid- och blockrutnäten går tillbaka till två kolumner redan på mobil, med tre kolumner på mellanstora skärmar och fyra på stora.
- Block som behöver mer plats – eller som du expanderar – tar hela raden, så du får ett större block bredvid två mindre när det passar.
- Inga avlånga fullbreddsblock med ihoptryckt text längre.

## 2026-09-01 – QuickFlow-uppgifter får egna påminnelser

- När du väljer "Med tid" under "Planera den" kan varje QuickFlow-uppgift få en egen påminnelse: vid start, 10/30 minuter, en timme eller en dag innan.
- Påminnelsen sparas på samma gemensamma uppgift som visas i Idag och Kalender – inga kopior skapas.
- Utan tid finns ingen påminnelse, så Flow hittar inte på ett klockslag åt dig.

## 2026-09-01 – Din MyFlove: tema och alarm

- Anpassa appen har fått en samlad sektion för färgtema, alarmsignal och alarmformat.
- Valen sparas på enheten och finns kvar efter omladdning eller utloggning.
- Temat ändrar bara identitetsfärger; semantiska färger för energi, status och varning påverkas inte.

## 2026-09-01 – QuickFlow landar direkt i Idag

- Varje godkänd QuickFlow-post skapas direkt som dagens gemensamma uppgift med samma ID.
- Äldre prioriterade poster migreras automatiskt en gång utan dubbletter.
- Planera den ändrar nu samma uppgift i stället för att skapa en kopia.

## 2026-09-01 – QuickFlow och Idag delar samma uppgifter

- Godkända QuickFlow-poster visas nu automatiskt i Idag utan att tid eller kalenderhändelse krävs.
- Idag och QuickFlow använder samma post och status: avbockning, prioriteringsordning, redigering och borttagning följer med mellan vyerna.
- Befintliga poster i dagens lista visas inte dubbelt när de redan finns i QuickFlow.

## 2026-08-31 – QuickFlow: nya dumpar skriver inte längre över listan

- "Godkänn och prioritera" slog tidigare ut hela "Min lista just nu" – inklusive saker du redan hunnit bocka av.
- Nu slås nya prioriterade saker ihop med befintliga: öppna och klara poster bevaras, och dubbletter av samma sak ersätts av den nya versionen.

## 2026-08-31 – QuickFlow: EN ingång, ett flöde

- QuickFlow-sidan är förenklad: "Kom ihåg", "Prioritera" och "Skriv eller prata in" är borta – kvar finns en enda ingång: "＋ Skriv eller prata med Flow".
- Flödet är alltid detsamma: dumpa allt → Flow delar upp i separata saker → du granskar, redigerar eller tar bort → Flow föreslår en ordning (utan hittade tider) → du godkänner.
- Bottennavigeringens +, desktopknappen och QuickFlow-sidan öppnar nu exakt samma dialog och samma logik – inga parallella QuickFlow-flöden finns kvar.
- Prioriteringsförslaget och "Varför?"-förklaringen ligger i "Min lista just nu" tillsammans med ditt batteri från Mitt batteri.

## 2026-08-31 – QuickFlow: ett brain dump blir flera uppgifter

- "Kom ihåg"-rutan delar nu upp texten i separata uppgifter och visar "Så här har jag förstått det" innan något sparas.
- Du kan redigera eller ta bort varje punkt, godkänna och prioritera, eller bara spara texten.
- Modalen är ombyggd för mobil: full bredd minus marginal, inget kapas åt höger och knapparna ligger under varandra.
- Prioriteringen har fått en liten "Varför?" som förklarar hur Flow tänker.

## 2026-08-31 – QuickFlow: flera saker blir flera aktiviteter

- "Planera den" delar nu upp text som innehåller flera saker i enskilda aktiviteter i stället för att spara allt som en enda.
- Fler skiljeord känns igen vid uppdelning (sen, sedan, dessutom).
- Dialogrutor scrollar nu vid mycket text, så hela innehållet och knapparna alltid syns.

## 2026-08-31 – QuickFlow: planera med din egen tid

- "Planera den" öppnar nu ett litet val: idag, imorgon eller valfritt datum – med eller utan tid.
- Saken hamnar i kalendern precis som du valt. Flow föreslår aldrig tider eller deadlines själv.

## 2026-08-31 – QuickFlow: dela upp i enskilda saker

- Saker som innehåller flera händelser kan nu delas upp i enskilda saker med en knapp direkt i "Min lista just nu".
- Fältet "Lägg till något" delar automatiskt upp flera saker som skrivs in på en gång.
- Uppdelningen skapar inga tider, deadlines, påminnelser eller kalenderhändelser.

## 2026-08-31 – QuickFlow: förtydliga varje uppgift

- Varje sak i "Min lista just nu" har nu en diskret Flow-knapp för att se varför uppgiften kan vara värd att göra, uppskattad energinivå och ett litet första steg.
- Förtydligandet använder Mitt batteri som kontext och sparas tillsammans med QuickFlow-listan – ingen separat loggning, tid, deadline eller kalenderhändelse skapas.
- Om AI inte är tillgänglig visas ett lugnt lokalt förtydligande i stället.

## 2026-08-31 – QuickFlow: "Jag har mycket på en gång"

- Skriv in flera saker i ett enda fält – en per rad eller separerade med komma/och. Inga tider, datum eller kalenderhändelser krävs.
- Flow sorterar dem i Gör nu, Gör sedan, Om du orkar och Kan vänta med en kort förklaring till varje – och hittar aldrig på deadlines.
- Prioriteringen tar hänsyn till din nivå i Mitt batteri: små viktiga saker först när energin är låg, det tyngsta först när den är hög.
- "Min lista just nu" ligger kvar: börja med en sak, bocka av, ändra ordning eller nivå, lägg till nytt och ta bort.
- Klart-markering frågar (frivilligt) hur det påverkade energin via den befintliga energiloggningen. "Planera den" skickar saken vidare till Planera – annars skapas ingen kalenderhändelse eller påminnelse.

## 2026-08-31 – Min energi följer MyFloves designspråk

- "Min energi – historik och mönster" är ombyggd med appens vanliga block, rundningar, borders och spacing.
- Dagens balans är ett kort med tre kompakta värden som får plats på mobil, och Flows reflektion visas som ett mjukt Flow-kort.
- Idag visar varje registrering som en horisontell rad med påverkan, svårighetsgrad och små ikonknappar för ta bort.
- Mönster över tid och Dina återkommande faktorer visas som rena rader i stället för smala kolumner, med "Varför?" bredvid rubriken.
- All loggning, beräkning och synk är oförändrad – det här är enbart en presentationsändring.

## 2026-08-31 – Välj själv vilka dagar programmet läggs på

- "Dagar/vecka" i Ditt mål är nu veckodags-chips (Mån–Sön) i stället för en siffra.
- Programmet skapas på exakt de dagar du valt – Flow får dina dagar och passen läggs ut på dem.
- Dina valda dagar sparas med målet och fylls i igen när du redigerar programmet.

## 2026-08-31 – "Visa bara det viktigaste" är av tills du själv slår på det

- Enkelt läge i Mer-menyn är nu AV som standard i stället för PÅ.
- Tidigare sparat standardvärde rensas automatiskt – läget aktiveras bara när du själv trycker på knappen.

## 2026-08-31 – Välj flera dagar för ett träningspass

- Pass-dialogen i Träning har nu veckodags-chips (Mån–Sön) i stället för fritext för dagen.
- När du lägger till ett pass kan du välja flera dagar – samma pass skapas på varje vald dag.
- Vid redigering av ett befintligt pass väljs en dag, och befintliga pass med annan dagtext mappas till närmaste veckodag.

## 2026-08-31 – Bottennavigationen sitter alltid fast längst ner

- Appens layout-root är nu exakt en skärmhöjd (`h-[100dvh]`, `overflow-hidden`, `overscroll-none`) så dokumentet aldrig kan scrolla under bottennaven.
- `overscroll-behavior-y: none` på html/body stoppar gummibands-scroll i mobila webbvyer som tidigare kunde få den fasta bottennaven att åka med uppåt.
- Verifierat på /hem, /kalender och /anpassa: naven ligger kvar vid botten vid scroll medan innehållet scrollar inuti som vanligt.

## 2026-08-31 – Flow-hjälparen är mindre och tydligare

- Maskoten i "Flow hjälper" är nu kompaktare (ny `compact`-scenstorlek) så att den inte dominerar vyn.
- Slide-ytan har fått mindre vertikal höjd och tätare spacing, vilket gör Flow-karusellen lugnare och lättare att läsa.

## 2026-08-31 – Flow ser dagens check-ins i sin kontext

- Flows personliga kontext innehåller nu dagens morgon-, dag- och kvällscheck-ins från den befintliga energi- och måendeloggen.
- Flow får tid, energi, mående och användarens eventuella fritext – utan att skapa en ny datakälla eller blanda ihop hälsologgning med aktiviteter.

## 2026-08-31 – Flow bjuder in till mjuka check-ins under dagen

- Flow kan en gång per tidsfönster (morgon 06–11, dag 11–17, kväll 17–23) öppna en diskret popup med en frivillig check-in.
- Popupen använder den befintliga centrala "Logga energi & mående"-vägen; ingen separat energi-, mående- eller aktivitetskälla skapas.
- "Hoppa över" stänger utan skuld och respekteras resten av tidsfönstret. En befintlig observation i tidsfönstret suppressar en ny popup.
- Varför?-förklaringen beskriver kort hur flera observationer hjälper Flow att se förändringar över dagen. Hälsokontext skapar aldrig aktiviteter, kalenderposter eller påminnelser.

## 2026-08-31 – Mående, energi och ekonomi är nu kontobundna

- Mående (`myflow-moods`) och ekonomi (`myflow-finances`) sparas kontobundet i `user_kv` via nya `useCloudSyncedList` – samma nyckel som MCP-verktyget `log_mood` redan använder, alltså en enda source of truth. Befintlig lokal data slås ihop per id efter inloggning, så inget skrivs över och inga dubbletter skapas.
- Energiloggar har `energy_logs` som source of truth. `myflove-energy-log` är nu enbart en lokal cache som speglar molnet (60 dagar) för insikter och mönster. Loggningar gjorda utan inloggning hamnar i `myflove-energy-pending` och flyttas upp till kontot vid nästa inloggning.
- Efter utloggning rensas den lokala krypterade kopian som tidigare, men allt hämtas tillbaka vid inloggning: energi, mående, fritext/orsak och ekonomi överlever logga ut → logga in.
- Fritext och "vad påverkar" sparas fortsatt på måendeobservationen som hälsokontext – aldrig som aktivitet, kalenderpost eller påminnelse.

## 2026-08-31 – Namn och morgon/kväll-batteri stannar kvar vid utloggning

- Ditt namn (`myflove-preferred-name`), dagens tidsramar (`myflove-day-window`) och morgon-/kvällsvärdena i Mitt batteri (`myflove-day-edges`) läggs till i enhetsnycklarna i `clearLocalUserData` – de rensas inte längre när du loggar ut, så appen känns igen dig vid nästa besök på samma enhet.

## 2026-08-31 – Fix: länkar i expanderade kort navigerar igen

- Klick på länkar inuti ett expanderat kort (t.ex. "Vad behöver du just nu?" på Hem) navigerade aldrig iväg: kortets tillfälliga historik-läge för Android-bakåtknappen kunde ogöra navigationen när kortet avmonterades. Menykort med länkar använder nu enbart routerns vanliga historik, medan vanliga innehållskort fortfarande kan stängas med bakåtknappen.
- Texten i "Vad behöver du just nu?" sa felaktigt "Fyra vanliga situationer" fast listan har tre – nu står det tre.

## 2026-08-30 – Global designregel: inga onödigt vertikala textblock

- Alla kort som bygger på `ExpandableBlock` växlar nu automatiskt till en horisontell rad (ikon · rubrik + kort text · status · pil) så snart kortet har utrymme, tack vare container queries. Smala kort på liten mobil staplar fortfarande innehållet.
- Widget-korten blir också horisontella i breda ytor i stället för höga torn, och minimihöjden på 9 rem gäller bara i smala kolumner.
- `MyFloveEmptyState` är kompaktare och lägger ikon, text och knapp på samma rad från `sm` och uppåt.
- Ändringarna är rent presentation – ingen data-, navigations- eller produktlogik har ändrats.

## 2026-08-30 – Kalender blir navet för dagens planering

- Kalender är nu appens enda primära plats för dagens planering, med tre flikar: **Idag**, **Kalender** och **Lägg till**. Varje flik har en egen adress (`/idag`, `/kalender`, `/lagg-till`) så länkar och bakåtknappen fungerar som vanligt.
- **Lägg till** är den gemensamma vägen in: ny aktivitet, "jag gjorde redan något" samt tydliga rader till påminnelse, rutin, medicin och barnens dag.
- Hem är åter en ren översikt: Mitt batteri, Flow, insikter, Min dag och QuickFlow. Duplicerade genvägar (Kalender-kortet, "Lägg till i dagen" och "Jag gjorde redan något") är borttagna. Min dag visar t.ex. "6 av 7 klara · 1 kvar" och öppnar Kalender · Idag.
- Ny energilogik: en planerad aktivitet ändrar aldrig energin av sig själv. När du bockar av något frågar MyFlove frivilligt hur det påverkade dig – Gav energi, Tog lite energi, Tog mycket energi eller Vet inte. "Vet inte" loggar ingenting.
- Planerad aktivitet, genomförd aktivitet och energilogg hålls isär i datamodellen; energiposten skapas bara med faktisk användaråterkoppling.
- En diskret "Varför?"-förklaring finns i energifrågan.

## 2026-08-29 – Publicerad: myflove.lovable.app uppdaterad

- Den senaste versionen av MyFlove publicerades till `https://myflove.lovable.app`.
- Live-sidan visar nu senaste blueprint, pitchdeck och pitchvideo i version 3.7.
- Inkluderar alla senaste design- och UX-ändringar: blocklayout, mjuka borders, "Varför?"-förklaringar och Lägg till på hemskärmen.

## 2026-08-29 – "Varför?" överallt och Lägg till på hemskärmen

- Sidhuvudet (`MyFloveHeader`) har nu ett gemensamt `why`-stöd, så alla "Varför?"-förklaringar ser likadana ut och beter sig likadant.
- Korta, varma "Varför?"-förklaringar finns nu på Mitt batteri, Hälsa, Min energi (historik), QuickFlow, Påminnelser och Insight – utöver Planera.
- "Lägg till på hemskärmen" visas som en tydlig inställningsrad i Mer med underrubriken "Öppna MyFlove snabbare när du behöver Flow." Riktig installationsprompt används där webbläsaren stödjer den, iOS får steg-för-steg och knappen döljs helt när appen redan är installerad.
- QA i mobilvy (390 px): Hem, Mitt batteri, Hälsa, QuickFlow, Påminnelser, Min energi, Insight, Planera, Idag och Kalender renderar utan horisontell scroll eller trasiga routes.

## 2026-08-29 – Nya Blueprint-, pitchdeck- och videomaterial 3.7

- Living Blueprint 3.7 beskriver MyFloves aktuella produktkarta: Flow som följeslagare, Mitt batteri som enda hälsologgning, Idag som aktivitetsnav och det gemensamma blocksystemet.
- Pitchdeck 3.7 och pitchvideo 3.7 är nytt material med en sammanhållen berättelse om MyFlove – inte en omstart av produkten.
- Externa marknadsuppskattningar är tydligt märkta som uppskattningar och prognoser; inga påhittade traction-siffror presenteras.
- Pitchsidan visar och länkar till 3.7-filerna för DOCX, PDF, PowerPoint och MP4.

## 2026-08-29 – Anpassa appen: symmetriskt rutnät

- Blocken i Anpassa appen sträcker sig nu lika högt inom varje rad, så rutnätet ser symmetriskt och balanserat ut.
- Underliggande grid-komponent (`MyFlovePageGrid` / `MyFloveBlockGrid`) använder `items-stretch` som standard, vilket ger jämna blockhöjder i hela appen.

## 2026-08-29 – Anpassa appen: block sida vid sida med mindre text

- Inställningarna är nu uppdelade i mindre block (Mindre på skärmen, Lättare att använda, Integritet, Konto) som ligger sida vid sida i rutnätet.
- Varje reglage visar bara en kort rubrik – långa förklaringar är borttagna så korten blir lättare att skanna.
- Samma blockdesign, rundning, border och färgsystem som resten av appen.

## 2026-08-29 – Hem: planera-väg rättad

- "Vad behöver du just nu? – Jag behöver planera min dag" leder nu till `/flowplan` (Planera) istället för att duplicera Idag-genvägen.

## 2026-08-29 – Mer: strukturerade sektioner längst ner

- Mer-sidans nedre del är nu grupperad i fyra tydliga sektioner: Min profil, Anpassa MyFlove, Kom igång och Ljud & konto – varje med rubrik och kort förklaring.
- "Din bottenmeny" ligger under Anpassa MyFlove där den hör hemma, och "Installera appen" (PWA) ligger i listan under Kom igång.
- Alla rader och kort har samma höjd, spacing, ikonplacering och beteende som tidigare – ingen funktion är flyttad till ny route eller borttagen.

## 2026-08-29 – Mer/Inställningar: en primär väg in per funktion

- Kartlade hela Mer-flödet och tog bort dubbletterna: Anpassa appen, Hemskärm och Min livsprofil fanns tidigare både som kategori, pillerknapp och eget kort.
- Kategorin "Inställningar" i områdesrutnätet är borttagen – inställningar bor nu i en enda sektion längst ner i Mer. Admin har en egen kategori.
- Alla inställningsrader (Anpassa appen, Hemskärm, Flow-inställningar, Min livsprofil, Så funkar MyFlove, Visa introduktionen igen, Alarmljud, Enkelt läge, Logga ut) har samma höjd, ikonstorlek, spacing och beteende.
- Sökningen i Mer hittar fortfarande alla sidor som tidigare.
- Fix: bottenmenyns "Återställ" och hjälptexten pekar nu på Idag + Planera, som är det faktiska standardläget.

## 2026-08-29 – Städning: kompaktare Påminnelser, energihistorik och listor

- Påminnelser: "Aviseringar" är nu ett kompakt kort – kort status och knapp på samma rad i stället för höga textstycken.
- Min energi: "Lägg till det du gjorde" är fullbrett, så tidsval och aktivitetschips ligger sida vid sida i stället för i en smal vertikal kolumn. Hero-texten är kortare.
- Inköpslista: alla rader har samma höjd och padding, ikoner i samma storlek, status till vänster och papperskorg till höger. Avklarade rader har diskret genomstrykning med bibehållen kontrast.
- Sparade butiker: kortare underrubrik ("Påminn mig när jag är nära en butik.") och input + platsknapp på samma rad som wrappar snyggt på små skärmar.

## 2026-08-29 – Städning: typsnitt, statistik och konsekventa kort

- Nunito Sans är nu appens enda typsnitt (tokens + fontladdning), med emoji-fallback.
- Sidvisningar loggas på EN plats (`trackPageView` i root) – den dubbla loggningen i layouten är borttagen, så statistiken inte dubbelräknas.
- `/insight` renderas nu i appens delade skal, så bottennavigation och back-navigation fungerar där också.
- Hem: Kalender-kortet visar kort värde ("Se dagen") + en rad förklaring, och Rutiner & medicin använder Lucide-ikon i stället för emoji – samma kortspråk som övriga block.

## 2026-08-29 – Planera: fullbreddsblock i stället för smal vertikal layout

- Steg 1 (”Hur ser dagen ut?”) och Steg 2 (”Ändra ordningen”) spänner nu över hela raden via `span`, så formulär och lista får hela ytans bredd i stället för att klämmas vertikalt i en halv kolumn.
- Energivalen ligger i tre kolumner även på mobil nu när blocket är fullbrett.

## 2026-08-29 – Hem: Kalender-blocket får samma vertikala rytm som andra block

- Lade till en osynlig statushållare i Kalender-blocket så att marginaler och vertikal spacing matchar de andra blocken nu när statusraden är borta.
- Endast presentation – navigation, data och funktionalitet är oförändrade.

## 2026-08-29 – Hem: Kalender-blocket utan "Jag finns här"

- Tog bort statusraden "Jag finns här" från Hem-blocket Kalender. Kortet visar nu bara titel, undertitel och Flows förslagstext.
- Endast presentation – navigation, data och funktionalitet är oförändrade.

## 2026-08-29 – Stabilare sortering av dagens måendeobservationer

- Dagens måendeobservationer sorteras nu kronologiskt även när flera loggningar har samma tidsstämpel, så ordningen blir förutsägbar i Mitt batteri och historiken.
- Testerna för `useQuickCheckin` väntar nu ut asynkrona tillståndsuppdateringar innan verifiering, vilket tar bort den sporadiska testflaken.

## 2026-08-29 – Hem: Kalender-ikon i stället för Flow-maskot, nästa-block bort

- Hem-blocket "Kalender" (tidigare "Flow · just nu") använder nu en kalender-ikon (CalendarDays) och områdesidentiteten "kalender" i stället för Flow-maskoten.
- "Nästa" / "Nästa viktiga sak" är borttaget från Hem – samma information finns redan i Idag.
- Inga funktionella eller dataändringar; endast presentation och hemlayout.

## 2026-08-29 – Idag: Lägg till i dagen följer blockspråket

- Steg 3 "Lägg till i dagen" på Idag är nu ett komprimerat, expanderbart block (ExpandableBlock) med ikon, etikett och status – samma designspråk som övriga kort.
- Innehållet (TaskQuickAdd och DidThisQuickAdd) är oförändrat och ligger i den expanderade vyn.

## 2026-08-29 – Tjockare kantlinjer på samtliga kort

- Alla kort med blocklayouten har nu 2px-borders i stället för 1px – gemensamma border-tokens (`--border-hairline`, `--border-strong`, `--border-dashed`, `--border-accent`), hero-ytan och alla `rounded-3xl`-kort i sidor och komponenter.
- Inre avdelare (`border-t`-linjer) är oförändrade.
- Endast presentation – data, logik och navigation är oförändrade.

## 2026-08-29 – Hem: Flow-kortet döps om till Kalender

- Kortet som tidigare hette "Flow · just nu" heter nu "Kalender" och leder till Kalender (/kalender).
- "Nästa" navigerar tillbaka till Idag (/idag).
- Flow-maskoten i godmorgon-kortet är förstorad från `sm` till `md`.
- Endast presentation och navigation – data, logik och övrig funktionalitet är oförändrad.

## 2026-08-29 – Hem: Nästa leder till Kalender, Flow-blocket större

- "Nästa" navigerar nu till Kalender (/kalender) i stället för Idag – eftersom det redan finns en Idag-widget.
- "Flow · just nu" är nu ett fullbrett block högt upp på Hem med större Flow-maskot.
- Endast presentation och navigation – data, logik och övrig funktionalitet är oförändrad.

## 2026-08-29 – Hem: Flow-, Insikter- och Nästa-korten leder nu vidare

- "Flow lär känna dig" navigerar till Insikter (/insight) – samma mål som kortets egen länk.
- "Nästa" navigerar till Idag (/idag) där aktiviteten visas i sin helhet.
- "Flow · just nu" navigerar till Flow (/flow).
- ExpandableBlock har fått ett href-läge: kortet blir en länk med samma komprimerade design (som Mitt batteri). Ingen information försvinner – innehållet bor på målsidorna.

## 2026-08-29 – Hem: centrerad blockdesign enligt ny referens

- Komprimerade block är nu centrerade: cirkulär färgad ikon upptill, rubrik + kort underrubrik, streck och stort värde i områdets färg, samt rund pilknapp uppe till höger.
- Mitt batteri-kortet och Dagens översikt följer samma centrerade stil.
- Hälsokortet överst visar nu Flow-maskoten i stället för en emoji.
- Expanderad vy, all data, navigation och funktionalitet är oförändrade.

## 2026-08-29 – Samma blockdesign på övriga sidor

- MyFloves gemensamma blockspråk (tvåkolumns-grid, mjuka rundade kort, områdesfärgade borders) är nu applicerat på övriga sidor: Matlista, Träning, Stop-paus, Quickflow, Relationer, Barn, Familj, Ekonomi, Resor, Timer (Pomodoro), Belöningar, Veckans flow, Studyflow, Jobb, Workflow, Daglig rutin, Friktionsindex, Livsprofil och Statistik.
- Påminnelser: blocken bär nu idag-områdets mjuka border.
- Sidorna använder MyFlovePageGrid med MyFloveWide för innehåll som behöver full bredd (formulär, listor, grafer) – samma symmetri som Hem och Hälsa.
- Endast presentation – data, logik, navigation och funktionalitet är oförändrade.

## 2026-08-29 – Samma blockpolish på Hälsa, Planera och Kalender

- Hälsa: Träning- och Rutiner-korten följer nu Hem-blockens formspråk – rounded-3xl, mjuk halsa-border, min-height 9rem, ikon + rubrik + kort underrubrik + pil uppe till höger. Kortare underrubriker.
- Hälsa/Mitt batteri: batteriblocket bär nu hälsaområdets border även i fullvy.
- Planera: stegblocken (Hur ser dagen ut?, Ändra ordningen) får planeraområdets mjuka blå/lila border.
- Kalender: kalenderkortet och import/export-knapparna får kalenderområdets mjuka rosa/lila border och samma skugga som övriga block.
- Endast presentation – data, logik och navigation är oförändrade.

## 2026-08-29 – Hemskärmen: polish och symmetri

- Tydligare områdesborders: varje blocks border följer sin färgidentitet (batteri = varm/gul, Flow = lila, Idag/Nästa = blå, Lägg till = mint) och är synligare mot pastellbakgrunden.
- Harmoniserade blockhöjder: komprimerade block delar min-height (9rem) så tvåkolumnsgriddet känns symmetriskt; samma rundning (rounded-3xl) och padding överallt.
- Visuell hierarki: huvudvärdet (t.ex. "56 %", "10:30", "1/3") är nu text-3xl och det största i varje block.
- Konsekvent ikonplacering: ikon + rubrik + underrubrik överst till vänster, pil/chevron diskret uppe till höger i alla klickbara block (även Mitt batteri och Idag).
- "Dagens översikt"-blocket heter nu "Idag" och följer samma kortstruktur som Mitt batteri.
- Kortare underrubriker utan avklippt text: "Nästa viktiga sak", "Ditt nästa steg".
- Endast presentation – data, loggning, navigation och logik är oförändrade.

## 2026-08-29 – Tre riktade UI/UX-korrigeringar

- Hem: "Dagens översikt" navigerar nu direkt till befintliga Idag-vyn (ingen ny route); tillbaka fungerar som vanligt. Blocket är en komprimerad widget: ikon + "3/5" + "2 kvar".
- Historik → Mående: "Hitta mitt flow" är omdesignad till samma blockspråk – rundat lavenderkort med ikon + kort rubrik. Funktionen (Flow-insikter) är oförändrad.
- Historik → Flöde: sektionerna "Lägg till något som påverkar", "Idag", "Mönster över tid" och "Hur mycket får det påverka?" är komprimerade som standard och expanderar vid tryck; långa förklaringstexter är kortade.
- Endast presentation – data, stores, navigation och logik är oförändrade.

## 2026-08-29 – Hem i samma designspråk som Hälsa

- Hemblocken har nu tre informationsnivåer i komprimerat läge: rubrik, kort underrubrik (3–8 ord) och aktuellt värde – t.ex. "Mitt batteri · Energi och mående · 33 % · Låg energi just nu".
- Widget-minimalismen (bara ikon + ett ord) är borta från Hem; blocken är större, luftigare och pastellfärgade enligt områdesfärgerna, precis som Hälsa.
- Tryck expanderar fortfarande endast det blocket på plats med mjuk animation, och stängning återgår till samma position.
- Tvåkolumnsrutnätet på mobil, data, stores, loggning, routes och Flow-logik är oförändrade.

## 2026-08-29 – Hem återställt som samlad överblick

- Alla hemblock visas igen som komprimerade widgets: Mitt batteri, Flow, Nästa, Dagens översikt, Lägg till i dagen, Rutiner & medicin, Vad behöver du just nu och områdesväljaren.
- "Lägg till i dagen" följer nu samma blockspråk – komprimerat kort (＋ Lägg till) som öppnar snabbtillägg och "Jag gjorde något" när man trycker.
- Inget innehåll är borttaget; information har bara flyttats från långa listor till kompakt block → tryck → expandera.

## 2026-08-29 – Widget-minimalism på fler dashboard-sidor

- Idag: "Dagens ordning" är nu en komprimerad widget (ikon + antal steg + etiketten "Ordning"); hela planen med steg, tider och länk till Planera finns kvar i expanderad vy.
- Kalender: batterikortet använder samma widget-läge som Hem – stor ikon + procent, tryck öppnar Mitt batteri.
- Mitt batteri: historikblocket är en komprimerad widget ("Historik") som expanderar i sidans flöde med flikarna Mående/Energi/Flöde oförändrade.
- Endast presentation: data, stores, navigation och logik är oförändrade.

## 2026-08-29 – Widget-läge: minimalistiska komprimerade block

- Komprimerade block på Hem visar nu bara stor ikon/illustration + ETT värde (t.ex. 🔋 58 %, ✓ 4/7, 📅 13:00) – rubrik, underrubrik och förklaringar har flyttats till den expanderade vyn.
- `ExpandableBlock` har fått ett `widget`-läge: komprimerat är en luftig widget, vid tryck expanderar samma kort i sidans flöde med rubrik och allt innehåll kvar.
- Batterikortet på Hem är en egen widget-länk (ikon + procent); Flow-noteringen är ett widget-block med maskoten och allt läroinnehåll i expanderad vy.
- Områdesfärgerna bär informationsvärdet i stället för text; ingen "tryck här"-copy finns kvar i komprimerat läge.
- Endast presentation: data, stores, navigation, routes, Flow-logik och hälsoregler är oförändrade.

## 2026-08-29 – Områdesfärger som visuell röd tråd

- Varje huvudområde har nu en egen mjuk färgidentitet: Hälsa (teal/salvia), Flow (lila), Idag (blå), Planera (blå/lila), Hem (varm persika), Återhämtning (gul) och Kalender (rosa/lila).
- Färgerna definieras centralt som design tokens i `src/styles.css` och mappas i `src/lib/areas.ts`, så att ett områdes färg kan bytas på ett enda ställe.
- Sidhuvuden, blockramar och blockikoner tar upp områdets färg via `data-area` och nya utilities (`area-text`, `area-bg-soft`, `area-border`, `area-hero`).
- Färg är aldrig enda informationsbäraren – ikon, rubrik och text är oförändrade, liksom kontrast, reduced motion och tillgänglighet.
- Endast presentation: data, stores, navigation, routes, Flow-logik, hälsologik och tester är oförändrade.

## 2026-08-29 – Komprimerade och expanderbara block

- Informationsrika block visar nu en lugn sammanfattning först och öppnar samma innehåll i en fokuserad vy vid tryck.
- Den expanderade vyn kan stängas med Stäng, Escape eller Androids bakåtknapp; fokus och scrollposition återställs till samma block.
- Reduced motion respekteras utan att ändra funktionalitet, data, navigation eller befintliga användarflöden.
- Block expanderar nu på plats i sidans flöde som ett accordion-kort i stället för att öppnas som en helskärmsvy: kortet växer mjukt, tar hela innehållsbredden (col-span-full) och kollapsar tillbaka till exakt samma ruta i tvåkolumnsrutnätet – verifierat utan horisontell scroll på 320–412 px.

## 2026-08-29 – Responsivt blocksystem

- MyFlove använder ett gemensamt CSS-grid som aktivt placerar lämpliga block bredvid varandra i stället för att stapla varje sektion som en hel rad.
- Hem visar ett varierat dashboard-grid med batteri/Flow, sammanfattningar och nästa steg sida vid sida; bredare ytor används där grafer och tidslinjer behöver det.
- `MyFlovePageGrid` använder två kolumner som standard även på 320–412 px, tre på tablet och fyra på desktop; `MyFloveWide` ger enskilda breda block hela raden.
- Hem, Hälsa och Mitt batteri visar flera lämpliga block samtidigt på mobil, medan långa formulär, tidslinjer och grafer fortsatt använder hela bredden utan sidoscroll.
- Resterande vyer – Planera, Kalender, Energi/Flow, listor, påminnelser, rutiner, medicin och inställningar – använder nu samma responsiva blockramverk.
- Mobilkorten har kompakt padding och storlek, medan innehåll som behöver läsbredd uttryckligen spänner båda kolumnerna.
- Endast layout – funktioner, data, logik, navigation och tester är oförändrade.

## 2026-08-29 – Ren kodbas (lint-städning)

- Alla lint-varningar åtgärdade: hjälpfunktioner flyttade ur komponentfiler till egna moduler (`scenes.ts`, `recurrence.ts`, `battery-observations.ts`) och hook-beroenden memoiserade.
- Autogenererade Supabase-filer exkluderas från linting – de redigeras aldrig för hand.
- Ingen funktionell förändring; alla 207 tester, typkontroll och produktionsbygge passerar.

## 2026-08-29 – Samlad MyFlove-design

- Gemensamma block, rubriker, ytor och minimering används nu konsekvent i appens centrala vyer.
- Hem, Mitt batteri, Idag, Planera, Flow, QuickFlow och Anpassa appen följer samma lugna visuella rytm.
- Befintliga funktioner, navigation, data och logik är oförändrade.

## 2026-08-29 – Flera observationer per dag i Mitt batteri

- Varje loggning av energi/mående blir nu en egen tidsstämplad observation – tidigare värden skrivs aldrig över.
- Ny vy "Idag i Mitt batteri" visar hur energi och mående förändrats under dagen (08:15 · 30 % → 13:40 · 55 % …), med din fritext vid varje tillfälle.
- Mitt batteri är fortfarande den enda loggningsplatsen; den fristående måendesidan är nu read-only och hänvisar dit.
- Logga så ofta du vill: morgon, eftermiddag, kväll – allt samlas i samma lugna bild av dagen.

## 2026-08-29 – Redigera dagens loggning i Mitt batteri

- Dagens energi- och måendeloggning går nu att ändra direkt i samma vy: Mitt batteri fyller i dagens värden och din sparade fritext automatiskt.
- Knappen visar "Uppdatera dagens loggning" när du redan loggat – samma logg uppdateras, ingen ny skapas.
- Fritexten kan ändras eller rensas helt; historiken förblir read-only.

## 2026-08-29 – En enda plats för energi & mående

- Mitt batteri är nu den enda platsen där du loggar energi och mående: Hem → Mitt batteri → Logga energi & mående.
- Hem visar batteriet tydligt med en direktknapp – men loggar inget själv.
- Dubbla loggningsvägar borttagna: den oanvända snabbincheckningen, Flows egna reglage och QuickFlows energipanel hänvisar nu till Mitt batteri.
- Du kan skriva med egna ord om vad som påverkar dig – frivilligt, sparas med dagens mående.
- Flow kan använda din text som kontext, men ställer aldrig diagnoser.
- Måendehistoriken är read-only; nya loggar görs i Mitt batteri.

## 2026-08-29 – Hälsologgning hålls skild från Min dag och kalendern

- Ny regel i koden: energi, sömn, mående och kroppsliga observationer är data – de blir aldrig automatiskt en uppgift, kalenderpost eller påminnelse.
- QuickFlow tolkar nu hälsotexter ("sov 5 timmar", "huvudvärk idag", "kroppen påverkar") som energi-/måendelogg i stället för kalender.
- Aktiviteter påverkas inte: "boka läkare", "träning kl 18" och liknande hamnar kvar som aktiviteter, och du kan alltid välja destination själv.
- Egen statistikhändelse för hälsologgning (utan värden) så att loggning aldrig blandas ihop med skapade uppgifter.
- Nya tester som säkerställer separationen.

## 2026-08-28 – Mediciner sparas i molnet

- Medicinlistan och medicinloggen synkas nu till ditt konto (som rutinerna) i stället för att bara ligga på enheten.
- Listan finns därför kvar efter utloggning och följer med till andra enheter.
- Befintlig lokal medicindata lyfts automatiskt upp till kontot första gången appen öppnas.

## 2026-08-28 – Av/på-knapp för anonym statistik

- Ny synlig inställning under Anpassa appen → Integritet: "Dela anonym användningsstatistik" med av/på-knapp.
- Knappen kopplad till befintliga opt-out-flaggan (`myflove-analytics-opt-out`) – avstängningen gäller direkt och inga fler händelser skickas.
- Länk till cookiepolicyn direkt från inställningen; cookiepolicyn pekar nu på var knappen finns.
- Nödvändig lagring (inloggning, inställningar, data) påverkas aldrig av valet.

## 2026-08-28 – Uppdaterade juridiska dokument

- Integritetspolicy, användarvillkor och cookiepolicy uppdaterade till dagens app (senast uppdaterad 28 augusti 2026).
- Integritet: hälsodata som särskild kategori med uttryckligt samtycke, sparade Flow-samtal, push-prenumeration, Google-inloggning, delat innehåll i hushåll, barns uppgifter samt att innehåll inte används för att träna AI-modeller.
- Radering: självbetjäning i appen (Inställningar → Avsluta konto) och att lokal data och krypteringsnyckel rensas vid utloggning.
- Villkor: Flow är inte diagnos eller behandling, appen är inte medicinteknisk, påminnelser är stöd och inte garanti, delning med andra, ARN och tvingande konsumenträtt.
- Cookies: krypterad lokal lagring (AES-GCM med nyckel i IndexedDB), sessionslagring för chattutkast och avidentifierad statistik utan innehåll.

## 2026-08-28 – Spara samtal med Flow

- "Prata med Flow" har nu en tydlig samtalslista: [+ Nytt samtal] högst upp och "Mina samtal" under, senast använda först.
- Varje samtal är separat med eget id – nya samtal blandas aldrig ihop med gamla, och du kan fortsätta där du slutade.
- Datum visas mänskligt: Idag, Igår, I förrgår – annars vanligt datum.
- ⋯ ger Byt namn och Ta bort samtal, med enkel bekräftelse innan radering.
- Automatiska, korta titlar från samtalets första meddelande – aldrig "Chat 1". Utan innehåll heter samtalet "Nytt samtal".
- Tomt läge: "💜 Prata med Flow – Du kan börja ett nytt samtal när du vill."
- Sparade samtal påverkar inte Flows långsiktiga lärande; det är fortsatt två skilda saker.
- Påbörjad text sparas i sessionslagring i stället för klartext på disken och rensas vid utloggning.

## 2026-08-28 – Äkta insikter och rekommendationer

- "Hitta mitt flow" visar bara mönster som faktiskt syns i din egen data – ingen generisk uppmuntran längre när underlag saknas.
- Varje insikt visar vad den bygger på, t.ex. antal incheckningar och snittvärde.
- Måendetrend kräver minst tre incheckningar den senaste veckan; en enstaka logg blir aldrig ett mönster.
- Avklarade uppgifter räknas nu på när de faktiskt blev klara (completedAt), inte när de skapades.
- Dagens fokus visas bara när det gäller idag.
- Tomläge i stället för påhittad slutsats: "Jag har inte tillräckligt underlag ännu."

## 2026-08-28 – Tydlig nytta med loggning

- Incheckningen på Mitt batteri visar kort vad du får tillbaka, och texten följer hur väl Flow redan känner dig.
- Ny diskret "ⓘ Varför?" på energi, mående och planering – bara där nyttan inte är självklar.
- Bekräftelse efter sparad incheckning är nu mänsklig: "💜 Tack. Det hjälper mig att förstå dig bättre."
- Promenader beskrivs utifrån nyttan: hitta en promenad som passar din energi just nu.
- Ingen ny insikts- eller datamodell: befintlig Flow-learning används, och inga mönster visas utan verklig data.

## 2026-08-28 – Pitchmaterial 3.6

- Uppdaterat Living Blueprint, pitchdeck och pitchvideo till version 3.6.
- Nytt fokus i materialet: Lugnare helhet, färre val, tydligare vägar och levande Flow.
- Pitchsidan använder nu 3.6-filerna för video, PowerPoint, PDF och blueprint.

## 2026-08-28 – Subtil sidövergång

- Infört en gemensam fade-transition vid riktiga sidbyten: tonar ut cirka 160 ms och tonar in cirka 220 ms.
- Lokala interaktioner, modaler, kollapsning, Flow och QuickFlow påverkas inte av sidövergången.
- `prefers-reduced-motion` stänger av övergångsanimeringen utan att ändra navigation eller historik.

## 2026-08-28 – Stop-paus flyttar till Mer

- Stop-paus är nu en egen tydlig post under Mer → Hälsa med egen ikon (🛑 Stop-paus) – direkt åtkomlig utan väg via Mitt batteri.
- Ny sida `/stop-paus` som öppnar samma StopModal-funktion och logik som tidigare – inga nya funktioner eller datamodeller.
- När pausen stängs används routerhistoriken (useSmartBack) så du kommer tillbaka dit du faktiskt kom ifrån.
- Dubbletten på Mitt batteri ("Stop – ta en paus först") är borttagen – bara en plats för Stop-paus.

## 2026-08-28 – Flow syns tydligare utan att flytta något

- Flow är optiskt större på små platser (Hem, chatten, installationskortet, Flow lär sig) via en ny `bump`-variant – rutan i layouten är låst så text, radhöjd och spacing står stilla.
- Flow i chattens sidhuvud, meddelandelistan och tänker-läget använder samma finjustering.
- Mini-scenen i Flow-karaktären visar maskoten i 68 px inuti sin 80 px-ruta.
- Nya tester `src/components/flow-mascot.test.tsx` verifierar att den optiska förstoringen inte ändrar layoutrutan; snapshot-storleken i `flow-character.test.tsx` är uppdaterad.

## 2026-08-28 – Flow-närvaro, minimerbara block och smart tillbaka

- Flow-maskoten är något större på de platser där den redan visas (mini 80 px, inline och hero något högre) – samma maskot, samma identitet.
- Flows små rörelser är fortsatt sparsamma och situationsbaserade och respekterar `prefers-reduced-motion`.
- "Mitt batteri" på Hem och "Energins historik idag" går nu att minimera/maximera med samma chevron-kontroll som övriga block.
- Minimerat läge kommer ihåg sig lokalt per sida (endast UI-preferens, ingen data påverkas).
- Ny delad hook `useSmartBack` – Tillbaka följer appens riktiga routerhistorik och faller bara tillbaka till Hem vid direktladdning.
- Tillbaka-knapparna i sidhuvudet, layouten och Insight använder nu samma logik, utan egen parallell historik.

## 2026-08-28 – Hem-kategorin: Inköpslista och Städning

- Inköpslista och Städning ligger nu tydligt under huvudkategorin **Hem** i menyn.
- Kategorin heter **Hem** (tidigare "Hemma") för att matcha den nya mentala modellen.
- Navigationsetiketten för `/shopping` är **Inköpslista** så den stämmer överens med sidan.
- Befintliga sidor, routes, data och funktioner är oförändrade: `/shopping` och `/stadning` fungerar som tidigare.
- Hälsa, Idag, Planera, Flow, Mitt batteri och QuickFlow är oförändrade.

- "Hur är ditt batteri just nu?" (snabb incheckning) är nu den primära funktionen högst upp på Mitt batteri.
- Dagens batteri/översikt, morgon/kväll och dagens energiflöde ligger direkt efter incheckningen.
- Historiken (mående, energi och flöde) är flyttad längre ner som sekundär funktion.
- Ingen data, funktion eller Flow-logik har tagits bort; samma komponenter återanvänds.
- Dagens energiflöde renderas inte längre dubbelt inuti historiken.

## 2026-08-28 – Slutstädning efter QA

- Rutiner använder nu samma dagsbaserade genomförandelogg i Hem, Idag och Flow; äldre rutinstatus migreras automatiskt.
- Återkommande rutiner filtreras konsekvent efter valt datum även i dagens Flow-lista.
- Flow och FlowPlan har separata och tydliga sidtitlar; FlowPlan finns också i appguiden.
- Insight-demoläget kräver nu explicit demoläge och servervaliderad admin-roll.
- "Energins historik" är inte längre en separat ingång i Hälsa utan nås från Mitt batteri.

## 2026-08-28 – Levande men lugn polish

## 2026-08-28 – Städad struktur: en plats för varje sak

- QuickFlow ligger inte längre inuti Planera i menyn – det är en egen ingång: "Fånga något snabbt".
- Flow-inställningar fanns på två ställen i menyn. Nu finns de bara under Inställningar → Flow (funktionen är oförändrad).
- "Att göra" heter nu "Alla uppgifter" och beskrivs som hela listan framåt – dagens saker bor i Idag. Samma uppgifter, ingen ny lista.
- Hälsa: korten "Energi & mående" och "Sömn & vila" ledde båda till Mitt batteri. De är borttagna – Mitt batteri högst upp är den enda ingången till energi, mående och sömn.
- Gamla länkar (/min-dag, /ma-bra, /vad-nu, /fokus, /morgonstart, /dump) fortsätter leda vidare till rätt ställe.
- Inga funktioner, data eller Flow-beteenden har tagits bort.

## 2026-08-28 – Lugn sidbytesanimation

- Sidbyte (mellan t.ex. Hälsa, Idag och Planera) har nu en kort, mjuk fade med ett litet lyft (~240 ms) så övergången känns smidig utan att vara påträngande.
- Animationen stängs av automatiskt om du valt reducerad rörelse.

## 2026-08-28 – Flow känns levande: kontextuell ton, reaktioner och mjuka rörelser

- Flows ton följer batteriet: bra energi, lagom, låg och mycket låg ger olika förslag – aldrig krav, aldrig skuld.
- Flow reagerar när något blir klart ("Yes! Den är klar. 👏") och frågar ibland om du vill ta nästa eller pausa – inte varje gång.
- Missade saker möts med värme: "Det blev inte riktigt som planerat. ❤️" med knapparna Flytta till imorgon eller hantera i Idag.
- Hem är dynamisk utan nya kort: samma hälsningsyta säger olika saker på morgonen, mitt i dagen, vid låg energi, efter flera avklarade saker och på kvällen.
- Batteriprocenten räknas upp mjukt i stället för att hoppa – och står stilla direkt om du valt reducerad rörelse.
- Nya anonyma händelser: flow_task_completion_reaction, flow_missed_task_shown, flow_missed_task_action samt flow_suggestion_shown/accepted/rejected (inga energivärden eller texter skickas).
- Ingen ny navigation, inga nya kategorier och inga nya funktioner – Hälsa, Idag, Planera, QuickFlow, Flow och Mina mönster är oförändrade.

## 2026-08-28 – Menyn: beskrivningstexterna alltid synliga

- Fix: Beskrivningarna under kategorierna och menyvalen ("Vad som händer idag", "Energi, mående, träning …") försvann när "Färre saker"-läget var på. Nu syns förklaringstexterna alltid i menyn – de är en del av att hitta rätt, inte extra brus.

## 2026-08-28 – Enklare huvudkategorier: Hem, Hälsa, Idag, Planera, QuickFlow, Flow, Mina mönster

- Ny samlad **Hälsa** (/halsa): energi och mående, träning och promenader, rutiner och medicin, sömn/vila och energins historik – en ingång, samma data som förut.
- "Min dag" heter nu genomgående **Idag** och är den enda kompletta dagslistan.
- "Planering" heter nu **Planera** och äger schemaläggning och ordning – på samma uppgiftsdata som Idag.
- Menyn är omgrupperad efter den nya mentala modellen: Idag, Planera, Hälsa, Flow, Mina mönster – plus Hemma, Familj, Studier, Jobb, Resor och Inställningar.
- Nya anonyma statistikhändelser: health_viewed, today_viewed, planning_viewed och flow_viewed (inga hälsovärden skickas).
- Inga rutter borttagna: /mitt-batteri, /ma-bra, /min-dag och övriga gamla länkar fungerar som förut.

## 2026-08-28 – Promenader: välj rutt och öppna i Google Maps

- Flow föreslår en promenadlängd utifrån batterinivån just nu, medan användaren alltid väljer själv.
- En rekommenderad rutt kan väljas för en tydlig detaljvy med MyFloves egen kartförhandsvisning, längd och ungefärlig tid.
- "Öppna i Google Maps" skickar med den aktuella positionen som start och destination samt den riktiga vändpunkten som waypoint för rundtur – appen öppnas om den finns, annars webbläsaren.
- En tydlig "Tillbaka till förslagen"-knapp gör det enkelt att välja en annan promenad.

## 2026-08-28 – Mediciner och rutiner: återkommande eller en gång

- När du lägger till en medicin eller rutin väljer du nu **Varje dag**, **Vardagar**, **Varje vecka** eller **En gång** – med datum för det som bara ska hända en gång.
- Påminnelserna följer valet: engångsdoser och veckorutiner schemaläggs bara de dagar de faktiskt gäller.
- Dagens listor (Hem, Min dag, Rutiner & medicin) visar bara det som gäller i dag, och kortet visar hur ofta det återkommer.
- Befintliga mediciner och rutiner fortsätter som varje dag – inget behöver göras om.

## 2026-08-28 – Besöksanalys: sidvisningar

- Varje sidvisning loggas nu anonymt (sektion "page", t.ex. /hem, /idag, /pitch) – du ser hur många som öppnar den delade länken och vilka sidor de besöker.
- Admin-vyn (Appstatistik) har fått blocket "Mest besökta sidor" med visningar per sida och unika besökare.
- Samma integritetsskydd som övrig statistik: inga användar-id, e-post, IP eller innehåll – bara vilken sida som öppnades. Respekterar användarens avstängning av anonym statistik.

## 2026-08-28 – Tydlig Flow på Hem

- Flow-lärandekortet heter nu "Flow lär känna dig" och visar den riktiga Flow-maskoten tydligt, med texten "Jag börjar se mönster i hur din energi, dina aktiviteter och din vardag hänger ihop."
- "Just nu" är nu signerat Flow ("Flow · just nu") med maskoten i rubriken – det är tydligt att förslaget kommer från Flow, inte ett generiskt kort.
- Ingen ny funktion eller navigation – bara tydligare presentation. Rollerna är oförändrade: Min dag = vad som händer, Planering = ordningen, Flow = förslaget, Prata med Flow = samtalet, QuickFlow = fånga.

## 2026-08-28 – Hemskärmen: lugn överblick utan dubbletter

- Snabbincheckningen och "Energins historik" har tagits bort från Hem. Batterikortet är den enda energibilden där, och hela incheckningen/historiken bor i **Mitt batteri**.
- "Just nu" upprepar inte längre samma sak som redan står under "Nästa" – Flow visar då bara sin rekommendation.
- Bara en Flow-notering längst ner på Hem (den som visar vad Flow lärt sig om just dig och länkar till Mina mönster).
- Hem visar fortfarande "Dagens översikt" som siffror – hela listan bor i Min dag, och alla vyer pekar på samma underliggande uppgift.

## 2026-08-28 – En plats för energi, tydligare roller

- "Energi och mående" och "Mitt batteri" var samma sak på två ställen. Nu bor incheckningen, dagens kurva, Stop-pausen och historiken (mående, energi, flöde) på **Mitt batteri** – /ma-bra går dit automatiskt.
- Menyn har en rad i stället för två för energi. Förtydligande: **bara energi-/måendeingångar** (incheckning, energi- och måendekort, energihistorik-genvägar och gamla /ma-bra) pekar på Mitt batteri. Flow, Planering, FlowScore, Prata med Flow, appguiden och QuickFlow behåller sina egna sidor.
- Tydligare roller i menyn: Min dag (vad som händer), Planering (ordningen), Flow hjälper (förslaget), Prata med Flow (samtalet).

## 2026-08-28 – Dubblettstädning: en sak, ett ställe

- Hem visar nu "Dagens översikt" som en kort sammanfattning (antal saker, klara, kvar) i stället för samma uppgiftskort som redan syns under "Nästa" och i Min dag.
- Min dag är den enda platsen med hela dagens lista. Hem länkar dit i stället för att upprepa den.
- Incheckning och energikurva har tagits bort ur Min dag – Mitt batteri är primär plats, Min dag visar bara batteristatusen som en klickbar rad.
- Alla länkar till dagen går nu till samma route (/idag) i stället för att blanda /min-dag och /idag.

## 2026-08-28 – Enklare incheckning och tydligare mönster

- Snabb incheckning är nu 1–5 på batteriet med ett tryck, mående är valfritt och du kan markera vad som påverkar dig (Sömn, Stress, Ljud/intryck, Mat, Socialt, Kroppen, Annat). Faktorerna sparas i ditt energiflöde.
- Flow-kortet på Hem har en tydlig länk: "Se vad jag har upptäckt" – går direkt till Mina mönster.
- Flows lärande-länk heter nu "Mina mönster" i stället för "Vad jag lärt mig".
- Fler mätpunkter i appstatistiken (fånga → förstå → planera → börja → klart → lär) utan känsligt innehåll.

## 2026-08-28 – Medicinlistan och medicinpåminnelserna läser samma data

- Medicinlistan har nu en enda källa (`myflove-medications`). Gamla nycklar (`myflow-medications`, `myflow-medication-log`) migreras in automatiskt, utan dubbletter.
- Gamla format tolkas säkert: enkel tid, saknat id och rena textposter blir riktiga mediciner.
- Köade medicinnotiser som inte längre motsvarar en aktiv medicin avbokas på servern – de kan inte längre komma när listan är tom.
- Loggrader för borttagna mediciner rensas bort.
- Medicindata fortsätter vara krypterad lokalt och rensas vid utloggning.

## 2026-08-27 – Bild på schemat läses av och sparas

- Ladda upp en bild eller PDF på schemat: Flow läser av den som ett dokument och gör om den till lektioner.
- Filen sparas under "Dina schemafiler" – tryck på den för att titta på originalet igen.
- Går även att öppna filen i nytt fönster eller ta bort den.

## 2026-08-27 – Mer-menyn: områden och inställningar först

- Mina områden och Inställningar ligger nu överst i Mer.
- Min profil och Anpassa MyFlove (hemskärm, introduktion, bottenmeny) har flyttats längst ner, i samma inbördes ordning.

## 2026-08-27 – Steg-för-steg, omgång 2 (Planering, Hem, Mer)

- Planering är nu två tydliga steg: 1) Hur ser dagen ut, 2) Ändra ordningen (Flows förslag går att flytta om).
- Hemskärmens kort har korta förklaringar: vad "Nästa", "Just nu" och "Vad behöver du just nu?" betyder.
- Mer-menyns grupper har en förklarande rad var: Min profil, Anpassa MyFlove, Mina områden.

## 2026-08-27 – Tydlig steg-för-steg-struktur (NPF)

- Ny gemensam stegkomponent: numrerade steg med en förklarande mening, som går att fälla ihop.
- Min dag är nu 1) Så mår du just nu, 2) Dagens plan, 3) Lägg till i dagen, 4) Det som får plats idag – energibalansen ligger sist och hopfälld.
- QuickFlow visar tydligt steg 1 Skriv eller prata in och steg 2 Granska och spara.
- Schemauppladdningen är uppdelad i steg 1 Klistra in/ladda upp, steg 2 Granska och ändra, steg 3 Spara.
- Inga funktioner har tagits bort – bara ordningen och språket är lugnare.

## 2026-08-27 – Redigera tolkade lektioner före sparning

- Klicka på en lektion i förhandsvisningen för att ändra veckodag, start- och sluttid, namn och plats.
- Du kan ta bort enskilda lektioner innan du sparar i schemat.
- Ändringarna gäller direkt i förhandsvisningen och sparas först när du trycker "Spara i schemat".

## 2026-08-27 – Förhandsvisning av tolkat schema

- Innan du sparar visas nu de tolkade lektionerna grupperade per veckodag, sorterade på tid.
- Sammanfattning högst upp: hur många lektioner som hittades, hur många som är nya och hur många som redan finns.
- Lektioner som redan ligger i veckoschemat märks med "finns redan" så du slipper dubbletter.

## 2026-08-27 – Tydlig plats för uppladdat schema

- Schemauppladdningen i StudyFlow visar nu tydligt att lektionerna sparas i ditt veckoschema, med antal lektioner du redan har.
- Ny länk "Visa veckoschemat" som scrollar direkt till Schema & kalender – både före och efter att du sparat.
- Efter sparning visas en bekräftelse med hur många lektioner som lades till och en genväg till veckoschemat.

## 2026-08-27 – Fler filformat vid uppladdning

- Gemensam lista över filformat i hela appen: PDF, bilder (även HEIC/HEIF, WebP, TIFF, AVIF) och textfiler (txt, md, csv, tsv, json, html, xml, rtf, log) samt dokument som doc/docx/odt/ppt/pptx/xls/xlsx/epub.
- Textfiler läses direkt i webbläsaren och blir material till Flow, bilder och PDF skickas som fil – övriga format ger ett vänligt tips om att spara som PDF, bild eller text.
- Schema- och kalenderimport tar nu även .ifb, .vcs, .csv, .md, .json och .html utöver .ics.

## 2026-08-27 – Gemensam sanitizer för all statistik

- All appstatistik går nu genom en enda sanitizer som bara släpper igenom korta, tekniska etiketter.
- Fritext, e-post, länkar, telefonnummer, personnummer, belopp och ord som mående, energi eller medicin stoppas alltid – både i payload och i event-/sektionsnamn.
- Nya tester för sanitizern: godkända etiketter, stoppade råvärden, begränsat antal och att payload-saneringen använder samma väg ut.

## 2026-08-27 – Statistik för "Vad jag lärt mig"

- Flow-knappen "Vad jag lärt mig" loggar nu ett eget anonymt event (`flow_learning_opened`) när den öppnas.
- Payloaden innehåller bara varifrån klicket kom – aldrig insiktstexter, energi, mående eller andra råvärden.
- Nya tester: exakt ett event per klick, sanerad payload och inget event för Flows övriga länkar.

## 2026-08-27 – Insight visar dina egna insikter

- "Vad jag lärt mig" öppnar nu MyFlove Insight med dina egna mönster från din faktiska användning – inga testprofiler.
- Saknas underlag visas ett lugnt tomläge som förklarar att Flow behöver lära känna dig mer, med exempel på vad som kan komma – aldrig påhittade slutsatser.
- Demoprofiler nås bara via ett explicit demoläge (länk längst ner) och är tydligt märkta som fiktiva.
- Nya anonyma event för Insight (vy och demoläge) – inga råvärden om dig lämnar enheten.
- Nya tester: egna insikter visas, tomläge när data saknas och att testprofiler inte läcker in i normalt läge.

## 2026-08-27 – Lugnare informationsarkitektur i Mer

- Mer-menyn är grupperad i Min profil, Anpassa MyFlove, Mina områden och Inställningar – färre val i taget och tydlig hierarki.
- "Anpassa hemskärmen" och "Visa introduktionen igen" nås nu direkt från Mer.
- "Lägg till på hemskärmen" ligger under Inställningar, tillsammans med Anpassa appen och Logga ut; Avsluta konto finns kvar under Anpassa appen → Konto.
- Anpassa hemskärmen loggar nu (anonymt) att den öppnats och att block visats/dolts eller flyttats.
- Nytt test säkerställer att batterikortet på Hem är en enda klickyta till Mitt batteri.

## 2026-08-27 – Analytics- och UX-kvalitetssäkring

- Energi och mående är nu bara snabb incheckning + länk vidare; batterivyn ligger enbart på Mitt batteri (dubbletten borttagen).
- Ett event per handling: uppgifter, mående, påminnelser och planer loggas nu på ett enda ställe i datalagret – den äldre loggvägen anropas bara via track().
- Dubbelskydd för vy-event (öppnat/visat) så omrenderingar inte blåser upp statistiken.
- Nya event täcker skapa konto, inloggning, intro, app-start, Flow, QuickFlow, Min dag, planering, påminnelser och inställningar.
- Nya tester verifierar att varje centralt event loggas exakt en gång och att känsligt innehåll alltid filtreras bort.

## 2026-08-26 – "Senast aktiv" i adminvyn

- Användarlistan visar nu "Senast aktiv" (när kontot senast använde appen) i stället för den tomma besökskolumnen.
- "Senaste inloggning" ändras bara när någon loggar in på nytt – redan inloggade användare syns nu ändå som aktiva.
- Datumfiltret tar även hänsyn till senaste aktivitet.

## 2026-08-26 – Egen morgon och egen kväll i Mitt batteri

- Du väljer själv när morgonen startar och när dagen slutar – batterikurvan börjar och slutar där.
- Två nya ifyllnader på Mitt batteri: hur batteriet känns vid morgonstart och när dagen slutar (1–10).
- Kurvan ankras i dina egna värden: morgonens nivå, läget just nu och kvällens nivå binds ihop mjukt.

## 2026-08-26 – Lägg till på hemskärmen vid inloggning

- Knappen "Lägg till MyFlove på hemskärmen" finns nu även längst ner på Logga in- och Skapa konto-sidorna.
- Fix: knappen doldes felaktigt i förhandsvisning och helskärmsläge – appen tolkades som redan installerad. Nu syns den så länge appen inte körs installerad.

## 2026-08-26 – Lugnare energi, tydligare konto och samlad appstatistik

- Mitt batteri ligger nu högst upp på Hem (direkt efter Flow) och all "Mitt batteri"-länkning går direkt till sidan /mitt-batteri.
- "Energi och mående" är radikalt förenklad: en snabb incheckning (batteri 1–10 + fem tydliga mående-val) först, historik och mönster bakom "Se min historik". Samma data som förut – inga dubbla registreringar. Medicin ligger kvar separat i Rutiner & medicin.
- "Lägg till på hemskärmen" är nu en liten, diskret notering längst ner på Hem i stället för ett stort block.
- "Avsluta konto" är borttagen från menyerna och ligger enbart längst ner under Inställningar i en tydlig men sekundär kontosektion – med bekräftelse kvar.
- Ny central analytics-grund: ett dokumenterat event-schema (app*opened, home_viewed, battery*/mood_checkin, quickflow, task, install, logout, kontoradering m.fl.) med sanerad payload. Inget mående, ingen medicin, inga belopp och ingen fritext skickas någonsin – bara användning.
- Flow-knappen "Mitt batteri" (bredvid "Prata med Flow") går nu till Mitt batteri i stället för dagens balans.
- Nya tester för event-schemat och sanering av känsliga payloads.

## 2026-08-26 – Känslig data krypteras lokalt

- Energi, mående, medicin och ekonomi sparas nu krypterade (AES-GCM) på enheten i stället för i klartext.
- Krypteringsnyckeln ligger som en icke-exporterbar nyckel i webbläsarens säkra nyckellagring – den går inte att läsa ut med JavaScript eller devtools, och innehållet är obegripligt utan den.
- Gammal klartext från tidigare versioner krypteras automatiskt vid start.
- Vid utloggning raderas nyckeln, så eventuella rester på disken inte går att läsa av nästa person på enheten.
- Fungerar fortfarande offline; om webbläsaren saknar stöd (t.ex. blockerat privat läge) fortsätter appen att fungera som förut.

## 2026-08-26 – MyFlove Clean-up 1.0

- Lugnare Hem: max sex block som standard (energi, "Just nu", nästa sak, kompakt dagsöversikt och en enkel väg att lägga till). Övriga block finns kvar och kan slås på i "Anpassa hemskärmen".
- Genvägsblocket på Hem är borttaget – det länkade bara till sådant som redan finns i navigationen.
- "Dagens saker" på Hem är nu en kompakt sammanfattning; hela planeringen och det samlade Gjort-läget bor i Min dag.
- Tydligare roller: QuickFlow = fånga något snabbt, Flow = förstår och föreslår, Min dag/Planering = planera dagen. Rubriker, hjälptexter och knappar är justerade därefter.
- Ett onboardinglager i taget: Flow-frågan väntar tills det korta introt är avklarat, och "Hoppa över" går direkt till Hem.
- Introduktionen går att se igen via Anpassa hemskärmen.
- Säkerhet: vid utloggning (och kontoradering) rensas all lokal användardata på enheten – energi, mående, medicin, ekonomi och annat privat ligger inte kvar till nästa användare. Enhetsinställningar som tema behålls.
- Nya tester: intro + "Hoppa över", kompakt dagsöversikt, avbockning och rensning av lokal data vid utloggning.

## 2026-08-26 – Mindre Flow på "Se Flow live"

- Hero-scenen på /flow är nedskalad från 33 % till 25 % av skärmhöjden (max 230 px) och maskoten fyller 108 % i stället för 126 %, så Flow inte längre känns för stor.

## 2026-08-26 – Flow svarar utan "invalid"-fel

- Långa profiltexter och långa samtal gjorde att anropet till Flow underkändes. Kontexten kortas nu ner och de senaste 40 meddelandena skickas.
- Samma fix i Stop-chatten, plus ett begripligt felmeddelande i stället för teknisk text.

## 2026-08-26 – Skrivfältet i Flow-chatten går att använda igen

- Skicka-knappens rad låg tidigare ovanpå textrutan och blockerade tryck/klick i nedre halvan – nu ligger knappen under fältet.

## 2026-08-26 – Lagom stor Flow i hela appen

- Flow i kortläget (Min dag, Flow-inställningar) är mindre och tar inte längre över kortet.
- Flow i chattens rubrik är nedskalad så texten får plats bredvid.
- Flows välkomsthälsning använder en mindre maskot.
- Kortläget klipps och skalas korrekt, så maskoten inte kan svälla utanför sitt kort på desktop.
- Verifierat på mobil (411 px) och desktop (1280 px): Flow syns i alla vyer och överlappar ingen text eller knapp.

## 2026-08-26 – Flow mini är lite större

- Mini-Flow i Hem-rutan är förstorat med ett litet steg, så maskoten syns bättre utan att gå tillbaka till att överlappa knappen eller texten.

## 2026-08-26 – Flow syns i mini-rutan

- Mini-Flow använder nu en riktig liten maskotstorlek i stället för en stor bild som klipptes hårt i 56 px-ramen.
- Rekvisita döljs i mini-läget så själva Flow alltid syns tydligt i Hem-rutan utan att överlappa texten.

## 2026-08-26 – Flow tar mindre plats på Hem

- Mini-Flow på hemskärmen och i vanliga appvyer är nu låst till en liten 56 px-yta, så maskoten inte kan växa över text eller knappen "Prata med Flow".
- Rekvisita och glöd beskärs i mini-läget för att Flow ska kännas närvarande men inte ligga i vägen.

## 2026-08-26 – Lugnare Flow på hemskärmen

- Flow är mindre på hemskärmen – samma kompis, men diskretare (mini-storlek).
- "Prata med Flow" går nu direkt till chatten i stället för till Flow-vyn – även från Livspusslet och Energiflödet.

## 2026-08-26 – Material 3.5

- Pitchvideon har en ny scen, "Flow lever", som visar andning, blinkningar, blick och hur Flow följer chatten.
- Living Blueprint 3.5 (Word + PDF) med nytt avsnitt om levande Flow, Flow-chatten och Flow-inställningar.
- Pitchdeck 3.5 (PowerPoint + PDF) med en ny slide om levande Flow och uppdaterade versionstexter.
- Pitch-sidan visar nya miniatyrer, ny affisch och nedladdningar för 3.5.

## 2026-08-26 – Flow följer samtalet

- Flow lyssnar när du skriver: snabbare andning, tätare blinkningar och blicken lutar mer mot dig.
- När Flow tänker blir andetagen djupare, blinkningarna sällsynta och blicken vandrar uppåt – hjärtglöden pulserar snabbare.
- När svaret kommit andas Flow ut med en kort ljus puls innan han går tillbaka till sitt lugna läge.

## 2026-08-26 – Levande Flow

- Flow andas nu mjukt, blinkar i slumpad rytm och lutar sig lätt mot muspekaren – han känns som en liten levande kompis i stället för en stillbild.
- Hjärtglöden bakom Flow pulserar lugnt.
- Allt stängs av automatiskt om du valt mindre rörelse i systemet.

## 2026-08-26 – Flow känner dig i chatten

- Flow-chatten utgår nu från din livsprofil, din nuvarande situation och de mönster Flow sett i din användning – tipsen blir mer personliga.
- Flow anpassar också tonen efter din hjälpnivå (Tyst/Diskret/Aktiv). Samma kontext används i Stop-samtalen.
- Ingen ny data samlas in – Flow använder bara det som redan finns i MyFlove, och du kan justera din profil när du vill.

## 2026-08-26 – Fortsätt din Flow-chatt

- Flow öppnar automatiskt ditt senaste samtal så du kan fortsätta där du slutade. Vill du börja om trycker du "Ny chatt".
- Påbörjad text sparas per samtal – lämnar du vyn ligger den kvar när du kommer tillbaka.

## 2026-08-26 – Prata med Flow

- Flow-chatten har fått en tydlig ingång: "Prata med Flow" finns nu i menyn "Mer", i översikten "Så funkar MyFlove" och som knapp direkt i Flow-kortet.

## 2026-08-26 – Installationsknapp på startsidan

- "Hoppa över"-knapp högst upp på introt – gå direkt till sista vyn utan att svepa igenom alla slides.
- Knappen "Lägg till MyFlove på hemskärmen" finns nu även på startsidan, innan man skapat konto – både i hjälten högst upp och nära "Möt Flow".

## 2026-08-26 – Installationsknapp överallt

- Knappen "Lägg till MyFlove på hemskärmen" finns nu även i menyn "Mer", så den går att nå från alla vyer – på Android, iPhone och vanlig webbläsare.
- Instruktionen visas i en ruta inne i appen i stället för en popup, så den fungerar även om popup-fönster är blockerade.

## 2026-08-26 – Lägg till MyFlove på hemskärmen

- Installationskortet visas nu alltid tydligt direkt under Flow när appen inte redan är installerad – även innan Chrome har skickat sin installationsprompt och även i preview.
- Om den inbyggda prompten saknas visar knappen i stället rätt steg: Dela → Lägg till på hemskärmen på iPhone/iPad, eller webbläsarens meny → Installera app/Lägg till på startskärmen på andra enheter.
- Ny knapp på Hem: "Installera MyFlove" med riktig installationsprompt där webbläsaren stödjer den (t.ex. Android/Chrome).
- På iPhone/iPad visas i stället en kort instruktion: tryck Dela → "Lägg till på hemskärmen".
- Knappen döljs helt när appen redan körs installerad – inget falskt "klart".
- Flow hälsar diskret bredvid knappen: "Vill du ha mig nära till hands? 💜"

## 2026-08-26 – Planering i bottennavet

- "Planering" i bottennavet öppnar nu planeringssidan (ordningen på dagen) i stället för Flow-hjälpen.
- Flow-hjälpen finns kvar som en egen punkt i menyn: "Flow hjälper".
- Hade du Flow som genväg byts den en gång till Planering – sedan bestämmer du själv i "Mer".

## 2026-08-26 – Flow-inställningar följer dig mellan enheter

- Dina Flow-inställningar (hjälpnivå, tidsfönster, förvarning och prioriteringar) sparas nu på ditt konto och synkas mellan mobil och dator.
- Fungerar även offline – ändringar sparas lokalt först och synkas när du är online igen.

## 2026-08-26 – Flow-inställningar

- Ny sida (Mer → Flow-inställningar): hjälpnivå Tyst/Diskret/Aktiv, visa/dölj Flow och om han får berätta vad han lär sig.
- Tidsfönster: välj tidigast och senast på dygnet som Flow får höra av sig – utanför det är han tyst.
- Förvarning: ställ in hur långt före en viktig tid Flow säger till (5–90 minuter).
- Prioriteringar: välj vilka typer av tider Flow håller koll på – barn, medicin, studier, jobb, träning, inköp eller övrigt.

## 2026-08-26 – Flow reagerar mjukare på din dag

- Låg energi + många saker: Flow föreslår att ni prioriterar tillsammans i stället för att pusha ("Vill du att vi prioriterar tillsammans?") – och går direkt till FlowPlan.
- Viktiga tider: Flow säger till cirka 30 minuter innan, med klockslag, och länkar till rätt vy (barn, studier, jobb, träning, inköp, medicin).
- När du bockar av något i Min dag reagerar Flow mjukt och anpassat efter din energi – lugnt när batteriet är lågt, glatt när du är i flyt.

## 2026-08-26 – Väder i Flows tips

- Flow använder nu timprognosen för dagen: när något utomhus (promenad, hämtning, träning, handling, resa) ligger i regnigt väder säger han till i god tid – "Det ser ut att regna kring 15:00 när du ska ut – ta med paraply."
- Tipset kommer bara när det spelar roll, går att vifta bort och följer dina Flow-inställningar.

## 2026-08-26 – Flow som levande följeslagare

- Flow är proaktiv: han hör av sig när energin är låg samtidigt som dagen är full, när det blir regn innan något utomhus och i god tid innan du behöver börja göra dig klar.
- Flow lär sig dig: nytt kort på Hem visar mjukt hur väl han känner dina morgnar, tunga dagar och energidippar – helt utifrån data som redan finns i appen.
- Flow tar aldrig över: varje mening kan viftas bort för dagen, och i Flows inställningar väljer du Tyst, Diskret eller Aktiv – eller stänger av Flow helt.
- Flow känns levande: en knappt märkbar andning och små reaktioner, som respekterar reducerad rörelse.

## 2026-08-25 – Export av adminstatistik (CSV/PDF)

- Ny exportruta i Appstatistik: välj datumintervall (eller 7/30/90 dagar) och ladda ner statistiken som CSV eller PDF.
- Exporten innehåller per dag (besökare och händelser) samt per del av appen och handling – helt anonymt, ingen personlig data.

## 2026-08-25 – Anonym appstatistik i admin

- Appstatistiken är nu helt anonym: kopplingen mellan händelser och användarkonton är borttagen i databasen, och admin visar inte längre besök per person.
- Vi sparar bara vilken del av appen som används, vilken typ av handling det är, ett slumpat lokalt id och tidpunkt – ingen e-post, IP eller innehåll.
- Nya nyckeltal i Appstatistik: händelser per besökare, andel återkommande, dagligt bruk (DAU/MAU), delar per besökare, andel som gör något och totalt antal händelser.
- Nya vyer: dagliga loopen (Fånga → Planera → Göra → Reflektera) och händelser per dag, plus en tydlig integritetsnot.

## 2026-08-25 – Marknadsscenen synkad med pitchsidan

- Videons marknadsscen har samma rubrik, korttexter och ordning som marknadssliden i pitchdeck 3.4.
- Pitchsidan visar nu miniatyrer av både videons marknadsscen och deckets marknadsslide, plus titelsidan.

## 2026-08-25 – Marknadsnyckeltal i pitchmaterialet

- Ny slide "Marknaden · Market Opportunity" i pitchdeck 3.4 med sex externa nyckeltal (140M+, ~3 %, $1,9B, $6,7B, 17,5 % CAGR, $3,06B).
- Nytt avsnitt 3.5 "Marknad och målgrupp i siffror" i Living Blueprint 3.4 (DOCX + PDF).
- Pitchvideon har fått en marknadsscen med samma siffror, källnot och avslutningen "MyFlove starts with ADHD — but is built for the complexity of everyday life."
- Alla siffror är märkta som externa uppskattningar/prognoser med källnot – inga egna traction-siffror.

## 2026-08-25 – Så funkar MyFlove (översikt)

- Ny sida `/oversikt`: en enkel sammanfattning av allt i appen, grupperat i Börja här, Planera, Mående & energi, Hemma, Människor & resor, Studier & jobb och Gör appen till din – varje rad förklarar vad det är och länkar dit.
- Genväg längst ner på Hem och i menyn under "Mer".

## 2026-08-25 – Pitchsidan matchar 3.4

- Pitchvideon har fått en miniatyrbild (poster) från Flow 2.0-scenen i stället för en svart ruta.
- Pitchdecket visas med en förhandsbild av titelsidan där Flow står med.
- Tydliga versionsmärken (3.4) på video och deck, plus en genväg till Flow live.

## 2026-08-25 – Flow syns även i videon (3.4)

- Pitchvideon har renderats om: Flow står nu som stor karaktär i Flow 2.0-scenen och vinkar med i slutbilden.
- Flow-scenen är omgjord till text + karaktär sida vid sida och nämner de 12 lägena.

## 2026-08-25 – Flow syns i dokumenten (3.4)

- Living Blueprint 3.4 (DOCX + PDF): Flow finns nu med som bild på framsidan och i avsnittet "Flow i appen".
- Pitchdeck 3.4 (PPTX + PDF): Flow står på titelsidan och har fått en egen slide med 12 lägen, Flow i hela appen och haptik.
- Pitchsidan pekar på 3.4-filerna.

## 2026-08-25 – Blueprint, pitchdeck och video 3.3

- Living Blueprint 3.3 (DOCX + PDF) med nytt avsnitt om Flow i appen och Morgonstart i Rutiner & medicin.
- Pitchdeck 3.3 (PPTX + PDF) där Flow är ett eget produktkort och statusen är uppdaterad.
- Ny pitchvideo med en egen Flow-scen (38 sekunder).
- Pitchsidan pekar på de nya filerna.

## 2026-08-25 – Morgonstart bor bland Rutiner & medicin

- Morgonstart har flyttat in i "Rutiner & medicin" som en egen flik och ett eget avsnitt – en plats för morgonen, rutinerna och doserna.
- Gamla länken /morgonstart leder nu dit automatiskt, och menyposten är borttagen så det inte finns två vägar till samma sak.

## 2026-08-25 – Flow finns i hela appen

- Flow står nu med överst i alla vanliga vyer (att göra, kalender, medicin, barn, studier, jobb, träning, inköp med flera) som en liten kontextuell följeslagare.
- Han visar samma sak som på Hem och Min dag – en kontext i taget – och dubbleras inte på sidor som redan har Flow (Hem, Min dag, Flow-previewen, pitch och admin).

## 2026-08-25 – Flow finns nu i den inloggade appen

- Flow står med som en kontextuell följeslagare på Hem och Min dag, med samma utseende, poser och rekvisita som i Flow-previewen (previewen är oförändrad).
- Flow väljer EN sak i taget utifrån data som redan finns: medicin som ska tas, regn eller sol, låg/hög energi, barnens dag, dagens nästa uppgift, vatten och tvätt.
- Nya rekvisita: sol och solglasögon, medicinburk, vattenglas och tvättkorg – plus små mini-Flows som speglar antalet barn.
- Flow firar när du bockar av något, var du än gör det i appen.
- Storleken anpassas efter plats: stor scen som huvudfokus, mindre inuti kort – och inget täcker bottennavigeringen.

## 2026-08-25 – Automatiska tester för Flows states

- Nya automatiska tester (Vitest) verifierar att exakt ett Flow-state renderas åt gången, både i karaktären och i hela Flow-vyn.
- Varje situation testas mot rätt rekvisita och pose: paraply i regn, säng och Zzz vid sömn, kaffe vid paus, bok vid plugg, laptop vid jobb, dammsugare vid städning, kockmössa och panna vid mat, bil/buss vid resa, batteri vid låg och hög energi, konfetti när något är klart och andningsring vid återhämtning.
- Testerna körs på mobilbredd (390 px) och kontrollerar även att Flow-scenen håller sin storlek (33svh, kvadratisk) och att prickarna matchar antalet vyer.
- Kör dem med `npm run test`.

## 2026-08-25 – Flow får riktiga scener i /flow

- Flow är nu en stor karaktär med tydlig rekvisita direkt i /flow: paraply i regn, säng och Zzz vid vila, kaffekopp vid paus, bok vid plugg, laptop vid jobb, dammsugare vid städning, kockmössa och stekpanna vid mat, bil vid resa, batteri vid låg/hög energi, konfetti när något blir klart och lugn andningsring vid återhämtning.
- Varje situation har flera lätta varianter så Flow inte gör exakt samma sak varje gång.
- Höjderna är justerade så att Flow, texten och huvudåtgärden ryms utan intern scroll på 375 och 390 px, med bara en Flow-state i DOM:en åt gången.

## 2026-08-25 – Haptisk återkoppling i Flow

- Flow ger nu en kort vibration när du byter vy, en liten stöt när du är längst ut i flödet och en tydligare puls när något firas.
- Vibrationerna är avstängda om du valt reducerad rörelse eller har tyst läge på, och används bara på enheter som stöder det.

## 2026-08-25 – Flow 2.0: levande karaktär, en sak i taget

- Flow är nu huvudpersonen i varje vy: maskoten tar ungefär en tredjedel av skärmen, får rekvisita (paraply, bok, laptop, kaffe, batteri, hjärta, konfetti) och egen animation utifrån situationen.
- Flow kan överraska – varje situation har flera alternativa poser som växlar mellan vyerna.
- Regnig dag ger en egen Flow-vy med paraplytips, baserad på väderdatan som redan finns i appen.
- Varje vy rymmer nu Flow, en kort text och en huvudåtgärd utan intern scroll, och exakt en Flow-state renderas i DOM:en.
- När du markerar något som klart hoppar Flow och firar innan nästa vy visas.

## 2026-08-25 – Flow lever i varje vy

- Flow har nu eget kroppsspråk per vy på förstasidan: vinkar i hälsningen, studsar i telefonen, nickar när han lyssnar, funderar vid modulerna, pulserar vid FlowScore, jublar vid "Byggs just nu" och andas lugnt i Dagens Flow.
- Alla rörelser stängs av automatiskt om du valt reducerad rörelse i systemet.

## 2026-08-25 – Större Flow bredvid texten

- Flow vid hälsningen är nu större och står alltid bredvid pratrutan, även på mobil.
- Flow-bilden längst ner i visionsavsnittet är borttagen.

## 2026-08-25 – Stora Flow vid hälsningen

- Den stora vinkande Flow står nu vid "Hej, jag heter Flow" högst upp, och Flow vid telefonen är liten igen.
- Pratbubblan är en rektangulär ruta som fyller bredden: på mobil ligger den under Flow, på större skärmar bredvid – texten radbryts snyggt i stället för att pressas ihop.

## 2026-08-25 – Tydlig Tillbaka-knapp på mobil

- Förstasidan har nu tydliga "‹ Tillbaka"- och "Nästa ›"-knappar längst ner på mobil, så du alltid kan byta vy med ett tryck om svepet inte fungerar.

## 2026-08-25 – Stabilt bakåtsvep på mobil

- Bakåtsvepet använder nu fingrets senast säkra position även när iOS avbryter en kantgest, och en faktisk dragsträcka väger tyngre än brusig momentumdata.
- Sveptröskeln är sänkt till 28–72 px och karusellen fångar gesten redan när fingret sätts ned.
- Ett hydratiseringsfel från ett slumpmässigt citat är borttaget så karusellens läge inte längre kan återställas när sidan startar.

## 2026-08-25 – Enklare att svepa tillbaka och Flow vinkar hej

- Bakåtsvep fungerar nu även när mobilens egen kantgest ville ta över: sidan blockerar webbläsarens sido-överskrollning och tröskeln för att byta vy är lägre (36–90 px).
- Pilknapparna vänster/höger syns nu även på mobil, så du alltid kan gå tillbaka med ett tryck.
- Flow är större på förstasidan och vinkar som en hälsning när du kommer in (stängs av vid reducerad rörelse).

## 2026-08-25 – Förstasidan: delbara vyer, mjukare svep och tydligare fokus

- Adressen minns vilken vy du är på (t.ex. /#flowplan): uppdaterar du sidan eller delar länken hamnar du på rätt vy, och bakåtknappen fungerar.
- Svep och drag har momentum: hastigheten räknas med, tröskeln anpassas efter skärmbredd (48–120 px) och kanterna har mjukare motstånd – känns snabbare på både mobil och desktop.
- Tydlig fokusmarkering på den aktiva vyn, korrekt tabordning (bara aktiv vy och aktiv prick nås med Tab) och läsbara etiketter som "FlowPlan – vy 8 av 10".

## 2026-08-25 – Förstasidan är nu ett slide-flöde

- Startsidan (/) är inte längre en lång scrollsida: allt innehåll ligger nu i tio interaktiva slides som byts en i taget med mjuka övergångar.
- Svep i sidled på mobil, pilknappar på desktop, samt piltangenter och Home/End på tangentbordet.
- Prickar längst ner visar var du är och tar dig direkt till valfri vy; en live-region läser upp vybytet.
- Bara den aktiva vyn nås av skärmläsare och tangentbord (inert), och sidan i sig kan inte längre scrollas vertikalt.

## 2026-08-25 – Flow: svep, drag och tangentbord

- Flow-karusellen följer nu fingret och musen i realtid; slide byts när du dragit ungefär en femtedel av bredden eller svept snabbt, annars fjädrar vyn tillbaka.
- Vertikala dragningar skrollar sidan som vanligt, och drag startar inte på knappar, reglage eller fält – mående- och energireglagen fungerar oförändrat.
- Första och sista vyn har motstånd i kanten i stället för att dras fritt.
- Tangentbord: vänster-/högerpil byter vy, Home/End går till första/sista, med tydlig fokusring på karusellen och fokus som flyttas till den nya vyn.
- Prickarna har nu klartextetiketter ("Vy 2 av 4: Hur är det just nu?") och en live-region läser upp vybytet.

## 2026-08-25 – Flow-karusellen ligger i en riktig horisontell rad

- Flow-sliderna renderas nu i ett spår med `flex flex-row` där varje slide är låst till `w-full min-w-full shrink-0`, och spåret glider i sidled med `translateX` i stället för att byta ut en enda slide i DOM:en.
- Yttre containern är `relative w-full overflow-hidden`, så inget kan stapla sig vertikalt.
- Endast den aktiva sliden är tillgänglig för skärmläsare och tabbning; övriga är `aria-hidden`/`inert`.
- Versionsstämpeln visar nu aktuell slide av totalt och att exakt en slide är synlig.

## 2026-08-25 – Flerdagsperioder syns nu alla dagar

- En period med slutdatum (t.ex. en veckas semester) visas nu varje dag i perioden även i Hem, Dagens saker, Min dag och "Allt i dagen" – inte bara på startdagen.
- Mitt i perioden visas ingen klockslagstid; klockslaget hör till startdagen.

## 2026-08-25 – Flow är nu sidans enda container

- `/flow` visar nu endast den state-baserade Flow-containern. De tidigare vyflikarna och dashboard-sektionerna för dagens belastning, planering, uppgiftslista och chatt är borttagna från Flow-sidan men finns kvar på sina ordinarie platser.
- Exakt en aktiv Flow-state renderas åt gången; intro är state 0 och nästa state ersätter den föregående i DOM:en via knappar eller swipe.

## 2026-08-25 – Direktlänk till en Flow-slide

- `/flow` läser nu `?slide=` från URL:en (t.ex. `/flow?slide=3` eller `/flow?slide=suggestion`) och startar på rätt slide vid laddning.
- Aktuell slide skrivs tillbaka till URL:en, så länken kan delas eller laddas om och landar på samma vy.

## 2026-08-25 – Flow byggd som state-baserad en-slide-vy

- Flow renderar nu bokstavligen endast aktuell slide i DOM:en; intro, incheckning, energi, förslag och återhämtning ersätter varandra via `currentSlide` i stället för att ligga sida vid sida i en CSS-karusell.
- Vänstersvep går framåt, högersvep går bakåt och pilar/prickindikator finns kvar. Flow-introt är state 0 och inget separat block.
- Mobiltesterna vid 375–390 px verifierar att exakt en slide finns i DOM före och efter swipe och att föregående innehåll tas bort helt.

## 2026-08-25 – Synlig Flow-version i appen

- `/flow` visar nu en liten rad längst ner med aktuell karusellversion (läst direkt från `data-flow-version` i DOM), build-id och om spåret verkligen ligger horisontellt – så att rätt bundle kan verifieras i realtid på mobilen.

## 2026-08-25 – Visuellt regressionstest för Flow-karusellen

- Nytt test `tests/e2e/flow_visual_regression.py` som i 375px, 390px och 414px kontrollerar geometrin (slides på samma rad, sida vid sida, en synlig åt gången) så vertikal stapling upptäcks direkt.
- Skärmbilder jämförs pixelvis mot sparade baselines i `tests/e2e/baselines/`; avvikelser över 2 % ger fel och en diffbild sparas i `/tmp/browser/flow-visual/`.
- Animationer och övergångar fryses under testet, och baselines uppdateras med `--update`.

## 2026-08-25 – Cache-busting och E2E-test för Flow-karusellen

- Varje build får ett unikt build-id. Vid ny version töms Cache Storage automatiskt, service workern uppdateras och sidan laddas om en gång, så den publicerade appen aldrig kan ligga kvar på en gammal bundle.
- Service workern rensar all cache vid aktivering, svarar på rensningsmeddelanden och främmande/legacy service workers avregistreras.
- Nytt E2E-test (`tests/e2e/flow_carousel.py`) som i 375px och 390px verifierar att bara en slide syns, att slide 2 ligger till höger med samma y-position och att horisontell swipe snappar rätt.

## 2026-08-25 – Flow-karusell korrigerad i publicerad mobilversion

- Den publicerade `/flow`-routen identifierades som en äldre bundle som saknade karusellens CSS; service workern använder ingen offline-cache och var inte orsaken.
- Karusellen använder nu en robust `flex-row nowrap`-track med `flex: 0 0 100%` per slide, dold vertikal overflow samt horisontell touch-scroll och snap.
- Den kritiska geometrin finns både som komponentklasser och explicit komponent-CSS, så responsiva eller överordnade layoutregler inte kan stapla sliderna.

## 2026-08-25 – Flow-karusellen låst horisontellt

- Tog bort den separata `FlowGreeting`-wrappern så Flow-presentationen alltid är slide 1 i samma karusell.
- Karusellspåret har nu explicit CSS-grid i sidled (`grid-auto-flow: column`, en kolumn på 100% per slide), horisontell touch-scroll och obligatorisk snap.
- Varje slide har fast 100% karusellbredd och kan inte krympa eller falla tillbaka till vertikal blocklayout.

## 2026-08-25 – Flow: en slide i taget, inte en lång sida

- Flow är nu en sammanhållen carousel: exakt EN slide syns åt gången och nästa slide ersätter den föregående horisontellt – inget staplas längre vertikalt.
- Slide 1 är Flow som presenterar sig (maskoten hoppar upp, "Hej! Jag är Flow 💜" och knappen "Visa mig"), sedan energi, förslag och återhämtning när det är relevant.
- Svep vänster/höger på mobil, diskreta pilar och punktindikator på större skärmar.
- Hälsningskortet ovanför decket är borttaget så sidan inte blir lång. Introduktionen första gången visas precis som förut.
- Samma befintliga Flow-logik, energi och uppgifter – ingen ny motor eller datamodell.

## 2026-08-25 – Flow 2.0: en personlig, svepbar Flow-upplevelse

- Flow har fått en egen startsida där Flow hälsar, hoppar upp och vinkar första gången – och därefter bara en kort, lugn hälsning.
- Första besöket visar en mycket kort introduktion i tre steg med "✨ Visa mig" och "Hoppa över".
- Flow visar en sak i taget i en svepbar upplevelse: Hur är det just nu, Din energi, Mitt förslag och Återhämtning – med pilar och punktindikator.
- Flow väljer själv vilken slide som är mest relevant: saknad incheckning först, återhämtning vid tung dag eller låg energi, och fokusuppgift när energin är hög.
- Allt bygger på befintlig logik och data (Flow-motorn, Mitt batteri, dagens incheckning, befintliga uppgifter) – inga nya system eller dubbletter.

## 2026-08-25 – Flow reagerar på startsidans demo

- Telefondemon i hero är nu interaktiv: uppgifterna kan bockas av och Flow svarar med en kort, lugn reaktion i pratbubblan i telefonen.
- De flytande korten runt telefonen (regn, fokustid, +8 Flow) ger också korta Flow-svar vid hover, fokus eller klick.
- Tidslinjen "Så ser en MyFlove-dag ut" har fått en extra kort mikroreaktion från Flow per punkt.
- Endast presentation på startsidan – ingen appfunktionalitet, datamodell eller navigation ändrad.

## 2026-08-25 – Flow som officiell maskot + levande startsida

- Flow har fått en officiell visuell referens: den runda lila figuren med kawaii-ögon, rosa kinder, hjärta på magen och glittrande stjärnor. Bilden ligger som CDN-asset och används via en gemensam komponent (`FlowMascot` / `FlowSays`) så att inga parallella varianter uppstår.
- Publika startsidan (/) är omgjord till en levande presentation: hero med telefonpreview och flytande kort, interaktiv sektion "Vad behöver du just nu?", "Dagens Flow" med varierande citat, FlowScore som belastning (inte prestation), animerad tidslinje över en MyFlove-dag och avsnittet "Byggs just nu – för verkliga vardagar" istället för påhittade användarsiffror.
- Ingen appfunktionalitet, datamodell eller navigation ändrad.

## 2026-08-23 – Logga mående och energi med ett tryck

- Snabbchecken på Hem har nu en tydlig "Logga"-knapp som sparar både mående och energi direkt, utan att du behöver dra i sliders eller välja något mer.
- Den gamla "Logga"-knappen i rubriken heter nu "Mer" och visar fortsatt genvägar till Mående, Energi och Anteckning.

## 2026-08-23 – Dubbel medicinpåminnelse kl 10:00 borttagen

- Spårade notisen kl 10:00: den kom från en gammal Elvanse-post kl 10:00 i medicinlistan (utöver den aktuella kl 11:30) – ingen förvarning, ingen tidszonsbugg och ingen hårdkodad standardtid.
- De 10 köade pushnotiserna för den gamla posten är avbokade. Inga andra påminnelser berördes och ingen kod ändrades.

## 2026-08-22 – Blueprint-nedladdning i appen

- Blueprinten kan nu laddas ner direkt från adminsidan /pitch, med en knapp för DOCX och en för PDF per version (3.2, 3.0, 2.9, 2.8).

## 2026-08-22 – Living Blueprint 3.2

- Blueprinten uppdaterad till version 3.2 (DOCX + PDF) och omstrukturerad i sex delar med innehållsförteckning och läsanvisning.
- Funktionskartan speglar nuläget: Hem som lugn landningssida, Planera min dag, snabbcheck, Mitt batteri™ och blocket Rutiner & medicin.
- Versionshistoriken kompletterad med 3.1 och 3.2, inklusive pitchvideo, pitchdeck och pitchsidan i appen.

## 2026-08-22 – Pitchsida i appen

- Ny adminskyddad sida `/pitch` där pitchvideon kan spelas upp direkt i appen och pitchdecken laddas ner (PowerPoint 3.2 och PDF 3.0).
- Knapp "Pitchmaterial" i sidhuvudet på adminsidan som länkar till den nya sidan.
- Filerna ligger under `public/pitch/`.

## 2026-08-22 – Pitchvideo och pitchdeck (v3.2)

- Ny pitchvideo (1920x1080, ca 34 s) med berättelsen problem → insikt → produkt → daglig loop → varför nu → vision. Remotion-komposition `pitch` och renderskript `remotion/scripts/render-pitch.mjs`.
- Nytt pitchdeck `MyFlove_Pitchdeck_3.2_2026-08-22.pptx` (9 slides) i samma lila designspråk, med platshållare för siffror som behöver fyllas i innan pitchen.

## 2026-08-22 – Ny introvideo: "Första blicken" (nedladdnings-CTA)

- Ny kort video (42 s, 1080x1920) som visar MyFlove för en helt ny användare: igenkänning, batteriet, QuickFlow, Min dag, Flow och avslutande uppmaning "Ladda ner MyFlove".
- Ny Remotion-komposition `firstlook` och renderskript `remotion/scripts/render-firstlook.mjs`.

## 2026-08-22 – Hem: Rutiner & medicin i ett gemensamt block längst ner

- Dagens rutiner och dagens medicindoser visas nu i ett gemensamt, minimerbart block "🔁💊 Rutiner & medicin" längst ner på Hem.
- Allt är avcheckningsbart med ett tryck (Klar) och kan ångras; listan sorteras efter klockslag.
- Samma befintliga data som i Rutiner & medicin – rutinerna bockas av via dagens påminnelse och medicin via medicinloggen, inga dubbletter.
- Blocket kan döljas eller flyttas i Anpassa hemskärmen.

## 2026-08-22 – Medicin: snabb avcheckning från Hem

- Nytt kompakt, minimerbart Hem-block "💊 Dagens medicin" som visar dagens/närmast kommande dos i stället för hela medicinlistan.
- En dos markeras som tagen med ett enda tryck (💊 Medicin · 08:00 → ✓ Tagen), och tagna doser kan ångras ("Ej tagen").
- Samma befintliga medicindata och samma logg som i Rutiner & medicin – ingen ny medicinmodell, ingen ny route och inga dubbletter.
- Blocket ligger efter "Nästa" och konkurrerar inte med de fyra snabbalternativen; det kan döljas i Anpassa hemskärmen.

## 2026-08-22 – Hem: Energins historik ligger nu direkt under batteriet

- Korrigerad renderingsordning på Hem: Hälsning → Hur är det just nu? → Mitt energibatteri → Energins historik → Nästa → Vad behöver du just nu? → Dagens saker → övriga block.
- "Energins historik" renderas faktiskt direkt efter "Mitt energibatteri" i Hem-layouten, inte längst ner, genom uppdaterad blockordning och en ny engångsmigrering.
- Befintlig komponent och befintlig energidata återanvänds; ingen ny energimodell eller route har skapats.
- Mitt energibatteri och Energins historik är fortfarande två separata minimerbara sektioner.
- Alla andra Hem-sektioner och minimeringsfunktioner är oförändrade.

## 2026-08-22 – Hem: Energins historik under batteriet + alla block minimerbara

- "Energins historik" visas åter som ett eget block direkt under "Mitt energibatteri" på Hem, med samma befintliga energidata och en enkel indikator på om energin ökar, är stabil eller minskar.
- Historiken ligger inte längre inne i batteriet – de är två block som kan minimeras var för sig.
- Alla relevanta Hem-sektioner (Hur är det just nu, Mitt energibatteri, Energins historik, Nästa, Dagens saker, Just nu, Vad behöver du just nu) har samma rubrik + diskret minimera/expandera-kontroll, och valet sparas som tidigare.
- De fyra snabbalternativen ligger i EN gemensam sektion och är oförändrade i namn, ikoner, undertexter och funktion.
- Det separata blocket "Jag gjorde något" visas fortfarande inte på Hem.

## 2026-08-22 – Utvecklingsläge: testsession i previewen

- Ny sida `/dev-session` (endast preview/dev) som skapar/återställer testkontot och loggar in automatiskt, så att klickflöden på Hem kan QA:as utan lösenord.
- Sidan är blockerad i publicerad app och märkt `noindex`.

## 2026-08-22 – Hem: "Jag gjorde något" borta som separat block + energihistorik i batteriet

- Det separata blocket "Jag gjorde något" (`gjort-knapp`) renderas inte längre på Hem och är borttaget från Anpassa hemskärmen. Funktionen finns kvar bakom snabbalternativet "Jag gjorde redan något".
- Mitt energibatteri är kompakt som standard och har nu "Visa energihistorik" – expanderar samma befintliga energihistorik (Energins historik idag) utan ny datamodell.
- Batteriet visar tydligt om energin ökar, är stabil eller minskar (pil + klartext).
- De fyra snabbalternativen är oförändrade.

## 2026-08-22 – Hem städas: "Lägg till det du gjorde" är borta som separat block

- Det separata blocket/fältet "Lägg till det du gjorde" (`gjort`) renderas inte längre på Hem.
- Funktionen finns kvar bakom snabbalternativet "Jag gjorde redan något" i "Vad behöver du just nu?" och använder samma "Jag gjorde något"-modal och aktivitetsmodell.
- Blocket är också borttaget från standardlayouten och från "Anpassa hemskärmen" som ett valbart block.
- De fyra snabbalternativen är oförändrade: namn, ikoner, undertexter, funktion och destination.
- Inga ändringar av aktivitetsmodellen, QuickFlow, Planera min dag eller energilogiken.

## 2026-08-22 – Bättre delning och SEO på publika sidor

- Alla publika sidor (start, guide, cookies, integritet, villkor, logga in, skapa konto, glömt lösenord) har nu titel, beskrivning, canonical och sociala delningskort.
- Ny delningsbild (og-image.jpg, 1200×630) används som förhandsvisning när en länk delas i sociala medier och chattar.
- twitter:card är satt till summary_large_image på alla publika sidor.

## 2026-08-22 – Lugnare Hem: de fyra snabbalternativen är kärnan

- De fyra snabbalternativen ("Vad behöver du just nu?") ligger nu högt på Hem, direkt efter hälsning, mående/energi och batteriet. Namn, ikoner, undertexter och destinationer är oförändrade.
- Tre överlappande block är dolda i standardlayouten eftersom snabbalternativen redan täcker dem: snabbknappen "Jag gjorde något", snabbfältet "Lägg till" och panelen "Lägg till det du gjorde".
- Blocken finns kvar och kan slås på igen i "Anpassa hemskärmen". Befintliga sparade layouter påverkas inte – ändringen gäller standardläget och återställning.
- Ingen funktion, route, datamodell eller energilogik har ändrats.

## 2026-08-26 – Snabbfix: "Jag gjorde redan något" öppnar rätt flöde

- I situationskortet "Vad behöver du just nu?" öppnar valet "Jag gjorde redan något" nu samma "Jag gjorde något"-modal som resten av appen, i stället för att länka till `/energifloede`.
- Ingen ny funktion, route eller energilogik har skapats – befintligt flöde återanvänds.

## 2026-08-22 – Lugnare första 30 sekunder

- Batteriet talar klartext direkt: "Du har medelbra energi – den är på väg upp, starkast kl 14–16." Procenten är kvar men sekundär, och minikurvan syns alltid utan att man behöver öppna kortet.
- "Preliminär kurva – blir din egen när du loggat energi några dagar" syns nu direkt för nya användare.
- Hem startar lugnare: energihistorik, områdesväljare och genvägar är dolda som standard och kan slås på i "Anpassa hemskärmen".
- "Jag gjorde något" är nu ett eget block i Anpassa hemskärmen och kan flyttas eller döljas som allt annat.
- "Korta vägar" har blivit "Vad behöver du just nu?" med fyra situationer i stället för produktnamn: Jag behöver planera något · Jag gjorde redan något · Jag vet inte vad jag ska göra nu · Jag har mycket i huvudet.
- Introt är nedkortat till två kort, och frågan om vad du vill ha hjälp med kommer först vid ett senare besök – första gången ska appen bara ge nytta.

## 2026-08-25 – Tydligare energistruktur och språk

- Min energi är nu tydligt "historik och mönster": batteriet är din energibild just nu, energihistoriken visar hur energin brukar röra sig. Ingen ny data, inget nytt system.
- Energins historik nås från Mer under "Mina mönster" i stället för att kännas som en egen huvudfunktion. Routen `/energifloede` fungerar som förut.
- Dagens balans förklaras nu i klartext: hur väl dagens krav matchar din energi och kapacitet – inget produktivitetsbetyg.
- Undertexter på Hem: "Lägg till – planera något", "Jag gjorde något – registrera något du redan gjort", "QuickFlow – fånga en tanke snabbt".
- "Jag gjorde något"-poster kan inte längre dubbleras visuellt i Hem, Min dag eller Allt i dagen.

## 2026-08-25 – Planera min dag tillbaka + Jag gjorde något i dagen

- 📋 Planera min dag i Planera: knappen "Föreslå en ordning" ger en smart ordning på dagens uppgifter utifrån tider, ork och svårighetsgrad. Du kan flytta stegen upp/ner innan du väljer "Använd planen".
- Den sparade ordningen visas som "Dagens ordning" i Min dag och gäller bara den dagen. Inga nya uppgifter skapas – bara en ordning på det som redan finns.
- "Jag gjorde något" hamnar nu i den gemensamma aktivitetsmodellen och syns bland dagens gjorda saker i Hem, Min dag och kalendern.
- Tydligare hjälptexter på Hem för "Lägg till" och "Jag gjorde något".

## 2026-08-25 – Enklare språk i hela appen

- Navigationen heter nu Hem, Min dag, QuickFlow, Planera och Mer – med QuickFlow som central snabbknapp.
- Interna produktnamn är utbytta mot vardagliga ord: FlowScore → Dagens balans, FlowPlan → Planera min dag, Energy Flow → Min energi, Flow Replan → Ändra planen, Flow Insights → Mina mönster, Friction → Svårighetsgrad, Daily Flow → Min dag, StudyFlow → Studier, StudyBuddy → Studiehjälp, WorkFlow → Jobb.
- Sidrubriker, flikar, hjälptexter och sidtitlar följer samma språk, så samma sak heter samma sak överallt. Ingen funktionalitet eller data har ändrats.

## 2026-08-21 – En logg per dag för mående och energi

- Ändrar du dagens mående- eller energivärde flera gånger uppdateras samma post i stället för att nya loggrader skapas – även vid snabba upprepade sparningar.
- Sparningarna körs i tur och ordning, så en dag alltid har en enda registrering per värde.

## 2026-08-21 – Mående och energi som 1–10-sliders

- ❤️ Hur är det just nu? på Hem använder nu mjuka horisontella sliders 1–10 för mående (😞 → 😍) och energi (🪫 → 🔋), med valt värde tydligt visat som t.ex. 7/10.
- Två helt separata värden – mående 9/10 och energi 2/10 samtidigt går bra. Båda sparas med datum och tid i befintlig måendelogg respektive energilogg.
- Dagens registrering uppdateras i stället för att dubbletter skapas, och samma sparade värden används i Hem, ❤️ Idag och Flow.

## 2026-08-21 – Snabb registrering av mående och energi

- Ny sektion ❤️ Hur är det just nu? på Hem och i ❤️ Idag – ett tryck registrerar mående (😞–😍) och ett tryck registrerar energi (🔋 1–5).
- Mående och energi är två separata värden och kan ändras hur många gånger som helst under dagen.
- Samma sparade värden visas i Hem och Idag – inga separata registreringar per vy. Mående sparas i befintlig måendelogg, energi i befintlig energilogg med datum och tid för framtida historik.
- Liten ＋ Logga-meny ger snabb väg till Mående, Energi och Anteckning. Sektionen går att minimera men är öppen som standard.

## 2026-08-21 – Minimering som genomgående UX-princip

- Samma minimerbara sektion (`CollapsibleSection`) används nu även på Hem (Nästa, Flow-förslag), i Flow → Idag (Dagens belastning), i ❤️ Idag (Dagens energibalans, Dagens lista) och i Min livsprofil.
- Dagens saker-kortet (Hem och Flow) går att minimera, och ☑️ Genomfört idag använder samma stil som resten.
- Inget nytt collapse-system: samma pil, animation och sparade läge per sida och rubrik. Kalenderns Tidslinje / Allt i dagen är oförändrad.

## 2026-08-21 – Minimerbara sektioner tillbaka

- 🕒 Under klockslag och 🌿 Under dagen i ✨ Allt i dagen går åter att minimera/expandera.
- ☑️ Genomfört idag på ❤️ Idag använder samma minimerbara sektion som resten av appen.
- Valet sparas per sida och rubrik. Minimering är bara en visningsinställning – data och avbockning påverkas inte.

## 2026-08-21 – Tillgänglighet i kalendern

- Segmentknapparna 📅 Tidslinje och ✨ Allt i dagen har nu `role="tab"`, `aria-selected` och `tabindex` så skärmläsare tydligt ser vilket visningsläge som är aktivt.
- Växlaren ligger i `role="tablist"` med beskrivande `aria-label="Visningsläge för dagen"`.

## 2026-08-21 – Tidslinje eller Allt i dagen

- ✨ Allt i dagen är nu ett alternativt visningsläge i kalendern i stället för en extra lista under den vanliga vyn.
- Ny växlare 📅 Tidslinje | ✨ Allt i dagen – samma dag och samma data, bara två olika presentationer.
- Inga dubbletter längre: när Allt i dagen är på visas den vanliga dagslistan och tidslinjen inte samtidigt.
- Avbockning fungerar som förut och synkas med ❤️ Idag, Hem och Att göra.

## 2026-08-25 – Blueprint, video och pitchdeck 3.0

- Living Blueprint uppdaterad till version 3.0 med nytt kapitel 18.8 och Idag som dagens kärna (DOCX + PDF).
- Pitchdeck v4 uppdaterat: "Nytt i version 3.0" med Idag, Allt i dagen, QuickFlow, Mitt batteri och Livsområden.
- Ny marknadsföringsvideo (v6) med scener för ❤️ Idag och QuickFlow som universell infångning.

## 2026-08-21 – Smala mobilskärmar

- Kalender, ❤️ Idag och inloggningen fungerar nu ner till 320 px bredd utan att något klipps av eller hamnar utanför skärmen.
- Knappraden i kalendern (Ny händelse, Påminnelse, Bildstöd, ✨ Allt i dagen) radbryts snyggt i stället för att sticka ut.
- Mobilens topprad har fått fast plats för tillbakaknapp, titel och Minimera-knappen; texten "Minimera allt" göms på riktigt smala skärmar.

## 2026-08-21 – Startsidan i mobil

- Hero-rubriken är mindre och radbryts snyggt på mobil – den krockar inte längre med den lila bakgrundsbubblan.
- Bakgrundsbubblorna är mjukare och nedtonade i mobilstorlek.
- Rubriker och sektionsmarginaler är anpassade för små skärmar, så sidan känns lugnare och mindre trång.

## 2026-08-21 – QuickFlow fångar klockslag

- QuickFlow förstår nu "idag", "i dag" och "ikväll" – tidigare hamnade de utan datum.
- Skriver du bara ett klockslag ("Ring frisören 14:00") läggs det på idag.
- Uppgifter behåller sitt klockslag: "Ring tandläkaren idag 14:00" blir en uppgift kl 14:00, inte en tidlös rad. Den dyker upp under 🕒 Under klockslag i ✨ Allt i dagen och på rätt tid i ❤️ Idag.
- Inköp får renare titlar – tidsuttryck städas bort ("Handla mjölk idag 14:00" → "Mjölk").

## 2026-08-25 – ✨ Allt i dagen i kalendern

- Kalendern har fått en utökad vy: **✨ Allt i dagen** (knapp vid dagens rubrik, syns för idag). Vanliga kalendern är oförändrad och visar fortsatt tidsbundna saker.
- Vyn visar hela dagen: tidsatta saker under klockslag och sådant utan tid under **🌿 Under dagen** – både planerat och genomfört, med livsområdesfärg kvar även när det är avbockat.
- Samma data och samma bock som Idag, Lista, Hem och Att göra – inga dubbletter. QuickFlow-objekt som hör till idag dyker upp automatiskt.
- Liten sammanfattning: "✨ X aktiviteter genomförda idag".
- "Allt i dagen" fungerar nu för **valfri kalenderdag**, inte bara idag: välj en dag så visas den dagens uppgifter, påminnelser, lektioner, barnens hållpunkter, rutiner och QuickFlow-objekt – med avbockning som sparas på rätt dag.
- Tidsatta saker sorteras alltid i klockordning (även "9:00"), avbockning flyttar aldrig något, och under 🌿 Under dagen hamnar det som återstår först. Valet "Allt i dagen" sparas per datum.

## 2026-08-24 – Avbockat idag försvinner inte längre

- Uppgifter och QuickFlow-tankar utan datum försvann tidigare helt när du bockade av dem. Nu räknas allt du bockar av idag som gjort idag och stannar kvar under "Genomfört idag" i Hem, Idag (🌊 Flow och 📋 Lista) och Flow → Idag.
- Verifierat i webbläsaren: avbockning i 🌊 Flow, 📋 Lista, Hem och Att göra ger exakt samma status i alla vyer, åt båda hållen.

## 2026-08-23 – Min dag och Daily Flow blir ❤️ Idag

- Min dag och Daily Flow är nu EN vy: **Idag**. Samma dagsdata, inga dubbla upplevelser.
- Två visningslägen inne i Idag: 🌊 **Flow** (batteri, dagens tidslinje, energibalans, ett förslag och det som får plats) och 📋 **Lista** (allt som ska göras idag, avbockningsbart). Valet sparas.
- Avbockningen är oförändrad och delas fortsatt av Hem, Idag, Flow och Att göra.
- Att göra finns kvar som hela listan (även kommande dagar), men är inte längre en dubbel huvuddestination.
- `/min-dag` skickar automatiskt vidare till `/idag`, så gamla länkar och genvägar fungerar.

## 2026-08-22 – Allt som kan genomföras kan bockas av

- Allt som hör till idag går nu att bocka av: uppgifter, kalenderhändelser, påminnelser, rutiner, lektioner, barnens hållpunkter och QuickFlow-tankar. En och samma bock, samma status överallt (Hem, Min dag, Flow → Idag, Att göra).
- Rutiner, lektioner och schemarader bockas av per dag – de återkommer imorgon utan att bli permanent "klara".
- Nytt: "X saker genomförda idag 💙" på Hem och i Min dag, så att dagen även visar vad du faktiskt har gjort – inte bara det som är kvar.
- Livsområdena har egna färger som alltid visar område, aldrig status: Vardag, Privat, Barn, Studier, Jobb, Hälsa, Ekonomi, Socialt och Egen tid.
- QuickFlow gissar livsområde bättre (hälsa, ekonomi, socialt, barn) och färgen följer med hela vägen till kalendern.

## 2026-08-21 – Bocka av dagens uppgifter direkt på Hem

- Nytt block "Dagens uppgifter" på hemskärmen: allt som hör till idag – även det QuickFlow har strukturerat – går att bocka av direkt, utan att gå till Att göra.
- Samma kort och samma avbockning som i Min dag, så status är densamma överallt (Hem, Min dag, Att göra).
- Kalenderhändelser, lektioner och rutiner visas inte som avbockningsbara – de hör hemma i tidslinjen.
- Blocket går att stänga av eller flytta i Anpassa hemskärmen.
- Samma lista finns nu även i Flow → Idag, så dagens uppgifter kan bockas av där utan att gå till Att göra.

## 2026-08-21 – QuickFlow sparar på riktigt

- Fix: när du tryckte "Godkänn allt" eller "Spara bara texten som den är" stängdes rutan innan sparningen hann köras – uppgiften, inköpet eller tanken försvann. Nu sparas allt innan dialogen stängs och dyker direkt upp i Att göra, Kalender, Inköp och QuickFlow.

## 2026-08-20 – Min livsprofil ersätter jobb- och studieprofilen

- Ny samlad profil 👤 Min livsprofil (Mer → högst upp): livssituation, anpassade följdfrågor, styrkor, svårigheter, vad du vill ha hjälp med, vad som ger/tar energi och hur du vill att Flow hjälper dig.
- Livssituationerna är utökade: Arbetar, Studerar, Arbetar och studerar, Söker jobb / mellan jobb, Föräldraledig, Sjukskriven, Frilansar / egenföretagare, Hemma / hushåll och familj, Praktik / arbetsträning och Annat – flera samtidigt.
- Följdfrågorna visas bara för det du valt, så profilen aldrig blir ett långt formulär. Sjukskriven frågar varsamt om vardagen – inga medicinska antaganden.
- "Profil klar X %" visas, men allt är frivilligt och appen fungerar med tom profil.
- Gamla Min jobbprofil och Min studieprofil är borta ur gränssnittet och navigationen. Det du fyllt i migreras automatiskt till livsprofilen – ingen data raderas.
- /min-situation leder nu till Min livsprofil.
- Flow, StudyFlow, FlowStudy, WorkFlow och Livspusslet använder livsprofilen som kontext.

## 2026-08-20 – Dubblettskydd i databasen

- Servern hindrar nu identiska registreringar: samma aktivitet med samma riktning inom samma minut kan bara sparas en gång per användare, även från två flikar samtidigt.
- Samma aktivitet vid en annan tidpunkt går att spara som vanligt.

## 2026-08-20 – Säkrare sparning av energiposter

- Energiflödet följer inloggningen: loggar man in i samma flik dyker posterna upp direkt, och vid utloggning töms de direkt (tidigare krävdes omladdning).
- Dubblettspärr: samma aktivitet med samma riktning inom en minut sparas inte två gånger – dubbeltryck skapar inte längre två poster.
- Om en borttagning eller ändring inte går igenom mot servern återställs vyn i stället för att visa ett felaktigt läge.

## 2026-08-20 – Snabbknapp "Jag gjorde något" på Hem

- Ny alltid synlig snabbknapp ➕ Jag gjorde något direkt under Mitt batteri på Hem – öppnar ett 3–5 sekunders flöde: välj/skriv aktivitet → 🔻/🔺/➖ sparar direkt.
- Friktion är ett frivilligt extrasteg efter att posten sparats, med Ångra och "Lägg till en till".
- Samma datamodell, energi- och friktionslogik som Energiflöde – dagens energiflöde och FlowScore uppdateras direkt.
- Den stora panelen "Lägg till det du gjorde" är dold som standard på Hem (kan slås på i Anpassa hemskärmen).

## 2026-08-20 – Lägg till det du gjorde & Dagens energiflöde

- Ny lågfriktionsfunktion "Lägg till det du gjorde": ett tryck för vanliga vardagssaker (middag, tvätt, undanplock, barn, packa inför imorgon) med val av när det hände, fritext och förberedd röstinmatning.
- Energi in/ut per aktivitet: 🔻 tar energi, 🔺 ger energi, ➖ neutral – går alltid att ändra i efterhand.
- Friktion är nu en egen dimension skild från energi (lätt/lagom/tungt att komma igång).
- Nytt kort "Dagens energiflöde" med uppdelning i Planerat, Vardag, Spontant och Återhämtning samt netto för dagen.
- Registrerade aktiviteter räknas in i FlowScore, så en tom kalender läses inte längre som en lätt dag.
- Nya mönster: "Tungt att komma igång med (30 dagar)" som visar när friktion och energikostnad skiljer sig åt.
- Hem och Min dag har fått blocken; på Hem kan de döljas/sorteras i Anpassa hemskärmen.

Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

### Added

- **Anpassa hemskärmen är tillbaka** (2026-08-20): Ny sida under Mer → Inställningar (och en liten länk längst ner på Hem) där du slår av/på och sorterar de block Hem faktiskt visar – Mitt batteri, Nästa, Flow-förslag, ＋ Lägg till, Dina genvägar, Korta vägar och Områdesväljare. Här väljer du också dina fyra egna genvägar, som nu kan visas direkt på Hem igen. Valen sparas i molnet.

### Changed

- **En enda förslagskälla** (2026-08-20): Hem, Min dag och Flow → Nu använder nu samma Flow-motor, så du får samma svar på "vad är viktigast just nu?" oavsett var du står. Kortet "Dagens fokus" på Min dag är borttaget (det upprepade tidslinjen), och den extra energimeningen är ersatt av Flows egen bedömning av dagens belastning.
- **Ett namn på varje sak** (2026-08-20): "Daily Flow", "Vad ska jag göra nu?" och "Dagens fokus" är borta ur gränssnittet. Allt heter Flow (Nu / Idag / Hjälp), och "Daglig rutin" heter nu **Rutiner & medicin** så att den inte konkurrerar med Min dag.
- **En väg in till Energiflöde** (2026-08-20): Energiflöde finns bara som del av Må bra i stället för att dessutom ligga under Hälsa och Avancerat. Gamla länkar till /energifloede fungerar fortfarande.

- **Ett samlat Flow** (2026-08-21): Flow är nu en enda hjälpare med tre lager – **Nu** (ett tydligt förslag med Ja, börja / Senare / Redan klar), **Idag** (dagens belastning i klarspråk och förslag att flytta något till imorgon) och **Hjälp** (Flow-chatten). FlowPlan, "Vad ska jag göra nu?" och Flow-chatten är sammanslagna och når du via /flow – gamla länkar pekar om automatiskt. FlowScore, Energiflöde, Veckans flow och Friktionsindex ligger kvar under Mer → Avancerat.
- **Förenklad Hem-landning** (2026-08-20): Hem är nu en lugn landningssida som svarar på "Vad behöver jag veta just nu?" – med hälsning, Mitt batteri, Nästa aktivitet, ett Flow-förslag och en tydlig ＋ Lägg till-knapp. Inga långa listor, grafer eller flera AI-förslag. All sekundär funktionalitet finns kvar på sina egna sidor och nås via Mer.
- **Enklare huvudnavigation** (2026-08-20): Appen har nu fem tydliga ingångar – Hem, Min dag, QuickFlow, Flow och Mer. Kalender, Att göra, FlowPlan, Vad ska jag göra nu?, Energiflöde, Må bra, FlowScore och Statistik är inte längre egna huvuddestinationer utan ligger under Min dag, Flow respektive Insights. Mer är omgrupperat i Min dag · Flow · Studier · Jobb · Familj · Hemma · Resor · Insights · Inställningar. Alla sidor, länkar och redirects fungerar precis som förut, och du kan fortfarande byta de två valfria platserna i bottenmenyn.

### Removed

- **Anpassa hemskärmen och död kod** (2026-08-20): Den gamla blockinställningen för hemskärmen beskrev block som inte längre finns på nya Hem och togs bort tillsammans med sina oanvända komponenter.

### Added

- **Min dag är appens kärna** (2026-08-20): Min dag samlar nu dagens tidslinje (händelser, uppgifter och rutiner med ändra/ta bort direkt i raden), Mitt batteri högst upp med nivå, riktning och detaljer vid tryck, en stor ＋ Lägg till-knapp för uppgifter på sekunder, en enkel mening om dagens energibalans och ETT förslag från Flow. Ingen ny data eller kalender – allt bygger på befintlig logik.
- **Mitt batteri – din energikurva över dagen** (2026-08-20): Ett lugnt, levande batteri högst upp i kalendern och som eget block på hemskärmen visar din energinivå just nu, om den stiger eller sjunker, och när du brukar vara starkast respektive lägst. Expandera för kurvan över dagen och mjuka förslag om placering och återhämtning. Kurvan bygger på FlowScore, ditt eget energimönster, Energiflöde™ och dagens aktiviteters energipåverkan – inga nya listor att fylla i. I kalenderns dagsvy tonas timmarna svagt efter din energi.
- **Dagen just nu på hemskärmen** (2026-08-20): Ett nytt block högt upp visar dagens tidslinje – hållpunkter, uppgifter med klockslag, rutiner och medicintider – med en mjuk Nu-markering. Går att flytta eller stänga av i Anpassa hemskärmen.
- **Medicinpåminnelser finns i Påminnelser** (2026-08-20): Mediciner och tider hanteras nu direkt på Påminnelser-sidan, så allt som påminner dig ligger på samma ställe.
- **Snabbknapp för Att göra på hemskärmen** (2026-08-20): En stor ＋ Lägg till-knapp högt upp på hemskärmen skapar en ny Att göra-post på sekunder. Dialogen frågar direkt om energi och föreslår en tid (avrundat uppåt till närmaste kvart), samtidigt som den plockar upp det aktiva rummet (Vardag, Privat, Studier, Jobb eller Barn) så inget behöver sorteras i efterhand.
- **Att göra är MyFloves dagliga agenda** (2026-08-20): Att göra har flikarna ☀️ Idag (standard), 📅 Kommande och ✅ Klart, en snabb ＋-knapp med val för när, energi och friktion, mjuka förslag från Flow när dagen inte matchar din energi, och en frivillig fråga om faktisk energi när du bockar av. Uppgifter med tid syns även i kalendern – utan tid stannar de i Att göra.
- **Anteckningar & idébank som egen del under Flow** (2026-08-19): Anteckningarna har fått en egen sida (/anteckningar) i Flow-gruppen i stället för att ligga inbakade i Quickflow – Quickflow länkar dit.
- **Flytta en anteckning tillbaka till Quickflow** (2026-08-19): Varje anteckning har nu "Tillbaka till Quickflow" – tanken blir ett aktivt flow-block igen, med möjlighet att ångra.
- **Idébanken bor i Anteckningar** (2026-08-19): Den gamla idébanken i Quickflow är borta – dina sparade idéer flyttas automatiskt in bland Anteckningar med gissat livsområde, så allt ligger på ett ställe.
- **Flytta befintliga tankar till Anteckningar** (2026-08-19): Varje tanke i "Du bad mig komma ihåg" har nu en anteckningsknapp – tanken flyttas till Anteckningar med gissat livsområde.
- **Redigera och radera anteckningar** (2026-08-19): Varje anteckning kan ändras direkt i listan – text och livsområde – och tas bort med möjlighet att ångra.
- **Spara direkt som anteckning från Quickflow** (2026-08-19): I Kom ihåg-rutan finns nu "📝 Spara som anteckning" – tanken landar direkt bland Anteckningar i stället för i triagelistan.
- **Medicinpåminnelser på förstasidan** (2026-08-19): Hemskärmen visar nu alla dagens kvarvarande doser (inte bara nästa) med en "Tagen"-knapp direkt i kortet, och blocket ligger högt upp och syns även i förenklad vy och i alla rum.
- **Energiflöde som egen del i Hälsa** (2026-08-19): Energiflöde ligger nu som en egen ingång i Hälsa-gruppen under Mer, vid sidan av Må bra, Träning, FlowScore och Statistik.
- **Barn som eget livsområde** (2026-08-19): I Att göra (och övriga vyer med livsområden) kan en sak nu läggas i Barn, vid sidan av Vardag, Privat, Studier och Jobb.

### Changed

- **Ingen "Sätt dagens fokus"-knapp på hemskärmen** (2026-08-20): Den tomma dagen visar inte längre en uppmaning att sätta fokus – Daily Flow visar bara det som faktiskt finns, och du sätter fokus via Flow eller FlowPlan som vanligt.
- **Ett sammanhängande Daily Flow-kort** (2026-08-19): Ditt fokus idag och dagens viktigaste ligger nu i samma kort – fokuslistan högst upp och "Resten av dagen" direkt under, i stället för två separata kort.
- **Inga dubbletter i Daily Flow** (2026-08-19): En uppgift som redan står i "Ditt fokus idag" eller som dagens fokus visas inte en gång till i listan under.
- **Daily Flow och Dagens viktigaste är nu ett block** (2026-08-19): Daily Flow är tillbaka på hemskärmen och innehåller incheckningen, Ditt fokus idag och dagens viktigaste saker i samma sektion – i stället för två block som visade samma sak.
- **Framtida saker stannar på sin dag** (2026-08-19): Hemskärmens lista visar bara det som gäller idag (eller saknar datum). Uppgifter, händelser och påminnelser med ett datum framåt syns först den dagen – de finns kvar under "Visa alla uppgifter som inte är klara".
- **Städad kodbas** (2026-08-18): Alla ~6 000 lintanmärkningar är åtgärdade – enhetlig formatering i hela projektet, tydliga typer i stället för lösa `any`, kommenterade undantag där de behövs och regler anpassade för UI-bibliotek och genererade filer. Inget i appens funktion har ändrats; alla flöden testades efteråt.

### Fixed

- **Uppgifter försvinner inte längre vid synk** (2026-08-18): Om molnläsningen misslyckades, eller om appen öppnades i en ny webbläsare/PWA med tom lokal lagring, kunde en tom lista skrivas över dina sparade uppgifter. Nu skrivs molnet bara över efter en avsiktlig ändring – aldrig av ett tomt startvärde eller ett misslyckat anrop.
- **Flow svarar igen i chatten** (2026-08-18): När du startade ett nytt samtal byttes sidan direkt när chatten skapades, vilket avbröt anropet till Flow så att svaret aldrig kom. Nu skickas frågan klart och svaret sparas innan sidan byter till det nya samtalet.
- **Snabbare start på varje sida** (2026-08-18): Molnsynken frågade efter inloggad användare en gång per sparad inställning – över 130 nätverksanrop per sidladdning. Nu delas svaret mellan alla, vilket tar ner det till en handfull och gör sidorna snabbare, särskilt på mobil och dålig uppkoppling.
- **Gamla påminnelser borttagna** (2026-08-18): Inaktuella notiser som låg kvar i kön är avbokade – Elvanse 12:15 och 11:30 från gamla medicinposter, morgonmedicin från ett gammalt id, samt vattenpåminnelserna 05:00/05:05 (inklusive den dagliga upprepningen) och en gammal testnotis. Aktuella påminnelser och mediciner (Elvanse 13:00, morgonmedicin 06:15) är orörda.

### Added

- **Energiflöde som egen rubrik under Må bra** (2026-08-19): I "Alla"-vyn på Må bra ligger Energiflöde nu som en egen hopfällbar sektion med rubriken "🔋 Energiflöde", bredvid Mående och Energi, i stället för ett länkkort gömt inuti Energi-sektionen.
- **Stop-samtal sparas** (2026-08-18): Chattarna du har med Flow via Stop-knappen sparas nu automatiskt och dyker upp bland dina Flow-samtal, så att du kan läsa dem igen senare.
- **Egna steg i städlistan** (2026-08-18): Du kan nu lägga till egna steg i städlistan och ta bort steg du inte behöver – per rum och läge. Borttagna standardsteg går att ta tillbaka igen.
- **Min situation överst i Mer** (2026-08-18): "Mer"-menyn inleds nu med ett eget kort för Min situation som visar vilka situationer som är aktiva just nu och tar dig direkt dit.
- **Kalendern i bottenmenyn och egna platser** (2026-08-18): Hela kalendern nås nu direkt från bottenmenyn. Hem och QuickFlow ligger fast, och de två övriga platserna byter du själv under "Mer" → "Din bottenmeny". Hemskärmens block och genvägar går att anpassa som tidigare.
- **Adminvyn visar namn, besök och inloggning** (2026-08-18): Användarlistan i adminöversikten visar nu namn, senaste besök (med antal händelser) och senaste inloggning, och går att filtrera på datumintervall. Besök loggas dessutom kopplat till inloggat konto i stället för bara anonym session. Tabellrubrikerna för namn, senaste besök, senaste inloggning och skapad går nu att sortera stigande/fallande.
- **Aviseringar för aktiva påminnelser** (2026-08-18): Aktiva påminnelser ger nu en notis när det är dags – på tiden eller med förvarning (5/15/30/60 min), och även för upprepningar (varje dag, vardagar, varje vecka). Push-notiser når dig när appen är stängd, och avbokade påminnelser skickar aldrig något. På sidan Påminnelser finns nu en ruta där du slår på notiser.

- **Sidan Påminnelser** (2026-08-18): Ny vy på `/paminnelser` där du lägger till, ändrar och avbokar påminnelser med datum, tid och anteckning. Varje påminnelse visar tydlig status – Aktiv eller Avbokad – och avbokade ligger kvar så att du kan aktivera dem igen eller ta bort dem helt.

- **GitHub-issues från checklistan** (2026-08-18): 70 färdiga issues (26 kapitel-epics + delmoment) med rubrik, beskrivning och acceptance criteria utifrån Utvecklarchecklista 2.9 – som markdown, JSON och ett gh-skript för import.
- **Utvecklarchecklista 2.9** (2026-08-18): Konkret checklista utifrån Living Blueprint 2.9 – ett avsnitt per kapitel (1–18) med avbockningsbara delmoment och status (klart/delvis/kvar), samt tre prioriterade nästa steg.
- **Blueprint 2.9** (2026-08-19): Living Blueprint uppdaterad till 2.9 – nytt kapitel 17.9 "Material och kommunikation" (blueprint, pitchdeck i PPTX och PDF, marknadsföringsvideo och changelog i Flow-röst), städad kapitelordning, versionshistorik 18.7 och rätt versionsnummer i sidhuvudet. Finns som DOCX och PDF.
- **Pitchdeck som PDF** (2026-08-19): Pitchdecket finns nu även som nedladdningsbar PDF (20 sidor) med de nya skärmbilderna och en avslutande sammanfattningsslide – "MyFlove i korthet" med vad appen är, hur den fungerar, vad som är nytt i 2.8 och status/nästa steg.
- **Pitchdeck 2.8 uppdaterat** (2026-08-19): Alla skärmbilder i pitchdecket är omtagna från den nya lila appen (hem, Min dag, Relationer, Flow, FlowScore, Feedback, QuickFlow, Insight). "Familj" heter nu Relationer i problem-, lösnings- och personabilderna, rubriken "Status idag" är renodlad, och citat/siffror på testarsidan visas som tydliga platshållare tills riktig data finns.
- **Marknadsföringsvideo 2.8** (2026-08-19): Videon har fått tre nya scener – Min situation, Relationer och FlowPlan som förslag – i samma lila MyFlove-uttryck. Blueprinten är uppdaterad till 2.8 och pitchdecket har en ny slide om vad som är nytt.
- **FlowPlan är ett förslag – du bestämmer ordningen** (2026-08-19): När Flow lagt en plan visas den som **förslag** tills du säger ja. Flytta uppgifterna upp och ner med pilarna tills ordningen känns rätt, tryck "Ja, kör den här ordningen" eller be Flow föreslå på nytt. Din ordning sparas och ligger kvar, och du kan alltid gå "Tillbaka till Flows ordning".
- **Ändra eller ta bort från alla vyer** (2026-08-19): Uppgifter, påminnelser, QuickFlow-tankar och rutiner har nu en liten ändra-knapp direkt där de visas – i Min dag, på hemskärmen, i kalenderns tidslinje, i flödeskorten och i QuickFlow. Du kan justera text, datum, tid, sluttid, livsområde och anteckning, eller ta bort helt, utan att leta upp rätt sida först. Poster som kommer från schema eller barnens dag visar i stället en länk till sin källa.
- **Förslagen följer din situation direkt** (2026-08-18): När du aktiverar, pausar eller byter situation under Min situation uppdateras Flow-förslagen på hemskärmen och QuickFlow-sorteringen på en gång. Aktiva situationer lyfts fram överst bland förslagen, QuickFlow sorterar valen så att det som passar din situation kommer först och det som vilar (t.ex. jobb när du inte arbetar) hamnar sist – med en kort rad som förklarar varför.
- **Min situation** (2026-08-18): Ett nytt övergripande lager på `/min-situation` (Övrigt i menyn) där du väljer vilka livssituationer som pågår just nu – 💼 Jobb, 🎓 Studier, 🏡 Föräldraledig, 🌿 Sjukskriven, 🔎 Arbetssökande, 🔄 Mellan arbeten eller 🧭 Annat. Flera kan vara aktiva samtidigt. Jobb öppnar **Min jobbprofil** (nu även arbetsplats) och Studier öppnar **Min studieprofil** direkt i vyn, och situationen slår på rätt livsområde utan att ersätta det. Varje situation kan få en egen beskrivning, och pausar du en situation raderas ingenting – den kan återaktiveras senare. Flow väger situation + profiler + livspusslet + FlowScore + Energiflöde när den ger förslag.
- **Gamla Familj-objekt mappas till Relationer** (2026-08-19): Uppgifter, kalenderhändelser, påminnelser och QuickFlow-regler som tidigare låg under "Familj" visas nu automatiskt som **Relationer** – kalenderfiltret döps om och ditt sparade val följer med, så ingen historik tappar sitt sammanhang.
- **Relationer – ett livsområde du formar själv** (2026-08-19): "Familj" har blivit **Relationer**. Du väljer vilka relationstyper som ska synas – ❤️ Partner, 👧 Barn, 👨‍👩‍👧 Familj, 🧑‍🤝‍🧑 Vänner, 👵 Anhöriga, 🐾 Husdjur eller ➕ Annan viktig person – och lägger till de personer du vill, med namn och egen information. Nämner du någon vid namn i Quickflow föreslår Flow kopplingen, som följer med som kontext till uppgift, kalender och påminnelse. Varje person kan markeras som något som gav eller tog energi, vilket landar i Energiflöde och FlowScore. Ingen behöver ha partner, barn eller familj – hushållet och barnens scheman finns kvar precis som förut.
- **Flashcards och quiz anpassade efter din studieprofil** (2026-08-18): När du laddar upp material i StudyBuddy visar Flow vad som styr anpassningen (t.ex. "Mest flashcards", "Kortare pass", "Extra tydliga formuleringar", "Provfokus") utifrån dina stödbehov och inlärningspreferenser. Antalet kort och frågor och betoningen sätts automatiskt – och du kan alltid byta mellan Balanserat, Mest flashcards och Mest quiz innan Flow kör.
- **Min studieprofil** (2026-08-18): I StudyFlow och StudyBuddy kan du frivilligt berätta ålder, utbildningsnivå, klass/årskurs, program eller inriktning, kurser och ämnen, studietakt, distans eller på plats, vad du främst vill ha hjälp med (komma igång, bryta ner stora uppgifter, hålla deadlines, planera inför prov, repetition, förstå instruktioner, komma ihåg uppgifter) och hur du lär dig bäst (korta pass, många pauser, tydliga instruktioner, visuellt stöd, quiz, flashcards, frågor och svar). Du kan välja flera och skriva egna. Flow använder det som personlig kontext – aldrig som fasta antaganden – när den skapar quiz, flashcards, sammanfattningar och delar upp uppgifter, och profilen vägs ihop med FlowScore, energi, Min dag och kalendern så att plugget anpassas efter hur veckan faktiskt ser ut. Allt går att ändra, pausa eller ta bort.
- **Min jobbprofil** (2026-08-18): Under Jobb och WorkFlow kan du frivilligt berätta yrkesroll, bransch, huvudsakliga ansvarsområden (välj flera eller skriv egna), arbetstider/arbetssätt och vad du främst vill ha hjälp med. Flow använder det som personlig kontext – aldrig som fasta regler – när den ger förslag inom Jobb, t.ex. "Du har ett möte imorgon, vill du lägga in 15 minuter för förberedelse?". Profilen vägs ihop med FlowScore, energi och Min dag, så att en krävande arbetsdag inte följs av en full kväll. Du kan pausa, ändra eller ta bort profilen när du vill.
- **Ångra hanterade QuickFlow-tankar** (2026-08-18): Råkar du markera en vilande tanke som "Hanterad" dyker den upp under "Nyligen hanterade" i QuickFlow-listan och sorteringen. Tryck "Ångra" så återaktiveras tanken – den får tillbaka sitt sparade datum och ligger kvar i QuickFlow igen. Syns i 24 timmar efter att den markerades hanterad.
- **Markera "Återkom senare"-tankar som hanterade** (2026-08-18): Vilande tankar göms nu automatiskt från sorteringen tills tiden är inne – du ser bara en liten rad med hur många som vilar, och kan visa dem om du vill. Varje sparad tanke har en tydlig knapp "Hanterad – göm den" i både QuickFlow-listan och sorteringen, så den försvinner ur vyn utan att du behöver leta.
- **Sparläge för "Återkom senare" i QuickFlow** (2026-08-18): Väljer du "Återkom senare" får du nu bestämma när tanken ska dyka upp igen – i kväll, imorgon bitti, om 3 dagar, nästa vecka eller eget datum och klockslag. Tanken ligger kvar i QuickFlow som vilande, du ser tidpunkten på kortet och kan ändra den när du vill.
- **QuickFlow: "Vart ska det här hamna?"** (2026-08-18): Efter att du fångat något föreslår Flow vart det hör hemma och visar alla val på ett ställe – uppgift, kalender, påminnelse, barn, familj, studier, jobb, hemma, hälsa, ekonomi, inköpslista, anteckning, energifaktor, återkom senare eller ta bort. Barn är nu ett eget val: nämner du ett av barnen vid namn föreslår Flow rätt barn, och du väljer om det blir kalenderhändelse, uppgift, anteckning eller inköp. Väljer du energifaktor anger du själv om den gav eller tog energi och hur mycket den ska påverka FlowScore. Alla förslag går att ändra manuellt.
- **"Omvandla till …" på anteckningar** (2026-08-18): Varje anteckning har nu en tydlig knapp där du väljer om den ska bli uppgift, kalenderhändelse eller energifaktor. Du kan justera text, datum, tid, påminnelse eller energiriktning, styrka och kategori – och inget sparas förrän du trycker Bekräfta.

### Fixed

- **Notiser kommer nu även när appen är stängd** (2026-08-18): Telefonens push-prenumeration kunde bytas ut i bakgrunden utan att servern fick veta – då skickades notisen till en gammal nyckel och syntes aldrig. Nu förnyas prenumerationen varje gång du öppnar appen, och tjänsten uppdaterar sig själv direkt om webbläsaren byter nyckel. Gamla, döda prenumerationer för samma enhet rensas bort.
- **Tider för personliga puffar sparas igen** (2026-08-17): Morgonpuff, kvällspuff och Morgonstart sparade inte de tider du valde – sparningen avvisades tyst i bakgrunden. Nu skickas bara dina inställningar, och tiderna ligger kvar och styr när notiserna kommer.

- **"Nyligen hanterade" syns även när allt är hanterat** (2026-08-18): Om du markerade alla QuickFlow-tankar som hanterade försvann ångra-sektionen helt, eftersom listan då dolde hela komponenten. Nu visas "Nyligen hanterade" så länge det finns något att ångra, både i listan och i sorteringen.

- **Resor och familjekalender fungerar igen** (2026-08-17): Reseökningen hämtar återigen riktiga avgångar i realtid, och familjens kalender, inköpslista och familjeuppgifter läser och sparar mot molnet igen i stället för att bara låtsas lyckas.

### Changed

- **Tydlig regelmotor för "Ditt fokus idag"** (2026-08-17): En enda plats (`src/lib/focus-rules.ts`) avgör nu vad som hör hemma i dagens fokus, i tydlig ordning: klara saker och undanstoppade göms, automatiska poster (prov/repetition) styr inte dagen, passerade datum och dagens datum visas, framtida datum väntar och saker utan datum kan alltid göras. Varje beslut har en kort motivering i Flow-röst.
- **"Ditt fokus idag" visar bara dagens saker** (2026-08-17): Uppgifter med ett framtida datum syns inte längre i "Ditt fokus idag" på hemskärmen – de ligger kvar i kalendern och dyker upp först när dagen är inne. Passerade datum och dagens datum visas fortfarande.

### Added

- **Spara som anteckning i QuickFlow** (2026-08-18): QuickFlow är fortsatt appens universella infångning – du behöver inte veta vad något är för att skriva ner det. Efter infångning kan du välja vad det ska bli: uppgift, kalenderhändelse, inköpslista, påminnelse, studier, jobb, livsområde, anteckning, energifaktor eller "Annat – behåll här". Väljer du anteckning sparas texten som den är, utan deadline eller krav på åtgärd, under "Anteckningar" på QuickFlow-sidan. Där kan varje anteckning senare omvandlas till något annat; Flow föreslår när det finns en tydlig koppling men omvandlar aldrig något automatiskt.
- **Färdiga regelmallar i QuickFlow** (2026-08-18): Åtta färdiga mallar för vanliga mönster – "boka …", "köpa …", "handla …", "påminn …", "ring …", "betala …", "idé: …" och "träffa …". Lägg till en mall direkt eller välj Anpassa för att ändra ord, destination, livsområde, klockslag och om ordet ska tas bort innan du sparar. Redan sparade regler går att ändra med pennknappen.

- **Egna sorteringsregler i QuickFlow** (2026-08-18): Du kan nu skapa dina egna regler för vart texter hamnar – t.ex. "börjar med köpa" → Inköpslistan (utan ordet "köpa" i titeln) eller "börjar med boka" → Kalendern kl 09:00. Varje regel kan sätta livsområde och klockslag, slås av/på och flyttas i ordning; översta regeln som passar vinner, annars föreslår MyFlove som vanligt. Reglerna finns på QuickFlow-sidan under "Mina sorteringsregler".
- **QuickFlow sorterar till alla delar av appen** (2026-08-18): Det du fångar i QuickFlow kan nu skickas vidare till inköpslistan, kalendern, att göra, påminnelser eller idébanken. MyFlove föreslår vart det hör hemma – "köpa schampo" hamnar i inköpslistan (som bara "schampo"), "förbereda middag" i kalendern – och förslaget är markerat men du väljer alltid själv.
- **Inställningar för energipåverkan** (2026-08-18): Ny inställningsvy i Energiflöde där du kan stänga av energipåverkan helt med ett reglage, sätta en samlad vikt och dessutom ställa vikten för varje energifaktor (sömn, socialt, rörelse, ljud & miljö, stress, återhämtning, egentid, annat) oberoende av varandra. Allt går att återställa till Normalt.
- **Energiflöde** (2026-08-19): Ny del under Må bra där du registrerar vad som ger 🔋 och tar 🪫 energi – sömn, socialt, ljud och miljö, stress, återhämtning, egentid. Dagens balans blir en egen faktor i FlowScore (du väljer själv: Av/Lite/Normalt/Mycket), och mönster över 14–30 dagar visar vad som återkommer. Posterna blir aldrig kalenderhändelser eller uppgifter – de beskriver bara din kapacitet, och Flow erbjuder en lättare plan när dagen tagit mer än den gett.

- **Ändra barn i sammanfogad händelse** (2026-08-18): Barnhändelser i kalendern har nu knappen "Ändra barn" – lägg till eller ta bort barn i efterhand utan att skapa en ny händelse.
- **Flera barn i samma händelse** (2026-08-18): I "Ny händelse" kan du nu välja flera barn samtidigt – t.ex. lämning av både Bella och Bianca. Det blir en händelse i kalendern och en påminnelse ("Lämning – Bella & Bianca"), men syns i varje barns schema. Dagens vy slår ihop identiska barnhändelser till en rad.
- **Ändra allt i efterhand** (2026-08-19): Nu kan du ändra allt du lagt in manuellt – titel, datum, starttid, sluttid, påminnelse, livsområde och anteckning. I kalendern öppnar "Ändra" en full dialog för både uppgifter och påminnelser, och på uppgiftssidan finns samma val under "Anteckning & delsteg".
- **Snabbval direkt i notisen** (2026-08-19): Påminnelser och notiser har nu två knappar – "✓ Klart" och "⏰ 10 min". Du kan bocka av eller skjuta upp utan att öppna appen; är appen redan igång sker det direkt, annars utförs valet nästa gång du öppnar MyFlove.
- **Anteckningar på uppgifter och kalenderhändelser** (2026-08-18): Du kan nu skriva en fri anteckning till det du lägger in – vad det gäller, adress eller vad du behöver ta med. Fältet finns i "Ny händelse" i kalendern och på uppgifter (öppna "Anteckning & delsteg"), och texten visas under titeln.
- **Framtida datum stannar i framtiden** (2026-08-17): Lägger du in något på ett datum längre fram – t.ex. en läkartid den 25 augusti – dyker det inte längre upp i dagens vy. Saker med datum prioriteras nu enbart efter datumet (Idag / Snart / Senare), och tankar i QuickFlow med en tid framåt räknas till den dagen i stället för idag.
- **Heldag som standard i QuickFlow** (2026-08-17): Nämner du ett datum men inget klockslag ("läkartid med Cassie den 25 augusti") läggs det nu in som heldag i stället för kl 09. Är tolkningen otydlig – t.ex. "kl 3" (morgon eller eftermiddag?) eller "fredag" (den här veckan eller nästa?) – frågar MyFlove i stället för att gissa, med tydliga val plus alternativet Heldag.
- **QuickFlow läser datum i texten** (2026-08-17): Skriver du "läkartid med Cassie den 25 augusti" föreslår MyFlove nu 25 augusti i stället för idag. Förstår "25 augusti", "25/8", "2026-08-25", "imorgon", "i övermorgon", "på fredag"/"nästa tisdag" samt klockslag ("kl 14", "14:30"). Utan klockslag föreslås kl 09, och allt går att ändra. Triagen visar det hittade datumet och föreslår Kalender.
- **Behaglig väckning** (2026-08-17): Morgonstart känns nu mjuk i stället för skarp. En varm, långsamt stigande klockklang (C–E–G–C) tonar in när du öppnar Morgonstart, med en ljudknapp om du vill tysta eller spela om den. Vibrationerna i puffarna är kortare och rundare, och texterna är lugnare ("Sträck på dig i sängen", "Ingen stress – tryck när du är redo").
- **Morgonstart för dig som snoozar** (2026-08-17): Nytt läge som fångar upp när alarmet snoozas bort. Flow puffar mjukt på vald tid och följer sedan upp med jämna mellanrum (t.ex. var 8:e minut, max 4 gånger) med stigande tydlighet: först en varm rad, sedan en tydligare, sedan en notis som ligger kvar tills du svarar. Puffarna slutar direkt när du trycker "Jag är vaken" eller kryssar ett steg i den lilla morgonrutinen (fötterna i golvet, ett glas vatten, släpp upp gardinen). Notisen öppnar den nya sidan **Morgonstart** (`/morgonstart`), och kortet syns på hemskärmen under morgonfönstret. Allt styrs från Påminnelser på hemskärmen.
- **Ny marknadsföringsvideo** (2026-08-17): Renderad om i MyFloves lila designspråk (Plus Jakarta Sans, violett/rosa palett i stället för de gamla jordtonerna). 2:27 min, 1280x720 – `myflove-marknadsforing-2026-08.mp4`.
- **Omplanering när kapaciteten är låg** (2026-08-17): När FlowScore är lågt frågar Min dag "Ska vi lägga om dagen?" med en konkret förklaring till varför (passerade datum, tunga saker, redan bokade hållpunkter) och tre lägen: _Behåll planen_, _Gör dagen lättare_ (färre saker och bara det som inte känns tungt) och _Bara det nödvändigaste_ (hållpunkter plus en enda sak). Valet ändrar direkt vad som ligger i dagens plan och vad som flyttas till "Resten kan vänta" – inget tas bort. Läget gäller resten av dagen och nollställs automatiskt till imorgon.
- **Ett gemensamt språk för allt i livet – steg 1** (2026-08-17): Ny delad modell (`src/lib/flow-items.ts` + `useFlowItems`) där en uppgift, en deadline, en lektion, en kalenderhändelse, barnens hållpunkt, en rutin och en tanke i Quickflow beskrivs på exakt samma sätt: livsområde, när, prioritet, energibehov och nästa steg. Nytt kort `<FlowItemCard />` visar dem likadant oavsett var i appen de skapades. Min dag läser nu från den delade källan, så en skoluppgift med deadline når dagen automatiskt, och kapaciteten från FlowScore avgör vad som visas – resten ligger kvar under "Resten kan vänta" i stället för att försvinna. Friktionsbiblioteket sätter energibehov på allt, inte bara jobb och studier.
- **Brödsmulor och tillbaka-knapp på Flow** (2026-08-17): Flow-sidan visar nu en tydlig sökväg – Hem › livsområde › platsen du kom ifrån › Flow – och en knapp "Tillbaka till …" som tar dig direkt tillbaka dit du var.
- **Flow visar var i livet du är** (2026-08-17): Flow-sidan har nu en kontextrubrik – "Du är i 🏠 Vardag · Att göra" – med genvägar till de sidor som hör till området (t.ex. Min dag, Rutiner, FlowScore) och chips för att byta del av livet (Vardag, Privat, Studier, Jobb). Inga nya menyval; genvägarna pekar på sidor som redan finns.
- **Enklare navigation** (2026-08-17): Fem fasta vägar i navet – Hem, Min dag, QuickFlow (mitten), Flow och Mer – lika på mobil och desktop. Ny sida **Min dag** (`/min-dag`) med dagens hållpunkter, dagens viktigaste sak, FlowScore och bara de uppgifter som gäller idag. "Mer" är nu en lugn vy med sök, kategorier, chippet "Visa bara det viktigaste" och inställningar (bottennav-redigeraren behövs inte längre). Flow vet varifrån du kom och föreslår något som passar platsen.
- **Smart framförhållning** (2026-08-17): Nytt läge som justerar påminnelsetiden per typ av hållpunkt (lektioner, barnens dag, uppgifter, kalender, rutiner) utifrån om du brukar bli sen eller tidig. Max 30 min tidigare / 15 min senare, styrs från hemskärmen.
- **Notiser för barnens hållpunkter** (2026-08-17): Skolschemat och barnens aktiviteter med klockslag skickar nu push-notiser innan de börjar ("🎒 Om 30 min: Idrott – Liam, kl 09:00 i Sporthallen"), 14 dagar framåt. Ny inställningspanel på Barn-sidan där du väljer om notiserna är på, hur långt innan de kommer (på slaget, 10, 15, 30 eller 60 min) och om du vill ha en morgonöversikt över hela barnens dag i en enda lugn notis vid vald tid. Tyst läge pausar dem som vanligt.

### Added

- **De sista kopplingarna (10–12)** (2026-08-17): (10) _Barnens dag räknas in_ – skolschema och barnens aktiviteter med klockslag blir hållpunkter i livspusslet på samma sätt som lektioner, så hemskärmen och FlowScore vet hur bunden dagen faktiskt är. (11) _Insight blir inställningar_ – valda strategier har nu knappen "Slå på åt mig" som ställer in det som redan finns i appen (dämpade färger, ingen rörelse, större text, symbolstöd, enkla ord, förenklad vy) i stället för att bara beskriva det. (12) _Lugnt förslag om block du inte använder_ – appen håller en lokal användningslogg (bara på din enhet, bara vilken del som öppnats) och föreslår efter en tid att dölja ett hemskärmsblock du inte tittat på på tre veckor. Du väljer "Dölj det" eller "Behåll", och allt går att slå på igen.

### Added

- **Fem kopplingar till mellan funktionerna** (2026-08-17): (5) _QuickFlow sorterar till rätt livsområde_ – i triagen väljer du (eller så gissar MyFlove) Vardag, Privat, Studier eller Jobb, och tanken blir en uppgift i rätt rum direkt. (6) _Rutiner, medicin och rörelse räknas i kvällens Flow Reset_ – "Det här blev gjort idag" visar nu även avklarade rutiner, tagna medicintider, träningspass och steg, inte bara uppgifter. (7) _Gårdagens Flow Reset sätter startläget_ – hur igår kändes påverkar förmiddagens FlowScore: kaos ger en lugnare start, en bra dag ger lite mer utrymme. (8) _Rörelse höjer kapaciteten_ – steg från hälsoappen och genomförda pass syns som en egen signal i FlowScore-nedbrytningen ("Du har rört dig idag"). (9) _Stopp-knappen kan pengar_ – vid impulsköp visas hur mycket som finns kvar av månadens budget och du kan parkera köpet i inköpslistan i stället för att bestämma nu.

### Added

- **Fyra nya kopplingar mellan funktionerna** (2026-08-17): (1) _Energimönster över dygnet_ – Energikartans loggar från de senaste 30 dagarna byggs till ett dygnsmönster (`src/lib/energy-pattern.ts`) som justerar FlowScore: "Du brukar ha lägre energi mellan 14 och 16. Planen tar höjd för det." (2) _Friktionsbiblioteket föreslår friktion_ – uppgifter i WorkFlow och StudyFlow matchas mot dina friktionsrapporter (`src/lib/friction-match.ts`) och föreslår ett friktionsvärde i stället för att du ska gissa. (3) _Vädret påverkar planeringen_ – Promenadvägar visar om det passar att vara ute (och föreslår inomhus vid hårt väder) och Nästa lektion lägger på marginal och föreslår en tidigare avgång när det regnar eller snöar (`src/lib/weather-advice.ts`). (4) _Bokad tid räknas bort från kapaciteten_ – möten med klockslag och dagens lektioner summeras (`src/lib/booked-time.ts`) och dras från FlowScores fokustid: "120 min av dagen är redan bokad – 95 min är dina."

- **Livspusslet – MyFloves delar börjar samarbeta** (2026-08-17): Ny gemensam kontext (`src/lib/life-puzzle.ts` + `useLifePuzzle`) som väger ihop FlowScore, energi, mående, tid kvar, osorterade tankar, deadlines per livsområde (Vardag, Privat, Studier, Jobb) och dagens fasta hållpunkter (uppgifter med klockslag och lektioner från schemat). Nytt block "Livspusslet" högst upp på hemskärmen visar hur delarna hänger ihop i stället för att räkna upp dem – med konkreta kopplingar ("Studier har deadline om 2 dagar och energin är låg – vi tar en liten bit idag") och, vid låg kapacitet, knappen "Flytta resten till imorgon". Flow får samma helhetsbild med varje meddelande och kan därför prioritera, dela upp och lägga om planen utifrån hela livet. Flows personlighet är uppdaterad: FlowScore är kapacitet, aldrig ett betyg, och en missad uppgift leder till omplanering – inte skuld. Stopp-knappen har fått ett känslosteg (stressad, trött, arg, ledsen, taggad, vet inte) som skapar ett mellanrum mellan känsla och handling innan samtalet med Flow. Inga befintliga funktioner är borttagna eller ersatta.

### Changed

- **En enda "Vad ska jag göra nu?" på hemskärmen** (2026-08-16): Dubbletten inne i Daily Flow-kortet (knapp + dialogruta) är borttagen. Kvar finns kortet högst upp på hemskärmen som leder till sidan `/vad-nu` med ett förslag i taget.

### Added

- **Enhetliga emojis, animationer och knapptexter** (2026-08-16): Alla emojis kommer nu från samma mappning (`src/lib/myflove-emoji.ts`, utökad med bl.a. FlowPlan, FlowScore, StudyFlow, Pomodoro, Rutiner, Väder och Stopp) och visas genom en gemensam `MyFloveEmoji`-komponent med samma storlekar och samma lugna andning. Knappar i hela appen klipper inte längre av text: de växer i höjd i stället, radbryts snyggt och centreras, och chips har samma höjd och trunkerar långa etiketter. Ingen funktionalitet ändrad.
- **Living UI på resten av appen** (2026-08-16): Samma rörelsetema finns nu i Flow-assistenten (tänkande i steg i stället för spinner), FlowPlan och Träning (Flow visar hur planen/passet växer fram), Studier och StudyFlow (uppdelning som process), Pomodoro och Må bra (andning), Energikartan och FlowScore (energi som levande prickskala), Veckans Flow och Statistik (mönster som samlas), Belöningar (lugn bekräftelse), Promenadvägar (rutt som ritas), samt Familj, Städning, Veckomatlista och 404-sidan. Tomma lägen i Uppgifter, Inköpslista, Kalender, Medicin och Barn har fått levande illustrationer. Ingen funktionalitet är ändrad och all rörelse stängs av vid "reduce motion" och i NPF-läget.
- **Living UI i resterande moduler** (2026-08-16): Fokusläget andas mjukt bakom ringtimern och avslutas med en ritad bock och en lugn bekräftelse. WorkFlow visar energi som prickskala och hur MyFlove tänker (🎯 → 🧠 → ✂️ → ✨) när en tung uppgift delas upp. Startsidans "Hjälp mig" har ett andande hjärta med små gnistor. Studiematerial/dokument visar MyFloves läsprocess (📄 → 🧠 → 🃏 → ✨) och ett levande tomt läge. Notisinställningarna visar att MyFlove lyssnar när puffarna är på. Och när en uppgift flyttas till imorgon glider den mjukt iväg i stället för att bara försvinna. Ingen funktionalitet ändrad; all rörelse respekterar "reduce motion" och NPF-läget.
- **Living UI – levande mikroanimationer** (2026-08-16): Nytt gemensamt rörelsesystem i `src/components/myflove/motion.tsx` med `MyFloveHeart`, `MyFloveSparkle`, `MyFloveThinking`, `MyFloveBreathing`, `MyFloveListening`, `MyFloveSuccess`, `MyFloveCelebration`, `MyFloveEnergyDots`, `MyFlovePath`, `MyFloveBalanceBars`, `MyFloveInsightGather`, `MyFloveNightSky`, `MyFloveFloatingElement`, `MyFloveTransition` och `MyFloveEmptyIllustration`. Varje funktion har fått sitt eget lilla liv: "Vad ska jag göra nu?" visar hur MyFlove tänker (📅 → ⚡ → 🎯 → ✨) i stället för en spinner, QuickFlow visar att MyFlove lyssnar när du skriver eller pratar, Resor ritar en rutt som rör sig framåt, Ekonomi visar balans som mjukt växande staplar, Insight samlar punkter till ett mönster, Flow Reset tänder stjärnor och en måne på kvällen, och hjärtat i Daily Flow slår i takt med din angivna energi (lugnare vid låg energi, mer liv vid hög). All kontinuerlig rörelse stängs av vid "reduce motion" och i NPF-läget.
- **Gemensamt designsystem: MyFlove-komponenter** (2026-08-16): Nya återanvändbara byggstenar i `src/components/myflove` – `MyFloveHeader`, `MyFloveCard`, `MyFloveSection`, `MyFloveButton`, `MyFloveChip`, `MyFloveIcon`, `MyFloveEmptyState`, `MyFloveLoading`, `MyFloveProgress` och `MyFloveModal` – plus en gemensam emoji-mappning (`src/lib/myflove-emoji.ts`) så att samma funktion alltid får samma emoji. Ekonomi, Resor, Inköpslista, Må bra och WorkFlow använder nu samma sidhuvud med tillbakapil, emoji, rubrik och kort förklaring. Nya sidor följer designen automatiskt.
- **Egen sida: "Vad ska jag göra nu?"** (2026-08-16): Ny vy på `/vad-nu` som visar ett enda förslag i taget utifrån hur lång stund du har (10 min, 25 min eller en timme), din energi och dagens belastning – med tid, prioritet, friktion och en förklaring till varför just den. "Börja nu" öppnar fokusläget, "Välj något annat" hoppar vidare och "Inte idag" skjuter upp till imorgon. Nås direkt från startsidan.
- **Tidslinje i kalenderns dagsvy** (2026-08-16): Dagsvyn visar nu en tidslinje från 06:00 till 22:00 med pastellfärgade händelsekort, bildstöd och en mjuk "Nu"-markering för var på dagen du är. Saker utan klockslag samlas längst ner.

### Changed

- **Uppdaterad appikon och PWA-ikoner** (2026-08-16): favicon.svg och alla PWA-ikoner (192, 512, maskable, Apple touch) matchar nu den uppdaterade MyFlove-loggan med violett bakgrund, vitt flödesspår och rosa accent. Den gamla favicon.ico är borttagen.
- **"Sätt dagens fokus"-knappen håller sig inom kanterna** (2026-08-16): Knappen på hemskärmen använder nu samma `MyFloveLinkButton`-komponent som resten av appen, så texten alltid ligger inuti knappen även på smala skärmar.
- **Tydligare hjärta i Daily Flow** (2026-08-16): Hjärtat i "Din kapacitet idag" har fått en mjuk cremefärgad bakgrundscirkel, bättre placering och en skugga så det syns tydligt mot den lavendelfärgade gradienten.
- **Resten av appen i samma design** (2026-08-16): Uppgifter, Flow Reset och Insight har fått samma pastellhero med emoji, rundare kort och tryckkänsla. Filterknapparna på Uppgifter är nu lavendelpiller, Flow Reset visar humöret som tre stora emoji-kort och kalenderns dagsvy har en tydligare "Nu"-markering.
- **Idag och fokusläget enligt skissen** (2026-08-16): "Din kapacitet idag" visar energi och belastning som lugna prickskalor i pastellgradient, och "Ditt fokus idag" numrerar dina tre första steg med färgade cirklar, tid, prioritet och friktion. Fokusläget har fått en stor ringtimer med start/paus mitt i cirkeln samt "Ta paus" och "Klar". "Vad ska jag göra nu?" avslutas med ett litet tips i stället för fler krav.

- **Designtokens för hela appen** (2026-08-16): Palett, rundningar (`rounded-xs`–`rounded-2xl`, `rounded-pill`), avstånd (`gutter`, `card`, `section`, `block`), skuggor (`shadow-soft`, `shadow-lifted`, `shadow-float`, `shadow-hairline`, `ring-focus`) och kantlinjer (`border-hairline`, `border-strong`, `border-dashed-soft`, `border-accent-soft`, `divider-hairline`) är nu gemensamma tokens i temat. Nya komponenter följer designen automatiskt utan hårdkodade värden, och allt anpassar sig i mörkt läge och NPF-läget "lugnare färger".
- **Ikoner och brickor i nya designen** (2026-08-16): Genvägar och överblicksbrickor på startsidan har fått pastellfärgade ikonplattor (lavendel, rosa, mint, ljusblå, sol) med rundade former, tydligare ikoner och en liten emoji i hörnet – t.ex. 🌸 Må bra, ✅ Att göra, 📅 Kalender, 🛍️ Inköp, 💊 Medicin och 🛑 Stop. Korten är rundare med lena skuggor och svarar med ett lätt tryck.
- **Ny känsla på startsida och QuickFlow** (2026-08-16): Hemskärmens hero går i pastell (lavendel, ljusblå, rosa, mint) efter tid på dygnet, och QuickFlow har fått samma mjuka hero med andande illustration.

### Changed

- **Hoppa över onboarding** (2026-08-16): En tydlig "Hoppa över"-knapp syns nu hela tiden uppe till höger i onboarding, plus en fullbredd knapp under framåtknappen som tar dig direkt till startsidan. "Nu kör vi" på sista steget leder också till `/hem`.
- **Onboarding som sveps i sidled** (2026-08-16): Välkomstkorten ligger nu i en karusell du kan svepa mellan med fingret. Progressen visas med punkter du kan trycka på plus en tydlig räknare ("Steg 2 av 4"), och du kan gå tillbaka utan att börja om.
- **Ny känsla: pasteller, mjuk rörelse och QuickFlow i mitten** (2026-08-16): Paletten har byggts ut med pasteller (lavendel, rosa, mint, ljusblå, creme) som fungerar i både ljust och mörkt läge. Sidor tonar mjukt in, kort poppar upp, illustrationer andas och knappar får ett lätt tryck. Bottennavigationen har nu fem platser med en upphöjd QuickFlow-knapp i mitten – Hem, ditt val, QuickFlow, ditt val och Mer. All rörelse stängs av automatiskt i NPF-läget "ingen rörelse".
- **Lila även på sidteman** (2026-08-16): Kalender, FlowPlan, FlowScore, Resor, Statistik, Ekonomi, Familj, Belöningar och övriga kategorisidor tintas nu i lila/rosa/mint istället för de gamla jord- och gråtonerna, så hela appen följer samma palett.
- **Ny design – mjuk lila** (2026-08-16): Hela appen har fått en ny färgvärld inspirerad av den lila skissen: ljus lila bakgrund, violett primärfärg, rosa accent och vita kort med mjuka, rundade former (radie 1.5rem). Rubriker sätts i Plus Jakarta Sans. Startsida, integritetssida och guiden följer samma palett.
- **Egen kategori för Flow** (2026-08-16): FlowPlan, Fokus, Veckans Flow, Quickflow, Hjälp, Belöningar och MyFlove Insight ligger nu i en egen kategori "Flow" i navigationen. "Din dag" innehåller Hem, Daglig rutin, Kalender, Att göra och Timer.
- **Egen kategori för hälsa** (2026-08-16): Må bra, Träning, FlowScore och Statistik ligger nu i en egen kategori "Hälsa" i navigationen istället för i "Din dag".

### Added

- **Stop-knapp i Hälsa** (2026-08-16): Stop-knappen finns nu även högst upp på "Må bra" – ett tryck ger andning och samtal med Flow innan ett impulsivt beslut.
- **Anpassa appen / NPF-läge** (2026-08-16): Ny sida `/anpassa` med globala val som gäller hela appen – färre saker på skärmen (extra hjälptexter göms), lugnare färger och mjukare skuggor, ingen rörelse/animation, enkla svenska ord istället för namn som FlowPlan och FlowScore, mer luft och större knappar, större text samt globalt bildstöd (slår även på symboler i kalendern). Valen sparas tills du ändrar dem och kan återställas.

- **Egen ordning på hemskärmen** (2026-08-16): I "Anpassa hemskärmen" kan du nu dra och släppa blocken (eller använda pilarna) för att bestämma ordningen på startsidan. Ordningen sparas tills du ändrar den, och kan återställas med "Återställ ordningen".
- **Anpassa hemskärmen** (2026-08-16): Hemskärmen startar i ett lugnare läge med färre block, och du väljer själv vad som ska synas via "Anpassa hemskärmen" – valet sparas tills du ändrar det.

- **Bygg om dagen** (2026-08-16): När saker passerat sin tid frågar MyFlove "Din dag blev annorlunda än planerat – vill du att jag bygger om resten av dagen?" och räknar om en realistisk plan utifrån kvarvarande tid, deadlines, energi, friktion och prioritet.
- **Daily Flow** (2026-08-16): Daglig incheckning på startsidan (energi, mental belastning, tillgänglig tid) som anpassar dagens rekommendationer, plus "Din dag i Flow" med max tre förslag och "Starta mitt Flow".
- **Vad ska jag göra nu?** (2026-08-16): En knapp som väger prioritet, deadline, tidsåtgång, friktion, energi och FlowScore och föreslår en enda sak – med "Börja nu", "Välj något annat" och "Inte idag".
- **Fokusläge** (2026-08-16): Lugn vy med uppgift, beräknad tid, timer och progress, och mjuka val efteråt (nästa, paus eller tillbaka).
- **QuickFlow flytande knapp** (2026-08-16): Alltid nåbar snabbdump utan kategorival, med förslag på påminnelse, uppgift eller kalender direkt efteråt.
- **QuickFlow-sortering** (2026-08-16): "Vill du att jag hjälper dig sortera?" med typförslag (uppgift, påminnelse, kalender, idé, minne) som alltid kan ändras, samt varsam uppföljning av saker som legat kvar några dagar.
- **Flow Reset** (2026-08-16): Frivilligt kvällsläge med dagsform, sammanfattning av dagen och erbjudande om att planera om utan skuld.
- **Veckans Flow** (2026-08-16): Ny vy på `/veckans-flow` med veckans sammanfattning, vad som hjälpte mest och lugna observationer om mönster.
- **Onboarding** (2026-08-16): Kort första-gången-flöde där du väljer vad MyFlove främst ska hjälpa dig med.
- Barnvy: ladda upp en bild eller ett dokument på skolschemat som ligger kvar i schemavyn (2026-08-15).
- Barnvy: lägg in barnets skolschema (ämne, tid, sal, lärare) som ligger kvar vecka efter vecka, med inklistring av schematext, markering av dagens lektioner och "Nästa lektion" överst (2026-08-15).
- Tyst läge: pausa alla påminnelser i 30 min–8 timmar, eller ställ in en återkommande tyst period nattetid (2026-08-15).
- Inköpslista: välj själv hur nära butiken påminnelsen ska komma – "I affären" (80 m), "Alldeles nära" (300 m) eller "I området" (1 km) (2026-08-15).

### Changed

- Barnvyn fastnar inte längre på "Laddar barn" vid nätverksstrul – visar felmeddelande med "Försök igen" (2026-08-15).

### Deprecated

### Removed

### Fixed

- Hem: dubbla förslagsrubriker borttagna – bara "Förslag just nu" visas nu (2026-08-15).
- Kalender: "Ny händelse"-knappen fick samma utseende och format som "+ Påminnelse" för ett mer konsekvent gränssnitt (2026-08-15).

### Security

## [0.9.0] - 2026-08-15

### Added

- **Fullständig changelog** (2026-08-15): All historik sedan projektstart samlad i `CHANGELOG.md` och i appens changelog-export.

## [0.8.0] - 2026-08-14

### Added

- **Glömt lösenord** (2026-08-14): `/glomt-losenord` mejlar återställningslänk, `/nytt-losenord` sätter nytt lösenord, länk från inloggningen.
- **Promenadvägar** (2026-08-14): Riktningsbaserade gångvägar i närområdet via OpenStreetMap Overpass, höjddata och kartförhandsvisning, med "Uppdatera min plats".

### Fixed

- Overpass-anrop returnerade tidvis 406 (2026-08-14) – rättat med korrekt Accept-header och User-Agent.

### Security

- SEO- och metadatafixar (2026-08-14): sidspecifika og-taggar, Organization/WebSite JSON-LD, site verification.

## [0.7.0] - 2026-08-13

### Added

- **Hjälptexter** (2026-08-14): Kontextuella i-knappar på 17+ sidor.
- **Tillbakaknapp** (2026-08-14): Historikbaserad navigering i layouten.
- **Introtur & enkelt läge** (2026-08-14): Guidad rundtur, svenska underrubriker och naturligt språk för FlowScore.
- **Minimera/maximera** (2026-08-14): Persistenta kollapsbara sektioner i ~35 vyer.
- **Områdesfiltrering** (2026-08-14): Hemskärmen visar bara valt rum, "Alla" slår ihop.

### Changed

- Blueprint uppdaterad till 2.7, ny presentation och ny preview-video (v5) (2026-08-14).

## [0.6.0] - 2026-08-12

### Added

- **StudyFlow™** (2026-08-13): Pluggläge med föreläsningsläge, kapacitetsplanering och kalenderkoppling.
- **Schemaimport** (2026-08-14): AI-tolkning av schema samt "nästa lektion" med plats och vägbeskrivning.
- **Lektionspåminnelser** (2026-08-14): Push när nästa lektion närmar sig.
- **FlowScore-vy** (2026-08-13): Egen central vy för kapacitetspoäng.
- **MyFlove Insight™** (2026-08-13): Demoprofiler för NPF och adaptiva strategier.
- **WorkFlow™** (2026-08-13): Arbetsläge med omplanering, mötesläge och Nu-lista.
- **Quickflow** (2026-08-13): Snabbinfångst med automatisk dubbletthantering.
- **Budget** (2026-08-12): Budgetpanel i ekonomi.
- **StudyBuddy/FlowStudy** (2026-08-13): AI-flashcards, quiz och Leitner-repetition.
- **Träning** (2026-08-11): Styrka/kondition, AI-pass och hälsoapp-koppling via Capacitor.
- **Livsområden** (2026-08-13): Vardag, Studier, Jobb, Privat med egna färger, grupperad navigation och global sök.

### Changed

- Prov läggs inte längre in automatiskt i kalendern; repetition rensas via purge-hook (2026-08-14).

## [0.5.0] - 2026-07-20

### Added

- **Push-notiser** (2026-07-18): Service worker, `push_subscriptions` och notiser för medicin, väder och påminnelser.
- **Återkommande påminnelser** (2026-07-20): Dagligen, veckovis och vardagar.
- **MCP-server** (2026-07-20): Agentintegration på `/mcp`.
- **Capacitor** (2026-07-20): iOS/Android-paketering med `MOBILE_BUILD.md`.
- **Familj/hushåll** (2026-07-20): Join-koder, delad inköpslista och kalender.
- **Proaktiva förslag** (2026-07-20): Loop-nudgar utifrån uppgifter, humör och väder.
- **Adminöversikt** (2026-07-20): Friktionsrapporter, rollhantering och changelog-export.
- **Rutiner** (2026-07-19): Rutinlista med molnsynk och notiser.
- **Kalenderintegration** (2026-07-09): ICS-import/export.
- **Tid & påminnelse** (2026-07-20): Specifik tid på uppgifter med alarmljud.
- **Valbara genvägar** (2026-07-20): Fyra egna appar på hemskärmen.

### Fixed

- Uppgifter försvann mellan dagar (2026-07-20) – flyttade från localStorage till `user_kv`.

### Security

- RLS-härdning och återkallad publik exekvering på interna funktioner (2026-07-20).

## [0.3.0] - 2026-07-09

### Added

- **Energikarta** (2026-07-08): Loggning av energinivåer, integrerad i FlowPlan.
- **Väderkort** (2026-07-08): Open-Meteo med geolokalisering på startsidan.
- **Matlista utan familj** (2026-07-09): Lokalt läge för användare utan hushåll.
- **Admin & statistik** (2026-07-08): `user_roles`, admin-gating och appstatistik.
- **Resor** (2026-07-08): Trafiklab ResRobot v2.1 med pendlingsvarningar.
- **Friktionsindex** (2026-07-08): `friction_items`/`friction_votes` med röstning.
- **FlowPlan™** (2026-07-08): AI-driven sekvensplanering.
- **Flow AI-personlighet** (2026-07-08): Dagsformsanpassat stöd.
- **Designsystem** (2026-07-08): Jordnära palett och Flow-voice-copy.
- **Publicering** (2026-07-09): Delbar testapp med PWA-stöd.

### Fixed

- Kalendern nåddes inte (2026-07-09) – routing rättad till `/kalender`.

## [0.1.0] - 2026-07-23

Initial baseline av MyFlove — ett svenskspråkigt "lugnt livsflöde"-dashboard byggt med TanStack Start, React 19, Tailwind CSS och Lovable Cloud.

### Added

- **Autentisering** (2026-07-23): Inloggning/registrering och skyddade sidor under `/_app`.
- **Dashboard/Hem** (2026-07-23): Startsida med genvägar, widget-grid och väderkort.
- **Fokus & Att göra** (2026-07-23): Daglig fokuspunkt samt uppgiftshantering med kategorier, status, delsteg, snooze och kalenderkoppling.
- **Kalender & Påminnelser** (2026-07-23): Återkommande påminnelser med tid och notiser.
- **Daglig rutin & Pomodoro** (2026-07-23): Rutinvy samt fokus-timer.
- **Dumping (brain dump)** (2026-07-23): Snabb idé-/tankeinsamling.
- **Må bra** (2026-07-23): Humörloggning och wellness-vy.
- **Medicin** (2026-07-23): Medicinlistor med schemalagda tider och intagsloggning.
- **Inköp & Matlista** (2026-07-23): Delad hushållsbaserad inköpslista med lokal fallback.
- **Ekonomi** (2026-07-23): Enkel transaktionshantering per kategori.
- **Resor** (2026-07-23): Sparade resor/hållplatser med pendlingsvarningar.
- **Familj** (2026-07-23): Delade funktioner för hushåll/familj.
- **Statistik & Belöningar** (2026-07-23): Statistikvy och achievements.
- **AI-assistent (Flow)** (2026-07-23): Chattbaserad assistent med MCP-verktyg.
- **Molnsynk** (2026-07-23): Offline-first lagring med best-effort synk.
- **Juridiskt** (2026-07-23): Integritetspolicy, villkor och cookies.

## 2026-08-28 – Gradvis förklarande copy

- Förklaringar om nyttan anpassas nu efter befintlig Flow learning level.
- Nya användare får enklare, fullständiga budskap; återkommande användare får kortare eller ingen upprepning.
- Energi, mående, planering, promenader och medicin använder samma gradvisa språk utan nya datakrav.

## 2026-08-29 – Städning följer appens layout

- Städningssidan använder nu samma MyFlove-block, 2px-borders och rundningar som resten av appen.
- Översikt, material, steg och eget steg ligger i symmetriska block i det gemensamma rutnätet.

## 2026-08-31 – QuickFlow räknar med batteriet

- Batterivärdet från Mitt batteri visas i QuickFlow och påverkar prioriteringen mer nyanserat: lätt före tungt vid lågt batteri, tungt tidigt vid högt.
- Fallback-prioriteringen väger viktighet, brådska och energinivå även utan AI.
