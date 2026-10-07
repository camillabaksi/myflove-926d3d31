# Paceable — rebrand etapp 1

## Mål och avgränsning

Ge den befintliga appen Paceables visuella identitet och huvudnavigation, utan ny app, migration eller förändrad Core-logik. **Appkod ändras först efter ditt godkännande. Ingen publicering.**

Etappen omfattar appens gemensamma ram, Idag, Tankar, Min plats, Kalender och Mer. Hem behålls kompakt och nåbart. Publik landningssida, App Store/Google Play, native display name/ikon/splash, domän och övergripande SEO-rebrand väntar på en separat release-checklista.

## 1. Designsystem: calm but happy

En varm, mycket ljus canvas, ljusa ytor och mörk plommontext. Ungefär 80 % lugn bas och 20 % färg, utan wellness-beige eller prestationsdashboard.

### Föreslagna centrala färgtokens

| Roll | HEX |
|---|---|
| Canvas, varm off-white | `#FAF9F6` |
| Surface, warm white | `#FFFEFC` |
| Primär text/navigation/knapp, plum | `#382C40` |
| Sekundär text, muted plum | `#716576` |
| Border | `#E5DFE6` |
| Soft lavender | `#E8DFF3` |
| Apricot/coral | `#F3B9A6` |
| Warm sun yellow | `#F2D57B` |
| Fresh sage | `#C6DDC9` |
| Soft sky blue | `#D3E6F2` |
| Warm sand neutral, sparsam accent | `#EAE3D8` |

HEX-värdena dokumenteras centralt; CSS kopplas till semantiska tokens med kompatibla värdeformat. Text ligger i plum/muted plum på ljusa ytor, inte ljus accenttext på ljus bakgrund. Kontrollera WCAG AA: 4,5:1 för vanlig text, 3:1 för stora texter och relevanta kontrollgränser. Dark mode får motsvarande tydliga tokenroller och testas.

- Behåll **Inter och Plus Jakarta Sans**, utan nya fontpaket. Ta bort handskriftsstil på omarbetade core-ytor, även hälsning och synliga kalender-/uppgiftsnamn.
- Luft, tydlig storleks-/vikthierarki, mjuka hörn och diskret kant/skugga. Inte ett separat kort för varje datapunkt eller kort inuti kort.
- Ingen belastningsstyrd mörkare bakgrund, alarmfärg eller green=good/red=bad för Capacity/Pace.
- Calendar-area-färger behåller sina områdesbetydelser och textetiketter; färg får aldrig vara enda informationsbäraren.
- Ny färgboost via små avsiktliga accenter, inte dekorativa glödor eller en stor illustration på varje sida.

## 2. Appens ram och huvudnavigation

Synligt varumärke i appens ram blir **Paceable**, med enkel sans-serif-wordmark tills en separat logotyp beslutas. Samma fyra destinationer och Mer används på mobil och dator. Datorns sekundära funktioner behålls, men får inte konkurrera med huvudnavigationen.

| Synligt namn | Befintlig destination | Förändring |
|---|---|---|
| Idag | `/idag` | Primär dagvy; sol över horisont, inte hus |
| Kalender | `/kalender` | Befintliga månad/vecka/dag |
| Tankar | `/quickflow` | Befintlig QuickFlow-sida och capture |
| Min plats | `/halsa` | Befintlig personlig ingång ompresenteras |
| Mer | Befintlig meny i appens ram | Sekundära funktioner, ingen ny route eller lagring |

**Inga routes byter namn eller tas bort.** `/hem` finns kvar via Mer; `/min-dag` fortsätter redirecta till `/idag`. Inga ändringar av auth, startredirect eller sparade navigationsval behövs för att Idag ska vara den primära fliken.

- Exakt fem mobilposter i stabila, lika breda spalter. Inga upphöjda plusknappar i huvudnavigationen.
- Egna enkla line icons för horisont, organisk tankebubbla och två öppna omslutande kurvor; enkel kalender och meny i samma tunna rundade stroke.
- Aktivt läge: tydlig plumtext, eventuellt svag lavender wash, `aria-current` för aktuell sida. Ingen stor färgcirkel.
- Min plats öppnar `/halsa` direkt, inte dagens specialfall där Hälsa öppnar en kategori i Mer.
- Tankar och **+ Lägg till** skiljs åt. Den generella QuickFlow-plusknappen presenteras inte som Lägg till på etappens primärytor; Today/Kalender behåller sina befintliga kontextuella Lägg till-handlingar. Capture-funktion, händelsenamn och alternativa legacy-ingångar behålls.
- Mer bevarar sökning, områden, konto-/inställningsfunktioner och befintliga behörighetsfilter. Minska endast säkra presentationsdubbletter; inga funktioner tas bort.

## 3. Idag och Kalender: endast presentation

### Idag

Behåll ordningen **hälsning/datum → Capacity → Din dag → Pace → relevant stöd**, med egen dag först och familjen sekundär.

- Faktisk kapacitetsprocent behålls i en lågmäld horisontell batterivisualisering utan målmarkering, ring, completion-effekt eller uppmaning att nå 100 %.
- Unknown visar befintlig frivillig incheckning, aldrig 0 %, streck eller tomt batteri. Framtidsskydd förblir oförändrat.
- Varsamt/Jämnt/Utrymme och samma förklaringslogik behålls. Högst en neutral stödkommentar, exempelvis ”En sak i taget räcker.”
- Lägg till, Påminnelse, kopiera dag, egna uppgifters avbockning och befintlig granskningsdialog bevaras. Ingen ändring när en dialog bara öppnas.

### Kalender

Byt färg, typografi, ytor och kontroller — **inte** perioddata, tidslinjens skala, drag/flytt/ångra, family projection eller beräkningar. Behåll lugn månad, känd kapacitet och områdesprickar, familjefilter och read-only barnschema. Hem får endast nödvändiga visuella följdändringar och förblir kompakt, utan en andra Today/Pace.

## 4. Tankar: befintlig fångst, tydligare presentation

Använd `QuickflowCapture`, `useVoiceInput`, nuvarande datumtolkning, granskningslista och befintliga godkända sparvägar. Ingen ny Tankar-tabell, lagringsnyckel eller parallell capture.

- Rubrik: **”Vad har du i huvudet?”**
- Undertext: **”Skriv eller säg det som det är.”**
- Behåll skriva/tala, granska/redigera och uttryckligt godkännande före sparning. Inget sparas vid öppning, inmatning eller stängning.
- Visa endast struktur som befintlig funktion faktiskt tolkar, med möjlighet att granska. Behåll redan sparade tankar, anteckningar, bilder och sorteringsregler nåbara utan att allt konkurrerar i första vyn.

**Viktig befintlig begränsning:** datum-/tidstolkning och separata påminnelseval finns. Däremot är automatisk familjekoppling plus ”dagen innan”-påminnelse i ett gemensamt kalenderförslag inte verifierad i dagens capture; den nuvarande kalender-sparvägen sätter titel/datum/tid men inte dessa båda fält. Etapp 1 lovar därför inte hela tandläkarexemplet som ny funktion, gissar inte barnkoppling och ändrar inte parser/sparmodell. Den utökningen kräver ett separat avgränsat godkännande om den ska ingå senare.

## 5. Min plats utan datamigration

Anpassa den befintliga datafria `/halsa`-ingången. Visa en lugn samling befintliga vägar till incheckning/mående, kapacitet-/energihistorik, återhämtning och befintliga insikter. Ingen ny historik, poäng eller datamodell skapas.

Min plats-namnet ligger i gemensam navigations-/översättningscopy så att det enkelt kan ändras. Träning, rutiner/medicin och äldre Flow-funktioner finns kvar via Mer/befintliga adresser. Ingen radering eller aggressiv flytt av personliga funktioner.

## 6. Paceable stones och Flow under övergången

Skapa en liten gemensam **PaceableStones**-presentation: tre konsekventa organiska pebble-former i matt keramik/soft-stone med återanvändbara accentfärger. En sammanhållen bildresurs med transparent bakgrund och en gemensam komponent håller form/proportioner konsekventa.

- Inga ögon, mun, armar, namn eller accessoarer. Ingen karaktär eller Tamagotchi.
- Sparsam användning i appidentitet och Today-stöd; inte stor bild på alla skärmar.
- Endast diskret settling/sliding, helt stilla vid reduced motion. Formation är inte ett hemligt Pace-kodsystem; texten förklarar nivån.
- Byt maskotpresentation endast på etappens omarbetade primärytor. Global companion visas inte där den konkurrerar med nya identiteten.
- **Ändra inte den delade FlowMascot eller Flow-/chatt-/minneslogiken.** Min Flow-rummet, legacy-Flow, anpassningar och sparad historik består. Ingen global Flow-rename.

## Teknisk omfattning: filer och nya delar

### Befintliga filer som ändras efter godkännande

- `src/styles.css`: Paceable-tokens, semantiska ytor, fokus, skuggor och reduced motion. Behåll kompatibla tokenalias för äldre ytor; publika landing-tokens lämnas separata.
- `src/components/layout.tsx`: appnamn, appbakgrund, huvudnavigation, desktop, Mer och avgränsad companion-/capture-presentation. Flytta relevanta inline-färgroller till CSS-tokens utan att skriva om appens beteende.
- `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/myflove/block.tsx`: endast nödvändiga gemensamma visual-varianter; internnamn består. Undvik bred omskrivning.
- `src/pages/today.tsx`, `src/pages/day-hub.tsx`, `src/components/day/today-capacity.tsx`, `src/components/day/today-pace.tsx`: typografi, identitet, ytor och neutral stödkommentar.
- `src/components/calendar/capacity-battery.tsx`, `src/components/calendar/calendar-planner.tsx`, `src/pages/calendar.tsx`: lugnt batteri och kalenderns visuella shell, inte beräkningar/geometri.
- `src/pages/dump.tsx`, `src/components/quickflow-capture.tsx`, vid behov `src/components/quickflow-fab.tsx`: Tankar-copy, granskningens utseende och tydlig åtskillnad mot +; befintliga handlers består.
- `src/pages/health.tsx`: Min plats som personlig ingång med befintliga länkar.
- Vid behov `src/pages/home.tsx`, `src/components/home/priority-actions.tsx` och monterade aktivitetsrader: enbart samstämmig typografi/presentation.
- `src/lib/i18n.ts`: ny synlig copy enligt befintligt språkval, utan ändrade tekniska identifierare.
- `AGENTS.md`, `CHANGELOG.md`, `src/lib/changelog.ts`, `roadmap.md`: dokumentation och verifieringsresultat efter implementation.

### Nya delar

- `src/components/paceable/navigation-icons.tsx`: tre konsekventa specialikoner, enkla SVG line icons.
- `src/components/paceable/paceable-stones.tsx` och bildresurs under `src/assets/`: gemensam visuell identitet, inte datalogik.
- Små presentationstester för navigation, godkännandeflöde och reduced motion. Inga nya paket, serverfunktioner eller databasscheman.

### Uttryckligen orörda

`dayCapacity()`, `useDayCapacity()`, `calendarLoad()`, `calendarGaps()`, `day-pace.ts`, future/unknown guards, recovery, Behöver mig, family dedup och child schedule/read-only-regler. Intern Capacity Mode och legacy-motorer består, fortsatt utan synliga mode-val.

Även `se.myflove.app`, `app.myflove.mobile`, namespace, URL schemes, backendprojekt/URL:er/nycklar, tabeller/RLS/auth/push, analytics-eventnamn, user_kv, localStorage-/krypteringsnycklar och tekniska MyFlove-/Flow-identifierare förblir oförändrade. Ingen routeborttagning, migration eller global search-and-replace.

## Arbetsordning och verifiering

1. Tokens → typografi/ytor → appens ram → navigation.
2. Idag → Tankar → Min plats → Kalender → Mer → sparsamma stones.
3. Kör befintlig testsvit och nya presentationsregressioner; granska automatiska typkontroll-/byggresultat. Inga manuella produktionsbyggen eller publicering.
4. Behåll regressionstäckning för Capacity-prioritet, unknown/future, Gentle/Steady/Open, okänd Load/längd, gaps/tight/overlap, recovery och familjededup.
5. Kontrollera att barnschema är read-only, egna tasks kan avbockas, capture kräver godkännande och öppnade dialoger inte skriver data. Skrivande flöden testas isolerat/mockat, inte genom att ändra användarens riktiga plan.
6. Webbläsarkontroll av `/idag`, `/hem`, `/kalender`, `/quickflow`, `/halsa` och `/min-dag`: 360/390/411/430 px samt desktop. Mer ska nå kvarvarande sekundärfunktioner; testa tangentbord, fokus, textskalning 200 %, kontrast, touch targets minst 44 px och reduced motion.
7. Kontrollera iOS safe-area och Android/inset-layout i webbpreview; **fysisk iOS/Android och native voice/insets kan inte verifieras fullt där** och redovisas som begränsning.
8. Slutrapport: ändrade filer, återanvändning, regler som lämnats orörda, legacy/routes, capture-begränsningen, testresultat och kvarstående risker.

## Risker och stoppregel

Globala tokens påverkar även äldre appytor; granskas utan att funktionerna skrivs om. Kalenderns positionsmått ska inte rubbas av ny styling. Capture får inte lova osupporterade familje-/påminnelseförslag. Native metadata och separat SEO-rebrand ingår inte.

**Om någon skyddsregel måste brytas stoppas just den delen och rapporteras. Planen godkänns av dig — inte automatiskt av mig.**
