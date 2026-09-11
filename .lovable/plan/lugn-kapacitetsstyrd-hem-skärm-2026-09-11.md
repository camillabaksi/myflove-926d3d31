# Lugn, kapacitetsstyrd Hem-skärm

## Mål

Göra Hem till en stillsam, lättläst startpunkt för mammor med hög mental belastning. Befintlig funktionalitet och data behålls, men första vyn får en tydligare visuell hierarki och mindre brus.

## Vald riktning

- Puderrosa lila palett: `#FBF2F8`, `#E9D8F2`, `#DCA6C2`, `#6E5AA6`, översatt till MyFloves semantiska färgtokens.
- Plus Jakarta Sans i rubriker och Inter i brödtext enligt projektets designminne.
- Mjukt bento-rutnät: en kolumn på smala mobiler, balanserade block på större skärmar.
- Vit, rundad huvudyta med gott om luft ovanpå en mjuk pastellbakgrund.

## Det som byggs

1. **Ny lugn Hem-yta**
   - Samla hälsning, genvägar, batteri och dagens schema i en centrerad vit yta med 24–32 px rundning.
   - Behåll befintligt Akut Lugn, enkelt läge, kärnresa och sekundära funktioner längre ned.

2. **Välkomsthuvud**
   - Visa personlig hälsning, varm stödtext, Flow/profilplats och diskret notisknapp.
   - Undvik tung information i första blickfånget.

3. **Tre snabba val**
   - Quickflow, Batteriet och Kalendern använder befintliga länkar, dialoger och statistikspårning.
   - Tydliga ikoner, korta etiketter och stora tryckytor.

4. **Batteri och Idag**
   - Visa verklig batterinivå med en mjuk blå–violett progressindikator och empatisk text.
   - Visa verkliga aktiviteter och tider från dagens uppgifter/påminnelser, utan exempeldata.

5. **Andande bakgrund**
   - Lägg en organisk, suddig glöd bakom den vita Hem-ytan.
   - Lätt dag: 10 sekunder (4 s in, 5 s ut, 1 s vila).
   - Upptagen dag: 12 sekunder med längre utandning.
   - Överbelastad dag: mycket långsam, mörkare och nästan stilla glöd.
   - Växla nivå mjukt utifrån dagens kalenderposter plus öppna Quickflow-saker.
   - Respektera “Mindre rörelse” och NPF-lägets stillhet.

6. **Navigation och tillgänglighet**
   - Behåll befintlig bottennavigation och desktopnavigation.
   - Säkerställ läsbar kontrast, fokusmarkeringar, stora tryckytor och stabil layout vid 360–430 px samt desktop.

## Teknisk avgränsning

- Presentationen ändras främst på Hem och i globala designtokens/animationsregler.
- Ingen databas, analyticsinsamling, kalenderlogik, Quickflow-logik eller användardata ändras.
- Befintliga komponenter och händelser återanvänds; inga nya paket behövs.
- Changelog uppdateras enligt projektregeln.

## Kontroll

- Formatering, typkontroll, relevanta tester och aktuell byggstatus.
- Visuell kontroll av Hem på 360 px, 411 px, 430 px och desktop, inklusive alla tre belastningsnivåerna och reduced motion.
