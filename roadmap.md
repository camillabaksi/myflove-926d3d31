# Roadmap
## Kalenderprover efter tidsrättningen (2026-10-20)
- [x] Rättat äldre testval och testförutsättningar mot dagens kalender; 14 riktade tester godkända och automatisk byggkontroll visar build OK. Appfunktioner och användardata orörda. Ingen publicering.
## Rättat: handinmatad tid blockerades (2026-10-20)
- [x] Rättat tidskontrollen i kalenderns rutinval och i dagstödets pausval så en självvald tid kan sparas; två riktade tester tillagda och gröna. Ingen publicering.

## Samlat Paceable-material och editorialbilder (2026-10-19)
- [x] Omfattning vald: dokument, pitchfilmer, korta appfilmer och fristående reklamfilm; anonymiserat verkligt kontoinnehåll.
- [x] Inventerat senaste källor och aktuell produkt; materialplan godkänd.
- [x] Fångat och granskat 56 anonymiserade svenska/engelska bilder samt 8 editorialramar; kontoskrivningar blockerade och engelska vyers svenska etiketter redovisade.
- [x] Blueprint SV/EN i Word/PDF v3, pitchdeck SV/EN i PowerPoint/PDF v6 samt manus och pilotunderlag versionsnamngivna; kvarvarande namn/porträtt borttagna och rättningar omgranskade.
- [x] Fyra 180,5-sekunders pitchfilmer, sex 24,5–25-sekunders appfilmer och separat 54-sekunders intro producerade. Reklamfilm v7 är oförändrad granskningskopia; publicerat intro bevarat.
- [x] Alla dokument-/presentationssidor och filmsamplingsbilder granskade; alla MP4 helt avkodade utan fel. Levereras i Files med rapport som granskningsutkast: full realtidsrörelse ej verifierad, övertoningstexter överlappar kort och pitch använder ersättningsfont. Ingen appändring eller publicering.
## Byggfel i snabbregistreringen (2026-10-19)
- [x] Rättat saknad avslutande JSX-klammer kring det valfria tidsfältet; inga funktions- eller dataändringar.
- [x] Tagit bort oanvänd kalenderdeklaration med saknad typ; automatisk byggkontroll visar build OK och båda ändrade appmoduler laddas med HTTP 200. Befintliga riktade tester körda men har separata mock-/förväntningsfel; inga test- eller funktionsändringar ingår. Ingen publicering.

## Samlad kalender-, barn- och Pace-planering (2026-10-18)
- [x] Registrera kraven och granska befintliga kalender-, planerings-, familje- och chattflöden; återanvändning och skyddsgränser kartlagda.
- [ ] Visa konkret återanvändnings- och genomförandeplan; invänta godkännande före appkodändringar.
- [ ] Gemensamt snabbflöde för flera aktiviteter från Idag, kalender, barnschema och Pace med datum/tid/person förifyllt.
- [ ] Kompakt månad/vecka, direkt redigering och hela dygnet med tillgängliga tidsval.
- [ ] Flera barn, gemensam visningsrad med namn, Min dag-filter och barnschema utan avbockning.
- [ ] Strukturerade svenska Pace-förslag för skapa/ändra/flytta, konflikt-/ägarkontroll och explicit godkännande.
- [ ] Planering med registrerad kapacitet/sammanhang utan batteriändring; bevara privata utkast och synk.
- [ ] Testa sparning/återläsning, redigering/flytt/avbryt, återkomst, tidszon, kontobyte/behörighet och mobil; dokumentera begränsningar och uppdatera båda ändringsloggarna. Ingen publicering.

## Kalendern – etapp 2: lugnare månadsvy (2026-10-17)
- [x] Godkänd avgränsad plan: månadssammanfattning, antal per ruta och kompakt dagslista under månadsrätten; övrig kalender orörd.
- [x] Genomförd i `src/components/calendar/calendar-planner.tsx` med nya presentationstester; 12 kalendertester och typkontroll godkända.
- [x] Webbläsarkontroll inloggad: 390/1280 px utan dokumentoverflow, sammanfattning och dagslista verifierade med verkligt konto; förstorad text (rot 32 px) utan horisontell overflow. Emulerad textstorlek är inte en äkta 200 %-inställning; fysisk enhet och skärmläsare är inte kontrollerade.
- [x] Ändringsloggarna och roadmap uppdaterade. Ingen publicering.

## Paceable – endast visuell filmfinish (2026-10-15)
- [x] Registrerat avgränsningen: endast rökslingor/partiklar, korrekta statusikoner och skärmperspektiv/glasreflex; bevara kod, timing, banor, texter, kamera och publicerat intro.
- [x] Eftersökt exakt redigerbar v3-källa: den tidigare tillfälliga animationsmappen saknas, och ingen beständig kopia hittades i projektet eller Files. MP4, stillbilder och stillbildsskript finns, inte animationens exakta källkod.
- [x] Avgränsad plan godkänd 2026-10-15 före animationsändringar.
- [ ] Förfina, exportera versionsnamngiven MP4 och kontrollera hela filmen; blockerad av saknad exakt v3-källa. Ingen rekonstruktion eller uppskattning av låsta banor/timing tillåts enligt godkänd plan. App och intro orörda; ingen ny förhandsvisning exporterad.
## Beslut – visuell referens (2026-10-15)
- [x] Skapat och granskat tydligt märkt konceptbild utifrån användarens referens före godkännande; ingen appändring eller publicering.
- [x] Användaren godkände designförslaget och genomförandet 2026-10-15.
- [x] Lokal papperspresentation med handskrivet ämne, mjuka spaltrubriker och tillgänglig punktmeny; befintliga sparanrop bevarade.
- [x] 21 riktade tester godkända; skrivning, stjärna, spaltflytt och Escape-fokus kontrollerade i isolerad inloggad session. 16 kombinationer av 320/390/430/1280 px, ljust/mörkt och 100/200 % rottext utan dokumentoverflow; desktop vid stor text får läsbar enkolumnsyta. Före-/efterbilder tagna med syntetiskt innehåll och spärrade kontoskrivningar. Verklig molnsynk och fysisk mobilkontroll är inte verifierade i denna presentationsetapp. Ingen publicering.
## Tankar – personlig reflektionsbok (2026-10-15)
- [x] Ta emot godkänt koncept och granska befintliga funktioner, navigation, datakällor och integritetsgränser.
- [x] Användaren ber att få se förslaget; visa den färdiga etappplanen direkt, utan appändringar.
- [x] Skapa och granska tydligt märkt konceptbild med syntetisk text; befintlig app, logotyp och navigation är inte ändrade.
- [x] Konkret etappplan visad; användaren godkände genomförandet 2026-10-15: ”Underbart, gör denna funktion”.
- [x] Etapp 1: privat lagringsgrund, sammanhängande ingångar och autosparande dagbok; Fånga och anteckningar bevarade.
- [x] Etapp 2: beslut med inlinepunkter, två spalter/fokusläge och frivillig reflektionsdel.
- [x] Etapp 3: tankekarta med pek-/tangentbordsalternativ och icke-destruktiva dagbokslänkar.
- [x] Lokal sparning/återläsning, navigation och 96 bredd-/tema-/textkontroller verifierade med syntetisk text och blockerade molnskrivningar; riktade tester för offline/synk, kontobyte och konflikter samt båda ändringsloggarna klara. Ingen publicering/native-versionering.
- [ ] Verklig sparning/återläsning i molnet och två-enhetstest: blockerad kontroll tills isolerat testkonto finns; inga testskrivningar görs i Camillas privata konto. Fysisk Android/iOS och skärmläsare kräver enheter.
## Engelska kontobilder och appfilmer (2026-10-13)
- [x] Plan godkänd; animerade produktfilmer och samtycke för synligt kontoinnehåll.
- [x] Isolerat engelskt språkval och nätverksspärr verifierade; 25 kontobilder granskade och bild-zip sparad. Endast osparat 25 %-exempel, ingen faktisk batteriändring eller omplanering.
- [x] Fyra filmutkast om dagen/batteriet och omplanering sparade; ljudspår, format, längder och full avkodning kontrollerade, tidsbilder granskade.
- [ ] Två filmer om Min plats/chatt/återhämtning blockerade av filmverktygets renderfel; inga partiella filer levererade.
- [x] Leverera 25 bilder, zip, fyra filmutkast och begränsningar i egen Files-samling; ingen publicering. Slutrapport mottagen; FILMRAPPORT-v2 dokumenterar fördröjd märkning.
- [ ] Omplaneringsfilmernas osparat-märkning behöver täcka hela intoningen; filmverktygets rättningsrendering misslyckades, v1 endast för granskning.
## Harmoniska Paceable-pitchdeck (2026-10-13)
- [x] Godkänd plan och endast demobilder, svenska/engelska, redigerbar PPTX + PDF.
- [x] Gemensam berättelse byggd; omslag, produkt och pilot provgranskade.
- [x] Två 16-slidesdeck validerade och återöppnade; alla 32 slides granskade, etikettöverlappning, sidfotsluft och bildproportioner rättade och omgranskade.
- [x] PPTX/PDF och bildöversikter sparade i Files och tillagda i befintlig materialsamling (medlemsstatus pending vid tillägget); ingen appfunktion eller publicering ändrad.
## Paceable blueprint, pitchfilmer och nya skärmbilder (2026-10-13)
- [x] Bekräfta Paceable, blueprint på svenska/engelska och pitchfilmer i båda bildformaten.
- [x] Materialplanen godkänd; ingen appändring eller publicering.
- [x] Verifiera aktuell produkt och fånga läsande, integritetssäkra produktbilder.
- [x] Skapa två blueprintversioner (Word/PDF) och fyra pitchfilmer från gemensamt faktaunderlag.
- [x] Granska alla dokumentsidor och filmscener, paketera skärmbilder och leverera i Files med redovisade begränsningar. Filmversion v2: 180 sekunder, ljudlösa text-/bildfilmer; 48 scener visuellt granskade och samtliga MP4 avkodade utan fel.

## Insikter – endast etapp 2B (2026-10-10)
- [x] Godkänd avgränsning: endast Insikters sida, metadata och isolerade presentationstester; inga andra vyer, datakällor eller publicering.
- [x] Förebilder tagna i sex bredder, båda teman och 100/200 % text. Separat navigeringsrad, Fraunces-rubrik och befintligt PaceContent införda.
- [x] Efterbilder: sex bredder × två teman × 100/200 % utan dokumentoverflow; även fasta rubrik-/textstorlekar förstorade separat. Insikter och båda diagrammen visas, tillbaka/Hem fungerar och tangentbordsfokus syns. Diagrammens befintliga mobilbegränsningar och fysisk Android/iOS-QA kvarstår för separat beslut; ingen 2C/2D eller publicering.
## Paceable designsystem – etapp 1 (2026-10-10)
- [x] Skapa en gemensam, opt-in designreferens med semantiska HSL-variabler för sidmarginaler, kort, informationsblock, kontroller, formulär, dialoger, typografi och responsivitet.
- [x] Bevara alla befintliga vyer; kontrollera referensen i ljust/mörkt tema, små mobilbredder och 200 % text utan nya beroenden eller publicering.
- [x] Dokumentera observerade senare kontrollpunkter för Logga just nu, MyFlove Insight samt diagrammen Energi och mående och Batteri & faktisk tid, utan att ändra dessa vyer.
- [x] Uppdatera båda changelogarna och redovisa exakt ändrade filer, skapade designvariabler och utförda kontroller. Stanna därefter för nytt godkännande.

## Fullständig designinventering (2026-10-10)
- [x] Läsgranska alla appvyer, offentliga sidor, delade komponenter, formulär, dialoger, diagram och navigation; skilj kodfynd från renderingsverifiering.
- [x] Redovisa avvikelser, gemensam målbild, återanvändning och riskbedömd etappplan. PDF och sökbara bilagor levereras; nya offentliga kontroller och referens-QA, kontovyer endast kod-/historisk inventering. Ingen appkod-, native- eller publiceringsändring.
- [ ] Genomförande inväntar uttryckligt godkännande av avgränsad etapp.
## Rutiner, Påminnelser och Inköp (2026-10-09)
- [x] Kompaktare sidknappar, val och rubriker med 44 px tryckyta. Ingen publicering.

## Hälsa & välmående (2026-10-09)
- [x] Rubriker och kort på Mitt batteri, Återhämtning, Mående, Energikarta. Ingen publicering.
- [x] Kompakta pausval, Starta, energinivåer och måendeval (44 px tryckyta). Ingen publicering.

## Kalender, Fånga och Min plats – nästa visuella etapp (2026-10-09)
- [x] Etapp 2–3 på Idag godkänd; ny begäran registrerad om samma målbild på Kalender, Fånga och Min plats.
- [x] Avgränsad plan godkänd för sidlokala kontroller och mörklila/mörkröd ton. Ingen publicering.
- [x] Godkänd lokal presentation genomförd; 48 bredd-/tema-/textkontroller utan sidöverflöde, 44px kontrollboxar och befintliga öppningar/länkar verifierade utan sparning. Full befintlig svit 545/545; skyddstest tillagt. Bildgranskning och begränsningar i docs/pace-next-pages-verification.md. Ingen publicering; denna etapp avslutad.
## Idag – logotyp och sidhuvud, Etapp 1 (2026-10-09)
- [x] Godkänd snäv etapp: befintlig BrandLogo utan dubblering, mindre Fraunces-hälsning, datum/namnmeny och borttagen dekorativ stenvisning endast på Idag.
- [x] Genomför sidlokal presentation; befintlig mobil-BrandLogo i 220 px, desktopsidebar oförändrad, Fraunces-hälsning 2rem och namnmeny i gridflödet. Knappar/personval och alla funktioner bevarade.
- [x] Före/efter mobil i båda teman visade; 32 kontroller över 320/360/390/430/768/1024/1280/1440 px och normal/200 % text utan sidöverflöde, dubbla logotyper eller överlapp. Namnmeny/dialog/Avbryt-fokus och syntetiskt långt namn utan sparning verifierade. 545/545 tester i 87 filer godkända i slutlig full körning; tidigare tidskänsligt secure-local-test klarade separat omkörning. Automatiskt bygge OK. Ingen publicering; Etapp 2/3 inväntar nytt godkännande.
## Ta bort lila maskotbild (2026-10-09)
- [x] Plan godkänd: endast bildpresentation; bevara texter, knappar, funktioner, originalassets och sparade val. Ingen ersättningsbild/publicering.
- [x] Gemensam maskotpresentation och tomma bildutrymmen borttagna; texter och handlingar kvar. 542/542 tester godkända; Inställningar, Pace-inställningar, samtal och Idag kontrollerade i båda teman vid 360/390/1280 px och 200 % text utan sidöverflöde eller konsolfel.
- [ ] Separata rumsbilder i Anpassa/Min samling pausade: maskoten är inbakad i hela scenen med hälsningsyta och kan inte tas bort som fristående bild utan separat beslut. Originalassets och sparade val bevarade; ingen publicering.
## Pace – hela appen stegvis (2026-10-09)
- [x] Formulärsteg 1: Inställningar och Pace-inställningar granskade och lokalt anpassade; 540/540 tester, 56 bredd-/tema-/textkontroller utan överflöde, Mer pixelidentisk. Inga kontoval ändrade eller publicerade.
- Nästa lilla etapp: kvarvarande profil/livsprofil och hemskärmsanpassning behöver öppnad-formulärgranskning; namn/barnens befintliga sparning ska bevaras exakt. Därefter ork/återhämtning enligt godkänd ordning. Inte färdigt i denna etapp.
- [x] Ordning fastställd: menyn och sidrubriker först, därefter formulär för formulär med befintligt designsystem.
- [x] Etappplan godkänd; Mer-vyn ska behållas som den är. Ingen publicering.
- [x] Ny avgränsning: skydda Mer-vyns hela godkända presentation och beteende under anpassningen.
- [x] Första rubriksteget: Inställningar, Anpassa, Anteckningar och Relationer delar PacePageTitle. Huvudmenyn behålls; Mer oförändrad i kod och pixelidentisk i jämförelsen. 538/538 tester, bygge OK; 112 rubrikkontroller i teman/360–1440 px/100–200 % utan overflow.
- [ ] Fortsatt rubriketapp: granska återstående sidrubriker före lokal anpassning; redan godkända ytor bevaras.
- [ ] Följande etapper: renderingsgranska och anpassa samtliga återstående formulär gruppvis; bevara sparning, utkast och behörigheter.
## Pace – gemensamt designsystem (2026-10-09)
- [x] Inventera befintlig godkänd grund och ta fram plan för återanvändbara sid-/formulärmönster.
- [x] Godkännande mottaget för system, referensyta och begränsad pilot; ingen publicering.
- [x] System, referens och guide byggda; gemensam klassdefinition i befintliga pilotformulär. 537 tester godkända; referens i båda teman, 360–1440 px och 200 % text, dialogfokus, validering och reduced motion kontrollerade. Fysisk mobil/skärmläsare ej verifierade; återstående sidkonvertering separat.
## Paceable – kvarvarande äldre formulär (2026-10-09)
- [x] Inventera gemensamma formulär-/dialogstilar och granskningskandidater; planen utökad från Logga just nu till samtliga kvarvarande äldre formulär. Fullständig renderingsinventering ingår före implementation.
- [x] Användaren begär samma design på samtliga kvarvarande äldre formulär; ingen publicering eller funktionsändring.
- [x] Anpassa Logga just nu, Anpassa, aviseringskort och rutinformulär; verifiera 360/390/430/1280 px, teman och 200 % text. 532/532 tester godkända; ingen publicering.
- [ ] Slutför renderingsgranskning av kvarvarande dolda formulär innan hela inventeringen markeras klar.
## Pace – riktig 3D, teknikbedömning (2026-10-08)
- [x] Kontrollera befintliga verktyg/beroenden och redovisa specialmodellering, material, granskning, resursbudget och begränsningar i planen; ingen appändring.
- [x] Teknikplan godkänd; endast statisk modell, separata prototypberoenden, inga rörelser.
- [x] Isolerad statisk konturmodell med 11 520 trianglar och gemensamma material; frontjämförelse/25°/teman/390–1280 px. WebGL utan sidfel; huvudappens kod/beroenden orörda.
- Pausat på användarens uttryckliga beslut 2026-10-08: inga ytterligare modell-, material- eller animationsändringar. Prototyp/källor/begränsningar arkiveras; återupptas endast på uttrycklig begäran. Kvarstående släta/facetterade ytor, kontaktglapp och materialavvikelse dokumenteras, ingen integration/publicering.
## Pace – realistisk följeslagare, endast prototypplan (2026-10-08)
- [x] Inventera stenoriginal och befintliga presentationsytor; jämför 3D och 2D utan appändring.
- [x] Bild 1 används endast för ljus/materialkänsla; bild 2 är exakt visuell förlaga utan nya former eller färger.
- [x] Alternativ B: bild 2 och transparent ZIP-original överensstämmer visuellt i former/proportioner/färgfamiljer/ordning/stapling; bakgrund och markskugga skiljer, pixelidentitet inte påstådd.
- [x] Isolerad lokal demo med Vilar/Hälsar/Lyssnar, exakt samma hela ZIP-bild, teman/390/1280 px/200 %/stillaläge och reducerad rörelse verifierade; inspelning. Ingen appintegration eller publicering.
- Även 2D-/animationsspåret pausat tills uttrycklig begäran; fysisk iOS/Android-prestanda ej verifierad.
## Pace/Paceable – namninventering (2026-10-08)
- [x] Inventera synliga Flow/MyFlove-namn och gamla bilder separat från tekniska identifierare.
- [x] Redovisa namnförslag, resursbegränsningar för stenföljeslagare, risker och kostnadseffektiv plan; ingen appkodändring eller publicering.
- [x] Namnstruktur och minsta textetapp godkända: synligt Pace i Mer/samtal/inställningar och Din takt på Idag; interna namn, grupp-ID, bilder och övriga etapper bevaras.
- [x] Textetappen verifierad: 531/531 tester i 84 filer efter omkörning av äldre tidskänsligt krypteringstest; nya namn på Idag/samtal/inställningar och Mer-sökning/länkar i 390/1280 px, båda teman och 200 % utan Mer-overflow. Befintliga bilder och interna identifierare oförändrade; ingen publicering.
- Övriga textområden, AI-identitet, notiser och bildpilot väntar på separat godkännande enligt planen.
## Mer – sista struktur- och kortjusteringen (2026-10-08)
- [x] Ta bort fyra dubblerade verktygsgrupper och ge Min vardag sex enhetliga kort med oberoende expansion.
- [x] 528/528 tester i 83 filer; automatiskt bygge OK. 360/390/430/1024/1440 px, båda teman och 200 %: sex kort, oberoende expansion utan höjdförändring, sökning och kvarvarande verktygsgrupper verifierade. 320 px normal fungerar; 320 px + 200 % visar ett befintligt överflöde i sök/kryss-raden (inte vardagskorten), lämnat orört enligt avgränsningen. Ingen publicering.
## Mer – fyra extra direktsektioner (2026-10-08)
- [x] Lägg till Min dag, Flow och samtal, Ork och återhämtning samt Hem och vardag efter Insikter; behåll alla befintliga ingångar även under Fler funktioner.
- [x] Tre nya tester verifierar rätt destinationer, samma filter och inga dubbletter inom sektioner. 360/390/430/1024/1440 px, båda teman och 200 % text kontrollerade utan overflow eller sidfel. Full svit 527/527 i 83 filer med lägre samtidighet efter ett känt tidskänsligt krypteringstest i första körningen; automatiskt bygge OK. Ändringsloggar uppdaterade. Ingen publicering.

## Uppgifter – sammanhållet Paceable-uttryck (2026-10-08)
- [x] Granskat sidans egna visuella avvikelser och delade komponenter; avgränsad plan framtagen före appkodändring.
- [x] Godkänd sidlokal presentation genomförd med befintliga tokens: sammanhållen rubrik, vyval, grupper, uppgiftskort och kontroller; Inter för funktion, Fraunces endast sidrubrik. Inga ändringar i datakällor eller delade komponenter.
- [x] 360/390/430/1024/1440, båda teman, normal/200 % text och alla tre vyval utan dokument-/sidöverflöde eller kapade namn. Dialog och redigeringsfält öppnade utan kontosparning; fyra isolerade åtgärdstester. Full svit 524/524 i 83 filer, automatiskt bygge OK. Idag/Kalender pixelidentiska före/efter; Tankar/Min plats har dynamiska bildskillnader, inga Uppgifter-klasser. Båda ändringsloggarna uppdaterade; inget publicerat.

## Mer enligt godkänd målbild (2026-10-08)
- [x] Tidigare etapps dokumenterade QA genomgången; befintligt Hem-dialogfokusfel kvarstår separat.
- [x] Inventerat samtliga 34 navItems plus profil, jämfört mobil/desktop med referens och förberett avgränsad plan.
- [x] Godkänd plan genomförd: en responsiv Mer-vy, befintliga länkar/filter och Äldre Hem bevarade; endast lokal presentation, ingen publicering.
- [x] 520/520 tester i 82 filer; automatiskt bygge OK. 360/390/430/1024/1440 i båda teman och normal/200 % text utan panel-/dokumentoverflow; gruppöppning, Äldre Hem, Escape-fokus och söknavigation kontrollerade utan sparning.

## Paceable på återstående sidor inklusive Hem och Flow (2026-10-08)
- [x] Omfattning bekräftad: även Äldre Hem och Flow ingår; befintlig godkänd identitet, inga funktionsändringar.
- [x] Inventering och före-bilder av Hem/Flow; avgränsad genomförandeplan framtagen.
- [x] Godkänd plan genomförd med gemensam avgränsning för Hem/Flow, befintliga neutrala kort och lokala dekorativa rubrik-/chattjusteringar; ingen publicering.
- [x] 180 skärmkontroller vid 360/390/430/1024/1440, båda teman och 200 % utan dokumentoverflow eller sidfel. Nya tokenpar över 4,5:1. Chattens rullning/inmatning samt dialogöppning/Escape kontrollerade utan sparning. Slutlig full svit 516/516; ett äldre timingtest föll vid två mellanliggande körningar. Primärvyer undantagna; tre pixelidentiska CSS-jämförelser, Kalender endast 4×8 px dynamisk skillnad. Ingen publicering.
- [ ] Hem-dialogens befintliga fokusåtergång efter Escape: bekräftat fel, kräver separat godkännande för funktionsrättning utanför denna visuella etapp.

## Visningsnamn på Idag (2026-10-08)
- [x] Plan godkänd; ⋯-meny, dialog, bekräftad synk, ingen sparad e-postgissning, tester. Ingen publicering.

## Paceables logotyper och webbikoner (2026-10-08)
- [x] Granska första ZIP-filen och flagga bakgrund, uppskalning och skillnader mellan symbolversioner.
- [x] Granska det nya rena filpaketet: kvarvarande ljusa kant-/bakgrundsrester, uppskalad stensymbol och omsatt ordmärke rapporterade.
- [x] Planens grund och avgränsningar godkända; genomförandet är uttryckligen inte godkänt.
- [x] Granska hela Paceable_Lovable_komplett_paket.zip inklusive båda dokumenten och alla 29 bildfiler: blockerande färgändring i horizontal-dark, vanlig ikon inte maskable-säker, övriga webbversioner visuellt kontrollerade. Redovisning före ändringar.
- [x] Korrigerad horizontal-dark verifierad pixelidentisk i stenregionen; mörk text oförändrad, separat PNG matchar ZIP.
- [x] Genomförandet godkänt med Paceable_Lovable_korrigerat_paket.zip; separat godkännande krävs för publicering.
- [x] Efter godkännande och godtagbar bildkvalitet: endast varumärkesplatser, exakt slogan, favicon/PWA/manifest; bevara gränssnitt, funktioner och native-projekt.
- [x] Verifiera mobil/desktop, ljust/mörkt läge, symbolkonsekvens och ändrade platser; ingen publicering. Resultat och kvarstående begränsningar: docs/paceable-brand-verification.md.

## Kompakt kapacitetsstöd i mobilkalendern
- [x] Avgränsad plan godkänd; ingen publicering.
- [x] Osparade val och öppet/stängt läge bevaras över Månad/Vecka/Dag via tillfällig sidstatus; ingen ny lagring eller autosparning.
- [x] Endast mobilpresentation ändrad; samma formulär, desktop och Veckans mål-position bevarade.
- [x] 508 tester godkända inklusive isolerad sparvalidering. 360/390/430 × Månad/Vecka/Dag × normal/200 % × öppet/stängt utan dokumentoverflow; tangentbord, mörkt läge och reduced motion kontrollerade. Desktop 1024/1440 kontrollerad; bilder och båda ändringsloggarna klara. Inget sparades i användarens konto; ingen publicering.

## Etapp 2A tillgänglighetsrättning
- [x] Plan godkänd; faktisk textstorlek/utrymme, separata tidsblocksbegränsningar och jämförelsebilder 390/768 px vid 200 %. Ingen publicering.
- [x] Lokal textanpassning genomförd; normalbilder 390/768 px identiska. Fasta veckoblock rapporteras separat, inte som lösta.
- [x] 56 bildkontroller över sju bredder och fyra vyer vid normal/200 %, utan dokumentoverflow; 503 tester och automatiskt bygge OK. Dialoger, periodnavigation, aktivitetsöppning och tangentbordsfokus verifierade utan sparning. Separat typkontroll inte körd enligt miljöns instruktion.
- [ ] Full läsbarhet i fasta veckoblock vid 200 %: blockerad av låsta dagbredder/tidsgeometri, kräver användarbeslut inför separat etapp.

## Etapp 2A desktop (2026-10-08)
- [x] Godkänd avgränsning: Idag en huvudkolumn; kalenderkontroller och sekundärt stöd, oförändrad mobil/geometri.
- [x] 503 tester godkända, automatiskt bygge OK; 768/1024/1280/1440 px och 200 % text kontrollerade. Mobilregler och stenasset bevarade; live-data gör pixeljämförelse varierande. Ingen publicering.

## Fyra avgränsade QA-rättningar (2026-10-08)
- [x] Godkänd plan: fokus, menynamn vid 200 %, desktop-Mers befintliga Enkelt läge och hälsningens radbrytning.
- [x] Sex skärmstorlekar utan sidoverflow; Escape/kryss återför fokus och sidbyte fokuserar nytt innehåll. Normalt/enkelt läge samt områdes-/rollfilter och 200 % menynamn verifierade. 503 tester och automatiskt bygge OK; stenbildens SHA-256 oförändrad. Ingen publicering.

## Tankars Varför i importkortet (2026-10-08)
- [x] Godkänd plan; endast Varför-länken flyttad in i importkortets nederkant via valfritt whySlot-prop (legacy-ytor påverkas inte).
- [x] 501 tester godkända; 360/390/430 px och desktop: länken inne i kortet, 58×44 px klickyta, fokus och popover öppnar samma innehåll, ingen overflow, dark mode och 200 % textskalning OK. Stenbildens kontrollsumma oförändrad. Tre leveransbilder; ingen publicering.

## Tankars två ytor (2026-10-08)
- [x] Godkänd plan, enbart capture-yta och inline-hjälp vid import; stenarna orörda.
- [x] 501 tester och bygge godkända; 360/390/430/desktop, light/dark, 200 % textskalning utan dokumentoverflow, fokus och hjälpöppning verifierade. Capture-dialog och befintlig röstkontroll öppnas; importknappar finns. Faktisk inspelning och import/sparning ej end-to-end-testade.
- [x] Fyra bilder levererade; stenbildens kontrollsumma identisk och övre 390 px-området pixelidentiskt med tidigare leverans. Stenar fortfarande 76×48 px, samma position; ingen publicering eller fler visuella ändringar.

## Endast Tankars stenstorlek (2026-10-08)
- [x] Godkänd plan och endast stenbildens rendering 1,9× större; befintlig behållare och övrig layout orörda.
- [x] 360/390/430 px kontrollerade, fyra riktade tester godkända och bildkontrollsumma oförändrad. Ingen publicering.

## Sista avgränsade finjusteringen (2026-10-08)
- [x] Godkänd plan: endast hälsningens smala storlek ändras till 34 px; befintliga Tankar-stenar och Min plats 32 px behålls.
- [x] Mobilvyer, oförändrad bildkontrollsumma och 501 tester verifierade; bilder levererade utan publicering. Vid 360 px bryts Camillabaksi fortfarande över två namnrader vid minsta tillåtna 34 px; större vyer oförändrade. Separat typkontroll ej körd.

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

- [x] Enhetlig identitet etapp 1 (ytor, kort, rubriker, dialoger samt QA-rättning för 200 % text och Flow-isolering) – ej publicerad
- [ ] Etapp 2: sidspecifika gradienter och hårdkodade färger (inväntar godkännande)

## Paceable – förfina uppladdad 3D-film (2026-10-15)
- [x] Ny rökreferens 2026-10-16: godkänd plan genomförd som v7_soft_smoke.mp4 och självständig källa. Endast rökritningen ändrad: genomskinliga slöjor med mjuka virvlar, ljusdjup och få partiklar på samma inåtriktade banor/tidsfönster. Alla fyra slutliga absorptionsöversikter och tidslinje/slutkant bildgranskade; hela 20 s spelade till slut i WebM-visningskopia utan mediafel eller tappade bilder. MP4 fullständigt avkodad, låsta källfunktioner/konstanter oförändrade och ljud bitidentiskt med v6. Utkast: röken mindre framträdande än referensens stora moln, korta textfragment under låst bubbelupplösning kvar; ljudlyssning ej utförd. App/intro orörda, ingen publicering.
- [x] Förfining 2026-10-16, v6: godkänd plan genomförd i befintlig v5-källa. Puff/halo ersatt med sju deterministiska, inåtriktade rökslingor per bubbla; överkantens hårda bakgrundsskarv reparerad lokalt. MP4 och självständigt redigerbart underlag sparade. Alla fyra absorptioner och överkantens början/övergångar/slut bildgranskade; hela 20 s spelade till slut i separat WebM-kopia, 480 visade bilder och 0 tappade. MP4 fullständigt avkodad utan fel; låsta rörelser/timing/text/mask oförändrade. Begränsningar: tunna slingor kan se stjärnformade ut, uppladdningen 1000123213.mp4 saknas för direkt jämförelse, ljudet kopierat men inte lyssnat på. App/intro orörda, ingen publicering.
- [x] Förfining 2026-10-16: v5 MP4 exporterad (20 s, 1344×756, 24 fps) och redigerbar källa sparad; svävning, färgmatchad förångning, lätt rörliga partiklar och text efter absorption. Alla fyra övergångar och slutruta bildgranskade; full avkodning utan fel. Utkast: mjuk/molnig rök snarare än referensens skarpare slingor, vissa inbakade partiklar statiska, färdbanans gamla svävningsbidrag justerat 1–3 px. Ingen funktionell appändring/publicering.
- [x] V5 realtidsuppspelning verifierad i separat WebM-kopia. V6 är aktuell leverans; dess oförändrade ljud är avkodat och checksummekontrollerat men lyssning återstår för användargranskning.
- [x] Godkänd inriktning: återskapa vid behov men efterlikna originalet; ingen appändring eller publicering.
- [x] Originalreferenser och scenplan framtagna; startbilder och första genererade MP4-utkast levererade.
- [x] Nytt krav 2026-10-15 inventerat: ingen redigerbar källa till denna MP4; exakta text- och rörelsekrav dokumenterade.
- [x] Avgränsad lagerplan godkänd; rent underlag samt öppnings-/slutbild med fasta textobjekt framtagna och visuellt granskade.
- [x] Utseende godkänt av Camilla 2026-10-15: skärminnehållet är ombyggt, originalbubblorna beskurna och liten retuschskarv finns vid telefonens överkant.
- [x] Exporterat lagerbaserat v3-granskningsutkast: 20 s, 1344×756, 16:9, H.264/AAC; fasta texter, kategoribanor och slutruta granskade, full avkodning utan fel. Inget byte av publicerat intro.
- [ ] Full realtidsgranskning återstår: testwebbläsarens MP4-spelare stannar med mediafel 4. Kräver fungerande spelare. Utkastets kända avvikelser redovisas: kort överlapp vid uppgiftsvisning, rosa bana över Appointments-hörnet och liten menytext.
