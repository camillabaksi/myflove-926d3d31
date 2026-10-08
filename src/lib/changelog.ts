export type ChangelogSection = {
  title: string;
  items: string[];
};

export const CHANGELOG_TITLE = "MyFlove Changelog";
export const CHANGELOG_INTRO =
  "Komplett logg över allt som byggts i MyFlove – från första prototypen till dagens version.";
export const CHANGELOG_UPDATED = "2026-10-08";

export const CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    title: "Navigation",
    items: [
      "Mer, expanderbara direktsektioner (2026-10-08): Min dag, Flow och samtal, Ork och återhämtning samt Hem och vardag är hopfällda från början och expanderas med samma befintliga kortkomponent som övriga grupper; flera kan vara öppna samtidigt. Alla ingångar finns kvar även under Fler funktioner. Tester uppdaterade; full svit 527/527. Ingen publicering.",
      "Mer, direktsektioner (2026-10-08): fyra befintliga kategorier visas efter Insikter med befintliga rader och filter. Alla tidigare ingångar finns kvar, även samma genvägar under Fler funktioner; inga data eller funktioner dupliceras. Designen bevarad; ingen publicering.",
      "Uppgifter (2026-10-08): oinramad sidrubrik, lättare vyval, Inter på uppgiftsnamn/grupper, varma kort och 44 px kontroller. Endast sidlokal presentation; funktioner, data och övriga sidor bevarade. Ingen publicering.",
      "Uppgifter, verifiering (2026-10-08): fem bredder, båda teman och 200 % text; dialog och vyval utan kontosparning. Fyra nya åtgärdstester; full svit 524/524 i 83 filer och automatiskt bygge OK.",
      "Mer enligt godkänd målbild (2026-10-08): samma responsiva vy på mobil och dator med profil, vardagskort, familj, insikter, alla övriga verktyg och Äldre funktioner. Befintliga länkar, filter, sök och funktioner bevaras; endast lokal presentation och lätt dekor. Logotyper och stenar oförändrade. Ingen publicering.",
      "Paceable på återstående sidor (2026-10-08): äldre Hem och Flow/samtal med undersidor använder befintliga Paceable-ytor och dialogdjup. Neutrala kort, dekorativa rubrikytor, lokala sidtitlar och chattbubblor anpassade; Inter för funktion och Fraunces för orientering. Primärvyer, betydelsebärande färger, bilder, navigation och data bevarade; ingen publicering.",
      "Verifiering (2026-10-08): slutlig full testkörning 516/516; befintligt timingkänsligt krypteringstest föll i två mellanliggande körningar men klarade separat omkörning. Nya tokenpars kontrast uppfyller AA. Hem-dialogens befintliga fokusåtergång rapporterad separat. Saknade sociala metadata kompletterade utan ändrade sidtitlar eller länkar.",
      "Enhetlig identitet etapp 1, QA-rättning (2026-10-08): lokal enkelkolumn och fri radbrytning vid 200 % text, dialogfält utan sidledsöverflöde samt uttryckligt skydd för Flow-chatten på /assistant med undersidor. Normallayout, Core och funktioner oförändrade; ingen publicering.",
      "Enhetlig identitet etapp 1 (2026-10-08): övriga inloggade sidor får Paceables befintliga färger och ytor; gemensamma kort och sidrubriker får varm yta och lätt djup, sidtitlar Fraunces; dialoger får upphöjd yta. Idag, Kalender, Tankar, Min plats, äldre Hem och Flow-sidor oförändrade; ingen publicering.",
      "Visningsnamn på Idag (2026-10-08): diskret ⋯-meny i hälsningen med Ändra visningsnamn. Namnet sparas i befintlig kontobunden namnlagring och visas först när synken bekräftats; vid fel behålls tidigare namn. E-postgissning visas bara som tillfälligt förslag och sparas inte. Stenar, layout och övriga funktioner oförändrade; ingen publicering.",
      "Paceables webbvarumärke (2026-10-08): godkända ljusa/mörka huvud- och kompaktlogotyper från korrigerat paket, exakt slogan Ditt liv, i din takt. samt favicon/PWA/Apple Touch Icon. Endast varumärkesplatser och installationsnamn ändrade; inga maskable-ikoner, native-, navigations-, data- eller funktionsändringar. Ingen publicering.",
      "Mobilkalenderns kapacitetsstöd (2026-10-08): kompakt rosa helrad med Lägg till vid behov och samma formulär. Osparade val bevaras i tillfällig sidstatus vid hopfällning och Månad/Vecka/Dag utan autosparning eller ny lagring. Veckans mål, desktop och Core oförändrade; ingen publicering.",
      "Startsida (2026-10-08): inloggade användare, inloggning, registrering, nytt lösenord, introduktionsturen, Tillbaka utan historik och generella notiser landar på /idag i stället för /hem. Specifika notislänkar och /hem under Mer → Äldre funktioner bevaras; design, Core och data oförändrade; ingen publicering.",
      "Etapp 2A tillgänglighet (2026-10-08): lokal textstorleks- och utrymmesanpassning för hälsning, batterier, kalenderkontroller, dagsvy och fria aktivitetsrader. Normallayouten och tidsgeometrin bevaras. Fasta veckoblock har kvarstående läsbarhetsbegränsningar vid 200 %; ingen publicering.",
      "Etapp 2A desktop (2026-10-08): Idag får flexibel huvudkolumn med proportionerlig Capacity och Pace; kalenderns kontroller samlas med Familj/visningsval först och frivilligt stöd efter huvudvyn på desktop. Mobil, navigation, stenasset, kalendergeometri, Core och data oförändrade; ingen publicering.",
      "Fyra QA-rättningar (2026-10-08): Mer återför fokus efter Escape/kryss och ger sidinnehållet fokus efter navigering; menynamn får radbrytas vid 200 % text; desktop-Mers områden följer befintligt Enkelt läge; hälsningen balanserar radbrytning på smal mobil. Ikoner, färger, stenar, Core och data oförändrade; ingen publicering.",
      "Desktopnavigation etapp 1 (2026-10-08): smal fast vänstermeny med samma fem huvudval som mobilen; Mer öppnas som panel med sök, områden och Äldre funktioner. Mobilen oförändrad; ingen publicering.",
      "Varför in i importkortet (2026-10-08): Tankars hjälplänk ligger nu vänsterställd under importknapparna inne i kortet, med samma funktion, innehåll, 44 px touchyta och fokus. Stenar och övrig layout orörda; ingen publicering.",
      "Tankar, snäv polish (2026-10-08): varm tankeinfångningsyta med tunn kant/elevation-1 och inline-Varför intill import, minst 44 px touchyta. Samma innehåll/funktion och pixelmässigt orörda stenar; ingen publicering.",
      "Tankars stenar (2026-10-08): endast befintlig keramisk bildrendering förstoras 1,9× i samma övre högra placering. Asset, rubrik, övrig layout och andra vyer oförändrade; ingen publicering.",
      "Sista finjusteringen (2026-10-08): Idags hälsning 34 px på smal mobil; större vyer oförändrade. Samma godkända stenar i Tankar och Min plats-rubriken på 32 px behålls. Inga övriga visuella ändringar; ingen publicering.",
      "Slutpolish (2026-10-08): samma godkända stenbild i befintliga Tankar/desktop-placeringar; Idag-stenarna oförändrade. Hälsningen anpassas på smal mobil, Min plats-rubriken är lugnare. Ingen Core-, data- eller bildändring; ingen publicering.",
      "Typografisk hierarki (2026-10-08): explicit Fraunces på hälsningen och Din dag, Tankars huvudrubrik och Min plats; funktionella rubriker använder Inter. Stenasset, rendering/placering, färger, djup, funktioner och data är oförändrade. Ingen publicering.",
      "Paceable-stenarna på Idag lite större (2026-10-08): stenarna bredvid hälsningen är nu 126×74 px efter att ha varit 104×68 px. De ligger i sidans eget flöde med luft runt sig, utan att gå in i texten, och hälsningen bryts på två rader. Verifierat i 390 px utan horisontell overflow. Ingen funktions- eller dataändring; ingen publicering.",
      "Större Paceable-stenar på Idag (2026-10-08): stenarna vid hälsningen är tydligt större och ligger på en egen rad ovanför hälsningen, så de inte ser ut som en liten rad bredvid texten. Stenbilden är beskuren så stenarna fyller ytan. Verifierat i 390 px. Ingen funktions- eller dataändring; ingen publicering.",
      "Min plats-ikon (2026-10-07): navigationen använder valt förslag B, Öppen rymdform.",
      "Paceable etapp 1D (2026-10-07): öppen organisk Min plats-navkontur, lättare Idag-rader med liten områdesprick och separatorer. Checkbox/meny har 44 px tryckyta; klara poster har checkmark/genomstrykning utan animation. Svensk datumrubrik visar Onsdag 7 oktober. Etapp 1C:s färger, övriga ytor, Core och data oförändrade. Ingen publicering.",
      "Paceable etapp 1C (2026-10-07): varm ivory, aubergine och flera mjuka accenter ersätter stark lila som generell action- och markeringsfärg på primärvyerna. Capacity har en egen dämpad ton, Kalenderns val är neutrala, Idag saknar prestationsantal och Pace-blad, Min plats-symbolen är enklare och Tankar är luftigare med neutral importcopy. Kalenderns Hem-prickar verifierades som återkommande rutiner och var redan områdesdeduplicerade. Ingen Core-, data- eller routeändring; ingen publicering.",
      "Paceable – visuell polish (2026-10-07): ny Min plats-ikon, ingen dubbel navigation på Idag, Din dag utan yttre ram, lugnare kalenderkontroller, små färgaccenter och stenar vid hälsningen. Synlig Flow-text ersatt på incheckning, Tankar och Min plats. Ingen logik eller data ändrad; ingen publicering.",
      "Paceable – visuell rebrand etapp 1 (2026-10-07): primärvyerna har fått varm, lugn färgpalett, sans-serif-typografi, Paceable-stenar och navigationen Idag · Kalender · Tankar · Min plats · Mer. Tankar och Min plats återanvänder befintliga funktioner; Core, familjeskydd, data, routes och tekniska identifierare är oförändrade. Ingen publicering.",
      "Paceable Core v1 (2026-10-07): Idag samlar registreringsbaserad Capacity, egen dag först, kvalitativ Load och deterministisk Pace (Varsamt, Jämnt eller Utrymme). Okänd/framtida Capacity ger ingen procent eller personlig Pace; familjekontext räknas bara vid Behöver mig och barnschema är read-only. Synligt Capacity Mode avvecklas medan interna beroenden och sparad data bevaras. Ingen migration eller publicering.",
      "Lugnare månad, barnschema och Flow (2026-10-07): datum, verklig kapacitet idag/historiskt och unika befintliga områdesprickar, en enda för familjen. Inget framtidsbatteri. Barnschema saknar avbockning även på Idag och i barnprofil/schemaeditor. Idag visar samma kapacitet och ett situationsanpassat Flow-stöd utan prestationskrav. Befintliga uppgifter och rättigheter bevaras; ingen publicering.",
      "Familjelager i kalendern (2026-10-07): Min dag, Min dag + familj och Familjeöversikt med barnval och grupperade aktiviteter. Barnens tider är diskret kontext utan avbockning eller automatisk belastning; Behöver mig är uttryckligt och beaktas i planeringen. Barnschemats Nu/Sedan/Sen följer tiden utan prestationskrav. Befintliga uppgifter, lagring och rättigheter bevaras. Ingen publicering.",
      "Kalender, områdesfärger (2026-10-07): mjuka områdesfärger på bakgrund, kant och ikon i månad, vecka och dag, med områdesnamn och färgnyckel. QuickFlows sparade område följer med; energipåverkan ändrar inte områdesfärgen. Aktiviteter och behörigheter bevaras. Ingen publicering.",
      "Hem, fyra kompakta rutor (2026-10-07): Kalender, dagens kapacitetsbatteri, Logga hur du mår och QuickFlow direkt under hälsningen. Samma incheckningsbaserade batterivärde som kalendern, eller – utan data. Befintlig måendelogg, Just nu, aktiviteter och behörigheter bevaras. Ingen publicering.",
      "Samlad kalender (2026-10-07): filter, veckomål och frivillig incheckning integreras i den visuella kalendern; kalenderkoppling och dagens befintliga verktyg får tydliga knappar. Ingen dubbel kalender eller konkurrerande batteri; aktiviteter och behörigheter bevaras. Inte publicerat.",
      "Kalender, kapacitetsbatteri (2026-10-07): dagens kapacitet visas som batteri med procent i alla vyer, bara från egen incheckning; planerad belastning visas separat.",
      "Kalender, veckovy på mobil (2026-10-07): veckan visar 1, 2 eller 3 dagar beroende på skärmbredd och sveps horisontellt dag för dag; datorn visar hela veckan. Minskad rörelse respekteras.",
      "Kalender, steg 1 – Månadsvy (2026-10-07): mjuk lavendelmarkering av vald dag, separat från dagens datum, med bibehållen ikonkontrast. Befintliga vyer och data behålls.",
      "Visuell kalender (2026-10-07): Månad, vecka och dag med gemensamma befintliga datakällor, tidsblock, oschemalagt, kända tidsluckor och kapacitetsläge utan påhittade procenttal. Egna engångsposter kan planeras/flyttas med ångra; energipåverkan är valfri och notiser slås inte på automatiskt. Familjbehörigheter och separat skrivskyddat föräldraschema bevaras. Ingenting publicerat.",
      "Kalendergranskning (2026-10-07): öppningsbara överlappsgrupper, läsbara tryckytor, gemensam vald dag och separat registrerad energi. Befintlig avbockningsjournal återanvänds. Datum/luft/överlapp samt mobil/dator kontrollerade utan sparade testposter; draghandtag för längd och fullständig skriv-/fler-enhetsverifiering återstår.",
      "Hem: Just nu-kortet kan nu ta bort aktiviteten med en tvåstegsbekräftelse (2026-10-05)",
      "Landningssidan: svensk/engelsk språkväxling och ny slogan 'your flow, with love' (2026-10-05)",
      "Familj: barnets eget konto ser sin kalender direkt, aldrig förälderns privata uppgifter om barnet (2026-10-05)",
      "Familj/Dela: välj hela familjen eller utvalda personer för listor och barnsaker (2026-10-05)",
      "Familj: kopplat konto behåller egna verktyg; uttryckligt delade poster visas under \"Delat med dig\" (2026-10-05)",
      "Flow i chatten: lägg till, ändra och ta bort uppgifter efter ditt godkännande; snyggare text; QuickFlow i nedre raden (2026-10-04)",
    "Mobilappar: säkerhetskopia per konto, tydlig kalenderkoppling och behörigheter för mikrofon/kamera/plats (iPhone 1.1, Android 6.3) (2026-10-04)",
    "Ljud: inget pip längre när iPhone-appen öppnas – tyst upplåsning utan larmsignalen (2026-10-04)",
    "Ljud: inget larmljud längre vid första trycket i appen på iPhone; Morgonstartens klang bara om Morgonstart är påslagen (2026-10-04)",
    "Notiser: den som delar en barnaktivitet väljer själv vilka mottagare som får notiser om den – båda sidor måste säga ja (2026-10-04)",
    "Notiser: kvällshälsningen avstängd, alla skickade notiser loggas och du väljer vems delade familjesaker du får notiser om (2026-10-04)",
    "Notiser: barnpåminnelser avstängda som standard och aldrig för delade barn (2026-10-04)",
    "Notiser: bara larm och påminnelser du själv bett om – inga automatiska puffar, väder eller hälsningar (2026-10-04)",
    "Ljud: Morgonstartens klang respekterar avstängt/tyst larm (2026-10-04)",
    "Notiser: tomma konton får inte längre Flows fråga om orken (2026-10-04)",
    "Notiser: aktiviteter med klockslag låter inte längre med larmljud om du inte själv valt påminnelse (2026-10-04)",
    "Android: appikonen matchar den bifogade MyFlove-ikonen; App Bundle 6.2 (versionCode 21) för Google Play (2026-10-04)",
    "iOS: AppIcon-bilden har bytts till den bifogade MyFlove-ikonen för TestFlight och hemskärmen (2026-10-03)",
    "Mobilprojektet: Capacitor-appen använder nu app-ID \"se.myflove.app\" (matchar Apple Developer) och iOS-mappen är förberedd; Android bygger fortfarande med \"app.myflove.mobile\" (2026-10-03)",
    "Imorgon med Flow – kvällens förberedelse av det vi redan vet, utan energiprognos; ny morgoncheck sätter dagens läge (2026-10-02)",
    "Min Flow är tillfälligt borttagen – Flow-fliken öppnar chatten direkt; sparade val och minnen ligger kvar (2026-10-02)",
    "Min Flow: den godkända Flow-figuren visas i fåtöljen; tidigare figurvariant och missanpassade tillbehör döljs utan att sparade val raderas. Poseanpassade resurser återstår (2026-10-02)",
    "Flow i rummet är helt täckande även när han går, med mjuka kanter, verklig skugga och ljus som följer rummet (2026-10-02)",
    "Min Flow: rummet följer dag, kväll och natt; Flow kan utforska fyra platser och vila i pyjamas på natten. En bottenpanel för kläder, accessoarer och rumsdetaljer visar ändringar innan de sparas (2026-10-02)",
    "Flow bor nu i rummet: sitter i fåtöljen, tar en kort promenad på mattan, dricker te eller myser med filt; uppladdad GIF och stillhetsval används (2026-10-02)",
    "Min Flow: ett tryggt rum, befintlig chatt, frivilliga minnen, tre rumsteman som kan väljas i samlingen och valfri rörelse; chatten prioriterar samtalet på mobil och QuickFlow ligger kvar separat (2026-10-02)",
    "Äldre data utan konto kan nu läggas till i ditt konto (eller tas bort) via en fråga överst, och osynkade ändringar från en offline-utloggning kommer alltid tillbaka vid ny inloggning (2026-10-02)",
    "Säkerhet och synk: lokal data hålls isär per konto, osynkade ändringar sparas för rätt konto vid utloggning, synken slår ihop ändringar från flera enheter utan att borttagna poster återkommer, känsliga uppgifter skrivs aldrig okrypterat, diskret synkstatus, och Återhämtning nås från Hem även i lågt läge (2026-10-02)",
    "Kalenderimport: PDF:er läses nu som text och Flows svar tolkas även som ren lista – importerade händelser hittas igen (2026-10-02)",
    "AI: hela appens Flow-AI använder nu Google Gemini via Lovable AI – även träningsskaparen och kalenderimporten byter till Gemini (2026-10-02)",
    "Popup-fönster på mobil: innehållet trycks inte längre utanför kanten – pictogram visas tre i bredd, start- och sluttid ligger bredvid varandra, och Flytta/Kopiera i barnschemat öppnas också som popup (2026-10-02)",
    "Telefonappen: uppgifter och annan data sparas nu även i telefonens egen lagring och återställs automatiskt om en ny version skulle rensa den (2026-10-02)",
    "Genomgång av appen: dubbla menyval borttagna (Chatta med Flow, Morgonstart), Översikt heter nu Hem, Min dag heter Idag överallt, emojis i menyn ersatta och färger enhetliga med designsystemet (2026-10-02)",
    "Popup-fönster överallt: alla \"Lägg till\"- och \"Ändra\"-formulär öppnas nu mitt på skärmen som popup – Relationer, Ekonomi, Jobb, Påminnelser, Rutiner, Städning, Inköp, Medicin, Studier, Energi, Profil med flera (2026-10-02)",
    "Android: App Bundle 6.0 (versionCode 19) byggd; behöver signeras med befintlig uppladdningsnyckel före Google Play (2026-10-02)",
    "Android: App Bundle 5.9 (versionCode 18) byggd; behöver signeras med befintlig uppladdningsnyckel före Google Play (2026-10-02)",
    "Barnschema: lägga till/ändra aktivitet öppnas i popup-fönster (2026-10-02)",
    "Navigering: varje sida öppnas längst upp (2026-10-02)",
    "Kalender: aktiviteter hamnar inte längre felaktigt i Vård på grund av ord som \"test\" (2026-10-02)",
    "Barnschema: borttagning av en återkommande aktivitet från en dag behåller tidigare dagar (2026-10-02)",
    "Android: App Bundle 5.8 (versionCode 17) byggd; behöver signeras med befintlig uppladdningsnyckel före Google Play (2026-10-01)",
    "Landningssidans äldre film har ersatts av en nyare svensk 24-sekunders introduktion med QuickFlow, kapacitetsval och dagens plan (2026-10-01)",
    "Landningssidan: ny knapp \"Se allt som finns i appen\" öppnar en förhandsvisning av hela sidomenyn grupperad per område – helt lokalt, inget konto behövs (2026-10-01)",
    "Landningssidan: de tre funktionskorten (QuickFlow, Planering utifrån energi, Ett steg i taget) öppnar nu små prova-på-demoer direkt på sidan – helt lokalt, inget sparas och inget konto behövs (2026-10-01)",
    "Landningssidans exempelvy är större och luftigare på mobil med tydligare hälsning, energi, mående, uppgifter och inspiration; exemplen är fortsatt fristående från kontodata (2026-10-01)",
    "QuickFlow: text med datum eller tid (\"tvätta fredag 10-14\", \"12 oktober kl 14\") ger ett direkt förslag att lägga det i kalendern på rätt dag och tid (2026-10-01)",
    "QuickFlow: egen knapp för PDF/dokument direkt på importkortet – möten och deadlines hittas som i bilder (2026-10-01)",
    "Kalender: möten med Zoom/Teams/Meet-länk får en klickbar Anslut-knapp direkt i dagsvyn (2026-10-01)",
    "QuickFlow: Importera från bild/PDF – Flow hittar kalenderhändelser, du granskar och godkänner; osäkra datum och dubbletter markeras, möteslänkar blir klickbara (2026-10-01)",
    "Landningssidan har varm krämvit bakgrund, liggande exempelvy, tre funktionskort och en spelbar introduktionsfilm (2026-10-01)",
    "Startsidan visar nu MyFloves dagsvy, tre tydliga kärnfördelar och enkla vägar till inloggning och registrering (2026-10-01)",
    "Ta bort: dolda kopior med samma namn och tid (t.ex. en oavslutad från en tidigare dag) tas bort tillsammans med raden (2026-10-01)",
    "Ta bort/ändra: aktiviteter som tas bort sparas nu direkt och kommer inte tillbaka (2026-10-01)",
    "Medicin: borttagna mediciner återuppstår inte längre från en annan enhets gamla kopia, så gamla påminnelser slutar dyka upp (2026-09-30)",
    "Android: App Bundle 5.6 (versionCode 15) med uppdaterat versionsnummer; behöver signeras med befintlig uppladdningsnyckel före Google Play (2026-09-30)",
    "Barn/Familje Flow: kompakta barnkort med Schema och Hjälp, ⋯-meny för profiländringar och barnspecifik profil med stödchips och sparade övningar. Båda ingångarna öppnar samma visuella schema; gamla detaljer finns kvar bakom profilen (2026-09-30)",
    "Typografi: egna aktivitetsnamn och kalenderposter visas i upprätt Caveat i dagvy, veckovy, uppgiftslista och på Hem; tider och kontroller behåller standardtypsnitt (2026-09-30)",
    "Typografi: Caveat används sparsamt för hälsningen på Hem och Flows välkomstfråga, utan kursiv stil eller ändring av övrig text (2026-09-30)",
    "Hem: rutan \"Lägg till på hemskärmen\" ligger nu allra längst ner på sidan, efter guiden och Anpassa hemskärmen (2026-09-30)",
    "Dator: Träning i sidomenyn öppnar nu sidan direkt även om sidbytet fastnat i den öppna fliken (2026-09-30)",
    "Träning: passet följer nu vald tid, har färre pauser (ingen vila i uppvärmning/nedvarvning eller mellan övningar) och korta instruktioner ovanför varje bild (2026-09-30)",
    "Hem: batterirutan \"Hur är läget idag?\" har stora färgkodade val där vald nivå lyser tydligt, och \"Just nu\"-kortet har markant etikett och violett accentlinje så dagens viktigaste uppgift syns direkt (2026-09-30)",
    "Hem: de fyra genvägarna (Kalender, Mitt batteri, Prata med Flow, QuickFlow) ligger nu längst upp, direkt under hälsningen (2026-09-28)",
    "Lägg till: bekräftelse visas när en händelse med klockslag sparas, t.ex. \"Sparad idag kl 17:30\" (2026-09-28)",
    "Admin \"Aktiva användare\": visar även konton som använt appen i inloggat läge senaste dygnet/7/30 dagarna – bara tidpunkt sparas (2026-09-28)",
      "Admin \"Hur går MyFlove?\": ny ruta \"Aktiva användare\" – inloggade senaste 7/30 dagarna och obekräftade e-postadresser (2026-09-28)",
      "Uppgifter med klockslag som blev sena följer nu med in i Idag/Min dag tills de blir gjorda – en missad tid gör saken sen, inte borttappad. Riktiga möten bor i kalendern (2026-09-28)",
      "Kalender och Idag: \"Kopiera dagen\" – kopiera en dags uppgifter och påminnelser till en eller flera dagar, med dubblettskydd (2026-09-28)",
      "UX-förenkling 1.0: ett tydligt första steg på Hem, Hälsa, Flow, Min dag, Återhämtning, Studier, Familj/Barn och Inställningar; mer innehåll bakom klick. Batteriets Varför? förklarar skillnaden mellan uppskattad energi och ditt kapacitetsval (2026-09-27)",
      "Flow: prata in i stället för att skriva – \"Prata\"-knappen i chattrutan spelar in din röst och skriver ut det du sa i textrutan (2026-09-27)",
      "Flow har fått röst – en högtalarknapp vid varje svar läser upp det med en mjuk, varm och tydlig röst; tryck igen för att stoppa, inget spelas automatiskt (2026-09-27)",
      "Mitt batteri och \"Hur mår du?\" sammanslagna – en enda incheckningsplats; Hem har ett enda \"Hur är läget idag?\"-kort som loggar kapacitet och ork direkt (2026-09-27)",
      "Återhämtning: Flow-övningar kan sparas – Återhämtningsbiblioteket visar först 🌿 För mig, 👨‍👩‍👧 Barn & familj och ⭐ Mina sparade. Övningar från Flow kan startas steg för steg (med timer när längd finns), sparas för ett visst barn och föreslås igen av Flow när de passar. Syns även i Familj och kan tas bort (2026-09-27)",
      "Hem: snäll starttimer vid tidsatta saker – mjuk puff ca 15 min innan, ett litet första steg och 2 lugna minuter utan larm eller försening (2026-09-27)",
      "Kalender: \"Veckans mål\" – saker som ska bli gjorda någon gång i veckan; välj en dag när det passar så hamnar det i Min dag (2026-09-27)",

      "Familj: \"Tidigare situationer\" syns nu direkt på Family Flow-sidan – med en summering av vilka vägar som fungerat för barnet och hela loggen hopfälld under \"Alla situationer\". Loggen delas med \"Hjälp mig med en situation\" och synkas mellan enheter (2026-09-27)",
      "Familj: \"Hjälp mig med en situation\" sparar nu varje situation i en egen logg – vilka vägar du provat, om de fungerade eller inte och vad som hjälpte mest. Visas som \"Tidigare situationer\" under första steget och synkas mellan enheter (2026-09-27)",
      "Familj: \"Hjälp mig med en situation\" är nu ett steg-för-steg-stöd – Vad händer? → Vem gäller det? → 1–3 korta följdfrågor → Flow sammanfattar → 3–5 vägar att prova med konkreta steg och \"Säg så här\" → \"Det fungerade inte\" ger nya vägar → kort feedback som kan sparas i barnets profil. Använder befintliga barnprofiler, barnschema, kapacitetsläge, Min dag och bildstöd (2026-09-27)",
      "Anpassa hemskärmen ligger sist på Hem; sparade val för block, ordning och checklistan bevaras även på nya enheter (2026-09-26)",
      "Hem fokuserar på vad du behöver just nu: Enkelt läge-knappen och dagfördjupningen har flyttats bort. Dagfördjupningen finns hopfälld i Idag, och Ny på MyFlove?-guiden ligger sist på Hem med väg till Flow (2026-09-26)",
      "Hem: \"Ny på MyFlove?\" och \"Så funkar MyFlove\" sammanslagna till en ruta – kartan leder vidare till hela översikten (2026-09-26)",
      "Hem: hopfälld \"Ny på MyFlove? Så funkar det\"-lathund längst ner – visuell karta över QuickFlow, Mitt batteri, Flow, Min dag och Återhämtning (2026-09-26)",
      "Studier: Word-, PowerPoint-, Excel- och OpenDocument-dokument kan laddas upp (2026-09-25)",
      "Ikoner: emojis ersatta med riktiga Lucide-ikoner överallt – inga tomma fyrkanter; kapacitetslägen visar färgade prickar (2026-09-25)",
      "Familj: Rutiner och Anteckningar kan vara Kan ändra – bocka av rutiner, skriva anteckningar (2026-09-25)",
      "Familj: delad städlista visar både vardagsstädning och storstädning per rum (2026-09-25)",
      "Familj: välj vem som får ändra; delad städlista visar även appens städsteg (2026-09-25)",
      "Familj: välj Av, Kan se eller Kan ändra per del; familjen kan bocka av inköp, städning, uppgifter och kalender (2026-09-25)",
      "Familj: även Träning, Mående & ork, Ekonomi, Studier, Jobb, Anteckningar och Resor kan delas (2026-09-25)",
      "Familj: välj vilka delar av appen familjen får se (kalender, uppgifter, inköp, rutiner & medicin), privat som standard (2026-09-25)",
      "Medicinpåminnelsen försvinner direkt när dosen markerats som tagen (2026-09-25)",
      "Barnens aktivitetslista visar bara läsbara anteckningar, inte intern pictogram- och färginformation (2026-09-25)",
      "Städning steg 5: verifierat oanvänd planeringskod har tagits bort utan datarensning. Historik, sparade omplaneringsvärden, FlowScore, energidata, QuickFlow-kompatibilitet och Jobb/Studier-stöd är kvar. (2026-09-25)",
      "Städning steg 4: Hem har en enda kapacitetskontroll med Fullt/Mellan/Lågt. Planera och Idag visar samma dagsplan utan egna energi- eller FlowScore-val; Lågt visar bara Nu och döljer extra val. Historiska energi- och mönsterdata finns kvar. (2026-09-25)",
      "Städning steg 3: FlowPlan är enda motorn för \"Vad gör jag nu?\". Den bygger bara på prioritet P1–P4 och kapacitetsläget, respekterar fasta tider och beroenden och ger Nu/Sedan/Kan vänta (i Lågt bara Nu). Just nu, Nästa rimliga steg, Hur är läget idag?, Planera, Planera om, Idag, Flow-chatten och Flows påminnelser visar samma plan; batteri och FlowScore påverkar inte längre urval eller ordning. (2026-09-25)",
      "Städning steg 2: Fullt/Mellan/Lågt är enda källan för aktuellt kapacitetsläge. Användarens val gäller tills hen ändrar det (standard Mellan); batteri, FlowScore och Energiflöde styr inte längre läget men finns kvar för historik. Orkfrågan har tre val (gamla värden Mycket/Okej/Lite/Nästan slut läses som Fullt/Mellan/Lågt). Påverkan-kortet föreslår ett lägre läge i stället för batterinivå. (2026-09-25)",
      "Städning steg 1: QuickFlow använder prioritetsmotorn P1–P4 som enda källa; Nu/Sedan/Kan vänta/Om du orkar är bara visningsord och gammal sparad data översätts vid läsning (2026-09-25)",
      "Passerade möten och tidsbokade aktiviteter rullar inte över till Idag; tidlösa uppgifter följer med (2026-09-25)",
      "Tillbakapil på alla sidor utom Hem; fler vyer kan fällas ihop och expanderas (2026-09-25)",
      "Mer-menyns kategorier är färre och mer sammanhängande: Min dag, Flow, Hälsa & ork, Återhämtning, Studier & jobb, Familj, Hem & vardag, Insikter (2026-09-25)",
      "Hälsa i bottennavigeringen öppnar samma kategorivyn som Mer → Hälsa, så båda vägarna leder till samma vy (2026-09-25)",
    ],
  },
  {
    title: "Tvåspråkigt pitch- och dokumentpaket 6.0",
    items: [
      "Ny sammanhängande Living Blueprint på svenska och engelska, förankrad i forskningsramverkets sex lager (2026-09-25)",
      "Redigerbara pitchdeck och pitchmanus på svenska och engelska (2026-09-25)",
      "Fyra 180-sekunders pitchfilmer: svenska och engelska i 16:9 och 9:16 (2026-09-25)",
      "Samma redaktionella design, verifierade siffror och försiktiga valideringspåståenden genom hela paketet (2026-09-25)",
    ],
  },
  {
    title: "Hem: en sak i taget",
    items: [
      "Hjälp mig börja (2 min) på Just nu-kortet – ett litet första steg och en lugn timer (2026-09-25)",
      "Mjuk övergång efter Klar: vill du landa 2 minuter innan nästa? (2026-09-25)",
      "Stäng dagen på kvällen: varm summering, ogjort kan flyttas till imorgon med Ångra (2026-09-25)",
      "Tre nya mjuka påminnelseljud med långsam intoning: Klangskål, Regndroppe och Mjuk harpa (2026-09-25)",
      "Fler val under Anpassa hemskärmen och nytt ljust/mörkt läge (2026-09-25)",

      "Dagens checklista på Hem visar tre punkter direkt och resten fälls ut med Visa alla (2026-09-25)",
      "Ändringar syns direkt på alla dina enheter, även när appen legat i bakgrunden (2026-09-25)",

      "Planera och påminnelser använder samma prioritetsord som Hem (2026-09-25)",
      "Mjuk fråga vid full dag, erbjudande att förenkla dagen, och samma prioritering i Planera och påminnelser (2026-09-25)",
      "Hur är läget idag? Fullt, Mellan eller Lågt – planen krymper när kapaciteten minskar och det som kan vänta kan flyttas med Ångra (2026-09-25)",
      "Barnens dag är valfritt under Anpassa hemskärmen och visas inte innan användaren själv väljer det (2026-09-25)",
      "Dagens checklista och barnschemat börjar som enkla sammanfattningar som kan öppnas för fler detaljer (2026-09-25)",
      "Bella och Biancas aktiviteter visas sida vid sida på Hem och kan bockas av direkt (2026-09-25)",
      "Avbockning synkas med Family Flow och använder samma fråga om hur aktiviteten kändes (2026-09-25)",
      "Just nu-kort med Klar och Inte nu, följt av Dagens checklista (2026-09-25)",
      "Orken visas i ord – Låg, Lagom eller God – med enkel förklaring (2026-09-25)",
      "Samma ordnivåer för batteriet överallt: Mitt batteri, observationer, QuickFlow, Familj och Träning (2026-09-25)",
      "Färre rutor på Hem; resten ligger i Mer i MyFlove (2026-09-25)",
      "Dagens fokus högst upp i Hälsa, Studier, Jobb, Städning och Träning (2026-09-25)",
      "Mitt batteri börjar med orken i ord; grafer ligger hopfällt (2026-09-25)",
      "Nu-markör i dagens lista så du ser var i dagen du är (2026-09-25)",
    ],
  },
  {
    title: "Min dag, barnens dagar och Familj",
    items: [
      "Personväxlare: Min dag, varje barn och Familj med parallell tidslinje (2026-09-24)",
      "Kopplade familjeaktiviteter som kan ändras var för sig eller tillsammans (2026-09-24)",
      "Förslag om återhämtning när eftermiddagen är tät och batteriet lågt (2026-09-24)",
    ],
  },
  {
    title: "Lugnare visuell dagsvy",
    items: [
      "Dagsvyn och Kalenderns dagläge visar tid, pictogram, aktivitet och konsekvent områdesfärg (2026-09-24)",
      "Klara aktiviteter ligger kvar lugnt nedtonade och alla befintliga åtgärder finns kvar (2026-09-24)",
    ],
  },
  {
    title: "Pitch & Investor uppdaterat med nytt huvudmaterial",
    items: [
      "Tio uppladdade pitch-, video-, BMC-, statistik- och marknadsfiler finns nu i den privata adminsektionen (2026-09-24)",
      "Materialet är sorterat i rätt kategorier och öppnas fortsatt med kortlivade adminlänkar (2026-09-24)",
    ],
  },
  {
    title: "Barnschema: andra dagar och egen ordning",
    items: [
      "Idag-vyn kan bläddra mellan dagar och nya aktiviteter visas på rätt dag (2026-09-23)",
      "Tryckbara dagsrutor markerar vilken dag som är vald, och formuläret visar måldagen (2026-09-23)",
      "Aktiviteter kan flyttas upp och ner i dagens ordning (2026-09-23)",
      "Tomma/klara dagar visar 'den här dagen' när en annan dag är vald (2026-09-24)",
    ],
  },
  {
    title: "Komplett pitch- och dokumentpaket 5.1",
    items: [
      "Pitchdeck och pitchfilmer speglar nu den aktuella MyFlove-produkten på svenska och engelska (2026-09-23)",
      "Living Blueprint och pitchmanus uppdaterade med Family Flow, energikoppling, Insikter, Återhämtning, träning och studier (2026-09-23)",
      "Äldre versioner bevaras och nya ekonomiska påståenden har inte lagts till (2026-09-23)",
    ],
  },
  {
    title: "Stress föreslås aldrig som energikälla",
    items: [
      "Stress och konflikt räknas inte som något som ger energi i återhämtningsförslag (2026-09-23)",
      "Texten beskriver ärligt dagens logg i stället för ett påstått mönster (2026-09-23)",
    ],
  },
  {
    title: "Rätt tid till nästa aktivitet i barnschemat",
    items: [
      "Minuter kvar räknas från faktisk lokal tid och uppdateras automatiskt (2026-09-23)",
      "Nu/Nästa följer klockan i stället för listans ordning (2026-09-23)",
    ],
  },
  {
    title: "Family Flow möter Mitt batteri och Flow",
    items: [
      "Familjeaktiviteter kan märkas med närvaro, förberedelse, resa och lugn stund efteråt (2026-09-23)",
      "Familj visar \"Vad kräver dig idag?\" utifrån ditt befintliga batteri (2026-09-23)",
      "Återhämtning räknar med förberedelse och resa och prioriterar tiden efteråt (2026-09-23)",
      "Flow väger in familjens åtaganden utan att boka om fasta tider (2026-09-23)",
    ],
  },
  {
    title: "Skydd mot att aktiviteter försvinner",
    items: [
      "Återställde 11 aktiviteter som skrevs över av en äldre enhet (2026-09-23)",
      "Listor slås nu ihop i stället för att skrivas över vid synk (2026-09-23)",
    ],
  },
  {
    title: "Områdesfärger i Family Flow",
    items: [
      "Aktiviteter visar sin områdesfärg i Vecka och Idag (2026-09-23)",
      "Nu/Nästa är lugnt: pictogram, kort text och diskret färgmarkering (2026-09-23)",
    ],
  },
  {
    title: "Ordna dagens lista",
    items: [
      "Aktiviteter i kalenderns dag och Min dag kan flyttas upp eller ner (2026-09-23)",
      "Ordningen sparas per dag och synkas med kontot (2026-09-23)",
    ],
  },
  {
    title: "Familj-genvägen öppnar Family Flow",
    items: [
      "Genvägen Familj på Hem öppnar nu Family Flow-vyn (2026-09-23)",
      "Delningssidan når du fortfarande inifrån Family Flow (2026-09-23)",
      "Redan sparade Familj-genvägar uppdateras automatiskt (2026-09-23)",
    ],
  },
  {
    title: "Barn som etikett inom Familj",

    items: [
      "Barn, Familj gemensamt och Förälder/omsorg finns som etiketter inom Familj (2026-09-23)",
      "Barnaktiviteter kopplas till den befintliga barnprofilen och behåller Familjs färg (2026-09-23)",
      "Familjs pictogrambank täcker fler vanliga aktiviteter kring barnets vardag (2026-09-23)",
    ],
  },
  {
    title: "Redigera, flytta och färgkoda i Family Flow",
    items: [
      "Ändra namn, pictogram, område, tider, återkomst och privata anteckningar på samma aktivitet (2026-09-23)",
      "Flytta en eller flera aktiviteter utan att skapa kopior (2026-09-23)",
      "Lugna, konsekventa områdesfärger i Vecka, Idag och Nu/Nästa (2026-09-23)",
    ],
  },
  {
    title: "Fler vård- och vardagspictogram i Family Flow",
    items: [
      "Ny neutral Vård-kategori med 14 tydliga pictogram för besök och undersökningar (2026-09-23)",
      "Handla, Städa, Tvätta, Packa och Fritid kompletterar vardagsstödet (2026-09-23)",
      "Kort svensk text och fler svenska sökord gör pictogrammen enklare att hitta (2026-09-23)",
      "Alla pictogram använder Lucide med ISC-licens; egna privata bilder finns kvar (2026-09-23)",
    ],
  },
  {
    title: "Pictogram och flexibel kopiering i barnschemat",
    items: [
      "Emoji och stjärnor ersattes av tydliga Lucide-pictogram med kort svensk text (2026-09-23)",
      "Aktivitetsbanken fick sökning och nio tydliga kategorier (2026-09-23)",
      "Aktivitet, dag och vecka kan kopieras till datum eller annat barn utan dubbletter (2026-09-23)",
      "Privata anteckningar stannar hos barnet om de inte väljs uttryckligen, och egna bilder dupliceras privat (2026-09-23)",
      "Dagar kan sparas som återanvändbara mallar utan privata anteckningar (2026-09-23)",
    ],
  },
  {
    title: "Återhämtning när dagen inte går att ändra",
    items: [
      "Flow hittar realistiska luckor mellan dagens fasta hållpunkter, med marginal för restid (2026-09-23)",
      "Förslagen anpassas efter dagens kapacitet och hur lång luckan är (2026-09-23)",
      "Mikropaus, Ljusboost, Stopp och egna vardagsaktiviteter föreslås via befintliga vägar (2026-09-23)",
      "Inget bokas automatiskt – du väljer Ja, Välj annan eller Nej tack (2026-09-23)",
      "Kortet finns i Återhämtning och i Familj, där barnens schema räknas med (2026-09-23)",
    ],
  },
  {
    title: "Veckonummer i kalendrarna",
    items: [
      "Månadsvyn visar veckonummer i en egen kolumn till vänster (2026-09-23)",
      "Vecko- och dagsvyn visar veckonumret i rubriken (2026-09-23)",
      "Barnets veckoschema visar veckonumret ovanför veckan (2026-09-23)",
    ],
  },
  {
    title: "Starkare skydd för sparade aktiviteter",
    items: [
      "Samtidiga vyer delar samma aktuella aktivitetslista så äldre kopior inte skriver över nya ändringar (2026-09-23)",
      "Väntande molnsynk slutförs före automatisk omladdning vid appuppdatering (2026-09-23)",
      "Tidigare versioner av aktivitetsdata arkiveras privat och kan återställas vid behov (2026-09-23)",
    ],
  },
  {
    title: "Barnschemat följer den visuella referensen",
    items: [
      "Barnets schema öppnas som en egen lugn vy med barnets namn och avatar högst upp (2026-09-23)",
      "Veckan visas som ett kompakt färgkodat rutnät med bildstöd och snabblänkar (2026-09-23)",
      "Dagens schema har tydliga dagsdelar och klar, nu och nästa-status (2026-09-23)",
      "Fasta symboler använder tydliga ikoner som visas korrekt på alla enheter (2026-09-23)",
    ],
  },
  {
    title: "Visuellt barnschema 1.0",
    items: [
      "Family Flow visar barnets vecka, idag och ett lugnt fokusläge med Nu och Nästa (2026-09-23)",
      "Aktiviteterna använder samma barnlista som Min dag och kalendern, utan parallellt planeringssystem (2026-09-23)",
      "Aktivitetsbank, egna aktiviteter och privata foton med tillfälliga säkra länkar (2026-09-23)",
      "Frivilliga Flow-förslag för täta dagar, återhämtning och förvarning vid övergångar (2026-09-23)",
    ],
  },
  {
    title: "Family Flow 1.0",
    items: [
      "Nytt område Familj under Mer – få vardagen att fungera för hela familjen (2026-09-23)",
      "Skriv en familjesituation, välj om det gäller dig, ett barn eller familjen, och få små steg utifrån dagens kapacitet (2026-09-23)",
      "Barnprofiler med namn, bild och \"det här brukar hjälpa mitt barn\" – privat, utan diagnosfält (2026-09-23)",
      "Godkända förslag hamnar som vanliga uppgifter i din dag och använder befintligt Nästa rimliga steg (2026-09-23)",
    ],
  },
  {
    title: "Privat Pitch & Investor i admin",
    items: [
      "Ny privat sektion i adminvyn där pitchdeck, ekonomi, financial model, BMC, quick answers och KPI-material kan samlas (2026-09-23)",
      "Filerna ligger i privat lagring och öppnas med tillfälliga länkar – osynligt för vanliga användare, testare och besökare (2026-09-23)",
      "Pitchdeck 5.0 finns nu upplagt, och öppna-knappen stoppas inte längre av popup-blockare (2026-09-23)",
    ],
  },
  {

    title: "Svenska återställs i hela appen",
    items: [
      "Byte tillbaka till svenska sätter tillbaka all översatt text direkt, inga engelska rubriker eller menyord blir kvar (2026-09-22)",
    ],
  },
  {
    title: "Svenska språkvalet stannar på svenska",
    items: [
      "Svenska flaggan byter direkt utan en omladdning som kunde hämta tillbaka engelska (2026-09-22)",
    ],
  },
  {
    title: "Flaggval på inloggningssidan",
    items: [
      "Språkväljaren är nu två små flaggor (svensk och brittisk) i stället för textknappar (2026-09-22)",
      "Aktiva flaggan lyser med violett kant; sidan byter språk direkt som förut (2026-09-22)",
    ],
  },
  {
    title: "Språkval på inloggningssidan",
    items: [
      "Välj Svenska eller English uppe på inloggningssidan, innan du loggar in (2026-09-22)",
      "Hela sidan byter språk direkt och valet följer med in i appen (2026-09-22)",
    ],
  },
  {
    title: "Hela appen på engelska",
    items: [
      "Inställningar → Språk: välj Svenska eller English, valet följer kontot (2026-09-22)",
      "Hela gränssnittet översätts i engelskt läge, även skärmar utan färdig ordlista (2026-09-22)",
      "Översatt text sparas lokalt så att den visas direkt nästa gång (2026-09-22)",
    ],
  },
  {
    title: "Ändra schemat för hand",
    items: [
      "Mitt schema går att ändra själv: lägg till, ändra eller ta bort tider (2026-09-22)",
      "Även tider som Flow läst in från ett uppladdat schema kan justeras (2026-09-22)",
    ],
  },
  {
    title: "Automatiskt pass i Träningsprogram",
    items: [
      "Passet kan köras automatiskt med stor timer, förvarning och automatisk start av nästa övning (2026-09-22)",
      "Ensidiga övningar delar tiden och säger till vid Byt sida; repetitioner väntar på dig (2026-09-22)",
      "Pausa, hoppa över, gå tillbaka, progress och vilotimer – ljudet kan stängas av (2026-09-22)",
    ],
  },
  {
    title: "Realistiska instruktionsbilder i Träningsprogram",
    items: [
      "Alla 58 övningar har en egen realistisk bild med tydliga rörelsefaser (2026-09-22)",
      "Visa hur visar bilden större tillsammans med korta teknikpunkter (2026-09-22)",
    ],
  },
  {
    title: "Enklare Mer med samlade inställningar",
    items: [
      "Mer visar främst MyFloves områden och har en enda tydlig ingång till Inställningar (2026-09-22)",
      "Profil, anpassning, Flow-inställningar, introduktion, ljud och konto finns kvar grupperade på en egen sida (2026-09-22)",
    ],
  },
  {
    title: "Pitchmaterial utan Venture Cup-märkning",
    items: [
      "Venture Cup har tagits bort från filnamn och synligt innehåll i pitchfilmerna och de redigerbara presentationerna (2026-09-22)",
      "Innehåll, språk, format och längd är oförändrade (2026-09-22)",
    ],
  },
  {
    title: "Material uppdaterat med Insikter, familjedelning och energikopplingen",
    items: [
      "Pitchfilmerna (svenska och engelska, 16:9 och 9:16) har nya scener om energikopplingen, Insikter och familjedelning (2026-09-22)",
      "Nya avidentifierade skärmbilder från Insikter och Familj används i film och deck (2026-09-22)",
      "Redigerbar pitchdeck v3 på svenska och engelska med samma 18 avsnitt (2026-09-22)",
      "Living Blueprint 4.5 har egna avsnitt för energikopplingen, Insikter och familjedelning (2026-09-22)",
    ],
  },
  {
    title: "Uppdaterat material och version 5.4",

    items: [
      "Pitchfilmerna (svenska och engelska, 16:9 och 9:16) är uppdaterade med den nya strukturen, Återhämtning och färska skärmbilder (2026-09-22)",
      "Ny redigerbar pitchdeck på svenska och engelska med samma innehåll som filmerna (2026-09-22)",
      "Living Blueprint 4.4 beskriver de fem vägarna, den samlade pausen, energikopplingen och familjedelningen (2026-09-22)",
      "Androidversion 5.4 byggd från samma kodbas som webben (2026-09-22)",
    ],
  },
  {
    title: "Ny struktur: Översikt, Flow, Hälsa och Återhämtning",
    items: [
      "Aktiviteter i Studier, Jobb, Familj, Hem och Återhämtning kopplas till energiloggen med en frivillig energikoll (2026-09-22)",
      "Genomförda träningspass i Träningsprogram ger samma frivilliga energikoll efteråt (2026-09-22)",
      "Insikter visar energi- och måendetrend per vecka och månad, inte bara observationer (2026-09-22)",
      "Familj: inbjudan med länk och valbar delning sak för sak – allt är privat tills du delar det (2026-09-22)",
      "Huvudmenyn är Översikt, Flow, Hälsa, Återhämtning och Mer – QuickFlow ligger inne i Flow (2026-09-22)",
      "Återhämtning har en paus där du väljer 5/10/20/30/60 minuter eller egen tid; Mikropaus och Akut Lugn är borta som separata val (2026-09-22)",
      "Efter paus eller Ljusboost kan du med ett tryck säga om energin känns mer, samma eller mindre – sparas i befintlig energilogg (2026-09-22)",
      "Stopp-knappen och Ljusboost finns kvar oförändrade (2026-09-22)",
      "Veckoplan är inte längre en egen sektion; gamla adressen leder till Översikt och träningsdata är orörd (2026-09-22)",
      "Vikt kan döljas helt i Träningsprogram och tas fram igen när du vill (2026-09-22)",
      "Morgonstart syns under Hälsa i stället för som egen huvudsektion (2026-09-22)",
      "I Matplanering väljer du själv vilka måltider som ska planeras – valet sparas (2026-09-22)",
      "Studier börjar med Nästa steg, med Bryt ner och Klar direkt (2026-09-22)",
      "Mina mönster heter nu Insikter och beskriver vad som syns i din egen data (2026-09-22)",
    ],
  },
  {
    title: "All träning samlad i Träningsprogram",
    items: [
      "Skapa mitt pass med Flow ligger nu högst upp inne i Träningsprogram i stället för på en separat träningssida (2026-09-22)",
      "Skapade pass kan startas, sparas eller läggas direkt i det befintliga träningsprogrammet (2026-09-22)",
      "Mina pass, genomförda pass och färdiga veckoprogram finns i samma träningssektion utan att tidigare data ändrats (2026-09-22)",
      "Den gamla adressen till passbyggaren leder vidare till Träningsprogram (2026-09-22)",
    ],
  },
  {
    title: "Flow bygger passet med AI",
    items: [
      "Skapa mitt pass använder AI som väger in energi, fritext, tid, plats, utrustning, fokus och ömma områden (2026-09-22)",
      "AI:n väljer endast övningar ur MyFloves eget bibliotek, med bild, teknikpunkter och säkerhetsnotis kvar (2026-09-22)",
      "Passet får en kort förklaring i du-form till varför det ser ut som det gör idag (2026-09-22)",
      "Om AI:n inte svarar byggs passet lokalt som tidigare, så du alltid får ett pass (2026-09-22)",
    ],
  },
  {
    title: "Fler övningar i passbiblioteket",
    items: [
      "Övningsbiblioteket har växt till 58 övningar i helkropp, överkropp, underkropp, bål och rörlighet (2026-09-22)",
      "Varje ny övning har egen bild, korta teknikpunkter och en tydlig säkerhetsnotis (2026-09-22)",
      "Fler svårighetsgrader gör att passen kan bli både mjukare och tuffare efter dagens energi (2026-09-22)",
    ],
  },
  {
    title: "Flow skapar ditt pass",
    items: [
      "Ny sida Skapa mitt pass med val av Styrka, Rörlighet, Återhämtning eller Eget upplägg (2026-09-22)",
      "Fritext och chips för energi, tid, plats, utrustning, fokus och känsliga områden (2026-09-22)",
      "Passet anpassas efter dagens energi och väljer bort övningar som ofta belastar det du angett (2026-09-22)",
      "Övningskort med illustration, set och reps, teknikpunkter, byt övning och markera klar (2026-09-22)",
      "Steg-för-steg-läge med vilotimer, samt loggning i historiken och Mina pass (2026-09-22)",
      "Kalorier visas som grov uppskattning och texten är allmän träningsvägledning, inte vård (2026-09-22)",
    ],
  },
  {
    title: "Ny Android-app (version 5.3, versionCode 12)",
    items: [
      "Appfilen för Google Play är uppdaterad till version 5.3 med allt det senaste i appen (2026-09-21)",
      "Filen är osignerad och signeras med egen keystore eller via Play App Signing (2026-09-21)",
    ],
  },
  {
    title: "Redigerbar PowerPoint av Venture Cup-pitchen",
    items: [
      "Den svenska Venture Cup-filmen finns som en redigerbar 16:9-PowerPoint med samma 13 delar och riktiga MyFlove-skärmar (2026-09-21)",
      "Texter, former, färger och bildplaceringar kan ändras direkt; produktbilderna kan ersättas i PowerPoint (2026-09-21)",
      "Mjuka toningar och sammanlagt tre minuters automatisk visningstid gör presentationen redo för filmexport (2026-09-21)",
    ],
  },
  {
    title: "Kalenderdagar öppnas från månad och vecka",
    items: [
      "Ett tryck på ett datum i månadsvyn eller veckovyn visar åter dagens innehåll och åtgärder direkt under kalendern (2026-09-21)",
      "Lägg till, Påminnelse, dagens samlade lista och befintliga redigeringsval fungerar utan byte till Dag (2026-09-21)",
    ],
  },
  {
    title: "Riktiga MyFlove-vyer genom hela Venture Cup-videon",
    items: [
      "De abstrakta bildytorna har ersatts med relevanta delar ur den riktiga MyFlove-produkten (2026-09-20)",
      "Kalender, Historik, Hem, QuickFlow, Mitt batteri, Flow, Min dag och Återhämtning stödjer nu berättelsen visuellt (2026-09-20)",
      "Pitchens text, språk, format, längd och mjuka toningar är oförändrade (2026-09-20)",
    ],
  },
  {
    title: "Renare bildytor i Venture Cup-videon",
    items: [
      "De återkommande grupperna med tre flytande ikonrutor har tagits bort ur alla illustrerade scener (2026-09-20)",
      "Bildytorna använder nu lugna organiska färgfält och en diskret handritad linje i samma redaktionella stil (2026-09-20)",
      "Produktbilder, texter, språk, format, längd och toningar är oförändrade (2026-09-20)",
    ],
  },
  {
    title: "Ny redaktionell design för Venture Cup-videon",
    items: [
      "Alla fyra pitchvideor har fått större typografisk kontrast, riktiga MyFlove-skärmar och handskrivna kommentarer (2026-09-20)",
      "Saknade symboler har ersatts med ritade ikoner och all text har fått säkra marginaler i båda formaten (2026-09-20)",
      "Filmerna är fortsatt exakt tre minuter, helt tysta och använder mjuka toningar (2026-09-20)",
    ],
  },
  {
    title: "Venture Cup 2026 pitchvideo",
    items: [
      "Ny treminuterspitch på svenska och engelska, i både 16:9 och 9:16 (2026-09-19)",
      "Visar riktiga produktskärmar, marknad, kundsegment, positionering, affärsmodell och kapitalcase (2026-09-19)",
      "Fyra helt tysta filmer med blinkfria toningar och tydligt märkta hypoteser (2026-09-19)",
    ],
  },
  {
    title: "Stabilare livevideo för mobil",
    items: [
      "Livevideorna har byggts om utan överlappande scener för att ta bort blinkningar, dubbla bilder och hopp (2026-09-19)",
      "De nya filerna saknar ljudspår och använder mobilkompatibel färg, bildfrekvens och nyckelbilder (2026-09-19)",
      "Fade in och fade out sker nu mot MyFloves lugna lavendelbakgrund (2026-09-19)",
    ],
  },
  {
    title: "Incheckningen dyker upp varje gång",
    items: [
      "\"Hur kändes det?\" visas nu oavsett var du bockar av något – dagslistan, kalendern, Att göra, Jobb och Studier (2026-09-19)",
      "Samma fyra svar som förut, plus Hoppa över – och bara en ruta per avbockning (2026-09-19)",
    ],
  },
  {
    title: "Livevideo med riktiga MyFlove-skärmar",
    items: [
      "Ny 90-sekunders video i 16:9 och 9:16 där varje scen visar en riktig inloggad MyFlove-skärm i telefonram (2026-09-19)",
      "Mjuk fade in och fade out mellan alla bilder och scener (2026-09-19)",
      "Visar Mitt batteri, QuickFlow, Min dag, Flow, Kalender, Återhämtning och Historik – utan musik (2026-09-19)",
    ],
  },
  {
    title: "Ny 90-sekunders marknadsföringsvideo",
    items: [
      "Svensk marknadsföringsvideo i både 16:9 och 9:16, baserad på investerarpitchens layout (2026-09-19)",
      "Visar problemet, det levande batteriet, QuickFlow, Flow, kapacitetsanpassning och energimönster (2026-09-19)",
      "Riktiga MyFlove-skärmar, tydlig text och lugn originalmusik utan berättarröst (2026-09-19)",
    ],
  },
  {
    title: "Ingen vit skärm längre",
    items: [
      "Om något oväntat går fel visas en lugn sida med \"Ladda om\" i stället för en tom skärm (2026-09-19)",
      "Omladdningen rensar gamla sparade filer så appen startar på senaste versionen (2026-09-19)",
    ],
  },
  {
    title: "Flow anpassar det du vill göra efter dagens kapacitet",
    items: [
      "Säg \"Jag vill träna\" eller \"Jag behöver plugga\" – Flow föreslår en rimlig version (2026-09-19)",
      "Finns på Hem, i QuickFlow, på raderna i Min dag och Kalendern samt i Studier och Träning (2026-09-19)",
      "Mindre, Större eller Senare – du bestämmer, och fasta tider ändras aldrig (2026-09-19)",
      "Vid låg kapacitet föreslås Återhämtning i stället för att pressa igenom (2026-09-19)",
    ],
  },
  {
    title: "\"Hur kändes det?\" direkt när du bockar av",
    items: [
      "Mjuk check-in efter avbockning i både Min dag och Kalendern (2026-09-18)",
      "Gav energi, Tog energi, Både och, Vet inte – eller Hoppa över (2026-09-18)",
      "Frågan ställs en gång per avbockning, utan dubbla energiloggar (2026-09-18)",
      "Nytt kort \"Vad ger dig energi?\" på Mitt batteri leder till historiken (2026-09-18)",
    ],
  },
  {
    title: "Välj flashcards, quiz eller båda i Studier",
    items: [
      "Nytt val \"Vad vill du få?\": Både och, Bara flashcards eller Bara quiz (2026-09-15)",
      "Flow skapar bara det du valt och knappen visar vad som kommer (2026-09-15)",
      "Material utan quiz visar ingen quizknapp, och tvärtom (2026-09-15)",
    ],
  },
  {
    title: "Visa mindre viker allt utom översta kortet",
    items: [
      "\"Visa mindre\" på Hem lämnar bara översta kortet med hälsning och snabbknappar (2026-09-15)",
      "Även \"Din dag – när du vill fördjupa\" viks ihop i enkelt läge (2026-09-15)",
      "\"Visa allt igen\" återställer allt som vanligt (2026-09-15)",
    ],
  },
  {
    title: "Egna genvägar på startsidan",
    items: [
      "Nytt block \"Mina genvägar\" på Hem – lägg till det du behöver (2026-09-15)",
      "Ta bort genvägar direkt på Hem eller under Anpassa hemskärmen (2026-09-15)",
      "Valen sparas per konto och följer med mellan enheter (2026-09-15)",
    ],
  },
  {
    title: "Statistik för Återhämtning",
    items: [
      "Mikropaus, Akut Lugn, Ljusboost och Stopp-knappen räknas var för sig, anonymt (2026-09-15)",
      "Nytt adminkort visar vilka pausvägar som används mest (2026-09-15)",
    ],
  },
  {
    title: "Uppdaterat material: blueprint 4.3, pitchdeck 4.3 och nya videor",
    items: [
      "Living Blueprint 4.3 med Återhämtning, Ljusboost, fasta vägar och ärlig statistik (2026-09-15)",
      "Pitchdeck 4.3 med nya sidor om Återhämtning och de fasta vägarna (2026-09-15)",
      "Demovideor EN/SV med ny Återhämtningsscen där solen andas 4–2–6 (2026-09-15)",
      "Reklamfilmer 16:9 och 9:16 uppdaterade med Återhämtning (2026-09-15)",
    ],
  },
  {
    title: "Återhämtning som samlad paussida",
    items: [
      "Paus heter Återhämtning och samlar Mikropaus, Akut Lugn, Ljusboost och Stopp-knappen (2026-09-15)",
      "Android-app 5.2 (versionCode 11) byggd med Återhämtning och fast bottenmeny (2026-09-15)",
      "Centrerad Återhämtning-knapp på Hem (2026-09-15)",
      "Bottenmenyns Paus öppnar Återhämtning och gamla /paus-länkar leder vidare dit (2026-09-15)",
    ],
  },
  {
    title: "Prata med Flow i bottenmenyn",
    items: [
      "\"Prata med Flow\" är en fast plats i bottenmenyn vid sidan av Hem, Kalender och Paus (2026-09-15)",
      "Länken visas kort som \"Flow\" i menyn och markeras tydligt när chatten är öppen (2026-09-15)",
      "Alla övriga funktioner finns kvar som vanligt via Mer (2026-09-15)",
    ],
  },
  {
    title: "Fast bottenmeny: Hem, QuickFlow, Kalender och Paus",
    items: [
      "Samma fyra huvudvägar i bottenmenyn för alla användare (2026-09-15)",
      "Paus leder till den befintliga pausvägen med Mikropaus, Akut Lugn och Ljusboost (2026-09-15)",
      "Egna platser i bottenmenyn pausade; övriga sidor nås via Mer (2026-09-15)",
    ],
  },
  {
    title: "Varmare sol och dovare reflektion i Ljusboost",
    items: [
      "Solen mer orange i kärna och sken, från gult mot djupare orange (2026-09-15)",
      "Vit prickmarkering i vattnet borttagen (2026-09-15)",
      "Ljusreflektionen i vågorna dovare och mer subtil (2026-09-15)",
    ],
  },
  {
    title: "Solen visar andningen i Ljusboost",
    items: [
      "Solen växer under inandningen, vilar i maxläget och krymper under utandningen (2026-09-15)",
      "Solstorlek, sken, värme, reflektion och kursiv text följer samma 4–2–6-animation (2026-09-15)",
    ],
  },
  {
    title: "Färgstarkare och närmare Ljusboost",
    items: [
      "Mättad solnedgång i guld, orange, aprikos, korall, rosa och mjuk lavendel (2026-09-15)",
      "Större och närmare sol med ett tydligare varmt sken över himmel och vatten (2026-09-15)",
      "Kursiv andningstext högre i nedre mitten, sömlöst synkad med skenets 4–2–6-rytm (2026-09-15)",
    ],
  },
  {
    title: "Ljusboost närmare den varma strandreferensen",
    items: [
      "Större, närmare sol med mjuk fotografisk kärna och tydlig visuell tyngd (2026-09-15)",
      "Bred gyllene reflektion genom vågorna mot betraktaren (2026-09-15)",
      "Sol, sken, reflektion och text exakt synkade i en mjuk 4–2–6-rytm (2026-09-15)",
    ],
  },
  {
    title: "Mjukare sol och andningssynk i Ljusboost",
    items: [
      "Större, tydligare sol med varmare gyllene, aprikos, korall och mjuka lavendeltoner (2026-09-15)",
      "Ljusskenet tonar ned vid inandning och växer långsamt vid utandning i samma 4–2–6-rytm som texten (2026-09-15)",
      "Andningstexten övergår mjukt på en fast plats utan kort eller layoutskiften (2026-09-15)",
    ],
  },
  {
    title: "Varmare och sömlös Ljusboost",
    items: [
      "Naturligare gyllene, orange och aprikosfärgad solnedgång med mjuka rosa/lila toner (2026-09-15)",
      "Ny sömlös strandloop utan hopp i sol, vågor eller färg när filmen börjar om (2026-09-15)",
      "Mjukare och mer organisk 4–2–6-andningspuls i ljuset (2026-09-15)",
    ],
  },
  {
    title: "Ljusboost är en verklig strandupplevelse",
    items: [
      "Filmisk strand med tydlig horisont, solnedgång och verkligt rörliga vågor (2026-09-15)",
      "Varmt ljus andas i rytmen 4 sekunder in, 2 sekunder paus och 6 sekunder ut (2026-09-15)",
      "Verkligt CC0-inspelat havsljud som du själv startar och kan stänga av (2026-09-15)",
      'Diskreta texter: "Följ ljuset", andningsrytm och "Du behöver inte göra något just nu." (2026-09-15)',
      'Välj 90 sekunder, 5, 10 eller 15 minuter och avsluta med "Lite mer landad?" (2026-09-15)',
    ],
  },
  {
    title: "Ärlig användarstatistik i adminvyn",
    items: [
      'Nytt kort "Användare (konton)" som räknar personer, inte webbläsare (2026-09-15)',
      "Aktiva användare = inloggad senaste 30 dagarna och har egen sparad data (2026-09-15)",
      'Gamla enhetsmåttet heter nu "Aktiva enheter" (2026-09-15)',
      "Test- och demokonton redovisas separat och påverkar inte statistiken (2026-09-15)",
    ],
  },
  {
    title: "Studier är en lugnare sida",
    items: [
      'Schemauppladdningen är hopfälld under "Ladda upp eller byt schema" (2026-09-15)',
      'Hem-valet heter nu "Vill du visa nästa lektion på Hem?" och är frivilligt (2026-09-15)',
    ],
  },
  {
    title: "Reklamvideo: Så hjälper Flow",
    items: [
      "En verklig Flow-dialog visar hur låg energi möts med omplanering och ett litet nästa steg (2026-09-15)",
      "Reklamfilmen finns i både 16:9 för pitch och 9:16 för sociala medier (2026-09-15)",
      "Den stående filmen har mer luft mellan budskapet och mobilen (2026-09-15)",
    ],
  },
  {
    title: "Svensk version av 30-sekundersdemon",
    items: [
      "Demon finns nu även på svenska med samma design och berättelse (2026-09-14)",
      'Demons texter är översatta, från "En lugnare vardag" till avslutet (2026-09-14)',
    ],
  },
  {
    title: "Ny 30-sekunders produktdemo",
    items: [
      "Engelsk demo följer QuickFlow → Flow → kapacitetsanpassning → Min dag (2026-09-14)",
      "Designen följer investerarpitchens ljusa lavendel-, rosa- och plommonfärgade uttryck (2026-09-14)",
      "Riktiga MyFlove-vyer visar hur samma uppgifter anpassas efter dagens kapacitet (2026-09-14)",
    ],
  },
  {
    title: "Rutiner och Medicin är en samlad sida",
    items: [
      "Dagens rutiner och doser visas först i en gemensam kompakt lista (2026-09-14)",
      "Flikarna är ersatta av ett enkelt flöde med Rutiner, Medicin och Morgonstart bakom tydliga val (2026-09-14)",
      "Påminnelser leder nu till den samlade sidan i stället för att visa en andra medicinhantering (2026-09-14)",
      "Avbockning, tider, upprepning, påminnelser och synkning fungerar som tidigare (2026-09-14)",
    ],
  },
  {
    title: "Lugnare Barn, Familj och Relationer",
    items: [
      'Barn: barnvalen högst upp, "Lägg till barn" fälls ut vid behov och dagens hållpunkter i en kompakt lista (2026-09-14)',
      'Barn: veckoschema, påminnelser och ta bort barn samlade under "Mer om barnen" (2026-09-14)',
      'Familj: din familj med medlemmar och kod, raden "Vad ni delar" och "Lämna familjen" under "Mer" (2026-09-14)',
      'Relationer: alla personer i en lista, typval vid tillägg och övriga inställningar under "Mer" (2026-09-14)',
    ],
  },
  {
    title: "Jobb är en samlad sida",
    items: [
      "Jobb och Jobbplanering ligger nu på samma sida med dagens plan överst (2026-09-14)",
      'Ny Jobbhjälp-sektion med "Kom igång", "Dina projekt" och "Ny arbetsuppgift" (2026-09-14)',
      'Fördjupat innehåll som kapacitet, övergångar och avslut ligger under "Mer i jobb" (2026-09-14)',
      "Jobbplanering är borttagen som egen menypost; gamla länkar leder till Jobb (2026-09-14)",
    ],
  },
  {
    title: "Studier är en samlad sida",
    items: [
      "Studier, Studiehjälp och kurser ligger nu på samma sida med Mitt schema överst (2026-09-14)",
      "Schemafilen sparas och kan öppnas igen; rast och lunch läses av som hållpunkter (2026-09-14)",
      'Nytt val: "Visa nästa lektion på Hem" – diskret rad på Hem när du vill ha den (2026-09-14)',
      "Studiehjälp är borttagen som egen menypost; gamla länkar leder till Studier (2026-09-14)",
    ],
  },
  {
    title: "Idag är nu ett utvecklat dagkort",
    items: [
      "Idag visar datum och alla dagens aktiviteter i en enda kompakt lista med Lägg till och Påminnelse nära till hands (2026-09-14)",
      "Tider, uppgifter, rutiner och kalenderposter visas tillsammans; genomförda saker ligger kvar dämpade i samma lista (2026-09-14)",
      "Separata gjort-/att göra-/tider-/kalenderblock och den tomma 06–22-tidslinjen är borttagna från dagvyn (2026-09-14)",
      "Kalenderns Dag-läge följer samma enkla listidé utan att ändra vecka eller månad (2026-09-14)",
    ],
  },
  {
    title: "Lugnare hem: Paus samlat och Flow kopplat till nästa steg",
    items: [
      'Dagens tanke och "Gör den enklaste saken" är borttagna som egna funktioner på Hem (2026-09-14)',
      "Ny samlad Paus-väg med Mikropaus, Akut Lugn och Stopp-knappen – diskret ingång på Hem och egen väg under Mer (2026-09-14)",
      'FlowScore visas direkt ovanför "Nästa rimliga steg" med "Varför just detta?" för fördjupning (2026-09-14)',
    ],
  },
  {
    title: "Resor och Promenadvägar är borttagna",
    items: [
      "Resesidan och pendlingsvarningarna är borttagna ur menyer, guider och layout (2026-09-14)",
      "Promenadvägar är borttaget från Träning (2026-09-14)",
      "Fokus ligger på QuickFlow, energi, Flow, Min dag, anteckningar och vardagsstöd (2026-09-14)",
    ],
  },
  {
    title: "Det du sparat blir lättare att hitta igen",
    items: [
      'Hem visar en liten "Kom ihåg"-rad när det finns öppna saker i QuickFlow eller öppna anteckningar (2026-09-14)',
      "Raden visar bara antal och leder till den befintliga fullständiga hanteringen; den dubbla QuickFlow-listan på Hem är borttagen (2026-09-14)",
      "Saker som väntat ett tag får en lugn påminnelse utan skuldbeläggande språk (2026-09-14)",
    ],
  },
  {
    title: "Kapacitetskortet fungerar på mobil",
    items: [
      'Kortet "Vad påverkar din kapacitet?" staplar ikon, rubrik och förklaring på smala skärmar så texten inte längre överlappar (2026-09-14)',
    ],
  },
  {
    title: "Dagsvyn ligger under Dag i kalendern",
    items: [
      "När Dag är vald ligger rubriken, Lägg till-knappen, dagens innehåll och tidslinjen inuti kalenderkortet direkt under vyvalet (2026-09-14)",
    ],
  },
  {
    title: "Kalenderkopplingen säger till när åtkomsten behöver förnyas",
    items: [
      "Om Google/Outlook nekar läsning av kalendern (401/403) ber appen dig nu koppla om kontot i stället för att tyst visa en tom kalender (2026-09-14)",
    ],
  },
  {
    title: "Dagvyn syns direkt i kalendern",
    items: [
      "När Dag väljs i kalendern visas dagens innehåll direkt under vyvalet – tidigare låg det under kalenderkopplingen så vyn såg tom ut (2026-09-13)",
      "Kalenderkopplingen (Google/Outlook) ligger nu under dagens innehåll (2026-09-13)",
    ],
  },
  {
    title: "Kalenderns dagvy och batterikort",
    items: [
      "Kalenderns tidslinje visas åter när Dag är vald, utan att den förenklade dagsöversikten tas bort (2026-09-13)",
      "Batterikortet ovanför kalendern använder hela bredden på mobil och lämnar inte längre en tom kolumn (2026-09-13)",
    ],
  },
  {
    title: "Enklare startsida",
    items: [
      "Startsidan är förenklad: ett lugnt flöde med Flow, tydlig 'Kom igång'-knapp och länk för befintliga användare (2026-09-13)",
      "Det svepbara tio-vyers-introet är ersatt av tre enkla kort som förklarar hur Flow hjälper, plus en liten sidfot (2026-09-13)",
    ],
  },
  {
    title: "Enkla ingångar i hela appen",
    items: [
      "Planera i Flow: energi + tid + 'Skapa min FlowPlan' är enda huvudsteget; 'Behöver du planera om?' ligger hopfällt (2026-09-13)",
      "Chatt i Flow öppnar direkt i samtalet; lägesbilden 'Idag' är hopfälld från start (2026-09-13)",
      "Rutiner, Medicin, Städning och Feedback: huvudhandlingen först, sekundära block hopfällda från start – läget sparas (2026-09-13)",
    ],
  },
  {
    title: "Samma enkla ingång i Kalender och QuickFlow",
    items: [
      "Kalender visar dagens innehåll direkt; månadsöversikten med vyer och filter ligger hopfälld bakom ett sparat klick (2026-09-13)",
      "QuickFlow börjar med frågan 'Vad snurrar i huvudet?' och infångningen; sortering, lista, anteckningar och regler ligger bakom 'Det du fått ur huvudet' (2026-09-13)",
      "Alla ingångar från Hem följer nu samma mönster: enkel huvudvy först, fördjupning bakom klick (2026-09-13)",
    ],
  },
  {
    title: "Enklare Flow-ingång",
    items: [
      "Flow öppnar med en enkel ingång: 'Vad passar bäst just nu?' och knappen 'Visa mitt förslag' (2026-09-13)",
      "Planera och Chatta nås som diskreta val och en hopfälld 'Mer om Flow'-sektion förklarar lägena (2026-09-13)",
      "Hjälpkarusellen är borttagen – 'Visa mitt förslag' leder direkt till planeringen, och planering, chatt och all funktionalitet finns kvar (2026-09-14)",
    ],
  },
  {
    title: "Enklare första upplevelse",
    items: [
      "Hem börjar med frågan 'Vad behöver du just nu?', en tydlig QuickFlow-handling och fyra jämna kärnkort (2026-09-13)",
      "Dagens steg, nästa rimliga sak och lugna pauser finns kvar bakom ett sparat, hopfällbart block (2026-09-13)",
      "Första introduktionen leder direkt till en enkel QuickFlow-handling eller vidare till Hem (2026-09-13)",
      "Mitt batteri och Min dag visar nu en enkel huvudhandling först, med befintliga detaljer bakom ett sparat klick (2026-09-13)",
    ],
  },
  {
    title: "Android 5.1 (versionCode 10)",
    items: [
      "Android-appens versionCode höjd 9 → 10 och versionName till 5.1 inför nästa Play-uppladdning (2026-09-12)",
      "Capacitor-projektet omsynkat med config, plugins och webbrot (2026-09-12)",
    ],
  },
  {
    title: "Svensk marknadsanalys i admin",
    items: [
      "Analysdelen har ett Sverige-först-block med samma svenska målgruppssiffror och marknadsresa som investerarpitchen (2026-09-12)",
      "Externa marknadsuppskattningar är tydligt separerade från MyFloves anonyma användningsdata och länkade till Socialstyrelsen (2026-09-12)",
    ],
  },
  {
    title: "Investerarpitchen fokuserar på Sverige först",
    items: [
      "Ny marknadsslide med svenska siffror: ≈500 000 barn och vuxna med ADHD eller autism, ~3 % av vuxna med ADHD (källa Socialstyrelsen) (2026-09-12)",
      "Go-to-market omarbetad till 'Prove it in Sweden. Then scale.' med stegen Pilot → Validate → B2C Sweden → Nordics & B2B/B2G (2026-09-12)",
      "Sidnumreringen är rättad och konsekvent (01–13); PowerPoint, PDF och Word-versionen är uppdaterade (2026-09-12)",
    ],
  },
  {
    title: "Inga dubbletter i Dagens lista",
    items: [
      "Samma sak som finns både som rutin och kalenderpost visas nu bara en gång i Dagens lista, Idag, Hem och Flow (2026-09-12)",
      "Vid sammanslagning behålls den avbockade posten, annars kalenderposten/uppgiften framför rutinen (2026-09-12)",
    ],
  },
  {
    title: "Uppdaterad engelsk investerarpitch",
    items: [
      "Den engelska investerarpitchen har korrekt sidnumrering (2026-09-12)",
      "Den inbäddade 27-sekundersvideon ligger nu på slide 5, och den tidigare slide 6 är borttagen (2026-09-12)",
      "En ny marknadssida visar 140M+ vuxna med ADHD, cirka 3 % vuxenprevalens och marknadstillväxt från $1.9B till $6.7B år 2033 (2026-09-12)",
    ],
  },
  {
    title: "Säkerhetslås för kalenderkopplingar",
    items: [
      "Krypterade kalenderkopplingar är låsta för all klientåtkomst och nås bara av serverns egen kod (2026-09-11)",
      "Säkerhetskontrollen är omkörd utan kvarstående kritiska fynd, så 5.0 kan publiceras (2026-09-11)",
    ],
  },
  {
    title: "MyFlove 5.0 och ny Android AAB",
    items: [
      "Webbappen, Living Blueprint, pitchdeck, pitchvideo, investerarpitch och byggdokumentation är synkade till MyFlove 5.0 (2026-09-11)",
      "5.0 omfattar den guidade dagsresan, Flow-åtgärder efter godkännande, sparad chatthistorik, Google-/Outlook-kalender, belastningskarta och sorterad anonymiserad adminanalys (2026-09-11)",
      "Android använder versionName 5.0 och versionCode 9; en osignerad AAB måste signeras före uppladdning till Google Play (2026-09-11)",
    ],
  },
  {
    title: "Sortering i användare och roller",
    items: [
      "Användarlistan i admin kan sorteras på alla kolumner: namn, senast aktiv, senaste inloggning, skapad och roller (2026-09-11)",
      "Klicka på kolumnrubriken för att byta sorteringsriktning (2026-09-11)",
    ],
  },
  {
    title: "Sortering i hela statistikdelen",
    items: [
      "Alla listor på adminsidans statistik kan nu sorteras: vad människor använder, kapacitet & mående, mest använda delar, mest besökta sidor och funktioner som faktiskt används.",
      "Varje lista har knapparna Mest först, Minst först och A–Ö.",
    ],
  },
  {
    title: "Sortera analysen per användare",
    items: [
      "Listan under Analys per användare kan sorteras: nyast aktiv först, äldst först, flest eller färst händelser (2026-09-11)",
    ],
  },
  {
    title: "Statistiken visar nu alla dagar",
    items: [
      "Analys per användare läste bara de första 1 000 händelserna, alla från samma tidiga datum (2026-09-11)",
      "Hela perioden läses nu in, så händelser, användare och datum stämmer (2026-09-11)",
    ],
  },
  {
    title: "Flyttade uppgifter hamnar aldrig bakåt i tiden",
    items: [
      'Flows "flytta till imorgon" ger alltid ett kommande datum (2026-09-11)',
      "Ett felaktigt datum kunde tidigare få uppgiften att se flera hundra dagar försenad ut (2026-09-11)",
    ],
  },
  {
    title: "Flow fortsätter i din senaste chatt",
    items: [
      "Öppnar du Flow landar du i ditt senaste samtal istället för en ny tom chatt (2026-09-11)",
      '"Nytt samtal" gäller bara den gången – nästa gång är historiken tillbaka (2026-09-11)',
    ],
  },
  {
    title: "Flow kan faktiskt flytta, dela och förenkla en uppgift",
    items: [
      "Flows förslag om att flytta, dela upp eller förenkla en uppgift blir en knapp i chatten (2026-09-11)",
      "Inget ändras förrän du godkänner förslaget (2026-09-11)",
      "Tidigare sa Flow att den flyttade uppgiften utan att något hände (2026-09-11)",
    ],
  },
  {
    title: "ICS-import/export borttagen från Kalender",
    items: [
      'Knapparna "Importera från telefonens kalender" och "Exportera till kalender (.ics)" är borta (2026-09-11)',
      'Kalendern synkas istället via "Din riktiga kalender" med Google eller Outlook (2026-09-11)',
      "Underliggande ICS-hjälpfil och tillhörande översättningar är borttagna (2026-09-11)",
    ],
  },
  {
    title: "Outlook-kopplingen är aktiv",
    items: [
      "Microsoft Outlook App User Connector är nu länkad till projektet (2026-09-11)",
      "Outlook visas som alternativ i Kalender bredvid Google (2026-09-11)",
      "Samma Lovable gateway-återvändandeadress används för Microsoft OAuth (2026-09-11)",
    ],
  },
  {
    title: "Koppla kalendern till Google eller Outlook",
    items: [
      'Du kan koppla ditt eget Google- eller Outlook-konto i Kalender under "Din riktiga kalender" (2026-09-11)',
      "Händelser från ditt konto visas i appen för den valda dagen (2026-09-11)",
      "Dagens aktiviteter kan skickas till kalendern och uppdateras i stället för att dubbleras (2026-09-11)",
      "Kopplingen är personlig och kan tas bort när som helst (2026-09-11)",
    ],
  },
  {
    title: "Genomgång av hela appen: dubbletter, länkar och enhetlig design",
    items: [
      "Alla sidor och genvägar har gåtts igenom: varje länk och gammal adress leder rätt (2026-09-11)",
      "Rubriken på varje sida ser likadan ut i hela appen (2026-09-11)",
      "Barn, Familj och Kalender använder samma lila/rosa personfärger (2026-09-11)",
      "Fel på Barn-sidan med knapp inuti knapp i schemarubriken är rättat (2026-09-11)",
      "Tio oanvända dubblettvyer har tagits bort ur koden utan att någon funktion påverkas (2026-09-11)",
    ],
  },
  {
    title: 'Andningsglöd inne i "Din dag, i din takt"',
    items: [
      'Andningsglöden ligger nu inne i kortet "Din dag, i din takt" i stället för i sidans bakgrund, och pulserar tydligt bakom hälsningen och batteriet (2026-09-11)',
      "Innehåll, dagslogik och inställningen för minskad rörelse är oförändrade (2026-09-11)",
    ],
  },
  {
    title: "Visuellt starkare 3-minuters investerarpitch",
    items: [
      "Den engelska investerarpitchen har byggts om med riktiga appbilder och en tydligare berättelse från problem till genomförbar dag (2026-09-11)",
      "Samma uppgifter med hög energi/4 timmar och låg energi/30 minuter är presentationens visuella kärna (2026-09-11)",
      "PowerPoint, PDF och Word innehåller samma 13 visuella slides; talarmanuset finns kvar i PowerPoint (2026-09-11)",
    ],
  },
  {
    title: "Ny demoslide i pitchdecket",
    items: [
      "Demosliden i pitchdecket 4.2 och i den engelska 3-minuterspitchen är utbytt mot den nya 27-sekundersdemon (2026-09-11)",
      "Sliden visar QuickFlow → Flow → planen anpassas efter kapacitet → Min dag (2026-09-11)",
    ],
  },

  {
    title: "Demon visar hur planen ändras",
    items: [
      "Demofilmen visar samma uppgiftslista planerad med hög energi och 4 timmar respektive låg energi och 30 minuter (2026-09-11)",
      "Riktiga skärmar visar att stegen blir kortare när kapaciteten är låg; demon är nu 27 sekunder (2026-09-11)",
    ],
  },

  {
    title: "Handla/köpa hamnar i Inköpslistan",
    items: [
      "Skriver du något om att handla eller köpa i ＋ Lägg till föreslås varan också till Inköpslistan (2026-09-11)",
      "Förslaget kan stängas av, och varunamnet rensas automatiskt (2026-09-11)",
    ],
  },

  {
    title: "Pitchdeck som PDF och Word",
    items: [
      "Pitchdecket 4.2 finns nu även som Word (DOCX) med alla slides, inklusive demosliden sist (2026-09-11)",
      "PDF och Word kan laddas ner direkt från pitchsidan (2026-09-11)",
    ],
  },

  {
    title: "20-sekunders produktdemo",
    items: [
      "Kort demo på engelska som visar kedjan QuickFlow → Flow → Min dag med riktiga skärmar (2026-09-11)",
      "Demon kan laddas ner separat som MP4 från pitchsidan (2026-09-11)",
      "Demon finns som egen slide i pitchdecket 4.2 och i den engelska 3-minuterspitchen (2026-09-11)",
    ],
  },
  {
    title: "Living Blueprint 4.2",
    items: [
      "Ny blueprint 4.2 som beskriver dagsresan i tre steg, enkelt läge och hopfällbara block (2026-09-11)",
      "Batteri mot faktisk tid, belastningskarta och kvällscheck finns med i dokumentet (2026-09-11)",
      "Kan laddas ner som DOCX och PDF från pitchsidan (2026-09-11)",
    ],
  },
  {
    title: "Pitchvideo och pitchdeck 4.2",
    items: [
      "Nytt pitchdeck 4.2 som speglar dagens app: guidad dagsresa, lugnt gränssnitt, enkelt läge och hopfällbara block (2026-09-11)",
      "Batteriet mot faktisk tid, belastningskartan och kvällschecken finns med i decket (2026-09-11)",
      "Ny 60-sekunders pitchvideo 4.2 och uppdaterade nedladdningar på pitchsidan (2026-09-11)",
    ],
  },
  {
    title: "Lugnare Hem",
    items: [
      '"Nästa rimliga steg" ligger nu inuti "Din dag, i din takt" direkt under "Idag" (2026-09-11)',
      'Dagens tanke och Rutiner & medicin ligger nu under "Mer i MyFlove" (2026-09-11)',
      "God morgon-kortet är tillfälligt borttaget från Hem för att hålla startsidan lugnare; det finns kvar under Rutiner & medicin (2026-09-11)",
    ],
  },

  {
    title: "Enhetlig design och tydligare andningsljus",
    items: [
      "Hela appen har samma mjuka pastelllila bakgrund bakom de vita korten (2026-09-11)",
      "Andningsljuset är starkare: 4 sekunder in, 5 sekunder ut, 1 sekunds vila (2026-09-11)",
      "Ljusets färg och tempo följer dagens belastning (2026-09-11)",
    ],
  },
  {
    title: "Akut Lugn och Mikropaus på mobil",
    items: [
      "Den lugna pausskärmen visas i helskärm på mobilen i stället för att klippas (2026-09-11)",
      "Text, timer och Flow är anpassade till små skärmar och mobilens säkra ytor (2026-09-11)",
    ],
  },
  {
    title: "God morgon borttaget från Hem",
    items: [
      "Morgonstart-kortet ligger inte längre direkt på Hem; det finns kvar under Rutiner & medicin (2026-09-11)",
    ],
  },

  {
    title: "Visuell belastningskarta",
    items: [
      "Insikter visar batteri och faktiskt genomförda aktiviteter per dag, vecka och månad (2026-09-11)",
      "Dagvyn omfattar 28 dagar, veckovyn 12 veckor och månadsvyn 12 månader (2026-09-11)",
      "Kartan visar bara sammanställda nivåer och antal, aldrig aktivitetsnamn eller privata anteckningar (2026-09-11)",
    ],
  },
  {
    title: "Batteritrend mot faktisk belastning",
    items: [
      "Insikter visar batteriets utveckling över 14 dagar tillsammans med faktiskt genomförda aktiviteter (2026-09-11)",
      "Planerade men inte genomförda aktiviteter räknas inte som belastning, och samband visas först när underlaget räcker (2026-09-11)",
      "Incheckningar före och efter aktiviteter ger en mer direkt jämförelse när sådant underlag finns (2026-09-11)",
    ],
  },
  {
    title: "Lugn, kapacitetsstyrd Hem-skärm",
    items: [
      "Hälsning, snabba val, batteri och dagens schema samlas i en lugn vit huvudyta (2026-09-11)",
      "En mjuk bakgrundsglöd anpassar färg och andningsrytm efter dagens kalender- och Quickflow-belastning (2026-09-11)",
      "Minskad rörelse och NPF-stillhet stänger av bakgrundens animation (2026-09-11)",
    ],
  },
  {
    title: "Lugnare hemskärm",
    items: [
      'Korten "Insikter" och "Din vardag" är borttagna från hemskärmen (2026-09-11)',
      "Mönstren från din vardag visas nu inne i Insikter (2026-09-11)",
      "Rutiner & medicin ligger kvar på Hem som ett eget block (2026-09-11)",
    ],
  },
  {
    title: "Zero-Guilt UX och Akut Lugn",
    items: [
      "Hem öppnar med en lugn hälsning, tydligt batteri och exakt två konkreta val från FlowScore (2026-09-11)",
      "Akut Lugn pausar påminnelser i 15 minuter och döljer dagens krav bakom en stillsam paus med Flow (2026-09-11)",
      'Passerade och uppskjutna uppgifter samlas under "Saker vi tar när du har energi" utan varningsspråk (2026-09-11)',
      "Mjuk haptik, upplösning och varm återkoppling ersätter konfetti vid slutförande och uppskjutning (2026-09-11)",
    ],
  },
  {
    title: "Fäll ihop block i hela appen",
    items: [
      "Alla gemensamma MyFlove-block kan nu minimeras och öppnas på appens olika sidor (2026-09-11)",
      "Öppet eller minimerat läge sparas per sida och block på den aktuella enheten (2026-09-11)",
      "Större specialbyggda block använder samma tydliga pil och sparade beteende (2026-09-11)",
    ],
  },
  {
    title: "Fäll ihop block på Hem",
    items: [
      "Flow, de tre huvudstegen, nästa rimliga steg, kvällschecken och övriga informationskort på Hem kan minimeras var för sig (2026-09-11)",
      "Varje val sparas så Hem behåller den mängd information användaren valt (2026-09-11)",
    ],
  },
  {
    title: "Enklare läge för NPF",
    items: [
      'Ny knapp på Hem: "Vill du ha det lugnare? Visa mindre på skärmen" slår på enkelt läge med ett tryck (2026-09-11)',
      "Enkelt läge visar bara hälsningen och kärnflödet Hur mår du? → Vad händer? → Planera om? (2026-09-11)",
      "Huvudstegen får kortare förklaringar och bara den viktigaste statusraden; allt annat återkommer med Visa allt igen (2026-09-11)",
      "Knappen visar rätt läge genom att följa samma inställning som faktiskt döljer innehållet (2026-09-11)",
      'Flow-maskoten blir helt stilla vid "Ingen rörelse" – även blinkningar och blick (2026-09-11)',
    ],
  },
  {
    title: "Sluttid i Lägg till",
    items: ["När du lägger till något med tid kan du nu också välja sluttid (2026-09-10)"],
  },
  {
    title: "Fix: konstiga tecken i loggningsknappen",
    items: [
      'Knappen på Hem visade "&amp;" – visar nu korrekt "Logga energi & mående" (2026-09-10)',
    ],
  },
  {
    title: "Välj start- och slutdag för mensen",
    items: [
      "Datumval för när mensen började och slutade – hela perioden sparas på en gång (2026-09-10)",
      "Sparade perioder listas och kan tas bort; snabbknappen för dagens mensdag finns kvar (2026-09-10)",
    ],
  },
  {
    title: "Ny adminöversikt: Hur går MyFlove?",
    items: [
      "Fyra tydliga KPI-kort högst upp: Aktivitet, Aktiva användare, Återkomst och Flow-användning (2026-09-09)",
      "Nya block för kärnflödet, mest använda delar med begripliga namn, kapacitet & mående samt återkomst (2026-09-09)",
      "Detaljerad eventstatistik och export ligger hopfällt längst ner; datainsamling och integritet oförändrade (2026-09-09)",
    ],
  },
  {
    title: "Ladda ner analysen",
    items: [
      "CSV- och PDF-nedladdning direkt i Analys per användare, med samma filtrering som vyn visar (2026-09-09)",
    ],
  },
  {
    title: "Analys per användare och Endast externa användare",

    items: [
      "Ny adminvy med händelser per webbläsare, aktiva dagar, senaste aktivitet och admin-/demomärkning (2026-09-09)",
      "Växlare som räknar bort grundar-, admin-, demo- och testanvändning utan att någon befintlig händelse ändras (2026-09-09)",
    ],
  },
  {
    title: "3-minuters investerarpitch på engelska",
    items: [
      "Nytt engelskt pitchdeck i tolv slides för Connect Östs Online Pitch Review 10 september 2026 (2026-09-08)",
      "Talarmanus finns som anteckningar per slide; PowerPoint och PDF länkas från investerarsidan (2026-09-08)",
    ],
  },
  {
    title: "Android AAB versionCode 8",
    items: [
      "versionCode höjd till 8 och versionName till 4.4 efter att Play Console meddelat att tidigare kod redan använts (2026-09-07)",
      "Bygg om AAB:n lokalt med bun run cap:sync && bun run android:aab innan uppladdning (2026-09-07)",
    ],
  },
  {
    title: "Android AAB versionCode 7",
    items: [
      "versionCode höjd till 7 och versionName till 4.3 i android/app/build.gradle (2026-09-07)",
      "Innehåller guidad dagsresa, kvällscheck kopplad till energi, Steg 3-justeringar och Insikter bredvid Rutiner & medicin (2026-09-07)",
      "Bygg lokalt med: bun install && bun run cap:sync && bun run android:aab (2026-09-07)",
    ],
  },
  {
    title: "Insikter & Rutiner sida vid sida",
    items: [
      "Insikter-kortet och Rutiner & medicin ligger nu i en gemensam tvåkolumnsrad på Hem, även på mobil (2026-09-07)",
      "Båda korten behåller sin expanderbara funktion och hamnar på samma rad när båda är synliga (2026-09-07)",
    ],
  },
  {
    title: "Steg 3: planera om dagen",
    items: [
      "Nytt Steg 3 i Planera: Flow föreslår att flytta, förenkla eller dela upp dagens saker (2026-09-07)",
      "Varje förslag har en tydlig godkännandeknapp – inget ändras förrän du säger ja (2026-09-07)",
      "Fasta tider och deadlines inom ett dygn flyttas aldrig (2026-09-07)",
    ],
  },
  {
    title: "Kvällschecken kopplad till dagens energi",
    items: [
      "Hur blev dagen? sparas med dagens ork, batteri, planerade och klara saker (2026-09-07)",
      "Nytt avsnitt Förväntat och faktiskt visar sambandet mellan planen och hur dagen kändes (2026-09-07)",
      "Efter några kvällar syns ett mönster: vid hur många saker dagarna brukar bli som väntat (2026-09-07)",
    ],
  },
  {
    title: "Lägg till i Vad händer?",
    items: [
      "＋ Lägg till-knappen ligger nu i steg 02 Vad händer? på Hem (2026-09-07)",
      "Steg 02 har två vägar: Planera dagen och Lägg till (2026-09-07)",
    ],
  },
  {
    title: "Insikter bredvid Rutiner & medicin",
    items: [
      "Insikter-kortet (MyFlove har lagt märke till…) ligger nu bredvid Rutiner & medicin på Hem (2026-09-07)",
    ],
  },
  {
    title: "Din dag börjar här – tre tydliga steg",
    items: [
      "Hem är nu en guide: 01 Hur mår du?, 02 Vad händer?, 03 Behöver du planera om? (2026-09-07)",
      "Varje steg visar sin egen status: energi/påverkan registrerad, antal planerade och klara saker, och om dagen behöver anpassas (2026-09-07)",
      "Ny enkel sida Hur mår du? med fyra ork-val och frivillig påverkan – sparas i befintlig energi- och påverkansdata (2026-09-07)",
      "Nästa rimliga steg visar ETT förslag i taget, med ett mindre steg när energin är låg (2026-09-07)",
      "Kvällscheck: Hur blev dagen? – lättare, som väntat eller tyngre än väntat, sparas med dagens ork och aktiviteter (2026-09-07)",
      "Övriga kort på Hem ligger kvar i den hopfällbara sektionen Mer i MyFlove (2026-09-07)",
      "Ny statistik för dagsresan: steg 1/2/3 öppnade, nästa steg visat/accepterat och kvällscheck genomförd (2026-09-07)",
    ],
  },
  {
    title: "Påverkan efter morgonkortet + allt går att fälla ihop",
    items: [
      "Påverkan-kortet ligger nu direkt efter Morgon och kväll (god morgon-kortet) på Mitt batteri (2026-09-07)",
      "Alla kort på Mitt batteri kan minimeras/expanderas och läget sparas (2026-09-07)",
    ],
  },
  {
    title: "Energi, Påverkan & Flow i adminstatistiken",
    items: [
      "Ny sektion i adminstatistiken som visar hur ofta Påverkan, Energi, Mående, Hälsofaktorer och Flow används (2026-09-07)",
      "Visar antal gånger och antal besökare per händelse, helt anonymt (2026-09-07)",
    ],
  },
  {
    title: "Påverkan flyttad upp i incheckningen",
    items: [
      "Påverkan-kortet ligger nu högst upp på Mitt batteri, direkt bredvid Logga just nu (ork & mående) (2026-09-07)",
      "Dagens observationer visas som egen sektion under incheckningen (2026-09-07)",
    ],
  },
  {
    title: "Lägg till direkt från Hem + mätning av återkommande användning",
    items: [
      "Ny tydlig ＋ Lägg till-knapp högst upp på Hem – skriv en rad och välj Aktivitet, Händelse, Påminnelse eller Bara en tanke (2026-09-07)",
      "Allt sparas i befintlig data: uppgifter i Kalender/Idag/Flow, händelser och påminnelser bland påminnelserna, tankar i Quickflow (2026-09-07)",
      "Anonym mätning av återkomst: första öppning, aktiva dagar och återkomst efter 1, 7 och 30 dagar (2026-09-07)",
      "Nya statistikhändelser Lägg till öppnad och Skapat via Lägg till, med läsbara namn i adminstatistiken (2026-09-07)",
    ],
  },
  {
    title: "Försenade uppgifter följer med in i idag",
    items: [
      "En öppen uppgift vars datum passerat (t.ex. ”Ring tandläkaren” igår) visas nu i Idag/Min dag tills den blir gjord – den försvinner inte tyst längre (2026-09-07)",
      "Framtida uppgifter ligger kvar på sin planerade dag, och avklarade poster hör fortfarande till sitt planerade datum (2026-09-07)",
    ],
  },
  {
    title: "Påverkan kan föreslå lägre batteri – du bestämmer",
    items: [
      "När du registrerat påverkan idag och batteriet står högre än rimligt föreslår batterikortet varsamt en lägre nivå – inget ändras automatiskt (2026-09-06)",
      "Förslaget anpassas efter grad (lite/måttligt/mycket) och om det påverkar nu eller har påverkat (2026-09-06)",
      "Avböjer du frågan ställs den inte igen samma dag (2026-09-06)",
      "Godkännande loggas som en vanlig energiobservation – befintlig dataväg, inga nya system (2026-09-06)",
    ],
  },
  {
    title: "Android AAB versionCode 5 förberedd",
    items: [
      "versionCode höjd till 5 i android/app/build.gradle – 4 fanns redan i Google Play Console (2026-09-06)",
      "Innehåller senaste webbändringar: rutiner i kalendern, påverkan, rätt vardagslogik och tydlig notisstatus (2026-09-06)",
      "Lokal byggning: bun install && bun run cap:sync && bun run android:aab (2026-09-06)",
    ],
  },
  {
    title: "Android AAB versionCode 4 förberedd",
    items: [
      "versionCode höjd från 3 till 4 i android/app/build.gradle (2026-09-06)",
      "Innehåller senaste webbändringar: rutiner i kalendern, påverkan, rätt vardagslogik och tydlig notisstatus (2026-09-06)",
      "Lokal byggning: bun install && bun run cap:sync && bun run android:aab (2026-09-06)",
    ],
  },
  {
    title: "Android AAB versionCode 3 förberedd",
    items: [
      "Webbprojektet byggt och typkontrollerat inför ny Android-release (2026-09-06)",
      "versionCode höjd från 2 till 3 i android/app/build.gradle (2026-09-06)",
      "Capacitor-konfigurationen och mobile-webroot uppdaterade till nya ljuslila bakgrundsfärgen #F9F7FD (2026-09-06)",
      "Lokal byggning: bun install && bun run cap:sync && bun run android:aab (2026-09-06)",
    ],
  },
  {
    title: "Vardagsrutiner dyker inte upp på helgen",
    items: [
      "Rutiner inställda på vardagar visas inte längre på lördag/söndag, även om de skapades en helgdag (2026-09-06)",
      "Veckovisa rutiner följer sin veckodag i stället för att också dyka upp på startdagen (2026-09-06)",
    ],
  },
  {
    title: "Kalendern visar rutiner och påverkan",
    items: [
      "Återkommande rutiner syns i månads-, vecko- och dagvyn på alla dagar där regeln infaller (2026-09-06)",
      "Påverkan-kortet finns i kalenderns dagvy för idag – registrera direkt där (2026-09-06)",
    ],
  },
  {
    title: 'Notiser: tydlig status och "Testa notis"',
    items: [
      "Nytt notiskort visar om den här enheten verkligen är registrerad för notiser (2026-09-06)",
      'Knappen "Testa notis" skickar en riktig push via servern (2026-09-06)',
      "Morgonstart förklarar lugnt när notiser inte är påslagna i stället för att låtsas fungera (2026-09-06)",
      "Hjälp för iPhone-hemskärm samt not om tyst läge, Stör ej och strömsparläge (2026-09-06)",
    ],
  },
  {
    title: "Återkommande aktiviteter är en rutin, inte fem kopior",
    items: [
      "En återkommande aktivitet sparas som en post med repetitionsregel och visas på rätt dagar (2026-09-06)",
      "Avbockning gäller bara dagens förekomst – nästa dag ligger kvar som ej klar (2026-09-06)",
      "Genomföranden sparas per förekomst, så historiken finns kvar även om rutinen ändras (2026-09-06)",
      "Engångsaktiviteter fungerar exakt som tidigare (2026-09-06)",
    ],
  },
  {
    title: "Påverkan: nu eller tidigare",
    items: [
      "Välj om det påverkar dig nu eller har påverkat dig – plus graden Lite/Måttligt/Mycket (2026-09-06)",
      "Valet sparas med dagen, syns i Historik och används som bakgrund av Flow (2026-09-06)",
      'Äldre registreringar tolkas som "Påverkar mig nu" – inget går förlorat (2026-09-06)',
    ],
  },
  {
    title: "Påverkan och menscykel styr dagens prioriteringar",
    items: [
      "Flow väger in dagens påverkan (val + grad) när Quickflow-listan prioriteras (2026-09-06)",
      "Menscykeln används som bakgrund om användaren själv aktiverat den för Flow (2026-09-06)",
      "Samma bakgrund används när en uppgift förtydligas – första steg och energinot anpassas (2026-09-06)",
      "Batterinivån ändras aldrig automatiskt och inga medicinska slutsatser dras (2026-09-06)",
    ],
  },
  {
    title: "Påverkan i historiken och valbara mönster",
    items: [
      "Historik visar dagens registrerade påverkan (val + grad) per dag – även dagar utan aktiviteter (2026-09-06)",
      'Nytt hopfällbart kort "Mina mönster" på Mitt batteri – stängt som standard, öppnas bara när man vill (2026-09-06)',
      "Mönster byggs enbart på egen data och visar lugn text i stället för påhittade mönster när underlaget är litet (2026-09-06)",
    ],
  },
  {
    title: "Kapacitet, påverkan och frivillig menscykel",
    items: [
      '"Vad påverkar din kapacitet?" – diskret kort under batteriet med grupperna Kropp & hälsa, Känslor & tankar och Omgivning (2026-09-06)',
      "Flera val samtidigt, grad Lite/Måttligt/Mycket, enkelt att ändra eller ta bort (2026-09-06)",
      "Frivillig menscykel: aktiveras med Ja/Nej i Min profil, helt dold om man väljer Nej (2026-09-06)",
      "Enkel cykelvy på Mitt batteri: mensdag, uppskattad tidslinje och symtom – uppskattningar, inga medicinska påståenden (2026-09-06)",
      "Personliga mönster byggs bara på egen registrerad data och kan stängas av för Flow (2026-09-06)",
    ],
  },
  {
    title: "Påverkan i Mitt batteri",
    items: [
      "Ny funktion: ange vad som påverkar dagens kapacitet (känslomässigt, mentalt, familj, jobb, oro m.m.) – flera val möjliga – med graden Lite/Måttligt/Mycket (2026-09-06)",
      "Påverkan sparas med dagen och ges till Flow som kontext för dagens prioriteringar – batterinivån ändras aldrig automatiskt (2026-09-06)",
    ],
  },
  {
    title: "MyFlove-ikon i Android-appen",
    items: [
      "Standardikonen (Capacitor) ersatt med MyFloves officiella logotyp (2026-09-05)",
      "Ikoner genererade från public/logo.svg för alla Android-densiteter, inklusive rund ikon och adaptive icon (2026-09-05)",
      "Adaptive icon-bakgrunden är nu MyFloves lila i stället för vitt (2026-09-05)",
      "versionCode höjt till 2, versionName fortfarande 4.1 (2026-09-05)",
    ],
  },
  {
    title: "Health Connect borttaget ur Android-MVP:n",
    items: [
      "Steg-behörigheten READ_STEPS och Health Connect-intent-filtret borttagna ur Android-manifestet (2026-09-04)",
      "capacitor-health-beroendet och dess Gradle-moduler borttagna ur Android-bygget (2026-09-04)",
      "Träningssidan fungerar som förut med manuell inmatning av steg (2026-09-04)",
    ],
  },
  {
    title: "Android-projekt redo för Google Play",
    items: [
      "Native Android-projekt skapat med paketnamn app.myflove.mobile och version 4.1 (2026-09-04)",
      "Release-signering via lokal keystore.properties eller miljövariabler – inga nycklar i repot (2026-09-04)",
      "Behörigheter för notiser, vibration och steg tillagda i manifestet (2026-09-04)",
      "Nya kommandon för att synka, öppna och bygga .aab (2026-09-04)",
    ],
  },
  {
    title: "Hela appen på engelska",
    items: [
      "Quickflow, Kalender/Idag, Mitt batteri och Mående, Historik, Veckoöversikten, Anteckningar och mappar samt adminöversikten byter språk (2026-09-04)",
      "Veckoöversiktens genererade meningar och veckodagar översätts också (2026-09-04)",
      "Datum och veckodagar följer språkvalet i historik och kalender (2026-09-04)",
      "Översättningarna ligger i egna ordlistor per område – svenska är fortfarande källspråk och fallback (2026-09-04)",
    ],
  },
  {
    title: "Svenska och engelska i MyFlove",
    items: [
      "Ny språkväljare i Min profil – Svenska eller English, sparat på kontot (2026-09-04)",
      "Navigation, hälsningar och hela startsidan byter språk direkt (2026-09-04)",
      "Flow-rösten (tomma vyer, bekräftelser, fel och uppmuntran) finns översatt (2026-09-04)",
      "Svenska är källspråket – saknad översättning visar svensk text i stället för tom ruta (2026-09-04)",
    ],
  },
  {
    title: "Appstatistiken visar rätt antal användare igen",
    items: [
      "Registrerade användare, nya senaste 7 dagarna och registreringsdiagrammet visade 0 trots att nya användare fanns – databasfunktionen avvisade serverns anrop (2026-09-04)",
      "Funktionen tillåter nu serverns säkra anrop men är helt stängd för direktanrop från vanliga konton (2026-09-04)",
      "Verifierat inloggad i webbläsaren: statistiken visar rätt antal (2026-09-04)",
    ],
  },
  {
    title: "Städningssidan följer appens layout",
    items: [
      "Städningssidan har samma sidhuvud som övriga sidor, med tillbaka-knapp, emoji och mjuk gradient (2026-09-04)",
      'Lägesval, översiktskort och "Det här behöver du" tar hela bredden igen – inget kläms ihop eller trunkeras (2026-09-04)',
    ],
  },
  {
    title: "Läsbar appstatistik och tydligare adminöversikt",
    items: [
      "Appstatistiken visar begripliga svenska namn på alla delar och handlingar i stället för tekniska koder (2026-09-04)",
      "Mest besökta sidor visar sidans namn med sökvägen som liten hjälptext (2026-09-04)",
      "Okända händelser snyggas till automatiskt i stället för att visas råa (2026-09-04)",
      "Adminöversikten har en direktknapp till Appstatistik (2026-09-04)",
    ],
  },
  {
    title: "Helhetsgenomgång: historiken visar avbockade aktiviteter rätt",
    items: [
      "En engångsaktivitet som bockas av en annan dag visas som genomförd på sin planerade dag, med den faktiska dagen sparad separat (2026-09-04)",
      "Flyttade aktiviteter ligger kvar bara på sitt nya datum och räknas aldrig som genomförda på ursprungsdagen (2026-09-04)",
      "Stabilare testkörning så hela sviten inte blir slumpmässigt röd (2026-09-04)",
    ],
  },
  {
    title: "Quickflow: flera saker eller en hel tanketömning",
    items: [
      "Quickflow fångar både flera saker i samma text och längre tanketömningar utan att dela sönder texten (2026-09-04)",
      "Ser det ut som en längre anteckning frågar Flow försiktigt: spara som anteckning eller behåll i Quickflow – inget flyttas automatiskt (2026-09-04)",
      "Efter fångsten väljer du: Saker att göra, Spara som anteckning, Lägg i mapp eller Påminn mig senare (2026-09-04)",
      "Anteckningen behåller hela originaltexten, mapp är frivillig och inga dubbletter skapas (2026-09-04)",
    ],
  },
  {
    title: "Flow som följeslagare på startsidan",
    items: [
      "Flow möter dig på hem-sidan med en kort fråga och tre–fyra enkla val: Få ur mig något, Kolla min dag, Kolla min ork, Hjälp mig välja (2026-09-04)",
      "Flow reagerar på din egen data: låg ork ger färre val, genomförd aktivitet frågar om energipåverkan, liggande Quickflow-poster får varsamma alternativ och söndagar lyfter veckoöversikten (2026-09-04)",
      "Valen ordnas efter vad du faktiskt använder mest – och Flow går alltid att stänga (2026-09-04)",
    ],
  },
  {
    title: "Större Flow på startsidan",
    items: [
      "Flow syns tydligare i morgonhälsningen på hem-sidan – maskoten är större och texten får mer luft (2026-09-04)",
    ],
  },
  {
    title: "Energiloggning påverkar bara batteriet",
    items: [
      "Energi- och måendeloggningar syns inte längre i kalendern eller dagens lista – de påverkar batteriet, energihistoriken och mönstren (2026-09-04)",
      'Appstatistiken loggar nu historik, veckoöversikt, energipåverkan efter aktivitet och "jag gjorde något" via serverfunktionerna (2026-09-04)',
    ],
  },
  {
    title: "Investerarsidan öppen för investerarkontot",
    items: [
      "Investerarsidan (/pitch) nås nu både med grundarkontot och med investerarkontots egen inloggning (2026-09-05)",
      "Tillbaka-länken anpassas: hem för investerare, admin för grundaren (2026-09-05)",
    ],
  },
  {
    title: "Mappar för anteckningar och mjukare Quickflow",
    items: [
      "Anteckningar kan sorteras i egna mappar – skapa, byt namn, ta bort och filtrera (2026-09-05)",
      "Förslag på mappar när du inte har några egna än (2026-09-05)",
      "Quickflow frågar mjukare om saker som blivit liggande, med fem enkla alternativ (2026-09-05)",
      "MyFlove lär sig vilket alternativ du oftast väljer och lägger det först (2026-09-05)",
    ],
  },
  {
    title: "Investerarmaterial version 4.1",
    items: [
      "Investerarsida, Living Blueprint, pitchdeck och pitchvideo delar nu samma version: 4.1 (2026-09-04)",
      "Ny pitchvideo 4.1: enkel start → Quickflow → Batteriet → Kalendern → energihistorik → veckoöversikt → adaptiv personalisering (2026-09-04)",
      "Pitchdeck 4.1: Batteriet som enkel ork-check-in, gemensam neutral start och datumkorrekta aktiviteter (2026-09-04)",
      "Living Blueprint 4.1 med de sex nya produktprinciperna och uppdaterad produktkarta (2026-09-04)",
    ],
  },
  {
    title: "Din vecka, historik och energi per aktivitet",
    items: [
      "💜 Din vecka på söndagar – lugn sammanfattning av veckan som varit (2026-09-04)",
      "Ny sida Historik: vad hände den här dagen, och vad gav eller tog energi (2026-09-04)",
      "Varje förekomst av en återkommande aktivitet har egen dag, status och energi (2026-09-04)",
      "Fyra snabba svar efter en aktivitet: gav / neutral / tog lite / tog mycket (2026-09-04)",
    ],
  },
  {
    title: "MyFlove lär sig din vardag",
    items: [
      "Startsidan visar vilka veckodagar som brukar bli fullast och lugnast (2026-09-04)",
      "MyFlove ser vilka aktiviteter som brukar ta mer energi – utifrån dina egna loggar (2026-09-04)",
      "Inget visas förrän underlaget räcker – inga gissningar (2026-09-04)",
    ],
  },
  {
    title: "Samma lugna design i hela appen",
    items: [
      "Alla sidhuvuden följer startsidans mjuka gradient, rundning och skugga (2026-09-04)",
      "Kort och block har samma tunna kant som startsidans kort (2026-09-04)",
    ],
  },
  {
    title: "Allt sparas + Flow hör av sig",
    items: [
      "Namnet i Min profil sparas automatiskt medan du skriver (2026-09-04)",
      "Flow skickar proaktiva notiser: fråga om orken, mjuk puff vid full dag och låg ork, samt hjälp att sortera Quickflow (2026-09-04)",
      "Puffarna når dig även när appen är stängd – som mest en per dag och regel (2026-09-04)",
    ],
  },
  {
    title: "Livsprofilen flyttar in i Min profil",
    items: [
      "Min livsprofil ligger nu på sidan Min profil – namn, barn och din vardag på ett ställe (2026-09-04)",
      "En enda profilingång i menyn; gamla länkar leder vidare dit (2026-09-04)",
    ],
  },
  {
    title: "Min profil: namn och barn",
    items: [
      "Ny profilsida där du sätter ditt namn och lägger till barnens namn och färger (2026-09-04)",
      "Namnet styr Hej-hälsningen på startsidan och rubriken på Mitt batteri, synkat mellan enheter (2026-09-04)",
      "Barnen återanvänder den befintliga barnfunktionen – ingen ny datamodell (2026-09-04)",
    ],
  },
  {
    title: "Enklare frågor och adaptiv personalisering",
    items: [
      "En enda energifråga: Hur mycket ork har du idag? med fyra svar – ingen procent eller skattningsskala (2026-09-04)",
      "Mående är separerat, frivilligt och tar sekunder: fem ansikten plus egna ord om du vill (2026-09-04)",
      "Påverkansfaktorer ligger bakom Visa mer – enkelt först, mer när det behövs (2026-09-04)",
      "Alla börjar från samma grund; startsidans tre kort anpassas först efter din faktiska användning (2026-09-04)",
    ],
  },
  {
    title: "Startsidan matchar ny design (mockup)",
    items: [
      "Tre huvudkort i en rad med centrerad ikon: Quickflow, Batteriet (med procent) och Kalendern (2026-09-04)",
      "Stort Ditt batteri-kort med tydlig siffra, lugn hälsning och länk till tips (2026-09-04)",
      "Idag-sektionen har radlayout med tid, titel, anteckning, pil och länk till dagsschemat (2026-09-04)",
      "Nytt citatkort med hjärta: Små steg varje dag skapar stora förändringar (2026-09-04)",
    ],
  },
  {
    title: "Ny startsida: lugn personlig kontrollpanel",
    items: [
      "Liten hero med hälsning och tre huvudkort: Quickflow, Ditt batteri och Kalendern (2026-09-04)",
      "Ny Idag-sektion med max 5 av dagens saker och länk till hela dagen (2026-09-04)",
      "Från ditt huvud visar senaste QuickFlow-tankarna, plus ett lugnt batteri- och återhämtningskort (2026-09-04)",
    ],
  },
  {
    title: "Notiser även när appen är stängd",
    items: [
      "Uppgifter med tid schemaläggs 14 dagar framåt istället för bara idag och imorgon (2026-09-04)",
      "Påminnelserna synkas om var 15:e minut och när appen öppnas igen (2026-09-04)",
      "Tappad push-prenumeration återskapas automatiskt när tillstånd redan finns (2026-09-04)",
    ],
  },
  {
    title: "QuickFlow får hjärnikon",
    items: [
      "QuickFlow visas nu med en hjärnikon i sidomenyn, bottenmenyn, toppmenyn, den flytande knappen och fångstryten (2026-09-03)",
      "Även den runda QuickFlow-knappen i bottennavigeringen visar nu hjärnan istället för ett plus (2026-09-03)",
    ],
  },
  {
    title: "Live-synk mellan enheter",
    items: [
      "Kalender, Min dag och QuickFlow uppdateras automatiskt när samma konto ändras på en annan enhet (2026-09-03)",
      "Batteri och energiflöde läser in nya energiloggar, energifaktorer och sparade val utan omladdning (2026-09-03)",
      "Befintlig kontosynk och datamodell återanvänds; inkommande ändringar skapar inga dubbletter (2026-09-03)",
    ],
  },
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
