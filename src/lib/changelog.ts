export type ChangelogSection = {
  title: string;
  items: string[];
};

export const CHANGELOG_TITLE = "MyFlove Changelog";
export const CHANGELOG_INTRO =
  "Komplett logg över allt som byggts i MyFlove – från första prototypen till dagens version.";
export const CHANGELOG_UPDATED = "2026-09-03";

export const CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    title: "Lägg till direkt på dagen",
    items: [
      "I Kalender (Min dag, Vecka och Månad) öppnas lägg-till-flödet inline på den valda dagen – ingen separat dialog (2026-09-03)",
      "Datumet är låst till dagen man klickat på; bara Jag gjorde detta/Jag ska göra detta, vad och valfri tid behöver väljas (2026-09-03)",
    ],
  },
  {
    title: "Kalender först på Hem",
    items: [
      "Hem-blocket Min dag är nu Kalender med tre tydliga vägar: Min dag, Vecka och Månad öppnar rätt vy direkt (2026-09-03)",
      "En stor, synlig Lägg till-knapp i Hem-blocket leder till den gemensamma lägg-till-vägen (2026-09-03)",
    ],
  },
  {
    title: "Aktiviteter visar vad du faktiskt gjort",
    items: [
      "En gemensam Lägg till-väg skiljer på Jag gjorde detta och Jag ska göra detta utan krav på kategori, prioritet eller energi (2026-09-03)",
      "Min dag och Kalendern visar först aktiviteter utan klockslag som faktiskt är gjorda och därefter Tider (2026-09-03)",
      "Kalenderns dagvy har en fast ordning: gjort, planerat, tider och därefter sekundära kalenderposter (2026-09-03)",
      "Tidsbestämda aktiviteter visas bara under Tider idag och upprepas inte i kapacitetsdelen (2026-09-03)",
      "Kalenderns lägg-till-väg använder valt datum och delade kalenderhändelser ligger i en egen sekundär sektion (2026-09-03)",
      "Det gamla generella Ny händelse-flödet är borttaget ur dagvyn; specialflöden för påminnelser, familj och barn finns kvar (2026-09-03)",
      "Att markera något som klart flyttar aldrig aktiviteten till idag; completedAt sparas separat och QuickFlow-hydrering skapar inga dubbletter (2026-09-03)",
    ],
  },
  {
    title: "Snabbval direkt i medicinpåminnelser",
    items: [
      "Medicinnotiser (push) har tre knappar: \u201dTagit\u201d, \u201d10 min\u201d (ny påminnelse) och \u201dHoppa över\u201d – fungerar även när appen är stängd (2026-09-03)",
      "Larmbannern i appen har samma val: \u201dTagen\u201d bockar av dosen direkt, \u201d10 min\u201d påminner igen, krysset hoppar över idag (2026-09-03)",
    ],
  },
  {
    title: "Genomfört hamnar på rätt dag",
    items: [
      "QuickFlow-poster som blir uppgifter behåller dagen de faktiskt gjordes i stället för att få dagens datum (2026-09-03)",
      'Felaktiga rader flyttas automatiskt tillbaka till sin riktiga dag, så "Genomfört idag" bara visar dagens saker (2026-09-03)',
    ],
  },
  {
    title: "Balanserad Hem-layout och tydligare Flow-maskot",
    items: [
      "Hem har ett balanserat desktop-grid med fullbredds-hero, två jämnstora block överst och tre jämnstora block under (2026-09-03)",
      "Flow-maskoten är tydligare i hälsningshero-sektionen på desktop; mobilens tidigare storlek och touchlayout är återställda (2026-09-03)",
    ],
  },
  {
    title: "Pitchdeck 4.0 för investerarpresentation",
    items: [
      "Pitchdeck 4.0 behåller MyFloves visuella identitet och kompletterar v3.7 med founder/kompetens, byggd produkt och strukturerad validering (2026-09-03)",
      "Affärsmodell, differentiering, go-to-market, kapital och roadmap är tydligt uppdelade utan påhittade siffror eller priser (2026-09-03)",
      "Marknadssiffror är fortsatt märkta som externa uppskattningar och PowerPoint, PDF samt förhandsbild finns på pitchsidan (2026-09-03)",
    ],
  },
  {
    title: "Kontosynk för personliga inställningar",
    items: [
      "Föredraget visningsnamn och dagsramar följer det inloggade kontot via befintlig offline-first-molnsynk (2026-09-02)",
      "Utloggning rensar kontobundna värden från enheten medan enhetsval, cache och sessionssignaler förblir lokala (2026-09-02)",
    ],
  },
  {
    title: "Avklarade poster stannar på sitt datum",
    items: [
      "Avklarade kalenderposter och uppgifter med datum visas på sitt planerade datum i stället för att hoppa till dagens Min dag (2026-09-02)",
      "Historiken ligger kvar på ursprungsdatumet i kalendern; återkommande händelser och flerdagsperioder är oförändrade (2026-09-02)",
      "Datumlösa tankar och uppgifter hör fortfarande till dagen de bockades av, i lokal tid (2026-09-02)",
    ],
  },
  {
    title: "Kompakt desktop-layout",
    items: [
      "Vänster sidonavigation på desktop är kompakt: smalare kolumn med horisontella länkrader (ikon + text) i stället för stora fyrkantiga kort (2026-09-02)",
      "Toppnavigationens piller är mindre på desktop – lägre höjd, mindre padding och gap, anpassade för mus (2026-09-02)",
      "Innehållsytan får mer plats på desktop; mobilens touchstorlekar, bottennavigering och safe-area är oförändrade (2026-09-02)",
    ],
  },
  {
    title: "Demokontot aktiverat för direkt inloggning",
    items: [
      "Demokontots e-post (investor@myflove.se) är bekräftad i inloggningssystemet – direkt inloggning utan e-poststeg, utan att några andra konton eller globala inställningar påverkas (2026-09-02)",
      "Demokontot hoppar automatiskt över introturen så att visningen börjar direkt på hemskärmen (2026-09-02)",
    ],
  },
  {
    title: "Investerar-/demokonto med exempeldata",
    items: [
      "Ett markerat demokonto fylls automatiskt en gång med syntetisk QuickFlow, dagsplan, rutiner, mående och energi (2026-09-02)",
      'Diskret markering "Demokonto · Exempeldata" i appen, och demoanvändning räknas inte in i besöks- eller användarstatistiken (2026-09-02)',
      "Demokontot är en vanlig användare med normal behörighet – inga nya roller och inga lösenord i koden (2026-09-02)",
    ],
  },
  {
    title: "Flow följer adressen och all lokal data skyddas",
    items: [
      "Flow-flikarna navigerar via adressen, så uppdatering, delning och bakåtknappen öppnar samma läge som du valde (2026-09-01)",
      "Manifestet över molnsynkade nycklar täcker även städning och energiinställningar, och ett test larmar om en ny nyckel glöms bort (2026-09-01)",
      "Utloggning behåller osynkad data även om sidans hook aldrig hann monteras i sessionen (2026-09-01)",
    ],
  },
  {
    title: "Flow samlar hjälp, planering och chatt",
    items: [
      "Flow, FlowPlan och Assistant visas som lägen i samma vy med flikarna Flow, Planera och Chatta (2026-09-01)",
      "De äldre adresserna finns kvar och öppnar motsvarande läge utan separata kopior av innehållet (2026-09-01)",
    ],
  },
  {
    title: "Äldre energiposter får egna stabila id:n",
    items: [
      "Väntande energiloggar utan UUID får ett eget id som sparas lokalt innan de skickas upp, så två identiska historiska observationer aldrig slås ihop (2026-09-01)",
      "Migreringen skriver alltid med upsert på id och är därför säker att köra om efter nätfel, avbrott eller utloggning (2026-09-01)",
    ],
  },

  {
    title: "Kritiska data-, genvägs- och mobilfixar",
    items: [
      "Osynkad lokal användardata och väntande energiloggar skyddas vid utloggning med bekräftad molnsynk, retry och idempotent migrering (2026-09-01)",
      "QuickFlow-, studie- och push-CTA:er går direkt till kanoniska routes och kalenderdialoger/bottom sheets får säker mobilhöjd med intern scroll (2026-09-01)",
    ],
  },
  {
    title: "Blockrubriken får ikon ovanför text",
    items: [
      "Ikonen i varje MyFlove-block ligger längst upp till vänster med rubrik, underrubrik och sammanfattning under (2026-09-01)",
      "Chevron för expandera/minimera sitter uppe till höger på samma rad som ikonen (2026-09-01)",
    ],
  },
  {
    title: "Blocken är mer fyrkantiga och horisontella",
    items: [
      "Kollapsade block är tillbaka som kompakta kort (cirka 10 rem höga) i stället för avlånga rektanglar (2026-09-01)",
      "Rubrik, underrubrik och sammanfattning håller sig på en rad så texten inte trycks ihop vertikalt (2026-09-01)",
      "Rutnätet låter blocken växa horisontellt och anpassa sig efter bredden i stället för att sträckas till den högsta kolumnen (2026-09-01)",
    ],
  },
  {
    title: "Anpassa-sidan visar bara det viktigaste",
    items: [
      "Inställningsblocken är minimerade som standard med rubrik, underrubrik och en kort sammanfattning av ditt val (2026-09-01)",
      "Alla val – teman, ljud och brytare – syns först när du öppnar blocket (2026-09-01)",
    ],
  },
  {
    title: "Blocken ligger två i bredd igen",
    items: [
      "Rutnätet visar två block i bredd på mobil, tre på mellanstora och fyra på stora skärmar (2026-09-01)",
      "Block som behöver mer plats tar hela raden – ett större block bredvid två mindre (2026-09-01)",
      "Inga avlånga fullbreddsblock med ihoptryckt text (2026-09-01)",
    ],
  },
  {
    title: "QuickFlow-uppgifter får egna påminnelser",
    items: [
      "Varje QuickFlow-uppgift kan få en egen signal när du väljer tid under Planera den (2026-09-01)",
      "Påminnelsen sparas på samma uppgift i Idag och Kalender utan dubbletter (2026-09-01)",
      "Utan tid finns ingen påminnelse – Flow hittar inte på ett klockslag (2026-09-01)",
    ],
  },

  {
    title: "Din MyFlove: tema och alarm",
    items: [
      "Samlad sektion för färgtema, alarmsignal och alarmformat i Anpassa appen (2026-09-01)",
      "Valen sparas på enheten och finns kvar efter omladdning eller utloggning (2026-09-01)",
      "Semantiska färger för energi, status och varning påverkas inte av temat (2026-09-01)",
    ],
  },

  {
    title: "QuickFlow landar direkt i Idag",
    items: [
      "Varje godkänd QuickFlow-post skapas direkt som dagens gemensamma uppgift med samma ID (2026-09-01)",
      "Äldre prioriterade poster migreras automatiskt utan dubbletter (2026-09-01)",
      "Planera den ändrar samma uppgift i stället för att skapa en kopia (2026-09-01)",
    ],
  },

  {
    title: "QuickFlow och Idag delar samma uppgifter",
    items: [
      "Godkända QuickFlow-poster visas automatiskt i Idag utan krav på tid eller kalenderhändelse (2026-09-01)",
      "Samma status, ordning, redigering och borttagning används i båda vyerna (2026-09-01)",
      "Befintliga poster dedupliceras i dagens lista (2026-09-01)",
    ],
  },
  {
    title: "QuickFlow: nya dumpar skriver inte över listan",
    items: [
      "Nya prioriterade saker slås ihop med befintliga istället för att ersätta hela listan (2026-08-31)",
      "Klara och öppna poster bevaras – dubbletter av samma sak uppdateras (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: EN ingång, ett flöde",
    items: [
      "En enda ingång: Skriv eller prata med Flow – dubletterna Kom ihåg, Prioritera och Skriv eller prata in är borta (2026-08-31)",
      "Bottennavens +, desktopknappen och sidan öppnar samma dialog och logik (2026-08-31)",
      "Dumpa → Flow delar upp → du granskar → Flow föreslår ordning → du godkänner, utan hittade tider (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: ett brain dump blir flera uppgifter",
    items: [
      "Kom ihåg-rutan delar upp texten och visar Så här har jag förstått det (2026-08-31)",
      "Du kan redigera, ta bort och godkänna punkterna innan de sparas (2026-08-31)",
      "Modalen får plats på mobilskärmen – inget kapas åt höger (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: flera saker blir flera aktiviteter",
    items: [
      "Planera den delar upp text med flera saker i enskilda aktiviteter (2026-08-31)",
      "Dialogrutor scrollar vid mycket text så hela rutan syns (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow räknar med batteriet",
    items: [
      "Prioriteringen väger viktighet, brådska och ditt batteri från Mitt batteri (2026-08-31)",
      "Batterivärdet syns i QuickFlow och styr ordningen även utan AI (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: planera med din egen tid",
    items: [
      "Planera den låter dig välja idag, imorgon eller datum – med eller utan tid (2026-08-31)",
      "Flow sätter aldrig tider eller deadlines åt dig (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: dela upp i enskilda saker",
    items: [
      "En sak med flera händelser kan delas upp i enskilda saker direkt i listan (2026-08-31)",
      "Lägg till-fältet delar automatiskt upp flera saker som skrivs in samtidigt (2026-08-31)",
    ],
  },
  {
    title: "QuickFlow: förtydliga varje uppgift",
    items: [
      "Varje sak i Min lista just nu kan få en kort förklaring, energiuppskattning och ett första steg från Flow (2026-08-31)",
      "Förtydligandet utgår från Mitt batteri och är ett stöd – det skapar inga tider, deadlines eller kalenderhändelser (2026-08-31)",
    ],
  },
  {
    title: 'QuickFlow: "Jag har mycket på en gång"',
    items: [
      "Skriv in flera saker samtidigt utan tider – Flow prioriterar dem i fyra lugna nivåer (2026-08-31)",
      "Prioriteringen utgår från din nivå i Mitt batteri och hittar aldrig på deadlines (2026-08-31)",
      "Min lista just nu: börja, bocka av, ändra ordning, lägg till och ta bort (2026-08-31)",
      "Klart-markering kan kopplas till den befintliga energiloggningen – ingen kalenderhändelse skapas automatiskt (2026-08-31)",
    ],
  },
  {
    title: "Min energi följer MyFloves designspråk",
    items: [
      "Historik- och mönstersidan är ombyggd med appens vanliga block, rundningar och spacing (2026-08-31)",
      "Dagens balans, Idag och Mönster över tid visas horisontellt och får plats på mobil (2026-08-31)",
      "Flows reflektion visas som ett mjukt Flow-kort – all loggning och beräkning är oförändrad (2026-08-31)",
    ],
  },
  {
    title: "Välj själv vilka dagar programmet läggs på",
    items: [
      "Träningsmålet har veckodags-chips i stället för antal dagar per vecka (2026-08-31)",
      "Programmet läggs ut på exakt de dagar du valt och dagarna sparas med målet (2026-08-31)",
    ],
  },
  {
    title: '"Visa bara det viktigaste" är av tills du själv slår på det',
    items: [
      "Enkelt läge i Mer-menyn är nu av som standard – det slås bara på när du själv väljer det (2026-08-31)",
      "Tidigare automatiskt sparat på-läge rensas om valet aldrig gjorts aktivt (2026-08-31)",
    ],
  },
  {
    title: "Välj flera dagar för ett träningspass",
    items: [
      "Pass-dialogen har veckodags-chips – välj en eller flera dagar när du lägger till ett pass (2026-08-31)",
      "Samma pass skapas på alla valda dagar; vid redigering väljs en dag (2026-08-31)",
    ],
  },
  {
    title: "Bottennavigationen sitter alltid fast längst ner",
    items: [
      "Layout-roten är exakt en skärmhöjd med låst ytterscroll så bottennaven aldrig åker upp när man scrollar (2026-08-31)",
      "Gummibands-scroll i mobila webbvyer blockeras så fasta element håller sig kvar vid botten (2026-08-31)",
    ],
  },
  {
    title: "Flow-hjälparen är mindre och tydligare",
    items: [
      "Maskoten i Flow-hjälparen visas i en kompakt scenstorlek så att den inte tar över vyn (2026-08-31)",
      "Slide-ytan har mindre vertikal höjd och tätare spacing för ett lugnare, mer lättläst flöde (2026-08-31)",
    ],
  },
  {
    title: "Flow ser dagens check-ins i sin kontext",
    items: [
      "Flows personliga kontext visar dagens morgon-, dag- och kvällscheck-ins med tid, energi, mående och eventuell fritext från befintlig loggning (2026-08-31)",
      "Ingen separat check-in-datakälla skapas och hälsologgning blir inte aktivitet eller kalenderpost (2026-08-31)",
    ],
  },
  {
    title: "Flow bjuder in till mjuka check-ins under dagen",
    items: [
      "En frivillig popup kan visas en gång per tidsfönster och använder den centrala loggningen för energi och mående (2026-08-31)",
      "Hoppa över respekteras resten av tidsfönstret; en befintlig observation stoppar en ny identisk fråga (2026-08-31)",
    ],
  },
  {
    title: "Mående, energi och ekonomi är nu kontobundna",
    items: [
      "Mående och ekonomi sparas på ditt konto och finns kvar när du loggar in igen – lokal data migreras utan dubbletter (2026-08-31)",
      "Energiloggar sparas alltid på kontot; loggningar utan inloggning flyttas upp automatiskt vid nästa inloggning (2026-08-31)",
      "Fritext om vad som påverkar dig sparas som hälsokontext – aldrig som aktivitet eller påminnelse (2026-08-31)",
    ],
  },
  {
    title: "Namn och morgon/kväll-batteri stannar kvar vid utloggning",
    items: [
      "Ditt namn, dagens tidsramar och morgon-/kvällsvärdena i Mitt batteri räknas nu som enhetsdata och rensas inte när du loggar ut (2026-08-31)",
    ],
  },
  {
    title: "Fix: länkar i expanderade kort navigerar igen",
    items: [
      "Menykort med länkar använder nu routerns vanliga historik, så Planera, Flow och QuickFlow från Hem inte längre avbryts av kortets Android-bakåtlogik (2026-08-31)",
      "Texten sa fyra situationer fast listan har tre (2026-08-31)",
    ],
  },
  {
    title: "Global designregel: inga onödigt vertikala textblock",
    items: [
      "Kort visar ikon, rubrik och status på samma rad så fort det finns bredd – annars staplas de som förut (2026-08-30)",
      "Widget-kort blir horisontella i breda ytor i stället för höga torn (2026-08-30)",
      "Tomma lägen är kompaktare med ikon, text och knapp på samma rad (2026-08-30)",
    ],
  },
  {
    title: "Kalender blir navet för dagens planering",
    items: [
      "Kalender har nu tre flikar: Idag, Kalender och Lägg till – med egna adresser (2026-08-30)",
      "Lägg till är gemensam väg in för aktivitet, påminnelse, rutin, medicin och barnens dag (2026-08-30)",
      "Hem är en ren översikt igen; duplicerade dagsgenvägar är borttagna och Min dag öppnar Kalender · Idag (2026-08-30)",
      "Planerad aktivitet ändrar aldrig energin automatiskt – energi loggas bara när du själv svarar efter att något är klart (2026-08-30)",
      "Planerad aktivitet, genomförd aktivitet och energilogg hålls isär i datamodellen (2026-08-30)",
    ],
  },
  {
    title: "Publicerad: myflove.lovable.app uppdaterad",
    items: [
      "MyFlove publicerades till https://myflove.lovable.app (2026-08-29)",
      "Live-sidan visar nu senaste blueprint, pitchdeck och pitchvideo i version 3.7 (2026-08-29)",
      "Publiceringen inkluderar senaste designen, 'Varför?'-förklaringar och Lägg till på hemskärmen (2026-08-29)",
    ],
  },
  {
    title: '"Varför?" överallt och Lägg till på hemskärmen',
    items: [
      'Gemensam "Varför?"-komponent i sidhuvudet med samma utseende och beteende i hela appen (2026-08-29)',
      '"Varför?" finns nu på Mitt batteri, Hälsa, Min energi, QuickFlow, Påminnelser och Insight (2026-08-29)',
      '"Lägg till på hemskärmen" är tillbaka som tydlig rad i Mer, med riktig installationsprompt och iOS-instruktion (2026-08-29)',
    ],
  },
  {
    title: "Nya Blueprint-, pitchdeck- och videomaterial 3.7",
    items: [
      "Living Blueprint, pitchdeck och pitchvideo är uppdaterade till nytt material i version 3.7 (2026-08-29)",
      "Materialet beskriver aktuell produktkarta, Flow som följeslagare, Mitt batteri som enda hälsologgning och Idag som aktivitetsnav (2026-08-29)",
      "Pitchsidan använder 3.7-filer för video, PowerPoint, PDF och blueprint; externa marknadstal är tydligt märkta (2026-08-29)",
    ],
  },
  {
    title: "Anpassa appen: symmetriskt rutnät",
    items: [
      "Blocken i Anpassa appen sträcker sig lika högt inom varje rad för ett symmetriskt rutnät (2026-08-29)",
      "Grid-komponenten använder items-stretch som standard för jämna blockhöjder i hela appen (2026-08-29)",
    ],
  },
  {
    title: "Anpassa appen: block sida vid sida med mindre text",
    items: [
      "Inställningarna är uppdelade i mindre block som ligger sida vid sida i rutnätet (2026-08-29)",
      "Varje reglage visar bara en kort rubrik – långa förklaringar är borttagna (2026-08-29)",
      "Samma blockdesign, rundning, border och färgsystem som resten av appen (2026-08-29)",
    ],
  },
  {
    title: "Hem: 'Jag behöver planera min dag' leder till Planera",
    items: [
      "Situationsvalet pekade på Idag trots att dagens översikt redan har ett eget kort – valet leder nu till /flowplan (2026-08-29)",
    ],
  },
  {
    title: "Mer: strukturerade sektioner längst ner",
    items: [
      "Mer-sidan är grupperad i Min profil, Anpassa MyFlove, Kom igång och Ljud & konto (2026-08-29)",
      "Din bottenmeny ligger under Anpassa MyFlove; Installera appen ligger under Kom igång (2026-08-29)",
    ],
  },
  {
    title: "Mer/Inställningar: en primär väg in per funktion",
    items: [
      "Dubbletterna i Mer är borta – Anpassa appen, Hemskärm och Min livsprofil finns nu på ett ställe (2026-08-29)",
      "Inställningar samlas i en egen sektion; admin har en egen kategori (2026-08-29)",
      "Alla inställningsrader har samma höjd, ikonstorlek och beteende (2026-08-29)",
      "Bottenmenyns återställning pekar på Idag + Planera, som är standard (2026-08-29)",
    ],
  },
  {
    title: "Städning: kompaktare Påminnelser, energihistorik och listor",
    items: [
      "Påminnelser: Aviseringar är ett kompakt kort med status och knapp på samma rad (2026-08-29)",
      "Min energi: Lägg till det du gjorde är fullbrett med chips sida vid sida (2026-08-29)",
      "Inköpslista: alla rader har samma höjd, padding och ikonstorlek (2026-08-29)",
      "Sparade butiker: kortare text och input + platsknapp på samma rad (2026-08-29)",
    ],
  },
  {
    title: "Städning: typsnitt, statistik och konsekventa kort",
    items: [
      "Nunito Sans är nu appens enda typsnitt, med emoji-fallback (2026-08-29)",
      "Sidvisningar loggas på en enda plats så statistiken inte dubbelräknas (2026-08-29)",
      "Insikter renderas i appens delade skal med bottennavigation och back (2026-08-29)",
      "Hem: Kalender-kortet och Rutiner & medicin följer samma kortspråk som övriga block (2026-08-29)",
    ],
  },
  {
    title: "Planera: fullbreddsblock i stället för smal vertikal layout",
    items: [
      "Steg 1 och Steg 2 i Planera spänner nu över hela raden, så formulär och lista får hela ytans bredd i stället för att klämmas vertikalt i en halv kolumn (2026-08-29)",
      "Energivalen ligger i tre kolumner även på mobil (2026-08-29)",
    ],
  },
  {
    title: "Hem: Kalender-blocket får samma vertikala rytm som andra block",
    items: [
      "Lade till en osynlig statushållare i Kalender-blocket så att avstånden och korthöjden matchar de andra blocken nu när statusraden är borta (2026-08-29)",
      "Endast presentation – navigation, data och funktionalitet är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Hem: Kalender-blocket utan 'Jag finns här'",
    items: [
      "Tog bort statusraden 'Jag finns här' från Hem-blocket Kalender – kortet visar nu titel, undertitel och Flows förslagstext (2026-08-29)",
      "Endast presentation – navigation, data och funktionalitet är oförändrade (2026-08-29)",
    ],
  },

  {
    title: "Stabilare sortering av dagens måendeobservationer",
    items: [
      "Dagens måendeobservationer sorteras nu kronologiskt även när flera loggningar har samma tidsstämpel, så ordningen blir förutsägbar i Mitt batteri och historiken (2026-08-29)",
      "Testerna för useQuickCheckin väntar ut asynkrona tillståndsuppdateringar innan verifiering, vilket tar bort den sporadiska testflaken (2026-08-29)",
    ],
  },
  {
    title: "Hem: Kalender-ikon i stället för Flow-maskot, nästa-block bort",
    items: [
      "Hem-blocket Kalender (tidigare Flow · just nu) använder nu en kalender-ikon och områdesidentiteten kalender i stället för Flow-maskoten (2026-08-29)",
      "Nästa / Nästa viktiga sak är borttaget från Hem – samma information finns redan i Idag (2026-08-29)",
      "Endast presentation och hemlayout – ingen funktions- eller dataändring (2026-08-29)",
    ],
  },
  {
    title: "Idag: Lägg till i dagen följer blockspråket",
    items: [
      "Steg 3 Lägg till i dagen på Idag är nu ett komprimerat, expanderbart block med ikon, etikett och status – samma designspråk som övriga kort (2026-08-29)",
      "Innehållet (snabb-tillägg och gjorde-detta) är oförändrat i expanderad vy (2026-08-29)",
    ],
  },
  {
    title: "Tjockare kantlinjer på samtliga kort",
    items: [
      "Alla kort med blocklayouten har nu 2px-borders i stället för 1px – gemensamma border-tokens, hero-ytan och alla rounded-3xl-kort (2026-08-29)",
      "Inre avdelare är oförändrade; endast presentation, ingen funktionsändring (2026-08-29)",
    ],
  },
  {
    title: "Hem: Flow-kortet döps om till Kalender",
    items: [
      "Kortet som tidigare hette Flow · just nu heter nu Kalender och leder till Kalender (/kalender) (2026-08-29)",
      "Nästa navigerar tillbaka till Idag (/idag) (2026-08-29)",
      "Flow-maskoten i godmorgon-kortet är förstorad från sm till md (2026-08-29)",
      "Endast presentation och navigation – data, logik och övrig funktionalitet är oförändrad (2026-08-29)",
    ],
  },
  {
    title: "Hem: Nästa leder till Kalender, Flow-blocket större",
    items: [
      "Nästa navigerar nu till Kalender (/kalender) i stället för Idag – det finns redan en Idag-widget (2026-08-29)",
      "Flow · just nu är nu ett fullbrett block högt upp på Hem med större Flow-maskot (2026-08-29)",
      "Endast presentation och navigation – data, logik och övrig funktionalitet är oförändrad (2026-08-29)",
    ],
  },
  {
    title: "Hem: Flow-, Insikter- och Nästa-korten leder nu vidare",
    items: [
      "Flow lär känna dig → Insikter, Nästa → Idag, Flow just nu → Flow (2026-08-29)",
      "ExpandableBlock har fått ett href-läge – samma komprimerade design, men kortet navigerar i stället för att expandera (2026-08-29)",
    ],
  },
  {
    title: "Hem: centrerad blockdesign enligt ny referens",
    items: [
      "Komprimerade block är centrerade: cirkulär ikon, rubrik + underrubrik, streck, stort värde i områdesfärg och rund pilknapp (2026-08-29)",
      "Mitt batteri och Dagens översikt följer samma centrerade stil; hälsokortet visar Flow-maskoten (2026-08-29)",
      "Endast presentation – data, logik, navigation och funktionalitet är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Samma blockdesign på övriga sidor",
    items: [
      "Gemensamt blockspråk (tvåkolumns-grid, mjuka rundade kort, områdesfärgade borders) på Matlista, Träning, Stop-paus, Quickflow, Relationer, Barn, Familj, Ekonomi, Resor, Timer, Belöningar, Veckans flow, Studyflow, Jobb, Workflow, Daglig rutin, Friktionsindex, Livsprofil och Statistik (2026-08-29)",
      "Påminnelser: blocken bär nu idag-områdets mjuka border (2026-08-29)",
      "Endast presentation – data, logik, navigation och funktionalitet är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Samma blockpolish på Hälsa, Planera och Kalender",
    items: [
      "Hälsa: Träning- och Rutiner-korten följer Hem-blockens formspråk med mjuk border och pil (2026-08-29)",
      "Planera: stegblocken bär planeraområdets mjuka border (2026-08-29)",
      "Kalender: kalenderkort och import/export-knappar bär kalenderområdets mjuka border (2026-08-29)",
      "Endast presentation – data, logik och navigation är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Hemskärmen: polish och symmetri",
    items: [
      "Tydligare områdesborders i varje blocks egen färg – mjuka men synliga mot pastellen (2026-08-29)",
      "Harmoniserade blockhöjder, samma rundning och padding – griddet känns symmetriskt (2026-08-29)",
      "Huvudvärdet är nu störst i varje block (text-3xl): 56 %, 10:30, 1/3 (2026-08-29)",
      "Konsekvent ikon- och pilplacering i alla klickbara block, även Mitt batteri och Idag (2026-08-29)",
      "Dagens översikt-blocket heter Idag och följer samma kortstruktur som Mitt batteri (2026-08-29)",
      "Kortare underrubriker utan avklippt text (2026-08-29)",
      "Endast presentation – data, loggning, navigation och logik är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Tre riktade UI/UX-korrigeringar",
    items: [
      "Hem: Dagens översikt navigerar nu direkt till befintliga Idag-vyn (2026-08-29)",
      "Historik → Mående: Hitta mitt flow följer nu blocksystemet – ikon + kort rubrik, samma funktion (2026-08-29)",
      "Historik → Flöde: sektionerna är komprimerade som standard med kortare texter; tryck visar hela innehållet (2026-08-29)",
      "Endast presentation – data, stores, navigation och logik är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Hem i samma designspråk som Hälsa",
    items: [
      "Komprimerade hemblock visar rubrik, kort underrubrik och aktuellt värde i stället för bara ikon + ett ord (2026-08-29)",
      "Blocken är större, luftigare och pastellfärgade efter områdesfärgerna – samma visuella språk som Hälsa (2026-08-29)",
      "Tryck expanderar fortfarande bara det blocket på plats; tvåkolumnsrutnätet på mobil är kvar (2026-08-29)",
      "Endast presentation – data, loggning, navigation och Flow-logik är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Hem återställt som samlad överblick",
    items: [
      "Alla hemblock visas igen som komprimerade widgets – batteri, Flow, Nästa, Dagens översikt, rutiner, vägar och områdesväljare (2026-08-29)",
      "Lägg till i dagen är nu ett block: komprimerat kort som öppnar snabbtillägg och Jag gjorde något (2026-08-29)",
      "Ingen funktion eller information borttagen – endast informationshierarki och presentation (2026-08-29)",
    ],
  },
  {
    title: "Widget-minimalism på fler dashboard-sidor",
    items: [
      "Idag: Dagens ordning är en komprimerad widget (ikon + antal) med hela planen i expanderad vy (2026-08-29)",
      "Kalender: batterikortet använder widget-läget – ikon + procent, tryck öppnar Mitt batteri (2026-08-29)",
      "Mitt batteri: historiken är en komprimerad widget som expanderar i flödet med oförändrade flikar (2026-08-29)",
      "Endast presentation – data, stores, navigation och logik är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Widget-läge: minimalistiska komprimerade block",
    items: [
      "Komprimerade block på Hem visar bara stor ikon + ett värde; rubrik och förklaringar bor i den expanderade vyn (2026-08-29)",
      "ExpandableBlock har fått ett widget-läge – luftig komprimerad widget som expanderar på plats i sidans flöde (2026-08-29)",
      "Batterikortet på Hem är en widget-länk (ikon + procent) och Flow-noteringen ett widget-block med maskoten (2026-08-29)",
      "Områdesfärgen bär informationsvärdet i stället för text; endast presentation är ändrad (2026-08-29)",
    ],
  },
  {
    title: "Områdesfärger som visuell röd tråd",
    items: [
      "Varje huvudområde har en egen mjuk färgidentitet: Hälsa, Flow, Idag, Planera, Hem, Återhämtning och Kalender (2026-08-29)",
      "Färgerna bor centralt som design tokens i styles.css och mappas i src/lib/areas.ts, så en områdesfärg kan bytas på ett ställe (2026-08-29)",
      "Sidhuvuden, blockramar och ikoner följer områdets färg via data-area och nya utilities (2026-08-29)",
      "Färg är aldrig enda informationsbäraren; kontrast, reduced motion och tillgänglighet är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Komprimerade och expanderbara block",
    items: [
      "Informationsrika block visar en lugn sammanfattning först och öppnar samma innehåll i en fokuserad vy vid tryck (2026-08-29)",
      "Stäng, Escape och Androids bakåtknapp återför användaren till samma block med återställd fokus och scrollposition (2026-08-29)",
      "Reduced motion respekteras utan ändrad funktionalitet, data eller navigation (2026-08-29)",
      "Block expanderar på plats i sidans flöde som accordion-kort och tar hela innehållsbredden, i stället för att öppnas som separat helskärmsvy – utan horisontell scroll på 320–412 px (2026-08-29)",
    ],
  },
  {
    title: "Responsivt blocksystem",
    items: [
      "Ett gemensamt CSS-grid placerar lämpliga block bredvid varandra i stället för att stapla varje sektion som en hel rad (2026-08-29)",
      "Hem visar ett varierat dashboard-grid med batteri/Flow, sammanfattningar och nästa steg sida vid sida (2026-08-29)",
      "MyFlovePageGrid ger två kolumner även på 320–412 px, tre på tablet och fyra på desktop; MyFloveWide ger enskilda breda block hela raden (2026-08-29)",
      "Hem, Hälsa och Mitt batteri visar flera lämpliga block samtidigt på mobil, medan grafer, formulär och långa texter använder hela bredden utan sidoscroll (2026-08-29)",
      "Planera, Kalender, Energi/Flow, listor, påminnelser, rutiner, medicin och inställningar använder samma blockramverk (2026-08-29)",
      "Mobilkorten har kompakt padding och storlek, medan läsintensivt innehåll uttryckligen spänner båda kolumnerna (2026-08-29)",
    ],
  },
  {
    title: "Ren kodbas (lint-städning)",
    items: [
      "Alla lint-varningar åtgärdade – hjälpfunktioner flyttade till egna moduler och hook-beroenden memoiserade (2026-08-29)",
      "Autogenererade Supabase-filer exkluderas från linting; ingen funktionell förändring (2026-08-29)",
    ],
  },
  {
    title: "Samlad MyFlove-design",
    items: [
      "Gemensamma block, rubriker, ytor och minimering används nu konsekvent i appens centrala vyer (2026-08-29)",
      "Hem, Mitt batteri, Idag, Planera, Flow, QuickFlow och Anpassa appen följer samma lugna visuella rytm (2026-08-29)",
      "Befintliga funktioner, navigation, data och logik är oförändrade (2026-08-29)",
    ],
  },
  {
    title: "Flera observationer per dag",
    items: [
      "Varje loggning i Mitt batteri blir en egen tidsstämplad observation (2026-08-29)",
      "Idag-vy visar energi och mående över dagen med fritext (2026-08-29)",
      "Fristående måendesidan är read-only – loggning sker i Mitt batteri (2026-08-29)",
    ],
  },
  {
    title: "Redigera dagens loggning",
    items: [
      "Ändra dagens energi, mående och fritext direkt i Mitt batteri – samma logg uppdateras (2026-08-29)",
    ],
  },
  {
    title: "En enda plats för energi & mående",
    items: [
      "Mitt batteri är den enda loggningsvägen: Hem → Mitt batteri → Logga energi & mående (2026-08-29)",
      "Dubbla loggningsformulär i Flow, QuickFlow och historiken borttagna (2026-08-29)",
      "Fritext om vad som påverkar dig – frivilligt, sparas med dagens mående (2026-08-29)",
      "Flow använder texten som kontext utan att dra medicinska slutsatser (2026-08-29)",
    ],
  },
  {
    title: "Hälsologgning skild från Min dag och kalendern",
    items: [
      "Energi, sömn, mående och kroppsliga observationer blir aldrig automatiskt uppgifter eller kalenderposter (2026-08-29)",
      "QuickFlow föreslår hälsotexter som energi-/måendelogg i stället för kalender (2026-08-29)",
      'Aktiviteter som "boka läkare" och "träning kl 18" fungerar precis som förut (2026-08-29)',
      "Egen statistikhändelse för hälsologgning – utan värden (2026-08-29)",
    ],
  },
  {
    title: "Mediciner sparas i molnet",
    items: [
      "Medicinlista och medicinlogg synkas till kontot, precis som rutinerna (2026-08-28)",
      "Listan finns kvar efter utloggning och på andra enheter (2026-08-28)",
      "Lokal medicindata lyfts automatiskt upp till kontot (2026-08-28)",
    ],
  },
  {
    title: "Av/på-knapp för anonym statistik",
    items: [
      "Synlig av/på-knapp för anonym användningsstatistik under Anpassa appen → Integritet (2026-08-28)",
      "Kopplad till opt-out-flaggan – avstängning gäller direkt (2026-08-28)",
      "Cookiepolicyn pekar på var knappen finns (2026-08-28)",
    ],
  },
  {
    title: "Uppdaterade juridiska dokument",
    items: [
      "Integritetspolicy, villkor och cookiepolicy speglar dagens funktioner (2026-08-28)",
      "Hälsodata beskrivs som särskild kategori med uttryckligt samtycke (2026-08-28)",
      "Sparade Flow-samtal, notiser, Google-inloggning och delning beskrivs (2026-08-28)",
      "Radering i appen samt rensning av lokal data och krypteringsnyckel vid utloggning (2026-08-28)",
      "Cookiepolicyn beskriver krypterad lokal lagring och sessionsutkast (2026-08-28)",
    ],
  },
  {
    title: "Spara samtal med Flow",
    items: [
      "Samtalslista i Prata med Flow med [+ Nytt samtal] högst upp (2026-08-28)",
      "Flera separata samtal med eget id – öppna och fortsätt ett gammalt samtal (2026-08-28)",
      "Relativa datum: Idag, Igår, I förrgår (2026-08-28)",
      "Byt namn och ta bort samtal med enkel bekräftelse (2026-08-28)",
      "Korta automatiska titlar från samtalets innehåll (2026-08-28)",
      "Sparade samtal är historik – inte Flows långsiktiga lärande (2026-08-28)",
    ],
  },
  {
    title: "Äkta insikter och rekommendationer",
    items: [
      "Insikter visas bara när de syns i din egen data – annars ett lugnt tomläge (2026-08-28)",
      "Varje insikt visar sitt underlag, t.ex. antal incheckningar och snitt (2026-08-28)",
      "Måendetrend kräver minst tre incheckningar senaste veckan (2026-08-28)",
      "Avklarade uppgifter räknas på completedAt i stället för createdAt (2026-08-28)",
      "Dagens fokus visas bara när det gäller idag (2026-08-28)",
    ],
  },
  {
    title: "Gradvis förklarande copy",
    items: [
      "Förklaringar om nyttan anpassas efter befintlig Flow learning level (2026-08-28)",
      "Nya användare får enklare budskap; återkommande användare får kortare eller ingen upprepning (2026-08-28)",
      "Energi, mående, planering, promenader och medicin använder samma gradvisa språk (2026-08-28)",
    ],
  },
  {
    title: "Tydlig nytta med loggning",
    items: [
      "Incheckningen visar kort vad du får tillbaka, anpassat efter hur väl Flow känner dig (2026-08-28)",
      "Diskret ⓘ Varför? på energi, mående och planering – bara där nyttan inte är självklar (2026-08-28)",
      "Mänsklig bekräftelse efter sparad incheckning i stället för teknisk text (2026-08-28)",
      "Promenader beskrivs utifrån nyttan: en promenad som passar din energi just nu (2026-08-28)",
      "Befintlig Flow-learning återanvänds – inga påhittade mönster och ingen ny datamodell (2026-08-28)",
    ],
  },
  {
    title: "Pitchmaterial 3.6",
    items: [
      "Living Blueprint, pitchdeck och pitchvideo är uppdaterade till version 3.6 (2026-08-28)",
      "Materialet fokuserar på Lugnare helhet, färre val, tydligare vägar och levande Flow (2026-08-28)",
      "Pitchsidan använder nu 3.6-filerna för video, PowerPoint, PDF och blueprint (2026-08-28)",
    ],
  },
  {
    title: "Subtil sidövergång",
    items: [
      "Gemensam fade vid riktiga sidbyten: ut cirka 160 ms och in cirka 220 ms (2026-08-28)",
      "Lokala interaktioner, modaler, kollapsning, Flow och QuickFlow påverkas inte (2026-08-28)",
      "prefers-reduced-motion stänger av övergångsanimeringen utan att ändra navigation eller historik (2026-08-28)",
    ],
  },
  {
    title: "Stop-paus flyttar till Mer",
    items: [
      "Stop-paus är nu en egen post under Mer → Hälsa med egen ikon 🛑 (2026-08-28)",
      "Egen sida /stop-paus – samma funktion och logik som tidigare (2026-08-28)",
      "Stänger du pausen kommer du tillbaka dit du faktiskt kom ifrån (2026-08-28)",
      "Dubbletten på Mitt batteri är borttagen (2026-08-28)",
    ],
  },
  {
    title: "Flow syns tydligare utan att flytta något",
    items: [
      "Flow är optiskt större på små platser utan att ändra layoutrutan (2026-08-28)",
      "Chatten, Hem, installationskortet och Flow lär sig använder samma finjustering (2026-08-28)",
      "Mini-scenen visar Flow i 68 px inuti sin fasta 80 px-ruta (2026-08-28)",
      "Tester verifierar layoutneutral förstoring och uppdaterad mini-storlek (2026-08-28)",
    ],
  },
  {
    title: "Flow-närvaro, minimerbara block och smart tillbaka",
    items: [
      "Flow-maskoten är något större där den redan visas – samma maskot och identitet (2026-08-28)",
      "Flows rörelser är fortsatt sparsamma och respekterar prefers-reduced-motion (2026-08-28)",
      "Mitt batteri på Hem och Energins historik idag går att minimera och maximera (2026-08-28)",
      "Minimerat läge kommer ihåg sig lokalt per sida och påverkar aldrig din data (2026-08-28)",
      "Tillbaka följer appens riktiga historik och faller bara tillbaka till Hem vid direktladdning (2026-08-28)",
    ],
  },
  {
    title: "Hem-kategorin: Inköpslista och Städning",
    items: [
      "Inköpslista och Städning ligger nu tydligt under huvudkategorin Hem i menyn (2026-08-28)",
      "Kategorin heter Hem (tidigare Hemma) för att matcha den nya mentala modellen (2026-08-28)",
      "Navigationsetiketten för /shopping är Inköpslista så den stämmer överens med sidan (2026-08-28)",
      "Befintliga sidor, routes, data och funktioner är oförändrade; /shopping och /stadning fungerar som tidigare (2026-08-28)",
      "Hälsa, Idag, Planera, Flow, Mitt batteri och QuickFlow är oförändrade (2026-08-28)",
    ],
  },
  {
    title: "Mitt batteri: tydligare hierarki",
    items: [
      "Hur är ditt batteri just nu? är nu den primära funktionen högst upp på Mitt batteri (2026-08-28)",
      "Dagens batteri/översikt, morgon/kväll och dagens energiflöde ligger direkt efter incheckningen (2026-08-28)",
      "Historiken (mående, energi och flöde) är flyttad längre ner som sekundär funktion (2026-08-28)",
      "Ingen data, funktion eller Flow-logik har tagits bort; samma komponenter återanvänds (2026-08-28)",
      "Dagens energiflöde renderas inte längre dubbelt inuti historiken (2026-08-28)",
    ],
  },
  {
    title: "Slutstädning efter QA",
    items: [
      "Rutiner använder samma dagsbaserade genomförandelogg i Hem, Idag och Flow; äldre rutinstatus migreras automatiskt (2026-08-28)",
      "Återkommande rutiner filtreras konsekvent efter valt datum även i dagens Flow-lista (2026-08-28)",
      "Flow och FlowPlan har separata sidtitlar och FlowPlan finns i appguiden (2026-08-28)",
      "Insight-demoläget kräver explicit demoläge och servervaliderad admin-roll (2026-08-28)",
      "Energins historik är inte längre en separat ingång i Hälsa utan nås från Mitt batteri (2026-08-28)",
    ],
  },
  {
    title: "Levande men lugn polish",
    items: [
      "Liten engångsreaktion på bocken när något blir klart – ingen konfetti, inga poäng (2026-08-28)",
      "Batteriet pulserar inte längre i bakgrunden; det rör sig bara när värdet ändras (2026-08-28)",
      '"Flow lär känna dig" följer din faktiska inlärningsnivå i språket och tonar in insikterna mjukt (2026-08-28)',
      "Kväll kombinerat med lågt batteri ger en lugnare mening på Hem (2026-08-28)",
    ],
  },
  {
    title: "Städad struktur: en plats för varje sak",
    items: [
      "QuickFlow är en egen ingång i menyn i stället för en underrubrik i Planera (2026-08-28)",
      "Flow-inställningar finns bara på ett ställe: Inställningar → Flow (2026-08-28)",
      '"Att göra" heter nu "Alla uppgifter" – hela listan framåt, dagens saker bor i Idag (2026-08-28)',
      "Hälsa: dubbla ingångar till Mitt batteri borttagna – energi, mående och sömn checkas in på ett ställe (2026-08-28)",
      "Gamla länkar leder fortfarande vidare till rätt vy, ingen data eller funktion borttagen (2026-08-28)",
    ],
  },
  {
    title: "Lugn sidbytesanimation",
    items: [
      "Sidbyte mellan Hälsa, Idag och Planera (och övriga sidor) fadar in mjukt med ett litet lyft – och respekterar reducerad rörelse (2026-08-28)",
    ],
  },
  {
    title: "Flow känns levande",
    items: [
      'Flows ton anpassas efter batteriet – från "bra läge för den större saken" till "vi behöver inte pressa idag" (2026-08-28)',
      "Flow reagerar när något blir klart och frågar ibland om du vill ta nästa eller pausa (2026-08-28)",
      "Missade saker möts utan skuld, med Flytta till imorgon som ett klick (2026-08-28)",
      "Hem säger olika saker beroende på tid, energi och hur dagen gått – utan nya kort (2026-08-28)",
      "Batteriprocenten animeras mjukt och respekterar reducerad rörelse (2026-08-28)",
      "Nya anonyma händelser: flow_task_completion_reaction, flow_missed_task_shown, flow_missed_task_action (2026-08-28)",
    ],
  },
  {
    title: "Menyn: beskrivningar alltid synliga",
    items: [
      'Fix: Kategoriernas och menyvalens förklaringstexter döljdes av "Färre saker"-läget – nu syns de alltid (2026-08-28)',
    ],
  },
  {
    title: "Enklare huvudkategorier",
    items: [
      "Ny samlad Hälsa-vy (/halsa) med energi och mående, träning och promenader, rutiner och medicin, sömn och energihistorik (2026-08-28)",
      'Genomgående språk: "Idag" (hela dagens lista) och "Planera" (bestäm och ordna) ersätter Min dag och Planering (2026-08-28)',
      "Menyn omgrupperad efter Idag, Planera, Hälsa, Flow och Mina mönster – utan att någon funktion eller rutt tagits bort (2026-08-28)",
      "Nya anonyma händelser: health_viewed, today_viewed, planning_viewed, flow_viewed (2026-08-28)",
    ],
  },
  {
    title: "Promenader nära dig",
    items: [
      "Flow föreslår promenadlängd utifrån batterinivån, du väljer alltid själv (2026-08-28)",
      "Välj en rutt för att se MyFloves kartförhandsvisning och öppna samma rundtur i Google Maps med riktig startpunkt och vändpunkt (2026-08-28)",
    ],
  },
  {
    title: "Rutiner & medicin",
    items: [
      "Mediciner och rutiner kan vara återkommande (varje dag, vardagar, varje vecka) eller en gång med datum (2026-08-28)",
      "Påminnelser och dagens listor följer valet – engångsdoser dyker bara upp den dag de gäller (2026-08-28)",
    ],
  },
  {
    title: "Besöksanalys",
    items: [
      "Sidvisningar loggas anonymt vid varje navigering – se hur många som öppnar den delade länken och vilka sidor de besöker (2026-08-28)",
      'Admin-vyn visar "Mest besökta sidor" med visningar per sida och unika besökare (2026-08-28)',
    ],
  },
  {
    title: "Daglig loop",
    items: [
      'Tydlig Flow på Hem: kortet heter nu "Flow lär känna dig" med den riktiga maskoten, och "Just nu" är signerat Flow · just nu – samma funktioner, tydligare vem som hjälper dig (2026-08-28)',
      "Energi och mående bor nu bara på Mitt batteri – incheckning, dagens kurva, paus och historik på ett ställe, med tydligare roller för Min dag, Planering, Flow hjälper och Prata med Flow (2026-08-28)",
      "Dubblettstädning: Hem visar en kort dagsöversikt i stället för samma uppgifter som Min dag, incheckning och energikurva bor bara i Mitt batteri och alla dagslänkar går till samma vy (2026-08-28)",
      "Enklare snabbincheckning: batteri 1–5 med ett tryck, valfritt mående och valfria påverkansfaktorer (sömn, stress, ljud, mat, socialt, kroppen) som sparas i energiflödet (2026-08-28)",
      'Flow på Hem länkar direkt till Mina mönster med "Se vad jag har upptäckt" (2026-08-28)',
      "Medicinlistan och medicinpåminnelserna läser exakt samma data – gamla nycklar migreras utan dubbletter och notiser för borttagna mediciner avbokas (2026-08-28)",
      "Bild eller PDF på schemat läses av av Flow och sparas som en fil du kan trycka på för att titta på originalet (2026-08-27)",
      "Mer-menyn börjar med Mina områden och Inställningar – Min profil och Anpassa MyFlove ligger längst ner (2026-08-27)",
      "Planering i två steg, förklarande rader på hemskärmens kort och i Mer-menyn (2026-08-27)",
      "Tydlig steg-för-steg-struktur i Min dag, QuickFlow och schemauppladdningen – numrerade steg, en sak i taget, allt går att fälla ihop (2026-08-27)",
      "Redigera tolkade lektioner direkt i förhandsvisningen – ändra dag, tid, namn och plats eller ta bort innan du sparar (2026-08-27)",
      "Förhandsvisning av uppladdat schema: tolkade lektioner visas per veckodag och tid, med markering av det som redan finns (2026-08-27)",
      "Uppladdat schema hamnar tydligt i ditt veckoschema i StudyFlow – med plats-indikator och genväg dit (2026-08-27)",
      "Fler filformat vid uppladdning i hela appen: PDF, bilder (även HEIC), textfiler och dokument – textfiler läses direkt och blir material till Flow (2026-08-27)",
      "Gemensam sanitizer för all appstatistik: bara korta tekniska etiketter släpps igenom – fritext, e-post, nummer och känsliga ord stoppas alltid (2026-08-27)",
      'Flow-knappen "Vad jag lärt mig" mäts nu anonymt – ett event per klick, utan några råvärden om dig (2026-08-27)',
      "MyFlove Insight visar dina egna insikter från din användning; demoprofiler ligger bakom ett explicit demoläge och tomläget förklarar lugnt när Flow behöver mer tid (2026-08-27)",
      "Lugnare Mer-meny: grupperad i Min profil, Anpassa MyFlove, Mina områden och Inställningar – med genvägar till hemskärmen och introduktionen (2026-08-27)",
      "Kvalitetssäkrad statistik: varje viktig handling ger exakt ett event, vy-event dubbelskyddas och känsligt innehåll filtreras alltid bort (2026-08-27)",
      "Energi och mående visar bara snabb incheckning och en länk till historiken – detaljerad batterivy finns på Mitt batteri (2026-08-27)",
      'Adminvyn visar "Senast aktiv" per konto – redan inloggade användare syns nu som aktiva även utan ny inloggning (2026-08-26)',
      "Egen morgon och egen kväll i Mitt batteri: du fyller i när morgonen startar, när dagen slutar och hur batteriet känns vid båda tidpunkterna – kurvan ankras i dina egna värden (2026-08-26)",
      '"Lägg till MyFlove på hemskärmen" finns nu även på Logga in- och Skapa konto-sidorna – och doldes tidigare felaktigt i förhandsvisning/helskärm (2026-08-26)',
      'Flow-knappen "Mitt batteri" leder till Mitt batteri-sidan i stället för dagens balans (2026-08-26)',

      'Lugnare energi och mående: snabb incheckning först (batteri + fem mående-val), historik bakom "Se min historik" (2026-08-26)',
      "Mitt batteri högst upp på Hem och alla länkar går direkt till Mitt batteri-sidan (2026-08-26)",
      '"Avsluta konto" finns bara längst ner under Inställningar, med bekräftelse (2026-08-26)',
      "Central appstatistik: gemensamt event-schema med sanerad payload – aldrig mående, medicin, belopp eller fritext (2026-08-26)",
      "Känslig data krypteras lokalt: energi, mående, medicin och ekonomi sparas med AES-GCM och nyckeln ligger icke-exporterbar i webbläsarens nyckellagring – vid utloggning raderas nyckeln (2026-08-26)",
      "MyFlove Clean-up 1.0: lugnare Hem med max sex block, kompakt dagsöversikt med hela dagen i Min dag, borttaget genvägsblock och tydligare roller för QuickFlow, Flow och Planering (2026-08-26)",
      'Ett onboardinglager i taget: Flow-frågan väntar tills introt är klart, "Hoppa över" går direkt till Hem och introt kan visas igen via Anpassa hemskärmen (2026-08-26)',
      "Utloggning rensar lokal användardata på enheten – privat data ligger inte kvar till nästa användare (2026-08-26)",
      'Mindre Flow på "Se Flow live": hero-scenen är nedskalad till 25 % av skärmhöjden (max 230 px) (2026-08-26)',
      'Flow svarar utan "invalid"-fel: kontext och samtalslängd kortas så anropet alltid godkänns (2026-08-26)',
      "Skrivfältet i Flow-chatten går att använda igen: Skicka-knappen låg ovanpå textrutan och blockerade tryck (2026-08-26)",
      "Lagom stor Flow i hela appen: mindre maskot i kortläget (Min dag, Flow-inställningar), i chattens rubrik och i välkomsthälsningen (2026-08-26)",
      "Flow mini är lite större: maskoten i Hem-rutan har fått ett litet storlekssteg upp så den syns bättre utan att överlappa text eller knapp (2026-08-26)",
      "Flow syns i mini-rutan: mini-läget använder nu en riktig liten maskotstorlek och döljer rekvisita så Flow syns tydligt utan överlapp (2026-08-26)",
      'Flow tar mindre plats på Hem: mini-maskoten är låst till en liten 56 px-yta så den inte kan överlappa text eller knappen "Prata med Flow" (2026-08-26)',
      'Flow är mindre på hemskärmen och "Prata med Flow" går direkt till chatten (2026-08-26)',
      'Material 3.5: pitchvideo med ny scen "Flow lever", Living Blueprint 3.5 och Pitchdeck 3.5 (2026-08-26)',
      "Flow följer chatten: andning, blink och blick ändras när du skriver, när Flow tänker och när svaret kommit (2026-08-26)",
      "Levande Flow: maskoten andas, blinkar i slumpad rytm, lutar sig mot pekaren och har en pulserande hjärtglöd – avstängt vid mindre rörelse (2026-08-26)",
      "Flow-chatten är kopplad till din profil: livsprofil, situation, hjälpnivå och sedda mönster ger mer personliga tips (2026-08-26)",
      "Flow-chatten fortsätter där du slutade: senaste samtalet öppnas automatiskt och påbörjad text sparas per samtal (2026-08-26)",
      "Prata med Flow: chatten nås nu från menyn Mer, översikten och direkt från Flow-kortet (2026-08-26)",
      "Hoppa över-knapp på startsidans intro – gå direkt till sista vyn utan att svepa igenom alla slides (2026-08-26)",
      "Installationsknappen finns nu även på startsidan innan man skapat konto – både högst upp och vid Möt Flow (2026-08-26)",
      "Installationsknappen finns nu även i menyn Mer så den går att nå från alla vyer – instruktionen visas i appen i stället för en popup och fungerar även med popup-blockerare (2026-08-26)",
      "Installationsknappen syns alltid under Flow när MyFlove inte redan är installerad – den använder riktig Android/Chrome-prompt när den finns och visar annars rätt menyinstruktion för iPhone/iPad eller övriga webbläsare (2026-08-26)",
      "Lägg till MyFlove på hemskärmen: tydlig installationsknapp på Hem med riktig prompt i Chrome/Android och Dela-instruktion på iPhone – döljs när appen redan är installerad (2026-08-26)",
      "Planering i bottennavet: genvägen öppnar planeringssidan med dagens ordning – Flow-hjälpen finns kvar som egen punkt i menyn (2026-08-26)",
      "Flow-inställningar synkas: hjälpnivå, tidsfönster, förvarning och prioriteringar sparas på ditt konto och följer med mellan mobil och dator (2026-08-26)",
      "Flow-inställningar: egen sida för hjälpnivå, tidsfönster för proaktiva meddelanden, förvarningstid och vilka typer av tider Flow ska prioritera (2026-08-26)",
      "Flow reagerar på din dag: prioriteringsförslag vid låg energi och full dag, förvarning cirka 30 minuter före viktiga tider med länk till rätt vy, och mjuka energianpassade reaktioner när du bockar av saker (2026-08-26)",
      "Flow och vädret: timprognosen används nu för att varna innan något utomhus hamnar i regn – med tid och paraplytips (2026-08-26)",
      "Flow som levande följeslagare: proaktiva påminnelser vid låg energi och full dag, regn innan du ska ut och förvarning innan du behöver göra dig klar – plus ett kort på Hem som visar vad Flow lärt sig om dig, och inställningar för Tyst/Diskret/Aktiv (2026-08-26)",
      "Export av adminstatistik: välj datumintervall och ladda ner anonym statistik som CSV eller PDF för egen analys (2026-08-25)",
      "Anonym appstatistik: admin visar nu nyckeltal (händelser per besökare, återkommande, dagligt bruk, dagliga loopen) helt utan personlig data – händelser kan inte kopplas till konton (2026-08-25)",
      "Marknadsscenen i videon och marknadssliden i decket har nu samma rubrik, texter och ordning – pitchsidan visar miniatyrer av båda (2026-08-25)",
      "Marknadsnyckeltal i pitchmaterialet: ny marknadsslide i pitchdeck 3.4, avsnitt 3.5 i blueprinten och en marknadsscen i pitchvideon – externa uppskattningar och prognoser med källnot (2026-08-25)",

      "Så funkar MyFlove: ny översiktssida som kort förklarar alla funktioner och vart du går – nås från Hem och menyn (2026-08-25)",

      "Pitchsidan 3.4: pitchvideon har miniatyrbild från Flow 2.0-scenen, decket visas med förhandsbild av titelsidan, versionsmärken och en genväg till Flow live (2026-08-25)",
      "Pitchvideon 3.4: Flow syns nu även i videon – stor karaktär i Flow 2.0-scenen och med i slutbilden (2026-08-25)",
      "Blueprint 3.4 och pitchdeck 3.4: Flow syns nu i dokumenten – på framsidan, i avsnittet om Flow i appen och som en egen slide i decket (2026-08-25)",
      "Blueprint 3.3, pitchdeck 3.3 och ny pitchvideo med egen Flow-scen – allt material speglar Flow i hela appen (2026-08-25)",
      "Morgonstart bor nu bland Rutiner & medicin – egen flik och eget avsnitt, gamla /morgonstart leder dit automatiskt och dubbletten i menyn är borttagen (2026-08-25)",
      "Flow överallt: Flow finns nu överst i alla vanliga vyer (att göra, kalender, medicin, barn, studier, jobb, träning, inköp m.fl.) och visar en kontext i taget – utan att dubbleras på Hem, Min dag, Flow-previewen, pitch eller admin (2026-08-25)",
      "Flow i appen: Flow finns nu på Hem och Min dag som en kontextuell följeslagare – han väljer en sak i taget utifrån medicin, väder, energi, barn och dagens nästa uppgift, har ny rekvisita (sol, solglasögon, medicinburk, vattenglas, tvättkorg, mini-Flows för barnen) och firar när du bockar av något. Flow-previewen är oförändrad (2026-08-25)",
      "Flow: automatiska tester (Vitest) säkerställer att exakt ett Flow-state visas åt gången och att varje situation ger rätt rekvisita och pose på mobilbredd – körs med npm run test (2026-08-25)",
      "Flow: riktiga karaktärsscener i /flow – Flow får paraply i regn, säng vid vila, kaffe vid paus, bok vid plugg, laptop vid jobb, dammsugare vid städning, kockmössa vid mat, bil vid resa, batteri vid låg/hög energi, konfetti när något blir klart och lugn andning vid återhämtning, med flera varianter per situation och utan intern scroll på mobil (2026-08-25)",
      "Flow: haptisk återkoppling vid vybyte – kort vibration när du swipar eller trycker dig till nästa vy, en liten stöt vid flödets kanter och en tydligare puls när något firas. Avstängt vid reducerad rörelse och tyst läge (2026-08-25)",
      "Flow 2.0: Flow är nu en stor levande karaktär som guidar dig en sak i taget – han byter pose, rekvisita och animation efter situationen (paraply när det regnar, bok vid plugg, kaffe vid paus, batteri vid låg energi, konfetti när något blir klart), har flera alternativa poser per situation och varje vy rymmer Flow, en kort text och en åtgärd utan scroll (2026-08-25)",
      "Förstasidan: Flow har levande kroppsspråk per vy – vinkar, studsar, nickar, funderar, pulserar, jublar och andas lugnt (respekterar reducerad rörelse) (2026-08-25)",
      "Förstasidan: Flow vid hälsningen är större och står nu bredvid pratrutan även på mobil, och Flow-bilden längst ner i visionsavsnittet är borttagen (2026-08-25)",
      'Förstasidan: den stora vinkande Flow står nu vid hälsningen "Hej, jag heter Flow" i stället för nertill vid telefonen. Pratbubblan är nu en rektangulär ruta som fyller bredden (under Flow på mobil, bredvid på desktop) (2026-08-25)',
      'Förstasidan: tydliga "‹ Tillbaka"- och "Nästa ›"-knappar längst ner på mobil, så du alltid kan byta vy med ett tryck om svepet inte fungerar (2026-08-25)',
      "Förstasidan: bakåtsvep på mobil använder nu fingrets senast säkra position även vid avbruten iOS-kantgest, faktisk dragsträcka prioriteras framför momentum och tröskeln är 28–72 px. Ett hydratiseringsfel som kunde återställa karusellen är också borttaget (2026-08-25)",
      "Förstasidan: bakåtsvep fungerar nu även när mobilens kantgest vill ta över, tröskeln är lägre (36–90 px) och pilknapparna syns även på mobil. Flow är större och vinkar som en hälsning när du kommer in (2026-08-25)",
      'Förstasidan minns nu vilken vy du är på i adressen (t.ex. /#flowplan) så att uppdatering, delning och bakåtknappen landar rätt. Svep och drag fick momentum med skärmanpassad tröskel, och karusellen har tydlig fokusmarkering, korrekt tabordning och läsbara etiketter som "FlowPlan – vy 8 av 10" (2026-08-25)',
      "Förstasidan (/) är nu ett interaktivt slide-flöde i stället för en lång scrollsida: tio vyer som byts en i taget med mjuka övergångar, svep i sidled, pilknappar, piltangenter/Home/End och prickar som visar var du är (2026-08-25)",
      "Flow-karusellen kan nu dras och svepas: spåret följer fingret eller musen i realtid, byter vy vid ungefär en femtedels bredd eller ett snabbt svep och fjädrar annars tillbaka. Vertikala drag skrollar sidan, reglagen påverkas inte, och kanterna har motstånd (2026-08-25)",
      'Flow-karusellen har fullt tangentbordsstöd: vänster-/högerpil byter vy, Home/End går till första/sista, karusellen har tydlig fokusring, fokus flyttas till den nya vyn och en live-region läser upp "Vy 2 av 4" (2026-08-25)',
      "Flow-karusellen ligger nu i en riktig horisontell rad: alla slides sitter sida vid sida i ett flex-row-spår där varje slide är exakt 100% brett, och spåret glider i sidled med en mjuk övergång. Yttre containern är låst med overflow-hidden så inget kan staplas vertikalt, och bara den synliga sliden nås av skärmläsare (2026-08-25)",

      "Flerdagsperioder (t.ex. semester med slutdatum) visas nu varje dag i perioden även i Hem, Dagens saker, Min dag och Allt i dagen – tidigare syntes de bara på startdagen (2026-08-25)",
      "Flow är nu sidans enda container: gamla vyflikar och vertikala dashboard-sektioner är borttagna från /flow, och exakt en aktiv state renderas åt gången med intro som state 0 (2026-08-25)",
      "Flow går nu att djuplänka: /flow?slide=3 (eller ett slide-namn) öppnar direkt rätt slide, och URL:en uppdateras när du swipar (2026-08-25)",
      "Flow är nu en robust state-baserad en-slide-vy: endast currentSlide renderas i DOM, vänster/höger-svep byter state och Flow-introt är state 0 i stället för ett separat block eller en CSS-karusell (2026-08-25)",
      "Flow visar nu sin version, build-id och om karusellen är horisontell längst ner på sidan, så att du direkt kan se att mobilen laddat rätt bundle (2026-08-25)",
      "Visuellt regressionstest för Flow: nytt Playwright-test kontrollerar karusellens geometri i 375, 390 och 414 px och jämför skärmbilder mot sparade baselines, så att framtida CSS-ändringar inte kan stapla sliderna vertikalt utan att det upptäcks (2026-08-25)",
      "Cache-busting: varje build har ett unikt id, gamla cacher töms och service workern uppdateras automatiskt så att publicerade /flow alltid laddar senaste versionen. Nytt E2E-test verifierar karusellen i 375px och 390px (2026-08-25)",
      "Flow på publicerad mobil: den driftsatta /flow-routen låg på en äldre bundle utan karusellens CSS. Tracken är nu flex-row nowrap och varje slide är låst till exakt 100% bredd med flex-basis, horisontell touch-scroll och snap (2026-08-25)",
      "Flow-karusellen är nu tekniskt låst i sidled med en 100%-kolumn per slide, touch-swipe och snap. Den separata intro-wrappern är borttagen så Flow-presentationen alltid är slide 1 i samma karusell (2026-08-25)",
      "Flow visar nu en slide i taget i en horisontell carousel – Flow presenterar sig först, sedan energi, förslag och återhämtning. Svep på mobil, pilar och punkter på desktop, och inget staplas vertikalt längre (2026-08-25)",
      "Flow 2.0: Flow har en egen startsida med hälsning, kort introduktion första gången och en svepbar upplevelse där Flow visar en sak i taget – incheckning, energi, förslag eller återhämtning – och väljer själv vad som är mest relevant utifrån befintlig Flow-logik och data (2026-08-25)",
      "Startsidan: Flow reagerar nu subtilt när du interagerar – telefondemons uppgifter kan bockas av med korta Flow-svar, de flytande korten ger egna reaktioner och tidslinjen har en kort mikroreaktion per punkt (2026-08-25)",
      'Flow är nu MyFloves officiella maskot med en fast visuell referens och en gemensam komponent, och den publika startsidan är omgjord till en levande presentation med telefonpreview, interaktiv "Vad behöver du just nu?", Dagens Flow, FlowScore som belastning och en animerad dag – utan påhittade användarsiffror (2026-08-25)',
      'Snabbchecken på Hem: ny "Logga"-knapp som sparar både mående och energi direkt med ett tryck, utan att något mer behöver väljas. Rubrikknappen heter nu "Mer" och visar genvägarna till Mående, Energi och Anteckning (2026-08-23)',
      "Medicinnotisen kl 10:00 spårad och åtgärdad: den kom från en gammal Elvanse-post kl 10:00 i medicinlistan (utöver den aktuella kl 11:30) – inte en förvarning, tidszonsbugg eller standardtid. De köade notiserna för den gamla posten är avbokade (2026-08-23)",
      "Blueprinten går att ladda ner direkt i appen: adminsidan /pitch listar version 3.2, 3.0, 2.9 och 2.8 med en knapp för DOCX och en för PDF per version (2026-08-22)",
      "Living Blueprint 3.2: dokumentet är omstrukturerat i sex delar med innehållsförteckning och läsanvisning, funktionskartan speglar nuläget och versionshistoriken är uppdaterad till 3.2 (2026-08-22)",
      'Ny adminskyddad sida "/pitch" där pitchvideon spelas upp direkt i appen och pitchdecken laddas ner (PowerPoint 3.2 och PDF 3.0), nåbar via knappen "Pitchmaterial" på adminsidan (2026-08-22)',
      "Ny pitchvideo (16:9, ca 34 s) och nytt pitchdeck 3.2 med berättelsen problem, insikt, produkt, daglig loop, varför nu och vision – i MyFloves lila designspråk (2026-08-22)",
      'Ny introvideo "Första blicken" (42 s, vertikal) för nya användare – från igenkänning till uppmaningen att ladda ner MyFlove (2026-08-22)',
      "Hem: dagens rutiner och mediciner är sammanslagna i ett gemensamt, minimerbart block längst ner på Hem, avcheckningsbart med ett tryck och sorterat efter klockslag. Samma befintliga rutin- och medicindata, inga dubbletter (2026-08-22)",
      'Medicin: nytt kompakt, minimerbart Hem-block "Dagens medicin" med ett-tryck-avbockning (Tagen/Ej tagen) för dagens och närmast kommande dos. Samma befintliga medicindata och logg som i Rutiner & medicin, ingen ny modell, route eller dubblett (2026-08-22)',
      'Hem: "Energins historik" renderas nu direkt under "Mitt energibatteri" i Hem-layouten (före "Nästa" och "Vad behöver du just nu?") genom uppdaterad blockordning och engångsmigrering. Samma befintliga komponent och energidata, inga nya modeller eller routes (2026-08-22)',
      'Hem: "Energins historik" visas som eget block direkt under Mitt energibatteri med samma energidata och trendindikator, och alla Hem-sektioner kan minimeras/expanderas med sparat läge. De fyra snabbalternativen ligger i en gemensam minimerbar sektion och är oförändrade (2026-08-22)',
      "Utvecklingsläge – ny sida /dev-session i previewen skapar en testsession automatiskt så att klickflöden på Hem kan QA:as utan lösenord. Blockerad i publicerad app (2026-08-22)",
      'Hem: det separata blocket "Jag gjorde något" är borttaget – funktionen ligger kvar i snabbalternativet "Jag gjorde redan något". Mitt energibatteri är kompakt som standard och kan valfritt expandera samma energihistorik som Min energi (2026-08-22)',
      'Hem städas – "Lägg till det du gjorde" visas inte längre som separat block på Hem. Funktionen finns kvar bakom snabbalternativet "Jag gjorde redan något" i samma modal och aktivitetsmodell. De fyra snabbalternativen är oförändrade (2026-08-22)',
      "Bättre delning och SEO – alla publika sidor har titel, beskrivning, canonical och ett socialt delningskort med ny förhandsbild (2026-08-22)",
      'Lugnare Hem – de fyra snabbalternativen ("Vad behöver du just nu?") ligger högt upp och är oförändrade, medan de överlappande blocken snabbknappen "Jag gjorde något", snabbfältet "Lägg till" och panelen "Lägg till det du gjorde" är dolda som standard. De går att slå på igen i Anpassa hemskärmen och befintliga layouter påverkas inte (2026-08-22)',
      '"Jag gjorde redan något" i situationskortet öppnar nu samma "Jag gjorde något"-modal som resten av appen, i stället för att länka till energihistoriken. Samma registrering, samma genomförda aktivitet, inga dubbletter (2026-08-26)',
      "Lugnare första 30 sekunder – batteriet svarar i klartext (Du har medelbra energi – den är på väg upp, starkast kl 14–16) med minikurvan alltid synlig, Hem startar med färre block, Korta vägar har blivit Vad behöver du just nu? med fyra situationer och introt är nedkortat till två kort (2026-08-22)",
      "Tydligare energistruktur – Mitt energibatteri är din nivå just nu, Min energi blir historik och mönster (nås under Mina mönster i Mer, routen fungerar som förut) och Dagens balans förklaras i klartext som match mellan dagens krav och din kapacitet. Undertexter på Hem för Lägg till, Jag gjorde något och QuickFlow, och Jag gjorde något kan inte längre visas dubbelt (2026-08-25)",

      "Planera min dag tillbaka – Planera kan föreslå en ordning på dagens uppgifter (tid, ork, svårighetsgrad), du kan flytta stegen själv och den valda ordningen visas som Dagens ordning i Min dag. Jag gjorde något syns nu bland dagens gjorda saker i hela appen (2026-08-25)",
      "Enklare språk i hela appen – navigationen är Hem, Min dag, QuickFlow, Planera och Mer, och interna produktnamn är utbytta mot vardagliga ord (Dagens balans, Min energi, Ändra planen, Mina mönster, Svårighetsgrad, Studier, Studiehjälp, Jobb). Bara språk och rubriker – ingen funktionalitet ändrad (2026-08-25)",
      "En logg per dag för mående och energi – ändringar av dagens värden uppdaterar samma post i stället för att skapa nya loggrader, även vid snabba upprepade sparningar (2026-08-21)",
      "Mående och energi som 1–10-sliders – ❤️ Hur är det just nu? på Hem har mjuka sliders 1–10 för mående (😞 → 😍) och energi (🪫 → 🔋) med tydligt värde (t.ex. 7/10). Två separata värden som sparas med datum och tid och används likadant i Hem, ❤️ Idag och Flow (2026-08-21)",
      "Snabb registrering av mående och energi – ❤️ Hur är det just nu? på Hem och i ❤️ Idag: ett tryck för mående (😞–😍) och ett tryck för energi (🔋 1–5), två separata värden som går att ändra under dagen och som visas likadant i båda vyerna (2026-08-21)",
      "Minimering som genomgående UX-princip – större informationssektioner på Hem, i Flow, ❤️ Idag och Min livsprofil kan minimeras med samma pil, animation och sparade läge. Bara presentation – data, status och avbockning påverkas inte (2026-08-21)",
      "Minimerbara sektioner tillbaka – 🕒 Under klockslag, 🌿 Under dagen och ☑️ Genomfört idag går åter att minimera/expandera med samma stil som resten av appen. Valet sparas och påverkar varken data eller avbockning (2026-08-21)",
      'Tillgänglighet i kalendern – växlaren 📅 Tidslinje | ✨ Allt i dagen använder nu `role="tablist"` / `role="tab"` med `aria-selected` och rätt `tabindex`, så skärmläsare ser vilket läge som är aktivt (2026-08-21)',
      "Tidslinje eller Allt i dagen – ✨ Allt i dagen är nu ett eget visningsläge i kalendern (📅 Tidslinje | ✨ Allt i dagen) i stället för en extra lista under kalendern, så inget visas dubbelt. Avbockning synkas som vanligt med ❤️ Idag, Hem och Att göra (2026-08-21)",
      "Blueprint, video och pitchdeck 3.0 – Living Blueprint 3.0, uppdaterat pitchdeck och ny marknadsföringsvideo som speglar ❤️ Idag, ✨ Allt i dagen, QuickFlow och Mitt batteri (2026-08-25)",
      "Smala mobilskärmar – Kalender, ❤️ Idag och inloggningen håller ihop ner till 320 px: knappraden radbryts, topplisten har fast plats för tillbaka/titel/Minimera och inget klipps av (2026-08-21)",
      "Startsidan i mobil – mindre hero-rubrik, mjukare bakgrundsbubblor och luftigare sektioner på små skärmar (2026-08-21)",
      "✨ Allt i dagen i kalendern – en utökad vy som visar hela dagen: tidsatta saker under klockslag och resten under 🌿 Under dagen, både planerat och genomfört, med samma data och samma bock som Idag, Hem och Att göra. Klockordning som håller, direkt uppdatering vid avbockning valet sparas per datum och vyn fungerar för valfri kalenderdag (2026-08-25)",
      'QuickFlow fångar klockslag – "idag", "ikväll" och rena klockslag tolkas rätt, uppgifter behåller sin tid och syns under 🕒 Under klockslag i ✨ Allt i dagen och i ❤️ Idag (2026-08-21)',
      "Avbockat idag stannar kvar under Genomfört idag – uppgifter och tankar utan datum försvinner inte längre när du bockar av dem (2026-08-24)",
      "Min dag och Daily Flow är sammanslagna till ❤️ Idag – en vy för dagen med två lägen: 🌊 Flow och 📋 Lista (2026-08-23)",
      "Allt som kan genomföras kan bockas av – uppgifter, händelser, påminnelser, rutiner, lektioner, barnens hållpunkter och QuickFlow-tankar delar samma bock och samma status i hela appen (2026-08-22)",
      "Genomfört idag – Hem och Min dag visar även vad du faktiskt har gjort, inte bara det som är kvar (2026-08-22)",
      "Livsområden har egna färger som visar område, aldrig status: Vardag, Privat, Barn, Studier, Jobb, Hälsa, Ekonomi, Socialt och Egen tid (2026-08-22)",
      "Dagens uppgifter på Hem och i Flow → Idag – bocka av dagens uppgifter (även de QuickFlow strukturerat) direkt från hemskärmen, med samma status i Min dag och Att göra (2026-08-21)",
      'QuickFlow sparar på riktigt – "Godkänn allt" och "Spara bara texten" hann tidigare inte spara innan rutan stängdes; nu landar uppgiften, inköpet eller tanken direkt i rätt vy (2026-08-21)',
      "Min livsprofil – en enda profil som ersätter Min jobbprofil och Min studieprofil: livssituation (flera samtidigt), anpassade följdfrågor, styrkor, svårigheter, stödbehov, vad som ger och tar energi samt hur du vill att Flow hjälper dig. Gammal profildata migreras automatiskt och Flow använder profilen som kontext (2026-08-20)",
      "Dubblettskydd i databasen – samma aktivitet med samma riktning inom samma minut sparas bara en gång, även om två flikar sparar samtidigt (2026-08-20)",
      "Säkrare sparning av energiposter – följer inloggningen direkt, dubbeltryck skapar inte dubbletter och en misslyckad ändring återställs i stället för att visa fel läge (2026-08-20)",
      "Snabbknapp ➕ Jag gjorde något på Hem – alltid synlig under Mitt batteri, sparar en vardagshändelse på 3–5 sekunder med frivillig friktion efteråt (2026-08-20)",
      "Lägg till det du gjorde – ett tryck för vardagssaker som middag, tvätt, undanplock eller barnens dusch, med val av när det hände, fritext och röstinmatning där mobilen stödjer det (2026-08-21)",
      "Energi in/ut per aktivitet – 🔻 tar energi, 🔺 ger energi, ➖ neutral, alltid ändringsbart efteråt (2026-08-21)",
      "Friktion är en egen dimension – hur svårt något är att komma igång med räknas separat från hur mycket energi det kostar (2026-08-21)",
      "Dagens energiflöde – Planerat, Vardag, Spontant och Återhämtning med netto för dagen, så att en tom kalender inte längre ser ut som en lätt dag (2026-08-21)",
      "Faktisk belastning räknas i FlowScore – allt du registrerat under dagen väger in, inte bara det som stod i kalendern (2026-08-21)",
      "Nytt mönster: Tungt att komma igång med – visar sådant som har hög friktion trots låg energikostnad (2026-08-21)",
      'En enda förslagskälla – Hem, Min dag och Flow → Nu använder samma motor och ger samma svar. Kortet "Dagens fokus" och den extra energimeningen på Min dag är borttagna (2026-08-20)',
      'Ett namn på varje sak – "Daily Flow", "Vad ska jag göra nu?" och "Dagens fokus" är borta ur gränssnittet, och Daglig rutin heter nu Rutiner & medicin (2026-08-20)',
      "En väg in till Energiflöde – finns bara i Må bra, inte längre även under Hälsa och Avancerat (2026-08-20)",
      "Anpassa hemskärmen är tillbaka – slå av/på och sortera blocken på Hem och välj dina fyra egna genvägar, sparat i molnet (2026-08-20)",
      'Ett samlat Flow – tre lager: Nu (ett tydligt förslag), Idag (dagens belastning och omplanering) och Hjälp (Flow-chatten). FlowPlan och "Vad ska jag göra nu?" är sammanslagna i Flow, tekniska mått ligger under Mer → Avancerat (2026-08-21)',
      "Min dag är appens kärna – dagens tidslinje, Mitt batteri, snabb ＋ Lägg till, dagens energibalans i klarspråk och ett enda Flow-förslag på samma skärm (2026-08-20)",
      "Enklare huvudnavigation – fem ingångar: Hem, Min dag, QuickFlow, Flow och Mer, med Mer grupperat i Min dag, Flow, Studier, Jobb, Familj, Hemma, Resor, Insights och Inställningar (2026-08-20)",
      "Mitt batteri – levande energibatteri i kalendern och på hemskärmen med nivå nu, riktning, starkaste och lägsta period, kurva över dagen och förslag på placering och återhämtning (2026-08-20)",
      "Dagen just nu på hemskärmen – dagens tidslinje med hållpunkter, uppgifter, rutiner och medicintider, med markering för var på dagen du är (2026-08-20)",
      "Medicinpåminnelser bor i Påminnelser – lägg till, ändra och bocka av mediciner på samma sida som övriga påminnelser (2026-08-20)",
      "Snabbknapp för Att göra på hemskärmen – stor ＋ Lägg till-knapp högt upp som skapar en uppgift på sekunder, frågar direkt om energi och föreslår en tid uppåt till närmaste kvart, med aktuellt rum förifyllt (2026-08-20)",
      "Ingen Sätt dagens fokus-knapp på hemskärmen – Daily Flow visar bara det som finns, fokus sätts via Flow eller FlowPlan (2026-08-20)",
      "Att göra är din dagliga agenda – flikarna Idag, Kommande och Klart, snabbtillägg med när/energi/friktion, förslag från Flow och en frivillig energifråga när du bockar av (2026-08-20)",
      "Anteckningar & idébank har en egen del under Flow – öppna Anteckningar direkt från Mer-menyn, Quickflow länkar dit (2026-08-19)",
      'Flytta en anteckning tillbaka till Quickflow – knappen "Tillbaka till Quickflow" gör anteckningen till ett aktivt flow-block igen (2026-08-19)',
      "Idébanken bor i Anteckningar – gamla idéer från Quickflow flyttas automatiskt in bland dina anteckningar (2026-08-19)",
      "Flytta befintliga tankar till Anteckningar – tryck på anteckningsikonen på en sparad Quickflow-tanke så flyttas den till Anteckningar (2026-08-19)",
      "Redigera och radera anteckningar – ändra text och livsområde direkt i listan, eller ta bort med ångra-knapp (2026-08-19)",
      'Spara direkt som anteckning från Quickflow – välj "Spara som anteckning" i Kom ihåg-rutan så hamnar tanken bland dina anteckningar (2026-08-19)',
      "Medicinpåminnelser på förstasidan – alla dagens kvarvarande doser visas högt upp på hemskärmen och kan bockas av med ett tryck (2026-08-19)",
      'Ett sammanhängande Daily Flow-kort – Ditt fokus idag och dagens viktigaste sitter ihop i samma kort med "Resten av dagen" direkt under fokuslistan (2026-08-19)',
      "Inga dubbletter på hemskärmen – en sak som redan ligger i Ditt fokus idag eller som dagens fokus upprepas inte i listan under (2026-08-19)",
      "Daily Flow och Dagens viktigaste är ett och samma block – incheckning, Ditt fokus idag och dagens viktigaste ligger nu tillsammans på hemskärmen (2026-08-19)",
      "Framtida saker stannar på sin dag – hemskärmen visar bara det som gäller idag eller saknar datum, resten dyker upp när det är dags (2026-08-19)",
      "Energiflöde har en egen ingång i Hälsa – öppna det direkt från Mer-menyn, vid sidan av Må bra, Träning, FlowScore och Statistik (2026-08-19)",
      "Barn finns som eget livsområde – välj Barn när du lägger till eller ändrar en sak i Att göra, precis som Vardag, Privat, Studier och Jobb (2026-08-19)",
      "Energiflöde som egen rubrik under Må bra – ligger nu som en egen hopfällbar sektion i Alla-vyn, bredvid Mående och Energi (2026-08-19)",
      "Stop-samtal sparas – chattarna från Stop-knappen hamnar bland dina Flow-samtal och går att läsa igen (2026-08-18)",
      "Uppgifter försvinner inte längre vid synk – en tom lista kan inte längre skriva över dina sparade uppgifter i molnet (2026-08-18)",
      "Flow svarar igen när du startar ett nytt samtal – frågan skickas klart innan sidan byter till chatten (2026-08-18)",
      "Städlistan går att anpassa – lägg till egna steg och ta bort dem du inte behöver, per rum och läge (2026-08-18)",
      "Min situation ligger som ett eget kort högst upp i Mer-menyn och visar vilka situationer som är aktiva (2026-08-18)",
      "Kalendern finns i bottenmenyn och de två fria platserna i navet byter du själv under Mer – hemskärmen anpassas som förut (2026-08-18)",
      "Adminvyn visar namn, senaste besök och senaste inloggning per användare, med filter på datumintervall och sortering på namn/besök/inloggning/skapad. Besök kopplas nu till inloggat konto (2026-08-18)",
      "Städad kodbas – all formatering enhetlig och alla lintanmärkningar åtgärdade, utan att något i appen ändrats (2026-08-18)",
      "Snabbare sidladdning – molnsynken hämtar inloggningen en gång i stället för en gång per inställning, vilket tar bort över hundra onödiga nätverksanrop per sida (2026-08-18)",
      "Aviseringar för aktiva påminnelser – notis när tiden är inne, med valfri förvarning (5–60 min) och stöd för upprepning. Push når dig även när appen är stängd, och avbokade påminnelser är tysta (2026-08-18)",
      "Sidan Påminnelser – lägg till, ändra och avboka påminnelser med datum, tid och anteckning. Tydlig status Aktiv/Avbokad, och avbokade går att aktivera igen eller ta bort (2026-08-18)",
      "Gamla påminnelser borttagna – inaktuella notiser (Elvanse 12:15 och 11:30, gammal morgonmedicin, vatten 05:00/05:05 med daglig upprepning och en testnotis) är avbokade. Aktuella mediciner och påminnelser är orörda (2026-08-18)",
      "GitHub-issues från Utvecklarchecklista 2.9 – 70 färdiga issues med rubrik, beskrivning och acceptance criteria, som markdown, JSON och importskript (2026-08-18)",
      "Utvecklarchecklista utifrån Blueprint 2.9 – ett avsnitt per kapitel med avbockningsbara delmoment och status (2026-08-18)",
      "Blueprint 2.9 – nytt kapitel om material och kommunikation, städad kapitelordning och versionshistorik, som DOCX och PDF (2026-08-19)",
      'Pitchdeck som nedladdningsbar PDF (20 sidor) med sammanfattningssidan "MyFlove i korthet" (2026-08-19)',
      "Pitchdeck 2.8 – nya skärmbilder från den lila appen, Familj utbytt mot Relationer och tydliga platshållare för testarcitat (2026-08-19)",
      "Marknadsföringsvideo 2.8 – nya scener för Min situation, Relationer och FlowPlan som förslag. Blueprint 2.8 och uppdaterat pitchdeck (2026-08-19)",
      "FlowPlan är ett förslag först – flytta uppgifterna upp/ner med pilarna, säg ja till ordningen eller be Flow föreslå på nytt. Din ordning sparas och går att återställa till Flows förslag (2026-08-19)",
      "Ändra eller ta bort från alla vyer – uppgifter, påminnelser, QuickFlow-tankar och rutiner kan justeras (text, datum, tid, sluttid, livsområde, anteckning) eller tas bort direkt i Min dag, hemskärmen, kalendern och flödeskorten (2026-08-19)",
      "Förslagen följer din situation direkt – aktiverar, pausar eller byter du situation uppdateras Flow-förslagen och QuickFlow-sorteringen omedelbart, med aktiva situationer överst och det som vilar sist (2026-08-18)",
      "Min situation – välj vilka livssituationer som pågår just nu (jobb, studier, föräldraledig, sjukskriven, arbetssökande, mellan arbeten, annat). Flera kan vara aktiva samtidigt, jobb och studier öppnar sina profiler, och pausade situationer behåller all information (2026-08-18)",
      'Gamla Familj-objekt mappas automatiskt till Relationer – uppgifter, kalenderhändelser, påminnelser och QuickFlow-regler behåller sitt sammanhang och kalenderfiltret "Familj" heter nu Relationer (2026-08-19)',
      "Relationer – välj själv vilka relationstyper (partner, barn, familj, vänner, anhöriga, husdjur, annan viktig person) och personer som finns i ditt liv. Flow föreslår kopplingen i Quickflow, tar med den som kontext i uppgifter, kalender och påminnelser, och du kan logga om en relation gav eller tog energi (2026-08-19)",
      "Flashcards och quiz anpassade efter studieprofilen – Flow väljer betoning och mängd utifrån dina stödbehov och preferenser, visar vad som styr och låter dig byta mellan balanserat, mest flashcards eller mest quiz (2026-08-18)",
      "Min studieprofil – ålder, nivå, årskurs, program, kurser, studietakt, distans/på plats, stödbehov och hur du lär dig bäst. Flow anpassar quiz, flashcards, sammanfattningar och studieplaner efter profilen och väger den mot FlowScore, energi och kalendern (2026-08-18)",
      "Min jobbprofil – berätta frivilligt yrkesroll, bransch, ansvarsområden, arbetstider och vad du vill ha hjälp med. Flow använder det som kontext för jobbförslag och väger arbetsdagens krav mot energi och resten av livspusslet (2026-08-18)",
      'Ångra hanterade QuickFlow-tankar – råkar du trycka "Hanterad" visas tanken under "Nyligen hanterade" i 24 timmar, och du kan återaktivera den med ett tryck (2026-08-18)',
      "Nyligen hanterade syns även när allt är hanterat – ångra-sektionen dolde sig tidigare om alla QuickFlow-tankar var klarmarkerade, nu visas den så länge det finns något att ångra (2026-08-18)",
      "Hanterad – göm den: vilande QuickFlow-tankar göms automatiskt tills tiden är inne och kan markeras som hanterade med ett tryck (2026-08-18)",
      "Sparläge för Återkom senare – välj när tanken ska dyka upp igen (i kväll, imorgon bitti, om 3 dagar, nästa vecka eller eget datum och tid). Den ligger kvar som vilande och tidpunkten går att ändra (2026-08-18)",
      "QuickFlow: Vart ska det här hamna? – alla val på ett ställe: uppgift, kalender, påminnelse, barn, familj, studier, jobb, hemma, hälsa, ekonomi, inköp, anteckning, energifaktor, återkom senare eller ta bort. Barn är ett eget livsområde och Flow föreslår vilket barn det gäller (2026-08-18)",
      "Omvandla till … på anteckningar – en tydlig knapp där du väljer uppgift, kalenderhändelse eller energifaktor, justerar detaljer och bekräftar innan något sparas (2026-08-18)",
      "Spara som anteckning i QuickFlow – fånga först, bestäm sen. Anteckningar har ingen deadline och kan senare bli uppgift, kalender, påminnelse, inköp, studier, jobb eller energifaktor när du bekräftar (2026-08-18)",
      "Färdiga regelmallar i QuickFlow – boka, köpa, handla, påminn, ring, betala, idé och träffa. Lägg till direkt eller anpassa ord, destination, livsområde och klockslag först (2026-08-18)",
      'Egna sorteringsregler i QuickFlow – bestäm själv att "köpa …" går till inköpslistan och "boka …" till kalendern, med valfritt livsområde och klockslag (2026-08-18)',
      "QuickFlow sorterar till alla delar – inköpslista, kalender, att göra, påminnelse eller idébank, med förslag på vart tanken hör hemma (2026-08-18)",
      "Inställningar för energipåverkan – stäng av påverkan helt, sätt en samlad vikt och justera vikten för varje energifaktor oberoende (2026-08-18)",
      "Energiflöde – registrera vad som ger och tar energi (sömn, socialt, ljud, stress, egentid). Dagens balans vägs in i FlowScore, du väljer själv hur mycket den får påverka, och mönster över tid visar vad som återkommer (2026-08-19)",
      'Ändra barn i en sammanfogad händelse i efterhand via knappen "Ändra barn" (2026-08-18)',
      "Flera barn i samma händelse – välj både Bella och Bianca vid lämning, en händelse och en påminnelse men syns i båda barnens schema (2026-08-18)",
      "Ändra allt i efterhand – titel, datum, tid, sluttid, påminnelse, livsområde och anteckning går att justera på allt du lagt in manuellt (2026-08-19)",
      'Snabbval direkt i notisen – tryck "Klart" eller "Skjut upp 10 min" i påminnelsen utan att öppna appen (2026-08-19)',
      "Anteckningar på uppgifter och kalenderhändelser – skriv fritt vad det gäller, adress eller vad du behöver ta med (2026-08-18)",
      "Notiser kommer även när appen är stängd – push-prenumerationen förnyas vid varje appstart och uppdateras automatiskt om webbläsaren byter nyckel (2026-08-18)",
      "Tider för personliga puffar sparas igen – morgonpuff, kvällspuff och Morgonstart behåller tiden du väljer (2026-08-17)",

      "Resor och familjekalender fungerar igen – riktiga avgångar i realtid, och familjens kalender/inköp sparas i molnet igen (2026-08-17)",
      "Tydlig regelmotor för Ditt fokus idag – klart och undanstoppat göms, automatiska poster styr inte dagen, passerat och dagens datum visas, framtida datum väntar och saker utan datum kan alltid göras (2026-08-17)",
      "Ditt fokus idag visar bara dagens saker – uppgifter med framtida datum syns inte i hemskärmens fokus, utan dyker upp först när dagen är inne (2026-08-17)",
      "Framtida datum stannar i framtiden – något du lägger in den 25 augusti syns inte i dagens vy, utan under Snart/Senare (2026-08-17)",
      'Heldag som standard i QuickFlow – datum utan klockslag blir heldag, och vid otydlighet ("kl 3", "fredag") frågar Flow i stället för att gissa (2026-08-17)',
      'QuickFlow läser datum i texten – "läkartid den 25 augusti" hamnar på 25 augusti, inte idag (2026-08-17)',
      "Behaglig väckning – mjuk, stigande klockklang när du öppnar Morgonstart, rundare vibrationer och lugnare texter (2026-08-17)",
      'Morgonstart – för den som snoozar bort alarmet: mjuka puffar som trappas upp och följer upp tills du säger "Jag är vaken" eller kryssar ett litet morgonsteg (2026-08-17)',
      "Ny marknadsföringsvideo renderad i MyFloves lila designspråk – 2:27 min översikt av hela appen (2026-08-17)",
      'Omplanering när kapaciteten är låg – Min dag föreslår en mindre dag ("Gör dagen lättare" eller "Bara det nödvändigaste") och flyttar resten till "Resten kan vänta" i stället för att kräva mer av dig (2026-08-17)',
      'Ett gemensamt språk för allt i livet – uppgifter, deadlines, lektioner, barnens dag, rutiner och tankar visas med samma fem saker: livsområde, när, prioritet, energibehov och nästa steg. Min dag samlar dem från hela appen och visar det som ryms i din kapacitet, resten ligger kvar under "Resten kan vänta" (2026-08-17)',
      "Brödsmulor och tillbaka-knapp på Flow-sidan – du ser sökvägen Hem › område › plats › Flow och kommer tillbaka med ett tryck (2026-08-17)",
      "Flow-sidan visar vilket livsområde du är i och ger genvägar dit du oftast ska härnäst – utan nya menyval (2026-08-17)",
      "Enklare navigation – fem fasta vägar (Hem, Min dag, QuickFlow, Flow, Mer), ny sida Min dag och en lugn Mer-vy med sök och kategorier (2026-08-17)",
      "Smart framförhållning – påminnelser flyttas automatiskt tidigare om du brukar bli sen, eller senare om du brukar vara tidig, per typ av hållpunkt (2026-08-17)",
      "Notiser för barnens hållpunkter – skolschema och aktiviteter påminner innan de börjar, med valfri morgonöversikt över hela barnens dag (2026-08-17)",
      "Barnens skolschema och aktiviteter räknas som hållpunkter i livspusslet – dagen visar hur bunden den faktiskt är (2026-08-17)",
      'Insight-strategier kan slås på direkt – knappen "Slå på åt mig" ställer in lugna färger, symbolstöd, enkla ord eller förenklad vy (2026-08-17)',
      "Lugnt förslag om att dölja hemskärmsblock du inte öppnat på tre veckor – helt lokalt och alltid möjligt att ångra (2026-08-17)",
      "QuickFlow sorterar tankar till rätt livsområde – Vardag, Privat, Studier eller Jobb – och tanken blir en uppgift i rätt rum direkt (2026-08-17)",
      "Rutiner, medicin, träningspass och steg räknas i kvällens Flow Reset – dagen är mer än avklarade uppgifter (2026-08-17)",
      "Gårdagens Flow Reset sätter startläget för dagen – kaos igår ger en lugnare förmiddag, en bra dag ger lite mer utrymme (2026-08-17)",
      "Rörelse höjer kapaciteten – steg och genomförda pass syns som en egen signal i FlowScore (2026-08-17)",
      "Stopp-knappen visar hur mycket som finns kvar av månadens budget och kan parkera köpet i inköpslistan i stället (2026-08-17)",
      "Energikartan lär sig ditt dygn – FlowScore vet nu när du brukar ha svacka eller topp och anpassar planen därefter (2026-08-17)",
      "Friktionsbiblioteket föreslår friktionsvärde på uppgifter i WorkFlow och StudyFlow – du slipper gissa hur tungt något är (2026-08-17)",
      "Vädret påverkar planeringen – Promenadvägar föreslår inomhus vid hårt väder och Nästa lektion lägger på marginal när det regnar eller snöar (2026-08-17)",
      "Bokad tid räknas bort – möten och lektioner dras från dagens fokustid, så FlowScore visar de minuter som faktiskt är dina (2026-08-17)",
      "Livspusslet – nytt block högst upp på hemskärmen som visar hur dagens delar hänger ihop (energi, deadlines, familj, jobb, studier) och erbjuder att flytta resten till imorgon när kapaciteten är låg (2026-08-17)",
      "Flow ser hela livspusslet – varje samtal utgår nu från FlowScore, energi, mående, deadlines per livsområde och dagens hållpunkter, och kan prioritera, dela upp och lägga om planen utan skuld (2026-08-17)",
      "Stopp-knappen har fått ett känslosteg (stressad, trött, arg, ledsen, taggad, vet inte) som skapar ett mellanrum mellan känsla och handling (2026-08-17)",
      'Bara en "Vad ska jag göra nu?" på hemskärmen – dubbletten inne i Daily Flow är borttagen, kortet högst upp leder till hela vyn (2026-08-16)',
      "Uppdaterad appikon och PWA-ikoner – favicon och alla installerbara ikoner matchar den nya MyFlove-loggan (2026-08-16)",
      '"Sätt dagens fokus"-knappen på hemskärmen håller texten inom kanterna med samma MyFloveLinkButton-stil som resten av appen (2026-08-16)',
      "Tydligare hjärta i Daily Flow – cremefärgad bakgrundscirkel, bättre placering och skugga så det syns mot gradienten (2026-08-16)",
      "Enhetliga emojis och animationer i hela appen, och knapptexter som alltid får plats – knappar växer i höjd i stället för att klippa av text (2026-08-16)",
      "Living UI på resten av appen – assistenten, FlowPlan, Träning, Studier, StudyFlow, Pomodoro, Må bra, Energikartan, FlowScore, Veckans Flow, Statistik, Belöningar, Promenadvägar, Familj, Städning och Veckomatlistan följer nu samma rörelsetema, plus levande tomma lägen (2026-08-16)",
      "Living UI i fler moduler – fokusläget andas och firar klart, WorkFlow visar energi och hur MyFlove tänker vid uppdelning, dokument/material visar läsprocessen, notiser visar att MyFlove lyssnar, och uppgifter glider mjukt iväg när de flyttas till imorgon (2026-08-16)",
      'Living UI – varje funktion har egna små animationer: MyFlove "tänker" i Vad ska jag göra nu, QuickFlow visar att den lyssnar, Resor ritar en rutt framåt, Ekonomi visar balans, Insight samlar punkter till ett mönster, Flow Reset tänder stjärnor och hjärtat slår i takt med din energi (2026-08-16)',
      "Gemensamt designsystem – återanvändbara MyFlove-komponenter (kort, knappar, sidhuvud, chips, empty states, loading, modal) och en fast emoji-mappning som gäller i hela appen (2026-08-16)",
      'Uppgifter, Flow Reset och Insight följer nu samma pastelldesign – hero med emoji, rundare kort, lavendelpiller och tydligare "Nu"-markering i dagsvyn (2026-08-16)',
      'Fokusläget har fått en stor ringtimer med start/paus i mitten, plus "Ta paus" och "Klar" (2026-08-16)',

      '"Din kapacitet idag" visar energi och belastning som prickskalor, och "Ditt fokus idag" numrerar dina tre första steg i pastell (2026-08-16)',
      '"Vad ska jag göra nu?" avslutas med ett litet tips i stället för fler krav (2026-08-16)',
      "Designtokens för palett, rundningar, avstånd, skuggor och kantlinjer – nya komponenter följer designen automatiskt (2026-08-16)",
      "Pastellikoner och emoji på startsidans brickor och genvägar – rundare kort, tydligare ikoner och lätt tryckkänsla (2026-08-16)",
      'Egen sida "Vad ska jag göra nu?" på /vad-nu – ett förslag i taget med tid, prioritet, friktion och varför (2026-08-16)',
      'Tidslinje i kalenderns dagsvy – 06–22 med pastellkort, bildstöd och "Nu"-markering (2026-08-16)',
      "Pastell-hero på startsidan och i QuickFlow, med andande illustration (2026-08-16)",
      "Hoppa över onboarding – tydlig knapp uppe till höger och fullbredd knapp under, leder direkt till startsidan (2026-08-16)",
      'Onboarding sveps i sidled med tryckbara punkter och räknare "Steg 2 av 4" (2026-08-16)',
      "Pasteller och mjuk rörelse – sidor tonar in, kort poppar upp, knappar svarar på tryck (2026-08-16)",
      "QuickFlow i mitten av bottennavigationen – fem platser: Hem, ditt val, QuickFlow, ditt val och Mer (2026-08-16)",
      "Lila även på sidteman – kalender, ekonomi, familj och övriga kategorisidor tintas i lila/rosa/mint (2026-08-16)",
      "Ny design – mjuk lila palett, violett primärfärg, rosa accent, vita kort och rundare former (2026-08-16)",
      'Stop-knapp i Hälsa – nås nu direkt högst upp på "Må bra" (2026-08-16)',
      "Anpassa appen (NPF-läge) – lugnare färger, ingen rörelse, färre saker på skärmen, enkla ord, större text och globalt bildstöd (2026-08-16)",
      'Egen kategori "Flow" i navigationen – FlowPlan, Fokus, Veckans Flow, Quickflow, Hjälp, Belöningar och MyFlove Insight samlade på ett ställe (2026-08-16)',
      'Egen kategori "Hälsa" i navigationen – Må bra, Träning, FlowScore och Statistik separerade från "Din dag" (2026-08-16)',
      'Egen ordning på hemskärmen – dra och släpp blocken i "Anpassa hemskärmen" (2026-08-16)',
      "Anpassa hemskärmen – lugnare startläge och egna val för vilka block som syns (2026-08-16)",
      "Daily Flow – incheckning av energi, mental belastning och tid som styr dagens förslag (2026-08-16)",

      "Bygg om dagen – MyFlove räknar om resten av dagen när planen spricker, utan skuld (2026-08-16)",
      '"Vad ska jag göra nu?" – en rekommendation i taget baserad på FlowScore, friktion och tid (2026-08-16)',
      "Fokusläge – en sak, en timer, inget brus (2026-08-16)",
      "QuickFlow som flytande knapp – dumpa först, bestäm sen (2026-08-16)",
      "QuickFlow-sortering med typförslag och varsam uppföljning av gamla poster (2026-08-16)",
      "Flow Reset – frivilligt kvällsläge med omplanering utan skuld (2026-08-16)",
      "Veckans Flow – lugn tillbakablick och mönster som observationer (2026-08-16)",
      "Onboarding – vad vill du att MyFlove främst hjälper dig med? (2026-08-16)",
    ],
  },
  {
    title: "Grund & plattform",
    items: [
      "TanStack Start med SSR, filbaserad routing och server-funktioner (2026-07-23)",
      "React 19, Tailwind CSS, shadcn/ui och Lucide-ikoner (2026-07-23)",
      "Lovable Cloud som databas, auth, storage och funktioner (2026-07-23)",
      "Inloggning, registrering och skyddade sidor under /_app (2026-07-23)",
      "Offline-first lagring i localStorage med molnsynk via user_kv (2026-07-20)",
      "PWA – installerbar på hemskärmen med service worker (2026-07-09)",
      "Capacitor-paketering för iOS och Android (2026-07-20)",
      "Namnbyte från MyFlow till MyFlove i hela appen och dokumentationen (2026-07-23)",
    ],
  },
  {
    title: "Kärnkoncept",
    items: [
      "Flow AI-personlighet – anpassat stöd efter din dagsform (2026-07-08)",
      "FlowPlan™ – AI-driven sekvensplanering av uppgifter (2026-07-08)",
      "FlowScore™ – kapacitetspoäng av energi, humör och arbetsbörda, med egen vy (2026-08-13)",
      "WorkFlow™ – arbetsläge med omplanering, mötesläge och Nu-lista (2026-08-13)",
      "StudyFlow™ – pluggläge med föreläsningsläge och kalendersynk (2026-08-13)",
      "StudyBuddy – flervalsfrågor, flashcards och Leitner-repetition (2026-08-13)",
      "MyFlove Insight™ – demoversion för NPF-profiler och strategier (2026-08-13)",
      "Stoppknappen™ – andningsövningar och AI-stöd vid överbelastning (2026-07-25)",
    ],
  },
  {
    title: "Livsområden & moduler",
    items: [
      "Livsområden: Vardag, Studier, Jobb och Privat med egna färger och ikoner (2026-08-13)",
      "Navigation grupperad i MyFlow, HomeFlow, FamilyFlow, StudyFlow och WorkFlow (2026-08-13)",
      "Global sökfunktion över alla vyer (2026-08-13)",
      "Hemskärm med valbara genvägar och områdesfiltrerade widgets (2026-07-20)",
      'Hemskärm: dubbla förslagsrubriker borttagna – bara "Förslag just nu" visas (2026-08-15)',
      "Barn-modulen – barnprofiler och delning inom familjen (2026-07-20)",
      "Barnets skolschema – lägg in lektioner (ämne, tid, sal, lärare) en gång, det ligger kvar och nästa lektion visas (2026-08-15)",
      "Skolschema som bild eller dokument – ladda upp och se det direkt i barnets schemavy (2026-08-15)",
      'Barnvyn visar fel med "Försök igen" istället för att fastna på laddning (2026-08-15)',
      "Hem & familj – hushåll, gemensam inköpslista och kalender (2026-07-20)",
      "Träning – styrka/kondition, AI-genererade pass och hälsoapp-koppling (2026-08-11)",
      "Promenadvägar – riktningsbaserade förslag i närområdet via geoposition (2026-08-14)",
      "Städning – rumsvisa lägen och checklistor (2026-08-13)",
      "Ekonomi – transaktioner och budgetpanel (2026-07-23)",
      "Matlista och matplanerare – fungerar även utan familj (2026-07-09)",
    ],
  },
  {
    title: "Planering & produktivitet",
    items: [
      "Uppgifter med tid, påminnelse, återkommande, delsteg och bilagor (2026-07-23)",
      "Uppgifter sparas i molnet och ligger kvar klarmarkerade (2026-07-20)",
      "Kalender med ICS-import/export och synk mot StudyFlow (2026-07-09)",
      "Schemaimport med AI-tolkning och 'nästa lektion' med vägbeskrivning (2026-08-14)",
      "Återkommande påminnelser (dagligen, veckovis, vardagar) (2026-07-20)",
      "Snooze, väntar-på-status och smarta deadline-påminnelser (2026-07-23)",
      "Quickflow – snabbinfångst av tankar med dubblettfilter (2026-08-13)",
      "Brain Dump – spara idéer (2026-07-23)",
      "Daglig rutin och Pomodoro-timer (2026-07-23)",
      "Minimera/maximera alla vyer med sparat läge (2026-08-14)",
      "Kalender: 'Ny händelse' och '+ Påminnelse' fick enhetligt utseende och placering (2026-08-15)",
    ],
  },
  {
    title: "Hälsa & välmående",
    items: [
      "Energikarta – logga energinivåer över tid, kopplad till FlowPlan (2026-07-08)",
      "Humörlogg och Må bra-vy (2026-07-23)",
      "Medicinlogg med schemalagda tider, tagningar och påminnelser (2026-07-23)",
      "Proaktiva förslag – väder, medicin, tvätt m.m. (2026-07-20)",
      "Väderkort på startsidan med platslokalisering (Open-Meteo) (2026-07-08)",
    ],
  },
  {
    title: "AI & assistent",
    items: [
      "Flow Assistant med sparad chatthistorik och sidopanel (2026-07-23)",
      "AI-genererade träningspass, studieplaner och quiz (2026-08-13)",
      "Personliga hälsningar, notiser och uppmuntran (2026-07-23)",
      "MCP-server så externa AI-agenter kan använda appen (2026-07-20)",
    ],
  },
  {
    title: "Familj & delning",
    items: [
      "Hushåll med unika join-koder (2026-07-20)",
      "Delad inköpslista och familjekalender (2026-07-20)",
      "Behörigheter och barn-delning (2026-07-20)",
      "Tyst läge – pausa påminnelser 30 min–8 timmar eller varje natt (2026-08-15)",
      "Inköpslista: valbar påminnelseradie per butik – i affären, alldeles nära eller i området (2026-08-15)",
    ],
  },
  {
    title: "Notiser & integrationer",
    items: [
      "Web Push-notiser för medicin, väder, påminnelser och loopar (2026-07-18)",
      "Alarmljud och val mellan alarm eller mild påminnelse (2026-07-20)",
      "Resesida med Trafiklab ResRobot v2.1 och pendlingsvarningar (2026-07-08)",
      "Kalendersynk via ICS (2026-07-09)",
      "Promenadvägar via OpenStreetMap Overpass och höjddata (2026-08-14)",
    ],
  },
  {
    title: "Konto, säkerhet & admin",
    items: [
      "Glömt lösenord – återställningslänk via mejl och sida för nytt lösenord (2026-08-14)",
      "Kontoborttagning (2026-07-23)",
      "Integritet, villkor och cookies-sidor (2026-07-23)",
      "Roller i separat tabell med RLS-härdning (2026-07-08)",
      "Adminpanel med statistik, rollhantering och friktionsrapporter (2026-07-20)",
      "Friktionsindex – användarfeedback med röstning (2026-07-08)",
      "Changelog-export till Word och PDF (2026-08-15)",
    ],
  },
  {
    title: "Design & upplevelse",
    items: [
      "Palett: beige bakgrund, skogsgrön primary, guld accent och vita kort (2026-08-14)",
      "Fraunces display + Inter body, mjuka radier och lena skuggor (2026-08-14)",
      "Flow-voice – varm och lugn svensk copy i hela appen (2026-07-08)",
      "Introtur, enkelt läge och svenska underrubriker (2026-08-14)",
      "Kontextuella hjälptexter med i-knapp på alla kort (2026-08-14)",
      "Tillbakaknapp baserad på historik (2026-08-14)",
      "SEO: sidspecifika og-taggar, JSON-LD, sitemap och robots.txt (2026-08-14)",
      "Städning: samma blocklayout och rundningar som övriga appen (2026-08-29)",
    ],
  },
];
