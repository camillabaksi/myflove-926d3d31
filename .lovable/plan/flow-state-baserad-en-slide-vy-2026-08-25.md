# Flow: state-baserad en-slide-vy

## Mål

Byt ut den horisontella CSS-karusellen mot en robust state-vy där endast den aktuella Flow-sliden finns i DOM:en.

## Genomförande

- Behåll befintlig Flow-logik, maskot, energi, mående, rekommendationer och återhämtning.
- Ersätt scroll-track och renderingen av alla slides med `currentSlide` och rendering av exakt en `FlowSlide`.
- Lägg till touch/pointer-svep: vänster går framåt, höger går bakåt. Behåll pilar och prickindikator.
- Låt Flow-introt vara state 0 och ersättas helt när användaren går vidare.
- Behåll en synlig versionsstämpel, men ändra kontrollen till state/DOM-antal i stället för horisontell CSS-layout.
- Uppdatera E2E- och visuella regressionstester så de verifierar en enda slide i DOM, statebyte via swipe och att föregående innehåll ersätts.
- Uppdatera båda changelog-filerna enligt projektregeln.

## QA

- Verifiera lokalt vid 375 och 390 px: exakt ett `[data-flow-slide]`, intro som state 0, swipe/pilar byter state och gammal slide försvinner ur DOM.
- Publicera därefter och köra samma E2E-kontroll mot `https://myflove.lovable.app`.
