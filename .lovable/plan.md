# Paceable – enhetlig visuell identitet (inventering och plan)

Ingen kodändring eller publicering förrän planen är godkänd.

## Inventering – vad som redan finns

- **Färger och djup:** Paceables varma yta, kant och tre djupnivåer finns redan som gemensamma värden, med en mörk variant. De gäller i dag bara inom de omarbetade sidorna (en "Paceable-yta"-markering).
- **Typsnitt:** Fraunces för hälsningar/orienterande rubriker (`pace-editorial`), Inter för allt funktionellt.
- **Byggstenar:** gemensam rubrik, kort, sektion, knapp, chip, tomt läge, laddning, dialog (MyFlove-familjen, används på 13 sidor) samt standardknappar/dialoger. Paceables stenar och logotyp är låsta.
- **Redan i Paceable-stil:** Idag, Kalender, Tankar, Min plats, navigering (mobil + desktop), inloggning/registrering.
- **Avviker tydligt:** de äldre sidorna under Mer (t.ex. Uppgifter, Träning, Studier, Arbete, Historik, Insikter, Energikarta, Friktionsindex, Pitch). De har lila gradienter, rosa kort, kraftigare skuggor och några hårdkodade färger. Äldre Hem är medvetet kvar som äldre funktion.
- **Hårdkodade färger:** få (friktionsindex 4, träning/uppgifter/insikter 1 vardera). Det stora avståndet kommer i stället från gradienter och kort.

## Tabell

| Område / sida | Finns redan | Behöver justeras | Återanvändning? | Insats |
|---|---|---|---|---|
| Gemensam bakgrund och ytor för alla inloggade sidor | Paceable-värden, men bara på 4 sidor | Använd Paceable-ytan på hela appens innehållsdel | Ja, befintliga värden | Låg |
| Gemensamt kort och gemensam sektion (MyFlove-familjen) | Används på 13 sidor | Varm yta, tunn kant, djupnivå 1 i stället för vitt kort och kraftig skugga | Ja, ändras på ett ställe | Låg |
| Gemensam sidrubrik | Finns | Fraunces för sidtitel, Inter för undertext, lugnare ikon | Ja | Låg |
| Knappar och dialoger | Standardknappar och dialoger | Dialoger får djupnivå 2 och varm yta; plommon bara som huvudknapp | Ja | Låg |
| Uppgifter, Träning, Studier, Arbete, Historik | Egna kort och gradienter | Byt gradientkort mot det gemensamma kortet | Ja | Medel |
| Insikter, Energikarta, Friktionsindex, Statistik | Diagram, hårdkodade färger | Byt till befintliga färgvärden; diagrammen behålls | Delvis | Medel |
| Inställningar, Profil, Familj, Barn | Formulär med standardbyggstenar | Följer i stort sett med via punkterna ovan | Ja | Låg |
| Glömt/nytt lösenord | Delvis | Samma logotyp och yta som inloggningen | Ja | Låg |
| Publik startsida, Om oss | Ljus fast bakgrund | Mörkt läge blandar ljus bakgrund med mörk text; 200 %-överflöde på smal skärm | Delvis | Medel |
| Äldre Hem, Flow-sidor | Äldre färgstark stil med Flow | Lämnas orörda (äldre funktion, Flow skyddad) | — | — |

## Skydd

Inga ändringar av data, inloggning, kalender, Capacity, Pace, Flow, familj, notiser, synkning, databas eller tekniska identifierare. Stenar, logotyper, navigering och sidornas uppbyggnad behålls. Inga nya paket och inget nytt designsystem. Ändringarna görs bara i utseendet.

## Minsta första implementation (rekommenderas)

1. Gör Paceable-ytan gällande för hela den inloggade appens innehåll, men inte för äldre Hem och Flow-sidorna.
2. Uppdatera det gemensamma kortet, sektionen och rubriken så att de använder befintliga Paceable-värden.
3. Ge dialoger samma yta och djup.

Det är cirka tre filer och ger ett lugnare, enhetligt intryck på omkring 30 sidor på en gång. Sidspecifika gradienter (prioritet 2–3) tas i en senare omgång.

Kontroll: 360/390/430/1024/1440 px, ljust/mörkt läge, 200 % text och kontrast (WCAG AA), samt att alla tester godkänns. Idag, Kalender, Tankar och Min plats ska se ut exakt som innan.

## Tekniskt

- Lägg `data-paceable-surface` på innehållscontainern i layouten, med undantag för legacy-routes.
- `MyFloveCard` och `MyFloveSection` får `bg-[var(--pace-surface)]`, kanten `--pace-border-warm` och `shadow-[var(--pace-elevation-1)]`. `MyFloveHeader`-titeln får `pace-editorial`.
- `DialogContent` får `--pace-surface-raised` och `--pace-elevation-2`.
- Fem hårdkodade färger byts mot semantiska tokens i omgång 2.
