# MyFlove vs Tiimo – UX- och arkitekturanalys (ingen kod ändras)

Analysen bygger på genomläsning av navigationen i `src/components/layout.tsx` (ca 35 nav-poster), route-listan i `src/routes/` (flera redirect-routes finns redan), samt Hem, Min dag, QuickFlow, Flow, Planering, Mitt batteri och Insight.

## Tiimos logik i korthet

Tiimo håller ihop fyra saker: **Today** (en visuell tidslinje för idag), **mental inbox / To-dos** (odaterat som väntar), **rutiner + fokus/timer** (gör-läget), och **AI som bryter ner och planerar om**. Allt annat är gömt. Kognitiv belastning hålls nere av få ingångar och ett tydligt "vad gör jag nu".

## Vad MyFlove redan gör bra

- **Ett gemensamt dataobjekt.** `useFlowItems` samlar uppgifter, kalender, lektioner, barn, rutiner, QuickFlow och loggade "gjort" till ett format med en enda avcheckning. Det är starkare än Tiimos uppdelning och är appens viktigaste tillgång.
- **Energi som förstaklassbegrepp.** Batteri, dagens kanter (morgon/kväll), friktion per uppgift och energihistorik finns – Tiimo har inget motsvarande.
- **Fångst utan krav.** QuickFlow med NLP för datum/tid och snooze motsvarar Tiimos mental inbox.
- **Steg-för-steg-strukturen** på Min dag, QuickFlow och schemaimport ligger nära NPF-praxis.
- **Flow som karaktär** ger en mjukare "kom igång"-ingång än Tiimos rena AI-knapp.

## Vad som är ologiskt, dubblerat eller krångligt

1. **Tre överlappande "energi"-ingångar i menyn:** `/mitt-batteri`, `/ma-bra` ("Energi och mående") och `/energifloede` ("Energins historik"). Användaren kan inte veta vilken som är rätt.
2. **Tre överlappande "planera/hjälp"-ingångar:** `/flow` (state-däcket), `/flowplan` (Planering) och `/assistant` (Prata med Flow). Rollerna beskrivs olika på olika ställen.
3. **Två listor över samma saker:** Min dag (`/idag`) och Att göra (`/tasks`) visar i praktiken samma flöde, med olika filter och olika UI.
4. **Menyn är för lång.** Ca 35 poster i "Mer" plus sökfält är i sig kognitiv belastning; `essential`-flaggan är satt på poster som inte hör till kärnflödet (Matlista, Resor, Relationer) medan Kalender och Att göra konkurrerar med Min dag.
5. **Inget visuellt tidsperspektiv.** Tiimos starkaste grepp – tidslinje med proportionell längd och "nu"-markör – finns bara som lista/tidslinje utan tidsupplevelse.
6. **Fokus/timer är frånkopplad.** `/pomodoro` känner inte till vilken sak du valt; det finns ingen väg "välj sak → starta fokus → bocka av".
7. **Omplanering är gömd.** Replan-logiken finns men triggas inte tydligt när dagen spricker.
8. **Insight/"Vad jag lärt mig".** Verklig data finns nu, men ingången heter "Mina mönster" i menyn och "Vad jag lärt mig" på Hem – två namn för samma sak.
9. **Hem gör mycket.** Batteriet ligger högt (bra), men flera sektioner under konkurrerar om samma uppmärksamhet som Min dag.
10. **Statistik är ojämnt täckt.** Vissa flöden loggar event, andra inte – det går inte att mäta trattarna fånga → planera → göra.

## Kontroll av det sammanhängande flödet

Den tänkta modellen håller i datamodellen men inte i navigationen:

```text
QuickFlow (fånga)  ->  Flow (förstå/föreslå)  ->  Hem (läge + nästa steg)
                                 |
                          Min dag (planera/göra)  ->  Insight (mönster)
```

- Fånga: OK – QuickFlow är enda inkorgen (`/dump` redirectar dit).
- Förstå/föreslå: **otydligt** – delat mellan Flow, Planering och chatten.
- Läge + nästa steg: OK på Hem, men konkurrerar med för många kort.
- Planera/göra: **delat** mellan Min dag, Att göra, Planering och Kalender.
- Mönster: OK men dubbelnamnad och svår att hitta.

## Prioriterad lista

### 1) Måste fixas för logiskt flow

1. **En energiingång.** `/mitt-batteri` blir enda destinationen; "Energi och mående" blir en snabb incheckning inne på batterisidan, historiken en flik/länk där. `/ma-bra` och `/energifloede` blir redirects. (Följer beslutet om förenklad Energi & Mående.)
2. **En planeringsingång.** `/flowplan` = "Planera dagen" (ordning). `/flow` = "Flow hjälper" (ett förslag i taget). `/assistant` = "Prata med Flow". Samma tre namn överallt: bottennav, Mer, Hem, Översikt.
3. **Slå ihop Min dag och Att göra.** Min dag får en flik "Idag" och "Allt" i stället för en separat sida; `/tasks` behålls som route men leder in i samma vy.
4. **Kapa menyn till fyra grupper** med max 6 poster synliga per grupp, resten bakom "Visa fler". Rätta `essential`-flaggorna så att bottennavets valbara platser bara erbjuder kärnvyer.
5. **Ett namn för Insight:** "Mina mönster" överallt, med undertext "det Flow lärt sig om dig".
6. **Bekräfta besluten i UI:** batteriet överst på Hem och klick går till `/mitt-batteri`; Flow som liten notering längst ner på Hem; Avsluta konto endast under Inställningar → Konto.

### 2) Bör byggas

7. **Visuell tidslinje för idag** i Min dag: proportionella block, nu-linje, luckor synliga – Tiimos starkaste grepp, byggd på befintliga `FlowItem`.
8. **Fokusläge kopplat till en sak:** "Starta" på ett item öppnar timern med titeln, och avslut bockar av via samma `toggleItem`.
9. **Omplanera när dagen spricker:** när tid passerat eller belastningen är för hög föreslår Flow en ny ordning med ett tryck.
10. **Bryt ner-knapp** på tunga items (Flow föreslår 2–3 delsteg som sparas som steg på uppgiften).
11. **Full analytics-täckning** för trattarna: fånga → sortera → planera → starta fokus → klar, med befintlig sanitizer så inga känsliga råvärden skickas.

### 3) Senare

12. Veckovy med samma visuella logik som dagens tidslinje.
13. Energiprognos: batterikurva vägd mot dagens planerade friktion.
14. Insight kopplar mönster till konkreta förslag ("du klarar tunga saker bäst 9–11 – lägg dit").
15. Rutiner som körbara sekvenser med tidsuppskattning per steg.
16. Delade vyer (familj/stöd) med samma tidslinje.

## Tekniska noteringar

- Ingen datamodelländring krävs för punkt 1–9: `useFlowItems`, `use-energy-battery`, `use-day-window` och `insight-personal` täcker redan behovet.
- Sammanslagningarna görs som route-redirects i `src/routes/` plus nav-städning i `src/components/layout.tsx` – inga sidor behöver raderas.
- Tidslinjen kan byggas som en presentationskomponent ovanpå `FlowItem` utan ny lagring.
- Ny mätning läggs i `src/lib/analytics-events.ts` och går via befintlig sanitizer.
