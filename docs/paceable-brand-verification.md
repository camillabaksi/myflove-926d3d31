# Paceable – varumärkesuppdatering, ej publicerad

## Resultat
- Korrigerat, godkänt ZIP är källa; inga original har ritats om, färgändrats eller genererats.
- Huvudlogotyp på inloggning/registrering och större publik varumärkesyta; kompakt logotyp i sidomeny, mobilhuvud och mindre introduktionsytor.
- Appens befintliga ljus-/mörkerläge väljer motsvarande logotyp. Publika ytor med befintlig fast ljus bakgrund behåller ljus logotyp även när appens mörkerklass finns.
- Slogan: **Ditt liv, i din takt.**
- Godkända ljusa standardikoner för PWA och Apple Touch Icon; ljus/mörk favicon med media-villkor och ljus ICO-fallback. Alla ikonadresser svarar 200.
- Manifestets `start_url` `/hem`, scope och övrigt beteende är oförändrade enligt planen. Inga maskable-poster används.
- Funktioner, Flow/QuickFlow, interna identifierare, lagringsnycklar, navigation och native-projekt har inte ändrats.

## Kontroller
- Mobil 360/390/430 px och desktop 1024/1440 px: inloggning, registrering, publik startsida, Om oss samt inloggade Idag och äldre Hem granskade i ljust/mörkt läge. Logotyper laddar och behåller proportionerna.
- Vid normal textstorlek hittades ingen sidscroll i de publika/auth-kontrollerna; inga JavaScript-sidfel i första responsiva genomgången.
- Hela testsviten: **510/510 godkända**. Ett tidigare intermittent secure-local-test godkändes vid omkörning och i den slutliga fulla körningen. Ett extra riktat test har därefter lagts till för fast ljus logotypyta.
- Automatisk byggsignal: build OK; inga manuella byggen eller typechecks körda.
- Skärmbilder av ljus/mörk inloggning, registrering, mobilhuvud och desktopmeny har visats under granskningen.

## Avvikelser och gränser – inte omdesignade
- Vid 200 % text finns overflow på registrering vid 360 px och Om oss vid 360/390/430 px. Granskningen fastställer inte att detta är orsakat av varumärkesbytet; inga generella layoutändringar har gjorts.
- Publika startsidan och Om oss blandar befintlig ljus bakgrund med mörka texttoken om mörkerklass aktiveras; läsbarhetsbegränsningen kvarstår i övrigt. Logotyperna är läsbara på dessa ytor.
- Äldre produktnamn förekommer fortfarande i juridiska dokument och historisk changelog; dessa texter är inte globalt namnbytta. Detta är inte en fullständig omarbetning av juridiskt innehåll eller alla interna namn.
- Ingen tillförlitlig automatisk temaväxling av installerad PWA-/iOS-hemskärmsikon utlovas. Faviconens media-villkor är verifierade i Chromium; fysisk Safari/Android och redan installerade appar återstår att kontrollera efter separat publiceringsgodkännande.
- Gamla oanvända bildfiler kan finnas kvar; ingen gammal logotyp används på de utbytta varumärkesplatserna. Flow-maskot och tidigare låsta illustrationsstenar har uttryckligen bevarats.

## Ändrade filer
### Logotyp och originalpekare
- `src/components/paceable/brand-logo.tsx`
- `src/components/paceable/brand-logo.test.tsx`
- `src/assets/paceable-brand/paceable-horizontal-light.png.asset.json`
- `src/assets/paceable-brand/paceable-horizontal-dark.png.asset.json`
- `src/assets/paceable-brand/paceable-compact-light.png.asset.json`
- `src/assets/paceable-brand/paceable-compact-dark.png.asset.json`

### Varumärkesplatser och namn
- `src/components/layout.tsx`
- `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx`
- `src/components/flow-onboarding.tsx`, `src/components/intro-tour.tsx`
- `src/components/pwa-install-button.tsx`, `src/components/pwa-install-card.tsx`
- `src/routes/index.tsx`, `src/routes/om-oss.tsx`
- `src/lib/landing-translations.ts`
- `src/components/landing/day-window.tsx`
- `src/components/landing/menu-preview.tsx`
- `src/components/landing/feature-demos.tsx`

### Webbikoner och metadata
- `src/routes/__root.tsx`
- `public/manifest.webmanifest`
- `public/favicon.ico`, `public/favicon-light.png`, `public/favicon-dark.png`
- `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`
- `public/favicon.svg` borttagen som ersatt gammal favicon.

### Dokumentation
- `AGENTS.md`, `roadmap.md`, `CHANGELOG.md`, `src/lib/changelog.ts`
- `docs/paceable-brand-verification.md`
- Varumärkesanteckning i projektminnet uppdaterad; ingen produktionspublicering.

**Publiceringsstatus: inte publicerad; inväntar separat godkännande.**