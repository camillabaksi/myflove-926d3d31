# Paceable – inventering och förslag: Pace + Din takt

## Sammanfattning

**Rekommenderad namnstruktur:** Paceable är appen, Pace är följeslagaren och Din takt är dagsrytmstödet med Varsamt, Jämnt och Utrymme. Slogan: **Ditt liv, i din takt.** Namnen är förslag, inte genomförda beslut.

Gamla namn och den lila maskoten används fortfarande. Huvudlogotyper/webbikoner är redan Paceable och lämnas orörda.

Källkods- och resursinventering, inte ny full skärm-/mobil-/pushkontroll. Endast plan/kravanteckningar dokumenteras; ingen appkod, bild eller användardata ändras eller publiceras. Källor nedan är relativt src om inte annat anges.

## 1. Var de gamla delarna finns

Källor är relativa `src/` om inte annat anges. Synliga texter ska skiljas från importnamn och kommentarer.

| Område | Synligt innehåll / resurser | Källor | Åtgärdstyp |
|---|---|---|---|
| Mer/navigation | Flow, Prata med Flow, Flow och samtal | `components/layout.tsx`, `components/paceable/more-view.tsx` | Etiketter; behåll länkar/filter/expansion. |
| Samtal | Flow, ”Flow tänker…”, ”Flow lyssnar när du behöver det.”, lila figur/status | `components/flow/assistant-content.tsx`, `flow-tabs.tsx` | Text liten insats; figur separat beslut. `/flow` och `/assistant` använder samma samtalsinnehåll. |
| Stöd på sekundära sidor | Fråga Flow, situationsscener och hjälpnivåer | `components/flow/flow-companion.tsx`, `flow-character.tsx`, `components/layout.tsx` | Aktivt men gemensam figur är undantagen från bland annat Idag, Kalender, Tankar, Min plats och Hem. |
| Inställningar | Flow-inställningar, Visa Flow, När får Flow höra av sig?, ”han” | `pages/flow-settings.tsx`, `components/flow/flow-companion.tsx` | Textbyte till Pace; samma hjälp, tider och prioriteringar. |
| Min Flow/rum/minnen | Min Flow, Anpassa Flow, Det här vet Flow om mig, Min samling | `components/flow/flow-personal-pages.tsx`, `flow-customize-sheet.tsx`, `flow-room.tsx` | Bevarade delar: Min Flow är tillfälligt borttagen enligt `flow-view.tsx`; personlig-sidornas exporter saknar externa anrop i granskningen. Inte återinföra vid namnbyte. |
| Tankar/QuickFlow | Tankar i navigation; QuickFlow i exempel/hjälp; ”Flow sorterar” | `components/quickflow-capture.tsx`, `hooks/use-quickflow.ts`, `lib/i18n-dicts/quickflow.ts` | Föreslå Tankar och Fånga en tanke. Samma fångst/sortering och tekniska namn. |
| Dagsrytm | Dagens Pace; Varsamt, Jämnt, Utrymme | `components/day/today-pace.tsx`, `lib/day-pace.ts` | Endast synlig rubrik → Din takt, ingen beräkningsändring. |
| Aktiva maskotbilder | Äldre Hem, incheckningsdialog, kalenderns krävande-dag-stöd, lugnläge, aktivitetshjälp, veckogenomgång, välkomsttur | `pages/home.tsx`, `components/flow-checkin-popup.tsx`, `calendar/calendar-planner.tsx`, `calm-mode.tsx`, `adaptive-activity-card.tsx`, `week-review-card.tsx`, `intro-tour.tsx` (de sista komponenterna under `components/`) | Bild-/alternativtextgranskning; registrering, kalender och placering skyddas. |
| Introduktion/hjälp | Min första dag i Flow, Så funkar MyFlove, Flow hjälper/FlowPlan/QuickFlow; arbetsrelaterad Flow-hjälp | `components/flow-onboarding.tsx`, `pages/overview.tsx`, `lib/app-guide.ts`, `pages/work.tsx` | Riktad copy, inte ny introduktion. Allmänt ”flow” är inte alltid personnamn. |
| Appinställningar | Anpassa MyFlove, Så funkar MyFlove, beskrivning av äldre navigation | `pages/settings.tsx` | Produktnamn/text, inte navigation eller funktion. |
| Notiser/installationshjälp | Testtitel MyFlove; ”MyFlove gör resten”; ”Flow skickar en varm rad”; telefoninstruktioner MyFlove | `lib/push.functions.ts`, `lib/flow-nudges.ts`, `components/personal-push-settings.tsx`, `enable-push-button.tsx`, `push-status-card.tsx` (sista två under `components/`) | Textbyte med särskild kontroll. Native heter ännu MyFlove: instruktioner måste motsvara telefonens verkliga namn. |
| Publika exempel/språk | QuickFlow, Prata med Flow, Flow sorterar, engelska motsvarigheter | `routes/index.tsx`, `components/landing/menu-preview.tsx`, `feature-demos.tsx`, `lib/landing-translations.ts` | Samma texter i båda språk, metadata följer. Publika exempel förblir lokala/kontoisolerade. |
| Juridik/metadata | MyFlove, AI-assistenten Flow, äldre slogan; FlowPlan i guide/cookies | `routes/villkor.tsx`, `integritet.tsx`, `cookies.tsx`, `guide.adhd-planner-for-adults.tsx`, `public/llms.txt` | Separat granskning; inte massersätta ansvarig part, kontakt eller AI/dataskyddsvillkor. |
| Andra äldre funktionsord | MyFlow i Insikter/toasts, StudyFlow i schemaimport, FlowScore i batteriförklaring/äldre egen sida | `pages/insight.tsx`, `components/insight-quickflow-hint.tsx`, `schedule-import.tsx`, `pages/battery.tsx`, `flowscore.tsx` | MyFlow → faktisk destination; StudyFlow → Studier. FlowScore kräver begreppsgranskning: inte följeslagaren, inte automatiskt Capacity/Din takt. |
| Historik/gamla filer/native | MyFlove/Flow i changelog, pitch/filmer, bilder, iOS/Android | `lib/changelog.ts`, `pages/pitch.tsx`, `remotion/`, `public/logo.svg`, `ios/`, `android/` | Bevaras. Historiska namn skrivs inte om; gammal bildfil betyder inte aktiv visning. `logo.svg` saknar aktiv appreferens i granskningen. |

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
| MyFlow / StudyFlow | **Dina uppgifter** / **Studier** | Faktisk destination styr. |
| Veckans Flow / äldre dagsfunktion | **Veckans översikt** / **Din dag** | Veckans översikt används redan på veckosidan; byt inte tekniska sidnamn. |

Engelska: Pace/Paceable och **Your pace** för dagsrytm; särskilj genom placering.

## 3. Framtida stenföljeslagare – teknisk möjlighet

- `src/assets/paceable-stones.png` är en sammanfogad godkänd bild via `PaceableStones`, inte tre frilagda original.
- **Möjligt:** mycket liten långsam förflyttning av hela formationen, utan deformation, filter, nya skuggor eller materialändring. Stillaläge/minskad rörelse ger statisk bild. Logotyp och låsta stenplaceringar lämnas stilla.
- **Separata stenrörelser:** kräver separat godkända frilagda original/lager; inte beskärning, maskning eller omritning av den låsta bilden. Äldre SVG-grupper är animerbara men inte ett godkänt substitut.
- FlowMascots blick, blinkning, hjärtglöd och vinkning kan inte överföras till stenar. Behåll samtalsstatus i text; ingen belöningsrörelse eller bedömning av mående/prestation.
- FlowCharacters situationsscener behöver separat visuell genomgång. Rummets figur är inbakad i `flow-room-seated.jpg`: byte kräver större bild-/designbeslut. Gamla rumsanimationer, tillbehör och sparade val bevaras.
- Exakta färger, former och material skyddas. Inga ansikten/armar/ben utan separat godkännande, inga tre tecknade individer eller Tamagotchi-krav/belöningar. Ingen bild eller animation skapas nu.

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
