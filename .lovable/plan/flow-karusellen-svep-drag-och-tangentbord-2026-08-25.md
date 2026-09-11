# Flow-karusellen: svep, drag och tangentbord

## Mål

Byt slides med fingret (svep), med musen (drag) och med tangentbordet – med tydlig fokusmarkering och korrekt uppläsning för skärmläsare. Ingen ändring av Flow-logiken, bara presentationen.

## Svep och drag

- Följ fingret/musen i realtid: spåret flyttas `-currentSlide * 100% + dragOffset` medan man drar, och animeringen stängs av under dragningen så det känns direkt.
- Släpp: byt slide om man dragit mer än ~20 % av bredden eller svept snabbt (kort tid + kort sträcka), annars fjädrar den tillbaka.
- Använd pointer events med pointer capture, så drag fungerar lika för touch, mus och penna.
- Ingen slide-växling om dragningen mest är vertikal (så att sidan går att skrolla), och drag startar inte på knappar, reglage eller inmatningsfält – reglagen för mående/energi ska fortsätta fungera.
- Första och sista sliden får motstånd i stället för att dras fritt utanför kanten.
- Respektera "reducerad rörelse": då byts sliden direkt utan glidande animation.

## Tangentbord och fokus

- Karusellens vyport blir fokuserbar (`tabIndex=0`) med tydlig fokusring och en osynlig instruktion: "Använd vänster- och högerpil för att byta vy".
- Piltangenter vänster/höger byter slide, Home/End går till första/sista. Pilar ignoreras när fokus ligger i ett fält eller reglage.
- Vid byte flyttas fokus till den aktiva sliden så att skärmläsaren läser upp det nya innehållet; sidan hoppar inte i sidled.
- Prickarna blir riktiga knappar i en tablist-liknande grupp med `aria-label` av typen "Vy 2 av 4: Hur är det just nu?" och tydlig fokusring.
- En live-region meddelar "Vy 2 av 4" vid byte.
- Inaktiva slides förblir `aria-hidden` + `inert`, så de inte går att tabba till.

## Teknik

- Allt sker i `src/components/flow/flow-deck.tsx`: ny drag-state (startX, startY, offset, dragging), pointer-handlers, `onKeyDown` på vyporten och ref till aktiv slide för fokus.
- Versionsstämpeln uppdateras till `swipe-keyboard-2026-08-25`.
- `tests/e2e/flow_carousel.py` utökas: drag byter slide, för kort drag fjädrar tillbaka, piltangenter byter slide, fokusring syns och inaktiva slides är inerta.
- `CHANGELOG.md` och `src/lib/changelog.ts` uppdateras med datum enligt projektregeln.

## QA

Verifieras i mobilvy (390 px) med Playwright: drag/svep, piltangenter, Home/End, fokusordning och att endast en slide är synlig.
