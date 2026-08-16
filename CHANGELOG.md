# Changelog

Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

### Added
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
