# Paceable – inventering och förslag: Pace + Din takt

## Sammanfattning

**Rekommenderad namnstruktur:** Paceable är appen, Pace är följeslagaren och Din takt är dagsrytmstödet med Varsamt, Jämnt och Utrymme. Slogan: **Ditt liv, i din takt.** Namnen är förslag, inte genomförda beslut.

Gamla namn finns fortfarande i synliga texter, samtal, inställningar, hjälp, notiser och juridiska sidor. Den lila maskoten används fortfarande aktivt. Däremot är huvudlogotyperna och webbikonerna redan Paceable; de ska inte göras om.

Inventeringen bygger på befintlig källkod och bildkopplingar. Den är inte en ny fullständig skärmgranskning, levererad pushkontroll eller kontroll av installerade mobilappar. Inga appfiler, bilder, inställningar eller användardata har ändrats; inget har raderats eller publicerats. Endast inventering, plan och kravanteckningar dokumenteras.

## 1. Var de gamla delarna finns

| Område | Befintligt användarsynligt innehåll | Källor | Bedömning / föreslagen åtgärd |
|---|---|---|---|
| Mer och navigation | Flow, Prata med Flow, Flow och samtal; hjälptext om planeringsläget i Flow | `src/components/layout.tsx`, `src/components/paceable/more-view.tsx` | Byt senare enbart etiketter/hjälptexter. Bevara länkar, sökning, filter, Enkelt läge och expansion. |
| Samtal | Flow i navigationsspår, ”Flow tänker…”, ”Flow lyssnar när du behöver det.”; lila figur och statusbilder | `src/components/flow/assistant-content.tsx`, `flow-tabs.tsx` | Textbyte är liten insats; figuren/statusuttrycken kräver separat visuellt beslut. `/flow` och `/assistant` använder redan samma samtalsinnehåll. |
| Gemensamt stöd på sekundära sidor | ”Fråga Flow”, ”Prata med Flow”, inställningshjälp och situationsillustrationer | `src/components/flow/flow-companion.tsx`, `flow-character.tsx`, `src/components/layout.tsx` | Aktivt men inte på alla sidor: layouten undantar bland annat Idag, Kalender, Tankar, Min plats och Hem från denna gemensamma figur. Befintliga stödregler bevaras. |
| Följeslagarinställningar | Flow-inställningar, Visa Flow i appen, När får Flow höra av sig?, Vad ska Flow prioritera? samt formuleringar med ”han” | `src/pages/flow-settings.tsx`, `src/components/flow/flow-companion.tsx` | Föreslå Pace-inställningar och neutrala formuleringar med ”Pace”. Byt inte betydelsen av hjälp, tider eller prioritering. |
| Min Flow / rum / minnen | Min Flow, Anpassa Flow, Det här vet Flow om mig, Min samling; helscen med Flow i fåtölj | `src/components/flow/flow-personal-pages.tsx`, `flow-customize-sheet.tsx`, `flow-room.tsx` | **Bevarade delar, inte dagens huvudvy.** `flow-view.tsx` säger uttryckligen att Min Flow är tillfälligt borttagen; personlig-sidornas exporter har inga externa träffar i granskningen. Inte återinföra dem som del av namnbytet. |
| Tankar / QuickFlow | Navigationen heter redan Tankar, men QuickFlow lever kvar i introduktion, publika exempel, hjälp, översikter och översättningar; status som ”Flow sorterar” | `src/components/quickflow-capture.tsx`, `src/hooks/use-quickflow.ts`, `src/lib/i18n-dicts/quickflow.ts`, `src/components/landing/feature-demos.tsx` | Samma fångst-/sorteringsfunktion, inget tas bort. Föreslå Tankar som namn och Fånga en tanke som handling. Tekniska QuickFlow lämnas kvar. |
| Dagsrytm | ”Dagens Pace”, Varsamt, Jämnt, Utrymme, planerad belastning och Gör dagen lättare | `src/components/day/today-pace.tsx`, `src/lib/day-pace.ts` | Byt endast synlig rubrik till Din takt. Beräkning, nivåer, förklaringar och användarval lämnas exakt som de är. |
| Hem, incheckning och kalenderstöd | Lila Flow i äldre Hem, incheckningsdialog och krävande-dag-stöd i kalenderns dagvy | `src/pages/home.tsx`, `src/components/flow-checkin-popup.tsx`, `src/components/calendar/calendar-planner.tsx` | Bildbyte behöver separat granskning av plats/proportioner. Formulär, registrering, förslag och placering ska inte ändras. |
| Övriga maskotplaceringar | Lugnläge, aktivitetshjälp, veckogenomgång och välkomsttur | `src/components/calm-mode.tsx`, `adaptive-activity-card.tsx`, `week-review-card.tsx`, `intro-tour.tsx` | Inventerade bildanrop, inklusive alternativtexter för skärmläsare. Gemensam figur kan återanvändas senare, men befintliga roller behöver mappas. |
| Introduktion, hjälpsidor och tomma lägen | ”Min första dag i Flow”, ”Så funkar MyFlove”, Flow hjälper / FlowPlan / Prata med Flow / QuickFlow, arbetsrelaterad hjälp om vad Flow vet | `src/components/flow-onboarding.tsx`, `src/components/intro-tour.tsx`, `src/pages/overview.tsx`, `src/lib/app-guide.ts`, `src/pages/work.tsx` | Små riktade textändringar, inte en ny introduktion. ”Din flow” som uttryck är inte samma sak som ett följeslagarnamn och ska inte massersättas. |
| Appinställningar | Anpassa MyFlove, Så funkar MyFlove, Flow-inställningar; beskrivning av äldre navigation | `src/pages/settings.tsx` | Anpassa Paceable, Så fungerar Paceable, Pace-inställningar. Korrigera beskrivningar efter faktisk navigation, inte navigationen. |
| Notiser och installationshjälp | Testnotis med titeln MyFlove, ”MyFlove gör resten”, ”Flow skickar en varm rad”; telefoninstruktioner som säger MyFlove | `src/lib/push.functions.ts`, `src/lib/flow-nudges.ts`, `src/components/personal-push-settings.tsx`, `enable-push-button.tsx`, `push-status-card.tsx` | Möjligt textbyte, men separat kontroll krävs. Installerade native-appar heter fortfarande MyFlove: instruktioner får inte ange ett namn som ännu inte finns i telefonens inställningar. |
| Publika exempel och språk | QuickFlow, Prata med Flow och Flow-beskrivningar, även engelska motsvarigheter | `src/routes/index.tsx`, `src/components/landing/menu-preview.tsx`, `feature-demos.tsx`, `src/lib/landing-translations.ts` | Uppdatera samma texter i båda språken och tillhörande sidbeskrivningar. Publika exempel förblir lokala och isolerade från kontodata. |
| Juridik och sidmetadata | MyFlove i villkor/integritet, AI-assistenten Flow, äldre slogan i bildbeskrivningar; FlowPlan i guide/cookies | `src/routes/villkor.tsx`, `integritet.tsx`, `cookies.tsx`, `guide.adhd-planner-for-adults.tsx`, `public/llms.txt` | Produktetiketter kan uppdateras efter separat innehållsgranskning. Inte blind ersättning av ansvarig part, kontaktuppgifter eller AI-/dataskyddsvillkor. |
| Äldre funktionsord | MyFlow i Insikter och bekräftelser, StudyFlow vid schemaimport, FlowScore i batteriförklaring och äldre egen sida | `src/pages/insight.tsx`, `src/components/insight-quickflow-hint.tsx`, `schedule-import.tsx`, `src/pages/battery.tsx`, `flowscore.tsx` | MyFlow ersätts med korrekt destination, t.ex. Dina uppgifter; StudyFlow med Studier. **FlowScore är inte följeslagaren eller dagsrytmstödet:** begreppsgranskning behövs, ingen automatisk omdöpning till Capacity/Din takt. |
| Historik, material och native | MyFlove/Flow i ändringshistorik, pitch/filmer, gamla bildfiler och iOS/Android-namn | `src/lib/changelog.ts`, `src/pages/pitch.tsx`, `remotion/`, `public/logo.svg`, `ios/`, `android/` | Historiska namn ska inte skrivas om retroaktivt. Bevarade gamla filer är inte bevis på aktiv visning; gamla `logo.svg` saknar aktiv appreferens i granskningen. Native lämnas orört. |

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

Synlig text är skild från interna namn. Bevara `FlowMascot`, `FlowCharacter`, `FlowStatus`, `FLOW_SYSTEM_PROMPT`, `useFlowPlan`, QuickFlow-komponenter, översättningskopplingar, analytics-händelser och `myflove:*`-händelser. Bevara lagringsnycklar som `myflove-flow-appearance`, `myflove-flow-memories`, `myflove-quickflow`, kontoägande, synk och kryptering.

Alla befintliga rutter och djuplänkar, bland annat `/flow`, `/assistant`, `/flowplan`, `/flow-installningar`, `/quickflow`, `/hem` och `/idag`, lämnas kvar. Inga migrationer, DB/RLS-/authändringar, nya paket, nativeändringar eller global sök/ersätt.

**Dagsrytmens `DayPace`, `deriveDayPace` och `day-pace.ts` behålls.** Eventuell framtida presentationsmodul för följeslagaren får ett tydligt avskilt namn, exempelvis `PaceCompanion`, inte ett generiskt `Pace`. Den får inte införa en andra beräkning av kapacitet eller dagsrytm.

AI-systemtexten introducerar fortfarande ”Flow – MyFloves AI-kompanjon”. En framtida namnjustering måste granskas separat så samtal inte återintroducerar gamla namn; råd, åtgärdsgodkännande och säkerhetsregler får inte ändras. Gamla sparade samtal ska inte skrivas om.

## 5. Risker och kostnadseffektiv arbetsordning

| Steg | Innehåll | Insats / stoppregel |
|---|---|---|
| 1. Besluta namn | Godkänn Pace, Din takt och synligt QuickFlow-namn. | Låg. Ingen kod innan godkännande. |
| 2. Minsta implementation | Endast synliga etiketter i Mer, samtal, inställningar och Dagens Pace → Din takt; tillhörande språk/alternativtexter. Den lila bilden står kvar till visuellt godkännande. | Låg–medel. Ingen funktion/route/storage ändras. |
| 3. Övriga textytor | Hjälp, introduktion, tomma lägen, publik sida och språk, AI-identitet och notistexter med separat kontroll. Juridik/nativeinstruktioner granskas särskilt. | Medel. Bevara notisschema, mottagare, ljud, tyst läge, behörigheter och specifika länkar. |
| 4. Visuell pilot | Separat godkänd statisk stenföljeslagare i en befintlig samtalsyta, därefter eventuell minimal rörelse av hela formationen. | Medel. Visa resultat före bred ersättning; rör inte logotyp eller låsta Idag-stenar. |
| 5. Större illustrationer | Situationsscener, rum och gamla tillbehör behandlas separat om de ska förändras. | Högre. Ingen ersättningsscen eller ny funktion utan eget godkännande. |

**Viktigaste namnrisken:** två synliga Pace-koncept kan få dagsrytmstödet att låta som följeslagarens omdöme. Din takt + oförändrade kvalitativa nivåer minskar risken. Dagsrytm är fortfarande deterministiskt stöd, inte AI eller prestation; följeslagaren är inte en medicinsk bedömare.

Pace är kort och internationellt användbart men ett vanligt engelskt ord; juridisk varumärkes-/namntillgänglighet är inte undersökt eller garanterad här. Appnamnet och domänen ändras inte.

## 6. Kontroll vid ett framtida genomförande

Riktade tester för samma länkar, sökning, Enkelt läge, behörighetsfilter och översättningar; regressionskontroll av dagsrytmens unknown/future/Varsamt/Jämnt/Utrymme utan logikändring. Visuell kontroll mobil/desktop, båda teman, 200 % text, skärmläsarnamn och minskad rörelse. Kontrollera samtalsstatus och att inga kalenderändringar sker automatiskt. Notiser behöver separat test av text och oförändrad leverans/destination; installerade appar kräver verklig enhetskontroll.

**Nästa beslut:** godkänn eller justera namnstruktur och den avgränsade första textetappen. Godkännande av planen är inte publiceringsgodkännande; större bildändringar kräver separat visuell granskning.