# Paceable – inventering och förslag: Pace + Din takt

## Sammanfattning

**Rekommenderad namnstruktur:** Paceable är appen, Pace är följeslagaren och Din takt är dagsrytmstödet med Varsamt, Jämnt och Utrymme. Slogan: **Ditt liv, i din takt.** Namnen är förslag, inte genomförda beslut.

Gamla namn och den lila maskoten används fortfarande. Huvudlogotyper/webbikoner är redan Paceable och lämnas orörda.

Källkods- och resursinventering, inte ny full skärm-/mobil-/pushkontroll. Endast plan/kravanteckningar dokumenteras; ingen appkod, bild eller användardata ändras eller publiceras. Källor nedan är relativt src om inte annat anges.

## 1. Var de gamla delarna finns

| Område | Befintligt användarsynligt innehåll | Källor | Bedömning / föreslagen åtgärd |
|---|---|---|---|
| Mer och navigation | Flow, Prata med Flow, Flow och samtal; hjälptext om planeringsläget i Flow | `layout.tsx`, `paceable/more-view.tsx` | Byt senare enbart etiketter/hjälptexter. Bevara länkar, sökning, filter, Enkelt läge och expansion. |
| Samtal | Flow i navigationsspår, ”Flow tänker…”, ”Flow lyssnar när du behöver det.”; lila figur och statusbilder | `flow/assistant-content.tsx`, `flow-tabs.tsx` | Textbyte är liten insats; figuren/statusuttrycken kräver separat visuellt beslut. `/flow` och `/assistant` använder redan samma samtalsinnehåll. |
| Gemensamt stöd på sekundära sidor | ”Fråga Flow”, ”Prata med Flow”, inställningshjälp och situationsillustrationer | `flow/flow-companion.tsx`, `flow-character.tsx`, `layout.tsx` | Aktivt men inte på alla sidor: layouten undantar bland annat Idag, Kalender, Tankar, Min plats och Hem från denna gemensamma figur. Befintliga stödregler bevaras. |
| Följeslagarinställningar | Flow-inställningar, Visa Flow i appen, När får Flow höra av sig?, Vad ska Flow prioritera? samt formuleringar med ”han” | `pages/flow-settings.tsx`, `flow/flow-companion.tsx` | Föreslå Pace-inställningar och neutrala formuleringar med ”Pace”. Byt inte betydelsen av hjälp, tider eller prioritering. |
| Min Flow / rum / minnen | Min Flow, Anpassa Flow, Det här vet Flow om mig, Min samling; helscen med Flow i fåtölj | `flow/flow-personal-pages.tsx`, `flow-customize-sheet.tsx`, `flow-room.tsx` | **Bevarade delar, inte dagens huvudvy.** `flow-view.tsx` säger uttryckligen att Min Flow är tillfälligt borttagen; personlig-sidornas exporter har inga externa träffar i granskningen. Inte återinföra dem som del av namnbytet. |
| Tankar / QuickFlow | Navigationen heter redan Tankar, men QuickFlow lever kvar i introduktion, publika exempel, hjälp, översikter och översättningar; status som ”Flow sorterar” | `quickflow-capture.tsx`, `hooks/use-quickflow.ts`, `lib/i18n-dicts/quickflow.ts`, `landing/feature-demos.tsx` | Samma fångst-/sorteringsfunktion, inget tas bort. Föreslå Tankar som namn och Fånga en tanke som handling. Tekniska QuickFlow lämnas kvar. |
| Dagsrytm | ”Dagens Pace”, Varsamt, Jämnt, Utrymme, planerad belastning och Gör dagen lättare | `day/today-pace.tsx`, `lib/day-pace.ts` | Byt endast synlig rubrik till Din takt. Beräkning, nivåer, förklaringar och användarval lämnas exakt som de är. |
| Hem, incheckning och kalenderstöd | Lila Flow i äldre Hem, incheckningsdialog och krävande-dag-stöd i kalenderns dagvy | `pages/home.tsx`, `flow-checkin-popup.tsx`, `calendar/calendar-planner.tsx` | Bildbyte behöver separat granskning av plats/proportioner. Formulär, registrering, förslag och placering ska inte ändras. |
| Övriga maskotplaceringar | Lugnläge, aktivitetshjälp, veckogenomgång och välkomsttur | `calm-mode.tsx`, `adaptive-activity-card.tsx`, `week-review-card.tsx`, `intro-tour.tsx` | Inventerade bildanrop, inklusive alternativtexter för skärmläsare. Gemensam figur kan återanvändas senare, men befintliga roller behöver mappas. |
| Introduktion, hjälpsidor och tomma lägen | ”Min första dag i Flow”, ”Så funkar MyFlove”, Flow hjälper / FlowPlan / Prata med Flow / QuickFlow, arbetsrelaterad hjälp om vad Flow vet | `flow-onboarding.tsx`, `intro-tour.tsx`, `pages/overview.tsx`, `lib/app-guide.ts`, `pages/work.tsx` | Små riktade textändringar, inte en ny introduktion. ”Din flow” som uttryck är inte samma sak som ett följeslagarnamn och ska inte massersättas. |
| Appinställningar | Anpassa MyFlove, Så funkar MyFlove, Flow-inställningar; beskrivning av äldre navigation | `pages/settings.tsx` | Anpassa Paceable, Så fungerar Paceable, Pace-inställningar. Korrigera beskrivningar efter faktisk navigation, inte navigationen. |
| Notiser och installationshjälp | Testnotis med titeln MyFlove, ”MyFlove gör resten”, ”Flow skickar en varm rad”; telefoninstruktioner som säger MyFlove | `lib/push.functions.ts`, `lib/flow-nudges.ts`, `personal-push-settings.tsx`, `enable-push-button.tsx`, `push-status-card.tsx` | Möjligt textbyte, men separat kontroll krävs. Installerade native-appar heter fortfarande MyFlove: instruktioner får inte ange ett namn som ännu inte finns i telefonens inställningar. |
| Publika exempel och språk | QuickFlow, Prata med Flow och Flow-beskrivningar, även engelska motsvarigheter | `routes/index.tsx`, `landing/menu-preview.tsx`, `feature-demos.tsx`, `lib/landing-translations.ts` | Uppdatera samma texter i båda språken och tillhörande sidbeskrivningar. Publika exempel förblir lokala och isolerade från kontodata. |
| Juridik och sidmetadata | MyFlove i villkor/integritet, AI-assistenten Flow, äldre slogan i bildbeskrivningar; FlowPlan i guide/cookies | `routes/villkor.tsx`, `integritet.tsx`, `cookies.tsx`, `guide.adhd-planner-for-adults.tsx`, `public/llms.txt` | Produktetiketter kan uppdateras efter separat innehållsgranskning. Inte blind ersättning av ansvarig part, kontaktuppgifter eller AI-/dataskyddsvillkor. |
| Äldre funktionsord | MyFlow i Insikter och bekräftelser, StudyFlow vid schemaimport, FlowScore i batteriförklaring och äldre egen sida | `pages/insight.tsx`, `insight-quickflow-hint.tsx`, `schedule-import.tsx`, `pages/battery.tsx`, `flowscore.tsx` | MyFlow ersätts med korrekt destination, t.ex. Dina uppgifter; StudyFlow med Studier. **FlowScore är inte följeslagaren eller dagsrytmstödet:** begreppsgranskning behövs, ingen automatisk omdöpning till Capacity/Din takt. |
| Historik, material och native | MyFlove/Flow i ändringshistorik, pitch/filmer, gamla bildfiler och iOS/Android-namn | `lib/changelog.ts`, `pages/pitch.tsx`, `remotion/`, `public/logo.svg`, `ios/`, `android/` | Historiska namn ska inte skrivas om retroaktivt. Bevarade gamla filer är inte bevis på aktiv visning; gamla `logo.svg` saknar aktiv appreferens i granskningen. Native lämnas orört. |

## 2. Sammanhängande namnförslag

| Befintligt | Förslag | Avgränsning |
|---|---|---|
| Flow, följeslagaren | **Pace** | Samtal, hjälptexter, alternativtexter och hälsningar. |
| Min Flow | **Min Pace** | Bara där funktionen redan finns; ingen återintroduktion av rum/egen sida. |
| Prata med Flow | **Prata med Pace** | Samma samtal och historik. |
| Flow och samtal | **Pace & samtal** | Under Stöd & samtal i Mer; samma länkar. |
| Flow-inställningar | **Pace-inställningar** | Samma val och tider. |
| Det här vet Flow om mig | **Det här får Pace komma ihåg** | Förtydligar att minnen är frivilliga, inte härledda fakta. |
| QuickFlow | **Tankar** / handling **Fånga en tanke** | Rekommenderas eftersom navigationen redan använder Tankar. Alternativ: Snabbfånga om kortnamn behövs. |
| FlowPlan / planeringsläge | **Planera** | Beskriv stödet, inte ett nytt varumärke. |
| Dagens Pace | **Din takt** | Varsamt / Jämnt / Utrymme behålls. |
| MyFlow / StudyFlow | **Dina uppgifter**, **din plan** / **Studier** | Välj ord efter den verkliga destinationen. |
| Veckans Flow / äldre dagsfunktion | **Veckans översikt** / **Din dag** | Veckans översikt används redan på veckosidan; byt inte tekniska sidnamn. |

På engelska behålls Pace/Paceable; dagsrytm kan heta **Your pace**. Den språkliga likheten finns då kvar men särskiljs genom placering och funktionsbeskrivning.

## 3. Framtida stenföljeslagare – vad resurserna tillåter

- Godkänd stenbild finns som en sammanhållen bild i `src/assets/paceable-stones.png`, använd via `PaceableStones`. Den är inte tre frilagda original.
- **Möjligt med befintlig bild:** mycket liten långsam förflyttning av hela formationen, utan deformation, färgfilter, nya skuggor eller materialändring. Stillaläge och minskad rörelse ger helt statisk bild. Befintliga låsta stenplaceringar/logotypen ska inte automatiskt börja röra sig.
- **Inte möjligt som enkel, godkänd återanvändning:** att låta varje sten röra sig självständigt bakom/framför de andra med nuvarande sammanfogade original. Det kräver separat godkända frilagda original/lager, inte maskning, beskärning eller omritning av nuvarande bild.
- Komponenten har även en äldre SVG-variant med tre grupper. Den är tekniskt animerbar men **inte ett tillåtet substitut för de pixelmässigt godkända stenarna**.
- FlowMascot har blick, blinkning, hjärtglöd, vinkning och olika samtalsstatus. Dessa ansikts-/kroppsuttryck kan inte överföras till stenarna. Behåll tydlig väntestatus i text; undvik att ”klart” blir en belöning eller att rörelse uttrycker en bedömning av mående.
- FlowCharacter innehåller situationsscener som behöver egen visuell genomgång. En generell bildersättning räcker inte för alla sammansatta illustrationer.
- Rummets Flow är inbakad i en helscen (`flow-room-seated.jpg`). Att ta bort figuren där är en större bild-/designändring, inte ett rent namnbyte. Gamla rumsanimationer och kläd-/tillbehörsfiler bevaras; sparade val raderas inte.
- Ingen ny figur, animation, scen eller bild skapas i denna inventering. Inga ansikten/armar/ben, tre separata figurer, krav, poäng eller Tamagotchi-beteende föreslås.

## 4. Skydd och teknisk separation

Behåll tekniska `FlowMascot`, `FlowCharacter`, `FlowStatus`, `FLOW_SYSTEM_PROMPT`, QuickFlow, `useFlowPlan`, analytics, `myflove:*`, översättningskopplingar och lagringsnycklar (`myflove-flow-appearance`, `myflove-flow-memories`, `myflove-quickflow`). Ingen global sök/ersätt. Kontoägande, synk, kryptering, auth, DB/RLS, native, familj och notiser lämnas orörda; inga migrationer eller paket. Samtliga rutter/djuplänkar behålls, inklusive `/flow`, `/assistant`, `/flowplan`, `/flow-installningar`, `/quickflow`, `/hem` och `/idag`.

Dagsrytmens `DayPace`, `deriveDayPace` och `day-pace.ts` behålls. Framtida följeslagarpresentation kan heta `PaceCompanion`, aldrig ett generiskt `Pace`. Ingen ny beräkning eller lagring. Kalender, Capacity, dagsrytm och familjerättigheter ändras inte.

AI-systemtexten introducerar fortfarande ”Flow – MyFloves AI-kompanjon”. Identitetsorden behöver senare separat granskning utan ändrade råd, säkerhetsregler eller åtgärdsgodkännande. Sparade samtal skrivs inte om.

## 5. Kostnadseffektiv arbetsordning

1. **Namnbeslut, låg insats:** godkänn Pace / Din takt och synligt QuickFlow-namn.
2. **Minsta textetapp, låg–medel:** etiketter i Mer, samtal, inställningar och Din takt; språk/alternativtexter. Lila bilden står kvar tills bildbyte godkänts.
3. **Övriga texter, medel:** hjälp, introduktion, tomma lägen, publika språktexter, AI-identitet och notiser. Juridik och instruktioner om installerade native-appar granskas särskilt.
4. **Visuell pilot, medel:** separat godkänd statisk stenföljeslagare i en befintlig samtalsyta, därefter eventuell minimal rörelse av hela formationen. Rör inte logotyp eller låsta Idag-stenar.
5. **Scener/rum, högre:** eget beslut och bildgranskning; ingen återintroduktion av gamla funktioner eller radering av sparade val.

**Namnrisken:** två synliga Pace-koncept kan få dagsrytm att låta som följeslagarens omdöme. Din takt minskar risken. Nivåerna är deterministiskt stöd, inte AI, prestation eller medicinsk bedömning. Engelska ”Your pace” kräver tydlig placering. Namnets juridiska tillgänglighet är inte undersökt; inget namn-/domänskydd garanteras.

## 6. Kontroller och godkännande

Vid framtida implementation: samma länkar, sökning, Enkelt läge, filter och språk; regressioner för unknown/future och Varsamt/Jämnt/Utrymme. Mobil/desktop, båda teman, 200 % text, skärmläsarnamn och minskad rörelse. Samtal och kalenderförslag får inte ändra något automatiskt. Notiser: oförändrat schema, mottagare, behörigheter, ljud, tyst läge och specifika länkar; verklig mobilkontroll separat.

**Nästa beslut:** godkänn eller justera namnstruktur och minsta textetappen. Ingen implementation eller publicering sker nu. Större bildändringar och publicering kräver separata godkännanden.
