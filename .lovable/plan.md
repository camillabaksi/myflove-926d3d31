# Områdesfärger som dova bakgrunder

## Mål
Varje inloggad sida får en dov men tydlig bakgrundston från sitt område, plus en liten färgad ikon och linje vid sidans rubrik. Allt annat (kort, knappar, meny, data, funktioner) oförändrat.

## Områden och toner (ljust läge)
| Område | Sidor | Bakgrund (ca) |
|---|---|---|
| Idag | /idag, /hem-dagvyer, uppgifter, påminnelser | dov blå #E6ECF5 |
| Kalender | /kalender, planering, vecka | dov rosa-lila #F1E8F4 |
| Tankar/Fånga | /quickflow, anteckningar, reflektionsbok | dov lavendel |
| Min plats / Hälsa | /halsa, mående, batteri, träning | dov salvia #E5EFE9 |
| Pace | /assistant, /flowplan | behåller nuvarande aprikosbild |
| Hem | /hem, familj, barn | dov aprikos #F6E6DA |
| Återhämtning | paus, stopp, ljusboost | dov sandgul |
| Mer/övrigt | inställningar, insikter, Mer | neutral varm ivory (dagens) |

Mörkt läge får motsvarande djupa, lågmättade toner. Bakgrunden tonas mjukt mot ivory nedåt så att vita kort ändå vilar lugnt.

## Detaljer
- Liten ikon och en kort tunn linje under sidrubriken i områdets mättade ton.
- Inga ändringar av kortkanter, flikar eller menyval (inte valt).

## Kontroll
- Mobil 360/390/430 px, surfplatta, desktop 1280/1600, ljust och mörkt läge, 200 % text.
- Kontrastkontroll (WCAG AA) på text mot varje bakgrund.
- Före-/efterbilder av varje område. Ingen publicering.

## Tekniskt
- Befintliga `--area-*`-tokens i src/styles.css utökas med `--area-*-bg`; nya tokens för tankar och neutral.
- En central sökväg→område-mappning (ny liten modul i src/lib) sätter `data-area` på layoutens innehållsyta; ingen ändring per sida.
- Rubrikdetalj via CSS på befintlig `pace-page-title`/sidrubrik inom `[data-area]`.
- Pace-scenen undantas. Inga routes, data, lagring eller native-filer rörs. CHANGELOG + changelog.ts uppdateras.
