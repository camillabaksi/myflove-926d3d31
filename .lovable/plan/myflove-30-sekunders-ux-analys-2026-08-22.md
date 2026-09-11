# MyFlove – 30 sekunders UX-analys

Analys av den faktiska koden i nuvarande version. Ingen kod ändrad.

## 1. Så ser de första 30 sekunderna ut idag

En helt ny användare möts av tre separata onboarding-ytor innan hen ser något värde:

1. `IntroTour` – modal med 4 svepbara kort (Välkommen, Quickflow, Kalender, Må bra).
2. `FlowOnboarding` – öppnas direkt när introt stängts: "Vad vill du att MyFlove främst ska hjälpa dig med?" (flerval) och sedan steg 2 "Vad vill du börja med?" (QuickFlow / Min första dag / Lägg in kalender).
3. `AreaOnboarding` – inline-block på Hem: välj livsområden.

Först därefter syns Hem, som i standardläget renderar tio block i följd: hälsning + namnfråga, "Hur är det just nu?" (två 1–10-sliders), Mitt batteri, "Jag gjorde något"-knapp med hjälptext, Nästa, Dagens saker, Just nu-rekommendation, Lägg till, Energins historik, Dina genvägar, Korta vägar (3 kort), Områdesväljare, samt "Anpassa hemskärmen" längst ner.

Sammanlagt: 2 modaler + ~12 ytor innan användaren gjort en enda nyttig sak.

## 2. De fem största friktionspunkterna

🔴 **1. Två modaler i rad innan första nyttan.** Intro (4 kort) plus målfrågan är ren inlärning utan output. Frågan "vad vill du att MyFlove ska hjälpa dig med" kräver att man redan förstår appen.

🔴 **2. Hem konkurrerar med sig själv.** Tio block, varav minst fem inbjuder till handling samtidigt (Logga mående, Jag gjorde något, Lägg till, Just nu-förslaget, tre snabbvägar). Inget block är visuellt utpekat som "börja här".

🟡 **3. Batteriet läses inte utan att öppnas.** `EnergyBattery` visar i stängt läge bara `NN%` plus en liten pil (↗ → ↘). Kurvan, "starkast kl X" och "Preliminär kurva" ligger bakom "Visa". För en ny användare är siffran dessutom modellgenererad, inte personlig (`reading.personal === false`), utan att det syns.

🟡 **4. Dubblering mellan Hem, Min dag och Planera.** "Dagens saker" (TodayTasks) finns både på Hem och i Idag. "Korta vägar"-kortet pekar på Min dag / QuickFlow / Planera – exakt samma tre destinationer som redan finns i bottennavet. "Jag gjorde något" finns både som CTA-knapp och som fullpanel (`gjort`-blocket).

🟢 **5. Otydlig skillnad mellan de fyra grundhandlingarna.** Lägg till / Jag gjorde något / Flow / Planera förklaras var för sig med olika ordval, aldrig sida vid sida. Nya användare måste gissa vilken knapp som gäller vilken situation.

## 3. Det som redan är bra – rör inte

- **En enda rekommendationsmotor.** Hem och Planera → Just nu använder båda `suggestNow()` i `src/lib/flow-engine.ts`. Ingen konkurrerande logik finns. Motorn ger redan EN uppgift, aldrig en lista, och formulerar energi i ord i stället för siffror.
- **Mående och energi är redan separata värden**, 1–10, sparas vid släpp (inte per steg), och kan justeras hela dagen utan att skapa nya rader.
- **Ingen tvingande registrering.** Sliders är valfria; appen fungerar utan dem.
- **Batteridatan stödjer redan trend över dagen.** `BatteryReading` har `slots`, `trend`, `trendLabel`, `peak`, `dip` och `personal`. Ingen ny energimodell behövs – bara bättre exponering.
- **Tomma dagen hanteras vänligt.** `assessToday` svarar "Dagen är öppen. Det räcker att bara vara idag." och `suggestNow` svarar "…inget väntar på dig just nu."
- Färger, animationer (breathe, pop-in) och den levande känslan behålls oförändrade.

## 4. Rekommenderad 30-sekunders resa

```text
0–5 s    Ett enda välkomstkort: "Släpp det du bär på. Jag hjälper dig sortera."
         → en knapp: Kom igång
5–12 s   Hem, överst: "Hur är det just nu?" – två sliders, redan synliga
12–18 s  Batteriet svarar direkt i klartext:
         "Du har medelbra energi och den stiger fram till kl 14."
18–25 s  EN rekommendation: "Det här är det som gör mest nytta nu."
25–30 s  Fyra tydliga vägar vidare, formulerade som situationer:
         Planera något · Jag gjorde något · Vad ska jag göra nu? · Ordna flera saker
```

## 5. Exakta små ändringar med störst effekt

1. **Slå ihop onboardingen till ett kort.** Behåll `IntroTour` men korta till 1–2 kort, och skjut upp `FlowOnboarding`-målfrågan: visa den först vid andra besöket eller som ett litet kort på Hem, inte som modal.
2. **Skriv om batteriets stängda läge till en mening.** Använd befintliga `trendLabel` och `peak`: "Medelbra energi – stiger fram till kl 14" i stället för "62% ↗". Procenten får bli sekundär.
3. **Visa mini-kurvan alltid.** `BatteryCurve` finns redan; flytta den till stängt läge i liten storlek. Detaljerna (peak/dip-chips, förslag) stannar bakom "Visa".
4. **Markera "Preliminär kurva" redan i stängt läge** för nya användare (`!reading.personal`) med kort text: "Blir din egen när du loggat några dagar".
5. **Ersätt "Korta vägar" med ett Situationskort** med fyra rader formulerade som användarens tanke → handling, i stället för produktnamn.
6. **Ta bort dubbletten:** låt `DidThisCta` respektera hemlayouten (den renderas idag alltid, med samma order-nyckel som batteriet) och göm `TodayTasks` på Hem när dagen är tom.
7. **Standardgöm fler block för nya användare** (energins historik, områdesväljare, genvägar) – de kan slås på i Anpassa hemskärmen.

## 6. Billiga ändringar via befintliga komponenter

| Ändring                | Återanvänder                                            |
| ---------------------- | ------------------------------------------------------- |
| Batteritext i klartext | `reading.trendLabel`, `reading.peak`, `reading.summary` |
| Alltid synlig kurva    | befintlig `BatteryCurve`                                |
| Situationskortet       | samma `Link`-kort som "Korta vägar" idag                |
| Färre block för nya    | `DEFAULT_PREFS.hidden` i `src/lib/home-layout.ts`       |
| Uppskjuten målfråga    | `FlowOnboarding` med annan trigger, ingen ny komponent  |
| Rekommendationen       | oförändrad `suggestNow()`                               |

## 7. Gör INTE nu

- Ingen ny energimodell eller nya tabeller.
- Ingen ny rekommendationsmotor eller AI-anrop på Hem.
- Ingen omdesign av färger, typografi eller animationer.
- Ta inte bort "Anpassa hemskärmen" eller möjligheten att visa alla block.
- Slå inte ihop Hem och Min dag – de har olika syfte.
- Inga ändringar i QuickFlows tolkningslogik.

## Kantfall som analysen tagit hänsyn till

- **Tom dag:** motorn svarar redan vänligt; efter ändringarna blir CTA:n "Lägg till något" det enda synliga nästa steget.
- **20 saker:** `suggestNow` väljer fortfarande EN; `assessToday` flaggar "tung" och `suggestMove` föreslår max en flytt.
- **Låg energi:** `defaultMinutesFor` sänker till 10 min och motorn väljer något litet – detta syns idag bara i förslagstexten, och blir tydligare med batteriets nya klartext.
- **Hög energi:** 60 min föreslås; risken är att Hem känns kravfyllt – därför färre samtidiga uppmaningar.

## Implementeringsordning (små steg)

1. Batteriets stängda läge: klartext + alltid synlig mini-kurva + "preliminär"-markering.
2. Standardlayout på Hem: göm energihistorik, områdesväljare och genvägar som default för nya.
3. Låt `DidThisCta` styras av hemlayouten så dubbletten försvinner.
4. Ersätt "Korta vägar" med Situationskortet (fyra situationer → fyra handlingar).
5. Korta `IntroTour` till 1–2 kort.
6. Flytta `FlowOnboarding`-målfrågan från modal till senare tillfälle.
7. Genomläsning av all text på Hem: bort med interna begrepp, kortare hjälptexter.
8. QA med testkontot: ny användare, tom dag, 20 saker, låg energi, hög energi.
