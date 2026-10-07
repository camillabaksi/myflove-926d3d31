# Paceable Core v1 — en samlad Idag med Capacity, Load och Pace

## Kartläggning: vad som finns idag

- **Capacity:** `dayCapacity()` och `useDayCapacity()` läser befintliga morgonregistreringar och energiloggar. Morgonvärdet har idag företräde; senaste energiloggen används bara när morgonvärde saknas. Aktiviteter påverkar inte procenten. Denna prioritering och befintliga omräkning behålls, inte ersätts med en ny modell.
- **Load:** `calendarLoad()` ger Inget planerat, Inte uppskattad, Låg, Lagom, Ganska hög eller Hög utifrån öppna poster med registrerad energipåverkan och befintlig friktion. Okända markeringar redovisas separat; ingen procent finns.
- **Utrymme:** `calendarGaps()` använder riktiga start-/sluttider, inte tidslinjens visuella minimihöjd. Okänd längd kan inte bevisa luft. Vanlig familjekontext tar inte förälderns tid; uttrycklig Behöver mig kan göra det.
- **Idag:** `/idag` renderar `DayHub` och `TodayContent`. Där finns redan `DailyFlowList`, `FamilyDayPerspectives`, ett kapacitetsbatteri och Flow. Dessutom finns överlappande batteri, separat kapacitetsläge, JourneySteps, NextStepCard och veckobelöningar i fördjupningen.
- **Hem:** `/hem` är en egen start med kalender, batteri, måendelogg och QuickFlow samt äldre dags-/lägeskort. Hem ska inte få en andra Pace- eller dagsmotor.
- **Äldre adresser:** `/min-dag` omdirigerar redan till `/idag`. `daily-flow.tsx` är nu Rutiner & medicin via `/daglig-rutin`, inte en ersättningsbar kopia av Idag. Veckofunktioner är periodverktyg, inte en ny Today.
- **Capacity Mode har många beroenden:** FlowPlan, prioritering, QuickFlow, familjebelastning, aktivitetsanpassning, återhämtningsförslag, resan, träning och life-puzzle. Synliga val finns i CapacitySelector på Hem, Mitt batteri och Planera, kalenderns kapacitetsdialog, morgonstart samt vissa fokus-/QuickFlow-/hälsotexter. Dessa ska inte döpas om till Pace: de är en annan modell.
- **Familj:** befintlig auktoriserad kalenderprojektion och familjepreferenser räcker. Barnaktiviteter projiceras utan completion och skyddas i `useFlowItems`; egna ägda föräldrauppgifter behåller avbockning. Ingen ny läsrätt, tabell eller ny lagringsnyckel behövs.

## 1. Gör Idag till den primära dagsupplevelsen

Bevara `/idag` och bygg vidare i befintliga `TodayContent`:

1. Personlig, kort hälsning och datum med befintliga kontouppgifter.
2. **Din kapacitet idag:** ett tydligt batteri med faktisk procent, eller ”Hur börjar du dagen?” och frivillig incheckning utan batteri, streck eller 0 %.
3. **Din dag:** egna aktiviteter först med befintliga handlingar. Behåll barnens separata tidsstyrda, icke-avbockningsbara vyer och visa familjekontext sekundärt. En tidigare vald barnperspektiv ska inte göra barnets dag till förstavy i nya Idag.
4. **Dagens Pace:** en kort nivå och konkret förklaring efter aktiviteterna. Belastning och osäkerhet får visas här utan ett andra procenttal.
5. Vid behov **Gör dagen lättare**, annars ingen press att lägga till något.
6. Högst en liten Flow-kommentar, relevant för faktisk kontext och utan beröm för completion, poäng eller streaks.

Ta bort de konkurrerande fördjupningsytorna från nya Idag, men behåll deras komponenter, historik och andra användningsställen. Ingen länk till FlowScore. Bevara Lägg till, Påminnelse, kopiera dag och befintlig avbockning.

## 2. Pace: en transparent tolkning, inte en ny poäng

Pace använder befintliga kategorier, inte en formel där aktiviteter ”kostar” kapacitetsprocent. Inga nya procentskalor, AI-bedömningar eller lagrade Pace-värden.

### Första regeluppsättningen

| Underlag | Resultat |
|---|---|
| Capacity saknas eller dagen är framtida | Ingen personlig Pace. Visa känd Load/planering; erbjud incheckning endast för idag. |
| Aktiviteter finns men all energipåverkan är okänd | Avstå från personlig balansbedömning. Visa ”Belastningen är inte uppskattad ännu”, även om Capacity är känd. |
| Känd Load är Ganska hög/Hög, eller befintlig låg batteriton möter känd energikrävande aktivitet, eller verifierade täta tider/överlapp finns | **Gentle — Varsamt:** planen kan behöva mer utrymme. |
| Högre registrerad kapacitet, lätt känd Load och verifierad luft, utan okänd energipåverkan eller okända tidslängder som kan omkullkasta slutsatsen; alternativt en faktiskt tom egen plan utan Behöver mig | **Open — Utrymme:** utrymmet får behållas, ingen uppmaning att fylla det. |
| Annat tillräckligt känt underlag | **Steady — Jämnt:** en försiktig tolkning, inte ett påstående om exakt balans. |

Återanvänd `capacityTone()` för befintliga kapacitetsgränser. Gentle/Steady/Open är produktregler, inte medicinskt eller matematiskt validerade nivåer. Förklaringen anger vilket faktiskt underlag som styrde och när information saknas. Delvis okänd Load får aldrig presenteras som fullständig eller användas för att lova Open.

**Täta tider:** kontrollera kända intervall, överlapp och mellanrum kortare än kalenderns befintliga 20-minutersgräns för luft. En kedja av flera sådana aktiviteter kan motivera varsammare Pace. Okända längder ger varken beräknade pauser eller påståendet ”ingen luft”. Återhämtning syns som legitim planerad aktivitet, aldrig +procent.

## 3. Gör dagen lättare — enbart användargodkända val

- Öppna en tydlig, avgränsad översikt över dagens faktiska poster: fasta tider, registrerade prioriteringar/deadlines, flyttbara egna poster, uttrycklig Behöver mig och verifierade täta tider.
- ”Behöver ske idag” får inte vara ett nytt AI-påstående; visa befintligt underlag och låt användaren bestämma.
- Återanvänd befintliga aktivitetshandlingar och omplanering där de är säkra. Flytt, borttagning av tid och andra ändringar kräver en uttrycklig bekräftelse och träffar originalposten.
- För externa eller barnstyrda tider visas information och befintlig väg till rätt funktion, inga egna completion- eller skrivvägar.
- Inget sparas när översikten bara öppnas. Ingen automatisk återhämtning eller ombokning.

## 4. Ett synligt Capacity-koncept, kompatibilitet internt

- Behåll `useCapacityMode`, befintligt sparat läge och motorernas nuvarande beroenden oförändrade internt. **Pace får inte automatiskt skriva över läget eller styra gamla planeringsmotorer i v1.**
- Avveckla synliga lägesval och lägesetiketter i befintliga monterade ytor, inte bara på Idag: gemensam CapacitySelector, Hem/morgonstart, kalenderdialog, batterinudge samt berörda QuickFlow-, fokus- och hälsotexter. Befintlig Energy-input kan fortfarande vara kvalitativ; den får inte beskrivas som ett separat Capacity Mode.
- Hem behåller sina fyra centrala ingångar och länkar till primära Idag, men får ingen konkurrerande full dagsvy. Gamla överlappande dags-/lägeskort monteras inte; sparade anpassningsval ligger kvar.
- Kompatibilitet med gamla motorer är uttryckligen legacy och märks i dokumentationen. Deras omarbetning kräver ett senare, separat steg.

## 5. Unknown och future: gemensamt skydd

- Lägg ett framtidsdatumskydd vid den gemensamma kapacitetskällan: även en felaktigt framtidsdaterad registrering får aldrig exponera Capacity. Historiska verkliga registreringar behålls.
- Förbered dagens datum som uttryckligt testbart underlag; skapa inte någon klockbaserad energiförändring.
- Batteriet renderas bara när procent är känd. Anpassa dess befintliga användningsställen så även Hem, kalenderns översikt/detaljer och kapacitetsdialoger undviker tomt batteri och ”–” som kapacitet.
- Månadens redan lugna områdesprickar och framtidsfria datumrutor bevaras. Framtidsdagar kan visa Load men aldrig personlig Pace eller Capacity.

## Teknisk genomförandeplan

- Återanvänd `dayCapacity`, `useDayCapacity`, `CapacityBattery`, `calendarLoad`, `calendarGaps`, `useVisualCalendar`, familjelagrets projektion/presence-regler, `DailyFlowList`, relevanta delar av `FamilyDayPerspectives`, befintlig check-in, `FlowMascot` och säkra aktivitetshandlingar.
- Skapa en liten ren, testbar härledning för Pace och känt tidsutrymme samt en fokuserad Pace-/omplaneringsyta. Ingen ny datakälla, kalender, chatt eller hälsolagring.
- Fånga personliga poster och Behöver mig utan att dubbelräkna kopplade egna föräldrauppgifter. Familjens vanliga aktiviteter kan ge kontext men inte energibelastning eller upptagen föräldratid.
- Ny copy på svenska och engelska följer befintligt språkval; befintlig design och maskot behålls.
- Ändrade innehållssidor får relevanta sidtitlar och beskrivningar utan global rebrand. Dokumentera beslut i `AGENTS.md` och uppdatera båda ändringsloggarna.
- **Ingen migration:** inga DB-/RLS-/auth-/domän-/push-/mobil-ID-/analytics-/nyckeländringar. Ingen route tas bort. Ingen publicering.

## Verifiering och leverans

- Tester för befintlig kapacitetsformel och prioritet, unknown, framtidsregistreringar, alla Pace-regler, helt/delvis okänd Load, okända längder, överlapp, återhämtning, familjekontext och deduplicerad Behöver mig.
- Kontrollera att egna uppgifter kan avbockas och barnschema aldrig kan det; öppning av hjälp/incheckning får inte skriva data.
- Kontrollera Idag, Hem och kalender på mobil och dator: en primär procent, rätt ordning, vuxen kort copy, läsbara knappar, tangentbord, ingen horisontell sidscroll och inga konkurrerande lägesval.
- Kontrollera att `/min-dag` når samma nya Idag och inventera kvarvarande gamla dagskomponenter utan att radera dem.
- Slutrapport med ändrade filer, återanvända/nya delar, kvarvarande legacy/adresser, exakta Pace-regler, unknown/future/familj och begränsningar. Fysiska iOS-/Android-enheter kan inte ersättas av webbläsarkontrollen och rapporteras separat.