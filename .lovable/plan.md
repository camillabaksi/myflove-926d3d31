# Steg 5 – slutlig kodstädning

## Mål
Ta bort endast verifierat oanvänd planeringskod efter steg 1–4, utan att ändra den centrala modellen, användarupplevelsen, routes eller sparad data.

## Genomförande
1. Slutför användningskontrollen för gamla `pickNow`, batteribaserad Nu-rankning och det gamla FlowScore-baserade omplaneringssystemet. Kontrollera vanliga och dynamiska anrop, routes, tester, serverfunktioner och molnlagring.
2. Ta bort gamla `pickNow` och dess privata hjälpkod från Just nu-kortet.
3. Ta bort endast den döda batteribaserade planeringsdelen från den gamla Flow-motorn. Behåll dagens historiska belastningssammanfattning och andra delar som fortfarande används.
4. Ta bort FlowReplan-kod endast om hela anropskedjan är bevisat oanvänd. Bevara stöd för det gamla sparade omplaneringsvärdet i synklagret så äldre appversioner och sparad data inte påverkas.
5. Dokumentera Jobb och Studiers separata FlowScore-stöd. Lämna det kvar om det inte påverkar central FlowPlan, prioritet eller kapacitetsläge.
6. Förenkla direkt berörd kod och oanvända imports utan större refaktoreringar.
7. Uppdatera ändringslogg och avsluta städningsdelen i roadmapen.

## Verifiering
- Typecheck och riktade tester efter borttagningarna.
- Hela testsviten och produktionsbuild.
- Mobiltest vid 390 px för Hem, Idag, Planera, Flow och QuickFlow.
- Kontroll av Fullt/Mellan/Lågt, P1–P4, Lågt-läge, gammal QuickFlow-data, batteri-/FlowScore-isolering och samma plan i Flow/UI.
- Kontroll av synk mellan två öppna appfönster.

## Avgränsning
Ingen datarensning, routingändring, redesign, ny arkitektur eller automatisk borttagning av Jobb/Studier-logik. Osäkra delar lämnas kvar och redovisas.
