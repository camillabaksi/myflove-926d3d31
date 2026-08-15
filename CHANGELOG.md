# Changelog

Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.9.0] - 2026-08-15

### Added
- **Fullständig changelog:** All historik sedan projektstart samlad i `CHANGELOG.md` och i appens changelog-export.

## [0.8.0] - 2026-08-14

### Added
- **Glömt lösenord:** `/glomt-losenord` mejlar återställningslänk, `/nytt-losenord` sätter nytt lösenord, länk från inloggningen.
- **Promenadvägar:** Riktningsbaserade gångvägar i närområdet via OpenStreetMap Overpass, höjddata och kartförhandsvisning, med "Uppdatera min plats".

### Fixed
- Overpass-anrop returnerade tidvis 406 – rättat med korrekt Accept-header och User-Agent.

### Security
- SEO- och metadatafixar: sidspecifika og-taggar, Organization/WebSite JSON-LD, site verification.

## [0.7.0] - 2026-08

### Added
- **Hjälptexter:** Kontextuella i-knappar på 17+ sidor.
- **Tillbakaknapp:** Historikbaserad navigering i layouten.
- **Introtur & enkelt läge:** Guidad rundtur, svenska underrubriker och naturligt språk för FlowScore.
- **Minimera/maximera:** Persistenta kollapsbara sektioner i ~35 vyer.
- **Områdesfiltrering:** Hemskärmen visar bara valt rum, "Alla" slår ihop.

### Changed
- Blueprint uppdaterad till 2.7, ny presentation och ny preview-video (v5).

## [0.6.0] - 2026-08

### Added
- **StudyFlow™:** Pluggläge med föreläsningsläge, kapacitetsplanering och kalenderkoppling.
- **Schemaimport:** AI-tolkning av schema samt "nästa lektion" med plats och vägbeskrivning.
- **Lektionspåminnelser:** Push när nästa lektion närmar sig.
- **FlowScore-vy:** Egen central vy för kapacitetspoäng.
- **MyFlove Insight™:** Demoprofiler för NPF och adaptiva strategier.
- **WorkFlow™:** Arbetsläge med omplanering, mötesläge och Nu-lista.
- **Quickflow:** Snabbinfångst med automatisk dubbletthantering.
- **Budget:** Budgetpanel i ekonomi.
- **StudyBuddy/FlowStudy:** AI-flashcards, quiz och Leitner-repetition.
- **Träning:** Styrka/kondition, AI-pass och hälsoapp-koppling via Capacitor.
- **Livsområden:** Vardag, Studier, Jobb, Privat med egna färger, grupperad navigation och global sök.

### Changed
- Prov läggs inte längre in automatiskt i kalendern; repetition rensas via purge-hook.

## [0.5.0] - 2026-08

### Added
- **Push-notiser:** Service worker, `push_subscriptions` och notiser för medicin, väder och påminnelser.
- **Återkommande påminnelser:** Dagligen, veckovis och vardagar.
- **MCP-server:** Agentintegration på `/mcp`.
- **Capacitor:** iOS/Android-paketering med `MOBILE_BUILD.md`.
- **Familj/hushåll:** Join-koder, delad inköpslista och kalender.
- **Proaktiva förslag:** Loop-nudgar utifrån uppgifter, humör och väder.
- **Adminöversikt:** Friktionsrapporter, rollhantering och changelog-export.
- **Rutiner:** Rutinlista med molnsynk och notiser.
- **Kalenderintegration:** ICS-import/export.
- **Tid & påminnelse:** Specifik tid på uppgifter med alarmljud.
- **Valbara genvägar:** Fyra egna appar på hemskärmen.

### Fixed
- Uppgifter försvann mellan dagar – flyttade från localStorage till `user_kv`.

### Security
- RLS-härdning och återkallad publik exekvering på interna funktioner.

## [0.3.0] - 2026-07

### Added
- **Energikarta:** Loggning av energinivåer, integrerad i FlowPlan.
- **Väderkort:** Open-Meteo med geolokalisering på startsidan.
- **Matlista utan familj:** Lokalt läge för användare utan hushåll.
- **Admin & statistik:** `user_roles`, admin-gating och appstatistik.
- **Resor:** Trafiklab ResRobot v2.1 med pendlingsvarningar.
- **Friktionsindex:** `friction_items`/`friction_votes` med röstning.
- **FlowPlan™:** AI-driven sekvensplanering.
- **Flow AI-personlighet:** Dagsformsanpassat stöd.
- **Designsystem:** Jordnära palett och Flow-voice-copy.
- **Publicering:** Delbar testapp med PWA-stöd.

### Fixed
- Kalendern nåddes inte – routing rättad till `/kalender`.

## [0.1.0] - 2026-07-23

Initial baseline av MyFlove — ett svenskspråkigt "lugnt livsflöde"-dashboard byggt med TanStack Start, React 19, Tailwind CSS och Lovable Cloud.

### Added
- **Autentisering:** Inloggning/registrering och skyddade sidor under `/_app`.
- **Dashboard/Hem:** Startsida med genvägar, widget-grid och väderkort.
- **Fokus & Att göra:** Daglig fokuspunkt samt uppgiftshantering med kategorier, status, delsteg, snooze och kalenderkoppling.
- **Kalender & Påminnelser:** Återkommande påminnelser med tid och notiser.
- **Daglig rutin & Pomodoro:** Rutinvy samt fokus-timer.
- **Dumping (brain dump):** Snabb idé-/tankeinsamling.
- **Må bra:** Humörloggning och wellness-vy.
- **Medicin:** Medicinlistor med schemalagda tider och intagsloggning.
- **Inköp & Matlista:** Delad hushållsbaserad inköpslista med lokal fallback.
- **Ekonomi:** Enkel transaktionshantering per kategori.
- **Resor:** Sparade resor/hållplatser med pendlingsvarningar.
- **Familj:** Delade funktioner för hushåll/familj.
- **Statistik & Belöningar:** Statistikvy och achievements.
- **AI-assistent (Flow):** Chattbaserad assistent med MCP-verktyg.
- **Molnsynk:** Offline-first lagring med best-effort synk.
- **Juridiskt:** Integritetspolicy, villkor och cookies.
