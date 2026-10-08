# Paceable — logotyper och webbikoner

## 1. Kvalitetsbedömning: produktionsbyte pausat
De båda ZIP-filerna är granskade. Det nya paketet förbättrar transparens och ikonernas format, men är **inte ett fullgott originalpaket**.

| Material | Bekräftat resultat | Beslut |
|---|---|---|
| Första paketets logotyper | Ogenomskinlig presentationsbakgrund; huvudlogotyp 970 × 325 px. | Används endast som referens. |
| Första paketets ikoner | Uppskalade små utsnitt; ljus ytterkant och redan inbakade rundade hörn. | Används inte som produktionsikoner. |
| Nya huvudlogotypen | Transparent PNG, 1900 × 560 px, slogan med rätt text. Läsanvisningen anger att ordmärket har satts om i DejaVu Serif och inte är en exakt kopia av tidigare ordmärke. Stor transparent marginal till höger. | Inte automatiskt likställd med godkänt original. |
| Nya stensymbolen | 285 × 289 px. Frilagd från presentationsbild; ljus bakgrundsrest vid stenarnas bas och ljusa/jämna kantrester runt delar av konturen. | Behöver ett rent godkänt original. |
| Nya ljusa/mörka ikonerna | Kvadratiska, utan inbakade rundade hörn, i 32/64/180/192/512/1024 px. Samma stenformation återanvänds. Den mörka visar tydligt en ljus fläck vid basen och ljusa konturer. Läsanvisningen bekräftar cirka 300 px faktisk källupplösning. | Används inte som produktionsikoner i nuvarande skick. |

**Stoppregel:** Planens grund och avgränsningar är godkända, men genomförandet är inte godkänt. Ingen friläggning, omritning, typsnittsersättning, AI-generering eller uppskalning används för att skapa ett nytt påstått original. Inga kodändringar eller logotyp-/ikonbyten görs innan användaren har bifogat och uttryckligen godkänt slutliga produktionsdugliga original. Ingen publicering.

Behövs: liggande godkänd logotyp med rena kanter och avsedd typografi, läsbar version för mörkt läge, samt ljus och lavendelbaserad kvadratisk ikon utan bakgrundsrester. Helst vektor eller verkligt skarpt rasteroriginal med samma stensymbol. Ingen ny variant skapas av mig.

**Godkänd design:** Tre mjuka stenar i salviagrönt, persika och lavendel, lätt asymmetriskt placerade utan kraftig lutning. Samma exakta stenformation i samtliga filer. Liggande huvudlogotyp med stenarna till vänster om Paceable, exakt slogan ”Ditt liv, i din takt.” samt ljus appikon och lavendelfärgad variant för mörkt läge.

## Kompletterande granskning av Paceable_Lovable_komplett_paket.zip (2026-10-08)
- Båda dokumenten och samtliga 31 bildfiler granskade. README anger en 1024 × 1024 rasterkälla, inte vektor; filmåtten ensamma bevisar inte faktisk originalskärpa. Befintlig logotyptext skiljer enligt README fortfarande från första AI-mockupen; ingen typsnittsersättning görs.
- **Blockerande:** `logos/paceable-horizontal-dark.png` har oavsiktligt färgändrade högra delar av samtliga tre stenar: platta lavendelfält och en mindre ljus fläck. Cirka 64 000 synliga stenpixlar skiljer sig från ljusversionen. README:s påstående att stenpixlarna är oförändrade stämmer inte för denna fil. Invänta korrigerat, användargodkänt original; ingen egen bildkorrigering.
- Övriga fem logotyper har transparent bakgrund, oförvrängda proportioner och korrekt Paceable-text. Slogan är exakt ”Ditt liv, i din takt.” där den ingår; compact och no-tagline saknar den avsiktligt. Ljus/mörk compact har något olika marginaler/filmått, inte anledning att sträcka bilden. Inga uppenbara kvarvarande presentationsrubriker/bakgrundsblock. Vid cirka 200 px logotypbredd blir inbakad slogan mycket liten; använd kompakt levererad logotyp på trånga befintliga varumärkesplatser, inte hård krympning av sloganen.
- Symbolens trimmed-fil är pixelidentisk med originalets utsnitt utan transparenta marginaler. Ingen ny stenformation har tillförts. Synlig stenyta i 1024-originalet är 684 × 727 px; textur är mjuk men ser användbar ut i kontrollerade webbvisningsstorlekar. Ingen vektorskärpa eller framtida native-kvalitet utlovas.
- Samtliga 16 ljusa/mörka ikon-PNG har rätt kvadratiska mått, plana avsedda bakgrunder och inga inbakade rundade hörn. Visuell kontroll i 16/32/48/64/180 px: symbolen känns igen, detaljer blir naturligt små vid 16 px. De tre webb-PNG-filerna är exakta kopior av motsvarande ljusa ikoner; favicon.ico innehåller exakt samma ljusa 16/32/48 px-bilder.
- Ikonerna i `icons/light/` och `icons/dark/` samt `icons/web/pwa-icon-192.png` och `pwa-icon-512.png` är användbara som vanliga `purpose: any`-ikoner, men **inte godkända som maskable**: synlig stenyta når cirka 46,4 % radie från mitten, utanför den garanterade 40 %-radien. Ett separat godkänt maskable-original krävs om det ska användas; ingen egen omplacering.
- `icons/web/android-foreground-432.png` inspekterad men inte använd: native-projekt är uttryckligen utanför etappen och filen ersätter inte en färdig webb-maskable-ikon.
- Nuvarande implementering förblir pausad. Inga app-/ikon-/native-ändringar eller publicering. Tidigare plan och övriga skyddsgränser bevaras.

## 2. Avgränsad varumärkesuppdatering
När kvalitetskravet är uppfyllt:
- Återanvänd den levererade liggande logotypen där produktens varumärke redan visas: sidomeny, mobilens relevanta apphuvud, inloggning, registrering och befintliga introduktionsytor. Behåll alla handlingar och navigationsmål.
- Publika startsidans befintliga varumärkesplats och sidfot får samma godkända logotyp/namn. Ingen ombyggnad av startsidan eller ändring av dess interaktiva exempel.
- Byt produktnamn i berörda välkomst- och installationsmeddelanden till Paceable. Funktioner som Flow, QuickFlow och Min Flow behåller namn och innehåll.
- Slogan skrivs exakt **”Ditt liv, i din takt.”** där en faktisk varumärkesslogan visas. Ingen automatisk ersättning av funktionell stödtext eller samtliga rubriker.
- Logotypens inbyggda typografi används som bild; appens befintliga typsnitt ändras inte. Proportioner bevaras utan sträckning, filter, beskärning eller omfärgning.
- Tidigare logotyper ersätts i varumärkesplatser, även på tillgängliga äldre sidor. Befintliga illustrationsstenar vid Idag/Tankar och Flow-maskoten i funktioner lämnas orörda enligt tidigare bildlås; de är inte produktlogotyper.

## 3. Webbikoner och plattformsgränser
- Favicon: godkänd ljus/mörk ikon med temaval där webbläsaren stöder det, samt ljus fallback. Kontrollera faktiskt byte och läsbarhet vid 16–64 px.
- PWA: ljus godkänd ikon som kompatibel standard i manifestet, 192 och 512 px. Namn/short_name ändras till Paceable och slogan används i relevant beskrivning; start_url, scope och övrigt beteende lämnas oförändrat.
- Apple-hemskärmsikon: godkänd ljus ikon i 180 px som kompatibel standard.
- **Automatiskt mörkt/ljust byte av redan installerad PWA-/Apple-hemskärmsikon utlovas inte.** Manifestets vanliga ikonfält ger inte ett tillförlitligt plattformsöverskridande temabyte. Webbläsarflikens ikon och appens visade logotyp är separata från hemskärmsikonen.
- Använd inte en vanlig ikon som maskable utan kontroll av att hela stensymbolen ryms inom säker beskärningsyta. Vid otillräcklig marginal behövs levererat godkänt maskable-original; ingen stenformation modifieras.
- Ändra inga notisfiler. Nuvarande generiska notisikon kan visuellt följa med om den refererar samma webbikonadress; specifika ikonlänkar och allt notisbeteende bevaras.
- Native-ikoner, splash, butiksnamn och Android/iOS-projekt ingår inte.

## 4. Tekniskt genomförande och berörda filer
- Ny gemensam, liten logotypkomponent i `src/components/paceable/` och godkända bildpekare i `src/assets/`. Ingen migration av andra befintliga medier.
- Presentation: `src/components/layout.tsx`, `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx`, `src/components/flow-onboarding.tsx`, `src/components/intro-tour.tsx` och relevanta befintliga varumärkesplatser som hittas vid slutlig inventering.
- Publikt varumärke: `src/routes/index.tsx` och berörda strängar i `src/lib/landing-translations.ts`; ändra inte övrigt innehåll eller översättningsfunktion.
- Installationsnamn: `src/components/pwa-install-button.tsx` och `src/components/pwa-install-card.tsx`.
- Webbikoner: `public/manifest.webmanifest`, nya faviconfiler i `public/` och länkar i `src/routes/__root.tsx`. Övriga uppladdade webbmedier lagras genom befintligt assetflöde.
- Berörda sidors titlar och delningsbeskrivningar uppdateras till korrekt produktnamn, utan domänbyte eller ändring av verifieringsuppgifter. Ingen ny delningsbild tillverkas och ingen tidigare logotypbild exponeras via gamla delningstaggar på dessa sidor.
- `AGENTS.md`, `roadmap.md`, `CHANGELOG.md` och `src/lib/changelog.ts` dokumenterar genomförandet och datum.

## 5. Skydd
Ingen generell omdesign, färg-/kort-/knapp-/navigationsändring. Kalender, Capacity/Load/Pace, familj, sparning, kontodata, autentisering, notisinställningar och annan funktionalitet förblir oförändrade. Ingen ändring av identifierare, bundle ID, package name, URL-schema, domäner, backend, tabeller, lagringsnycklar eller interna MyFlove/Flow-namn. Inga nya paket och ingen publicering.

## 6. Kontroll och slutrapport
- Före/efter på inloggning, registrering, introduktion, sidomeny/apphuvud och publik varumärkesplats vid 360/390/430 samt 1024/1440 px, i ljust och mörkt läge; även 200 % text och synligt fokus.
- Samma symbol, oförändrade proportioner, läsbart ordmärke/slogan och inga ljusa kantrester på mörk bakgrund.
- Sök och visuell kontroll av att gamla produktlogotyper saknas i användargränssnittets varumärkesplatser; skilj uttryckligen från bevarade Flow-funktionsbilder och interna namn.
- Kontrollera faviconens fallback och temabyte, manifest-/ikonlänkar och maskable-säkerhet. Redovisa separat vad som kräver fysisk iPhone/Android och vad redan installerade appar kan behöva tid att uppdatera.
- Kör berörda tester och granska automatisk byggsignal. Rapportera exakt vilka filer/platser som ändrats med skärmbilder och eventuella återstående begränsningar.

**Nuvarande status:** Planens grund och avgränsningar är godkända; genomförandet är pausat. Ingen appkod, produktionsikon eller publicering ändrad. Vi inväntar slutliga produktionsdugliga original och användarens uttryckliga godkännande av dem.
