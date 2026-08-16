# Changelog

Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

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
