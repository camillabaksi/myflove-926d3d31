# Städning av MyFloves struktur

Målet: en funktion = ett hem. Ingen funktionalitet raderas – saker flyttas, slås ihop visuellt eller göms bakom expandering.

## 1. Dubbletter och överlappningar (verifierat i koden)

| Överlapp | Var det finns idag | Primär framöver |
| --- | --- | --- |
| Dagsvy | `/hem` (725 rader, inkl. "Dagen just nu", Daily Flow, batteri), `/min-dag` (188 rader), `/kalender` dagsvy | **Min dag** (`/min-dag`) blir cockpit; kalenderns dagsvy återanvänds där |
| Uppgifter | `/tasks` (Idag/Kommande/Klart) + samma uppgifter i hem, min dag, kalender, FlowPlan | **Min dag** visar dagen, `/tasks` blir listvy nåbar därifrån |
| Energi | `/ma-bra`, `/energifloede`, energikartan i `/ma-bra`, `/flowscore`, Mitt batteri | **Mitt batteri** i Min dag; loggning och historik under batteriet/Insights |
| Prioritering/hjälp | `/flowplan`, `/vad-nu`, `/fokus` (redan redirect → flowplan), `/assistant`, proaktiva förslag, Livspusslet | **Flow** (en sektion) |
| Tankefångst | `/quickflow`, `/anteckningar`, `/dump` (redan redirect → quickflow) | **QuickFlow** primärt, Anteckningar som flik i QuickFlow |
| Rutiner | `/daglig-rutin`, `/morgonstart` (Wake Up) | **Rutiner** med Morgonstart som avsnitt |
| Statistik | `/statistik`, `/veckans-flow`, `/insight` | **Insights** samlar dem |
| Hemmet | `/matlista`, `/shopping`, `/stadning`, `/finances` | Grupp **Hemma** i Mer |
| Genvägar | Hemskärmens genvägskort + bottennavets fria platser + QuickFlow | Behåll bottennav-platser + QuickFlow; genvägskortet blir valfritt |

## 2. Rekommenderad informationsarkitektur

```text
Hem        Hälsning, batteri-sammanfattning (en rad), nästa hållpunkt,
           1–3 saker, stor + knapp. Inget mer på första skärmen.
Min dag    Kalender (dag/vecka) + aktiviteter/att göra + Mitt batteri
           + dagens energibalans (expanderbart).
QuickFlow  Fånga, sortera, Anteckningar/idébank.
Flow       Dagens nästa steg, FlowPlan-ordning, omplanering,
           "Vad ska jag göra nu?", Hjälp/chatt, proaktiva förslag,
           Livspusslet som underlag.
Mer        Studier · Jobb · Relationer/Familj/Barn · Hemma (mat, inköp,
           städ, ekonomi) · Resor · Insights (statistik, energikarta,
           veckans flow, FlowScore-detaljer) · Inställningar (rutiner,
           påminnelser, tyst läge, min situation, anpassa appen, admin).
```

Bottennav: Hem · Min dag · QuickFlow · Flow · Mer. De två fria platserna
byts mot en valfri plats (position 2 eller 3) så användaren behåller sin
anpassning utan att navet växer.

## 3. Vad som slås ihop visuellt

- **Hem**: ta bort dubbelvisning – "Dagen just nu" och Daily Flow-kortet flyttas till Min dag; Hem behåller bara sammanfattningen.
- **Min dag**: ett kort per lager – Batteri (med energibalans bakom expandera), Dagens tidslinje (kalender + uppgifter + rutiner + medicin), Att göra-rest.
- **Flow**: flikar i en sida – Nästa steg · Ordning (FlowPlan) · Omplanera · Fråga Flow.
- **Insights**: flikar – Mönster (statistik) · Energikarta · Veckan · Strategier.
- **Hemma**: en sida med flikar Mat · Inköp · Städ · Ekonomi (befintliga sidor renderas som innehåll).

## 4. Bara flyttas till Mer/Inställningar

`/paminnelser`, `/daglig-rutin`, tyst läge, `/min-situation`, `/anpassa`, `/beloningar`, `/traning`, `/pomodoro`, `/friktionsindex` (feedback), admin-sidorna. Routes behålls oförändrade – bara menyplaceringen ändras.

## 5. Kan tas bort utan att funktionalitet försvinner

- Navposter (inte kod) för: FlowScore, Energiflöde, Må bra, Statistik, Veckans Flow, FlowPlan, Anteckningar, StudyBuddy, WorkFlow – de nås från sin nya förälder.
- Hemskärmens genvägskort om bottennavets fria plats täcker behovet (sektionen finns kvar i Anpassa hemskärmen).
- Inget route-filborttag i denna omgång. `/fokus` och `/dump` är redan redirects och behålls som sådana.

## 6. Konflikter i nuvarande navigation

- `navItems` listar 40+ destinationer platt och grupperas sedan i 8 kategorier – kategorierna och "Enkelt läge" (essential-flaggan) pekar delvis åt olika håll (t.ex. `/matlista` är markerad `essential`, `/min-dag` och `/flowplan` konkurrerar om samma jobb).
- Bottennavets slots defaultar till `/kalender` + `/assistant`, vilket dubblerar Min dag och Flow när dessa blir fasta.
- `/calendar` → `/kalender` och `/fokus` → `/flowplan` är redirects som ska bevaras.
- Hem, Min dag och Kalender renderar alla dagens tidslinje via olika komponenter.

## 7. Implementeringsordning (en etapp per körning)

1. **Navigation först, innehåll orört**: bygg om `src/components/layout.tsx` till fem destinationer + ny Mer-gruppering. Inga sidor ändras, inga routes tas bort. Lätt att rulla tillbaka.
2. **Min dag blir cockpit**: flytta batteri, tidslinje och dagens uppgifter från `home.tsx` till `my-day.tsx` genom att återanvända befintliga komponenter (`EnergyBattery`, `DayTimeline`, `DailyFlowCard`) – ingen ny logik.
3. **Hem bantas**: lämna hälsning, batterirad, nästa hållpunkt, 1–3 saker och + knappen. Anpassa hemskärmen behåller resten som valbart.
4. **Flow samlas**: `/flow` som flikvy över FlowPlan, Vad nu, Assistent och förslag; gamla routes blir redirects.
5. **Energi samlas**: Energiflöde och Energikarta renderas inuti batteriet respektive Insights; `/energifloede` och `/ma-bra` behålls som redirects till rätt flik.
6. **Insights och Hemma samlas** på samma sätt.
7. **Uppföljning**: changelog + `src/lib/changelog.ts`, klickgenomgång av alla gamla URL:er så inget 404:ar.

## Tekniska noteringar

- Ingen datamodell ändras. Alla flyttar sker på presentationsnivå genom att montera befintliga sidkomponenter i nya containers.
- Gamla URL:er behålls som `beforeLoad`-redirects (samma mönster som `_app.calendar.tsx`) så bokmärken och push-länkar fortsätter fungera.
- `home-sections.ts` och användarens sparade hemskärmsordning migreras mjukt: okända sektions-id:n ignoreras, nya läggs sist.
- FlowScore, friktionsvärden och Livspusslet fortsätter beräknas exakt som idag – de får bara ingen egen menypost.
