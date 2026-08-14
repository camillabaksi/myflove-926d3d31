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

## [0.1.0] - 2026-07-23

Initial baseline av MyFlove — ett svenskspråkigt "lugnt livsflöde"-dashboard byggt med TanStack Start, React 19, Tailwind CSS, Supabase och Clerk.

### Added
- **Autentisering:** Inloggning/registrering via Clerk, skyddade sidor under `/_app` med sessionskontroll mot Supabase.
- **Dashboard/Hem:** Startsida med genvägar, widget-grid och väderkort.
- **Fokus & Att göra:** Daglig fokuspunkt samt uppgiftshantering med kategorier (uppgift/ärende/projekt), status, delsteg, snooze och kalenderkoppling.
- **Kalender & Påminnelser:** Återkommande påminnelser (dagligen/vardagar/veckovis) med tid och notiser.
- **Daglig rutin & Pomodoro:** Rutinvy samt fokus-timer.
- **Dumping (brain dump):** Snabb idé-/tankeinsamling.
- **Må bra:** Humörloggning och wellness-vy.
- **Medicin:** Medicinlistor med schemalagda tider och intagsloggning, plus medicinpåminnelser.
- **Inköp & Matlista:** Delad, hushållsbaserad inköpslista med lokal fallback, samt matplanerare.
- **Ekonomi:** Enkel transaktionshantering (inkomster/utgifter) per kategori.
- **Resor:** Sparade resor/hållplatser med pendlingsvarningar baserat på avgångstider.
- **Familj:** Delade funktioner för hushåll/familj.
- **Statistik & Belöningar:** Statistikvy, admin-statistik samt achievements/belöningssystem.
- **Friktionsindex:** Feedbackfunktion för att fånga upp friktion i vardagen.
- **AI-assistent (Flow):** Chattbaserad assistent med AI SDK-integration och MCP-verktyg (lägg till uppgift, lista uppgifter, logga humör).
- **Push-notiser:** Web push för alarm, medicin- och pendlingspåminnelser, med ljud-på/av-kontroll.
- **Molnsynk:** Offline-first lagring via `localStorage` med best-effort synk mot Supabase (`user_kv`) för inloggade användare.
- **Adminpanel:** Adminöversikt och appstatistik för administratörer.
- **Juridiskt:** Sidor för integritetspolicy, villkor och cookies.
- **Mobilstöd:** Capacitor-paketering för iOS/Android.
