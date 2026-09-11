# Flow-karusellen: riktig horisontell rad i stället för en slide i taget

## Vad koden faktiskt gör idag

`src/components/flow/flow-deck.tsx` är inte en karusell. Den håller ett state (`currentSlide`) och renderar **exakt en** slide i DOM:en i en vanlig `div` utan `flex`. Det finns alltså ingen rad som kan stapla vertikalt — men det finns heller ingen horisontell rörelse, vilket är det som saknas visuellt.

Yttre `<section>` har redan `relative overflow-hidden`. Inget dolt grid-system ligger runt sektionen: `src/pages/flow.tsx` renderar bara `<main class="mx-auto w-full max-w-xl">` runt `FlowDeck`.

## Ändringar

1. Yttre container (`<section>`): behåll/säkerställ `relative w-full overflow-hidden`.
2. Lägg till en inre spårrad: `flex flex-row w-full transition-transform duration-300 ease-out` med `transform: translateX(-currentSlide * 100%)`.
3. Rendera alla aktiva slides i spåret, var och en i en wrapper med `w-full min-w-full shrink-0` (`basis-full`), så ingen slide kan bli smalare eller bredare än 100%.
4. Behåll swipe, pilar, prickindikator, URL-synk (`?slide=N`) och FocusMode oförändrat.
5. Endast den aktiva sliden är tillgänglig för skärmläsare/tabb (`aria-hidden` + `inert` på övriga) så att inaktivt innehåll inte läses upp.
6. Uppdatera versionsbadgen: den räknar idag `[data-flow-slide]` och kräver 1 för "✓". Byt kontroll till "en synlig slide" (antal slides + aktivt index) eftersom flera slides nu ligger i spåret enligt önskad design.
7. Uppdatera `CHANGELOG.md` och `src/lib/changelog.ts` med datum enligt projektregeln.

## Följdeffekt att känna till

Med en riktig rad ligger alla slides i DOM:en samtidigt (det är förutsättningen för glidande övergång). Det ersätter den tidigare regeln "endast en slide i DOM". Testerna i `tests/e2e/flow_carousel.py` / `flow_visual_regression.py` som verifierar exakt ett `[data-flow-slide]` uppdateras till att verifiera: en rad med `flex-row`, varje slide `w-full shrink-0`, och att spårets `translateX` matchar aktivt index.

## Verifiering

Playwright i mobilvy (375 och 390 px): mät att varje slide-wrapper har samma bredd som containern, att sektionens `scrollHeight` inte växer med antalet slides (dvs. inte staplat vertikalt), och att swipe/pilar flyttar spåret horisontellt.
