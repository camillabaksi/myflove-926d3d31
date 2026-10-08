# Roadmap

## Sista avgränsade finjusteringen (2026-10-08)
- [x] Godkänd plan: endast hälsningens smala storlek ändras till 34 px; befintliga Tankar-stenar och Min plats 32 px behålls.
- [ ] Verifiera mobilvyer, stenbildens kontrollsumma och tester; leverera bilder utan publicering.

## Slutpolish och visuellt lås (2026-10-08)
- [x] Godkänd plan, inventering och endast tre presentationsändringar.
- [x] 501 tester, automatiskt bygge, bildkontrollsumma och mobil/desktop-kontroller. Separat typkontroll ej körd.
- [x] Fem bilder och rapport levererade; inga fler visuella ändringar.
- [ ] Användarens visuella godkännande/designlås: små Tankar/sidebar-stenar och befintlig Min plats-klippning vid 200 % samt Tankar-dark-kontrast rapporterade. Ingen publicering.

## Typografisk hierarki (2026-10-08)
- [x] Godkänd plan; explicita editorialroller och funktionell Inter, oförändrade stenar och övrig design.
- [x] 500 tester godkända och automatiskt bygge OK; mobil/desktop-, 200 % skalnings-, dark/light- och fokuskontroller genomförda.
- [x] Fem screenshots levererade; ingen publicering. Granskningspunkt: vid 360 px bryts Camillabaksi på två namnrader; 390/430 px har två rader totalt. Stenlåset förhindrar layoutändring; inga visuella ändringar efter bilderna.

## Paceable etapp 1D — detaljpolish (2026-10-07)
- [x] Visa avgränsad plan och invänta godkännande.
- [x] Ändra endast Min plats-navsymbol, Idags aktivitetsrader och svensk datumtypografi; bevara Etapp 1C och all funktionalitet.
- [ ] Verifiera hela testsviten, separat typkontroll, automatiskt bygge och Idag/nav på mobil och desktop.
- [ ] Dokumentera och leverera tre nya 390 px-bilder efter verifiering; inga ändringar därefter och ingen publicering.

## Paceable etapp 1C — slutlig visuell polish (2026-10-07)
- [x] Separera CTA-, selected-, navigation- och Capacity-färger utan att skapa en ny universell huvudfärg.
- [x] Förenkla Idag, Pace, Min plats-symbol/header och Tankars presentation/copy utan Core- eller dataändring.
- [x] Verifiera kalenderprickarnas orsak och korrigera endast ett påvisat presentationsfel.
- [x] Kör tester, typkontroll och preview-bygge; kontrollera 360/390 px och desktop, reduced motion, fokus och kontrast.
- [x] Ta nya 390 px-skärmbilder av Idag, Kalender, Tankar, Min plats samt närbild av Min plats aktiv. Ingen publicering.

## Paceable rebrand etapp 1 (2026-10-07)
- [x] Ta emot visuell riktning och skyddsgränser; kartlägg befintlig design/navigation för en konkret plan.
- [x] Visa implementationsplan och invänta godkännande — godkänd med förtydliganden om aktiv QuickFlow-route, återanvändbara SVG-stenar och visuell stoppregel.
- [x] Efter godkännande: design tokens, app shell/navigation, Idag, Tankar, Min plats, Kalender, Mer och sparsamma stenar; bevara Core och tekniska identifierare.
- [x] Efter implementation: regressionstester, mobil/dator/tillgänglighet, dokumentation och slutrapport. Ingen publicering eller native-/SEO-rebrand.
- Verifierat: `/idag`, `/kalender`, `/quickflow`, `/halsa`, `/hem` och `/min-dag` kontrollerade inloggat i 390/1280 px utan sidöverflöde; `/min-dag` redirectar fortsatt till `/idag`. Femdelad mobilnavigation, Paceable-varumärke och återanvända Tankar/Min plats-vägar syns. Typecheck, riktade Core/familjetester och bygge är godkända. Hela sviten gav 494/495 godkända; ett befintligt krypteringslagringstest var instabilt och berörs inte av rebranden. Ingen publicering eller fysisk enhetstest.

## Paceable Core v1 (2026-10-07)
- [x] Kartlägg återanvändning, Today-vägar, Capacity Mode, lagring och familjeskydd; presentera implementationsplan före appändring.
- [x] Konsolidera primär Today med registrerad Capacity, befintlig kvalitativ Load och transparent Pace; behåll tekniska identifierare och legacy-data.
- [x] Lägg till frivillig hjälp att göra dagen lättare utan automatiska ändringar; bevara barnschema read-only.
- [x] Kontrollera unknown/future, familj, språk och mobil/dator; uppdatera dokumentation och rapportera legacy/risker. Ingen publicering.
- [x] Leverera slutrapportens 17 punkter, inklusive fysisk iOS-/Android-begränsning.
- Verifierat: Capacity-prioritet och framtidsspärr, deterministisk Pace, okänd Load/längd, tidsluckor/överlapp, recovery och familjededuplicering täcks av tester. `/idag`, `/hem`, `/kalender` och `/min-dag` kontrollerades inloggat i 390/768/1280 px utan overflow eller sidfel; redirecten består, mode-/prestationsytor saknas och öppnade granskningsdialoger ändrar inget. Fysiska iOS-/Android-enheter är inte testade. Ingen databas-, RLS-, auth-, route-, nyckel-, mobil-ID- eller publiceringsändring.

## Lugnare månad, barnschema och Flow (2026-10-07)
- [x] Beskriv befintliga datumrutor, färger, avbockningsvägar och Flow-stöd före ändring.
- [x] Förenkla månad till datum, verklig kapacitet idag/historiskt och en prick per område; inget framtidsbatteri.
- [x] Gör barnschema helt utan avbockning i alla vyer, med tidsstyrt fokus; behåll egna uppgifter.
- [x] Förfina ett situationsanpassat Flow-stöd, testa mobil/dator och uppdatera dokumentation. Ingen publicering eller DB/RLS-ändring.
- Verifierat med befintliga aktiviteter: framtidsbatterier 0, högst fyra prickar, barnets Idag/schema/editor utan klar-knappar och egna uppgifter fortsatt avbockningsbara. Mobil utan sidöverflöde, inga sidfel, 63 tester godkända och senaste bygge OK. Ingen testaktivitet sparad.

## Familjelager i kalendern (2026-10-07)
- [x] Kartlägg befintliga kalenderposter, barnschema, närvarometadata och rättigheter; beskriv lösningen före implementation.
- [x] Bygg familjelager med lägen, val av barn, gruppering, visuellt sekundära block och uttrycklig Behöver mig; bevara kapacitet och egna uppgifter.
- [x] Gör barnschemats NU/SEDAN/SEN tidsstyrt utan prestationskrav; kontrollera tester, mobil/dator och dokumentera. Ingen publicering.
- Verifierat på mobil och dator: familjeläget kan stängas av, barn kan väljas och egna aktiviteter finns kvar; familjekontext kräver användarens val vid planering. Sextio tester godkända och senaste bygge OK. Ingen databas-/RLS-ändring eller publicering.

## Kalenderns områdesfärger (2026-10-07)
- [x] Använd befintliga livsområden för mjuka färgmarkeringar i alla tre kalendervyer; behåll områdesnamn och ikoner.
- [x] Kontrollera färger, kvarvarande aktiviteter och ändringsloggar. Ingen publicering beställd.
- Kontrollerat i månad/vecka/dag med befintliga aktiviteter, färgnyckel och mobil 411 px utan sidöverflöde; tretton tester godkända och inga sidfel. Inga aktiviteter ändrade eller sparade.

## Startsidans viktigaste delar (2026-10-07)
- [x] Välj kompakt layout för kalender, dagens energibatteri, måendelogg och QuickFlow.
- [x] Återanvänd befintliga uppgifter och handlingar, kontrollera startsidan och uppdatera ändringsloggar. Ingen publicering beställd.
- Kontrollerat: fyra ingångar, kapacitetsdetaljer, befintlig måendelogg, QuickFlow och kalenderöppning; 360/430/700 px utan horisontellt överflöde, nio tester godkända. Inga testobservationer eller aktiviteter sparade.

## Samlad kalender (2026-10-07)
- [x] Integrera veckomål, incheckning, filter och kalenderkoppling i den visuella kalendern utan dubbla översikter; bevara dagens befintliga verktyg.
- [x] Kontrollera layout, verktyg och kvarvarande aktiviteter; uppdatera ändringsloggar. Ingen publicering beställd.

## Kalender: sex publiceringssteg (2026-10-07)
- [ ] Månadsvy: förtydligad och kontrollerad (8 tester, skärm och inga sidfel); publicering beställd, inväntar bekräftad driftsättning.
- [x] Veckovy mobil 1–3 dagar med svep (2026-10-07).
- [x] Veckovy: publicering beställd 2026-10-07 tillsammans med dagsvy.
- [x] Dagsvy med drag-and-drop, tidslinje, energibalans och att få gjort: publicering beställd 2026-10-07.
- [ ] Tidslinje: kontrollera tidsblock och luft, publicera.
- [ ] Energibalans: tydlig jämförelse utan falsk precision, kontrollera och publicera.
- [ ] Att få gjort: direkt avbockning och tidsplanering, kontrollera och publicera.
- Nästa steg väntar på att månadsvyns publicering blir klar; vid kontroll serverades ännu tidigare version. Ändra inte nästa steg före bekräftad publicering.

## Visuell kalender (2026-10-07)
- [x] Kartlägg befintlig kalender, datakällor, kapacitetsberäkning och behörighetsgränser; presentera plan före implementation.
- [x] Bygg gemensam perioddata och mockupens månad/vecka/dag utan parallella modeller.
- [x] Inför tidsblock, luft utifrån kända sluttider, oschemalagt, snabbplanering och godkända Flow-förslag; flytt/längd via formulär samt musdragning av egna engångsposter.
- [x] Granska mobil/dator, periodlogik, överlapp, avbockningskällor och kontogränser; uppdatera dokumentation och ändringsloggar. Publicera inte.
- Begränsningar: inga sparande teständringar i användarens konto; flytt/ångra och fler-enhetssynk behöver isolerat testkonto för fullständig ändringsverifiering. Extern Google-läsning avvisades av leverantören och behöver återanslutning. Fysiska telefoner är inte testade. Längd ändras via formulär, inte draghandtag. Befintliga konto-/familjedokument har inte serverpaginering.

## Slogan och engelska på landningssidan (2026-10-05)
- [ ] Byt slogan i aktuell landningssida och senaste pitchdeck/blueprint utan att ändra originalen.
- [ ] Ge besökare språkval och översätt hela landningssidans exempel och dialoger till engelska; kontrollera mobil och dator.

## Pitchmaterial i uppladdade filmens design (2026-10-04)
- [x] Anpassa svensk och engelsk pitch samt Living Blueprint till filmens lavendel/rosa formspråk, skrivstilsaccenter och grundarporträtt.
- [x] Bevara innehåll och tidigare filer; granska alla 22 sidor i varje nytt dokument och samla version 6.4 i Files.

## Pitchdeck och Living Blueprint 6.3 (2026-10-04)
- [x] Uppdatera svenska och engelska versioner med grundarporträtt, befintliga produktbilder och nya Flow-funktioner.
- [x] Redovisa daterad webb- och kontostatistik med källor och tydliga begränsningar.
- [x] Leverera redigerbara presentationer och blueprint-dokument samt sidgranskade PDF:er i Files.

## Felsökning Android + iOS från grunden (2026-10-04)
- [ ] Ljud, larm, vibration och notiser i mobilappen – bara det man bett om.
- [ ] Inloggning, kontobyte och data i mobilappen.
- [ ] Utseende, knappar, länkar och skärmkanter i mobilappen.
- [ ] Rätta tydliga fel, kontrollera, uppdatera ändringsloggar.

## Min Flow: sammanhängande rum (2026-10-02)
- [x] Ersätt avvikande Flow i fåtöljen med den godkända figuren i en enda fast scen.
- [x] Dölj inkompatibla poser, kläder, lösa tillbehör och rumsöverlägg utan att radera sparade val.
- [ ] Skapa en riktig sittande pose av samma Flow, integrerad med dynans perspektiv och ljus. Dagens godkända figur har en stående pose.
- [ ] Skapa ett hårspänne anpassat till denna pose och en helscen som inte ändrar Flows päls eller ansikte.
- [x] Verifiera rum och förhandsvisning på 360, 390 och 430 px samt minskad rörelse.

## Levande Min Flow (2026-10-02)
- [x] Dag, kväll och natt med manuellt testläge, lugn vandring mellan fyra platser och nattvila.
- [x] Bottenpanel för val av kläder, accessoarer och rumsdetaljer med förhandsvisning och kontobunden sparning.
- [x] Kontrollera mobil, minskad rörelse och äldre länk till anpassningen.

## Flow i rummet (2026-10-02)
- [x] Använd uppladdad Flow-animation som integrerad figur i fåtöljen och låt Flow röra sig i rummet.
- [x] Lägg till lugna, frivilliga te- och filtstunder med alternativ för minskad rörelse.
- [x] Kontrollera rummet på mobil och uppdatera ändringsloggarna.

## Min Flow etapp 1 (2026-10-02)
- [x] Visa Min Flow under Flow-fliken och behåll QuickFlow separat.
- [x] Återanvänd chatt och kontobunden synk för frivilliga minnen och utseende.
- [x] Visa rumsteman och valfri rörelse utan belöningssystem.
- [x] Verifiera mobil, minskad rörelse, chatt, sparning och navigering i förhandsvisningen.

## Landningssida enligt skiss 2 (2026-10-01)
- [x] Varm krämvit/sandfärgad startsida, liggande dagsvy och efterfrågad text/navigering.
- [x] Kontrollera mobil, dator, länkar och videoknapp.

## Startsida (2026-10-01)
- [x] Bygg skissinspirerad landningssida med verklig dagsvy, tre kärnfördelar och fungerande inloggning/registrering.
- [x] Kontrollera utseende och länkar i mobil- och datorbredd.

## Android App Bundle 5.6 (2026-09-30)
- [x] Höj versionCode till 15 och versionName till 5.6, bygg och kontrollera AAB.
- [ ] Signering för Google Play väntar på den befintliga uppladdningsnyckeln; ingen ny nyckel får ersätta den.

## Barnvyn i Familje Flow (2026-09-30)
- [x] Kompakta barnkort med Schema, Hjälp och meny; barnprofil med stöd och barnspecifika sparade övningar.
- [x] Barnspecifikt situationsstöd utan att blanda ihop barn eller ändra befintlig lagring.
- [x] Verifiera mobil, desktop, behörighet, tester och ändringsloggar.

## Typografi (2026-09-30)
- [x] Visa tre teckensnitt och använd valt Caveat sparsamt i personliga hälsningar, upprätt och utan ändring av appens övriga text.
- [x] Visa egna aktivitetsnamn och kalenderposter i Caveat på Hem, i dag-/veckovyn och i uppgiftslistan; behåll tider och kontroller i lättläst standardtypsnitt.

## UX-förenkling 1.0 (2026-09-27)
- [x] Förenkla Hem, Hälsa, Mitt batteri, Flow, Min dag, Återhämtning, Studier, Familj/Barn och Inställningar med primär handling först och fördjupning bakom klick.
- [x] Förklara batteriets faktiska uppskattning utan att förväxla den med valt kapacitetsläge; gör lathunden kort och klickbar.
- [x] Verifiera mobilbredder och desktop, kontroller, tester och uppdatera båda ändringsloggarna.

## Städning (godkänd audit 2026-09-25)
- [x] Steg 1: Konsolidera prioritet till priority-engine
- [x] Steg 2: Fullt/Mellan/Lågt som primär kapacitetskälla
- [x] Steg 3: FlowPlan kopplas till prioritet + kapacitet
- [x] Steg 4: En kapacitetskontroll, samma plan i UI och inventering av äldre planeringsdelar
- [x] Steg 5: Slutlig kodstädning av verifierat oanvända planeringssystem

- [x] Skapa komplett tvåspråkigt materialpaket: sammanhängande Living Blueprint, svenska/engelska pitchdeck och uppdaterade pitchfilmer i 16:9 och 9:16 (2026-09-25)

- [x] Förtydliga Dagsvyn med gemensamma pictogram, områdesfärger och lugnare aktivitetsrader (2026-09-24)

- [x] Uppdatera privata Pitch & Investor-filer med uppladdat pitch-, BMC-, statistik- och marknadsmaterial (2026-09-24)

- [x] Uppdatera komplett pitchpaket, pitchfilmer, Living Blueprint och centrala stödokument till nuvarande MyFlove (2026-09-23)

- [x] Family Flow: Barn som underetikett inom Familj, kopplat till befintliga barnprofiler (2026-09-23)

- [x] Family Flow: redigering, flerflytt, återkomst, områdesfärger och responsivitet (2026-09-23)

- [x] Family Flow: utöka pictogramväljaren med neutral vård och fler vardagsärenden (2026-09-23)

- [x] Family Flow barnschema: riktiga pictogram, kopiering mellan dagar/veckor/barn och mallar (2026-09-23)

- [x] Visuellt barnschema 1.0 i Family Flow: vecka, idag, Nu/Nästa, aktivitetsbank, privata bilder, kopiera vecka och Flow-koppling (2026-09-23)

- [x] Ersätt streckfigurer med 58 realistiska instruktionsbilder i Träningsprogram (2026-09-22)

- [x] Förenkla Mer och samla profil, anpassning, app- och kontoval i en egen Inställningar-vy (2026-09-22)

- [x] Samla Flow skapar ditt pass, Mina pass och historik i Träningsprogram som enda träningssektion (2026-09-22)

- [x] Utökat övningsbibliotek till 58 övningar med bild och säkerhetsnotis (2026-09-22)

- [x] Flow skapar ditt pass: övningsbibliotek, generator, träningskort, steg-för-steg-läge och Mina pass (2026-09-22)

- [x] Redigerbar svensk 16:9-PowerPoint av Venture Cup-pitchfilmen med 13 slides och filmexporttider (2026-09-21)

- [x] Återställ öppning av vald kalenderdag från månadsvy och veckovy (2026-09-21)

- [x] Visa mindre på Hem viker allt utom översta kortet (2026-09-15)

- [x] Egna genvägar på startsidan – välj själv vad som ska ligga på Hem (2026-09-15)

- [x] Anonym statistik per pausväg (Mikropaus, Akut Lugn, Ljusboost, Stopp) med adminkort (2026-09-15)

- [x] Blueprint 4.3, pitchdeck 4.3 och alla fyra videor uppdaterade med nytt material (2026-09-15)

- [x] Android AAB 5.2 (versionCode 11) byggd (2026-09-15)

- [x] Återhämtning som samlad paussida med centrerad ingång på Hem och redirect från /paus (2026-09-15)

- [x] Prata med Flow som fast plats i bottenmenyn, kort "Flow", tydligt aktiv markering (2026-09-15)

- [x] Fast bottenmeny med Hem, QuickFlow, Kalender och Paus för alla användare (2026-09-15)

- [x] Varmare orange sol, borttagen vit prickmarkering och dovare ljusreflektion i Ljusboost (2026-09-15)

- [x] Solen själv som tydlig andningsguide, exakt synkad med sken, reflektion och text (2026-09-15)

- [x] Färgstarkare Ljusboost med större närmare sol, tydligare sken och högre kursiv andningstext (2026-09-15)

- [x] Ljusboost närmare referensen med större sol, bred gyllene reflektion och synkad 4–2–6-andning (2026-09-15)

- [x] Ljusboost med tydligare varm sol, utandningsstyrt ljussken och mjukt synkad text (2026-09-15)

- [x] Ljusboost med varmare solnedgång, organisk andningspuls och sömlös havsloop (2026-09-15)

- [x] Ljusboost ombyggd till en verklig filmisk strand med naturligt havsljud och 4–2–6-andning (2026-09-15)

- [x] Reklamvideo om hur Flow faktiskt hjälper, i 16:9 och 9:16 (2026-09-15)

- [x] Rutiner och Medicin samlade på en sida: dagens lista först, hantering vid behov och ingen dubblett i Påminnelser (2026-09-14)

- [x] Lugnare Barn, Familj och Relationer: vem det gäller först, fördjupning under Mer (2026-09-14)

- [x] Studier samlat på en sida: Mitt schema med rast/lunch, valfri nästa lektion på Hem och all studiehjälp på plats (2026-09-14)

- [x] Pitchdeck 4.0 med investerarunderlag, tydliga statusar och valideringsplatshållare
- [x] Resor, Promenadvägar och Flow-karusellen borttagna; Flow kvar som planering/chatt (2026-09-14)
- [x] Isolerat investerar-/demokonto med syntetisk seed, demoetikett och filtrerad analytics
- [x] Förenklat aktivitetsflöde: gjort/planerat, fast ordning i Kalenderns dagvy, separata kalenderposter, borttaget gammalt händelseflöde, datumseparering och dubblettsäker QuickFlow-synk (2026-09-03)
- [x] Kalender först på Hem: Min dag/Vecka/Månad-genvägar och synlig Lägg till-knapp (2026-09-03)
- [x] Slutlig helhetsstädning: Flow, gemensam UI, QuickFlow/Idag, navigation, analytics och mobil-QA
- [x] Global responsiv layoutstandard (innehållsmedvetna grid, ingen tvingad vertikal text, knappar/ikoner)
- [x] QuickFlow-uppgifter ska kunna ha egna påminnelser i kalendern
- [x] Kontosynka för kvarvarande inloggad användardata och personliga inställningar
- [x] Live-synk mellan enheter för kalender, Min dag, QuickFlow och energi (2026-09-03)
- [x] Veckoöversikt på söndagar, datumkorrekt aktivitetslogik och historik med energipåverkan (2026-09-04)
- [x] Investerarmaterial version 4.1: pitchvideo, pitchdeck, Living Blueprint och investerarsida i samma version (2026-09-04)
- [x] Health Connect/steg borttaget ur Android-MVP:n inför Google Play Internal Test (2026-09-04)
- [x] MyFlove 5.0: samlad release med lugn dagsresa, Flow-åtgärder, kalenderkoppling, belastningskarta och sorterad adminanalys (2026-09-11)
- [x] Investerarmaterial och Android AAB synkade till MyFlove 5.0 / versionCode 9 (2026-09-11)
- [x] Förenklad första upplevelse: en huvudhandling, fyra kärnkort och stegvis information på Hem (2026-09-13)
- [x] Förenklad Energi och Min dag: primär handling först, befintliga detaljer bakom klick (2026-09-13)
- [x] Återställd tidslinje i Kalenderns dagvy och fullbrett batterikort på mobil (2026-09-13)
- [x] Kalender: dagens innehåll visas direkt när Dag väljs, kalenderkopplingen flyttad under (2026-09-13)
- [x] Kalender: dagsvyn placerad inuti kalenderkortet direkt under valet Dag (2026-09-14)
- [x] Mobil-layout: kapacitetskortets rubrik och sammanfattning överlappar inte längre (2026-09-14)
- [x] Upptäckbarhet: kompakt påminnelse om öppna QuickFlow-saker och anteckningar på Hem utan dubbla listor (2026-09-14)
- [x] Paus-vägen samlar Akut Lugn, Mikropaus och Stopp-knappen; FlowScore kopplat till nästa rimliga steg (2026-09-14)
- [x] Idag och Kalenderns Dag-läge förenklade till ett utvecklat dagkort med en gemensam kompakt lista (2026-09-14)

- Jobb samlat på en sida (2026-09-14): plan, jobbhjälp, uppgifter och "Mer i jobb"; /workflow redirectar till /jobb.

- [x] Skapa och kvalitetsgranska 30-sekunders MyFlove-demo i investerarpitchens design (2026-09-14)

- [x] Venture Cup 2026 pitchvideo: 3 min, SV+EN, 16:9+9:16, helt utan ljud (2026-09-19)

- [x] Venture Cup-videorna omdesignade med redaktionell typografi, skrivstil, ritade ikoner och säkra textmarginaler (2026-09-20)

- [x] De tre återkommande ikonrutorna borttagna ur Venture Cup-videons illustrerade scener (2026-09-20)

- [x] Relevanta riktiga MyFlove-vyer används genom hela Venture Cup-videon (2026-09-20)

- [x] Android AAB 5.3 (versionCode 12) byggd (2026-09-21)

- [ ] Serverstyrd versionshantering för synkkonflikter (ersätter enhetsklockor) – planerat, ej påbörjat
- [ ] Test på två fysiska telefoner + byte till ett annat konto – kräver användaren

- [ ] Taktilt djup: plan + Fraunces/Newsreader-jämförelse (väntar på godkännande), sedan implementation + 5 screenshots
