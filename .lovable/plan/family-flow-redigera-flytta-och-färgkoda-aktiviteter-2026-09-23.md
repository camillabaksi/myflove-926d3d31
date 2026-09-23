# Family Flow: redigera, flytta och färgkoda aktiviteter

## Mål
Göra barnschemat snabbt att ändra utan en avancerad kalendereditor. En förälder ska kunna öppna exempelvis **Tandläkare 14:00**, ändra tiden till **15:00** och spara samma aktivitet utan kopia.

## Genomförande

### 1. Behåll samma data och samma aktiviteter
- Återanvänd befintliga `child_items`, barnprofiler, privata bilder, pictogrambank och molnsynkning.
- Alla ändringar och flyttar använder befintlig uppdatering av aktivitetens id; inga nya kalenderposter skapas.
- Behåll befintligt konfliktskydd och revisionshistorik.
- Använd befintligt `repeat`-fält för Ingen, Dagligen, Vardagar och Varje vecka. Återkommande aktivitet redigeras som samma befintliga post.

### 2. Enkel redigering
- När en aktivitet öppnas visas en tydlig panel med:
  - namn
  - pictogram från befintlig sökbara pictogrambank
  - område
  - datum och starttid
  - valfri sluttid/längd
  - återkommande dagar enligt befintligt återkomststöd
  - befintlig privat anteckning
  - befintligt eget foto som alternativ
- Området och pictogrammet kan bytas direkt utan att aktiviteten skapas om.
- Sluttid/längd lagras i aktivitetens befintliga visuella metadata, inte i ett nytt schema- eller aktivitetssystem.

### 3. Flytta en eller flera aktiviteter
- En aktivitet får den enkla åtgärden **Flytta**, med nytt datum och ny tid i samma panel.
- Vecko- och Idag-vyn får ett tydligt **Välj flera**-läge. Valda aktiviteter kan flyttas tillsammans till ett nytt datum och/eller förskjutas till en ny starttid med bibehållen ordning.
- Flytten kontrollerar målpositioner och uppdaterar varje befintligt id exakt en gång; ingen kopieringsfunktion används.
- På desktop blir veckans aktivitetskort dragbara mellan dagkolumner. Släpp på en dag uppdaterar datumet direkt; klockslaget behålls. På touch/mobil används alltid **Flytta** så precis dragning inte krävs.
- Skolschemaposter som kommer från separat befintligt skolschema förblir läsbara men ändras inte som Family Flow-aktiviteter.

### 4. Konsekvent områdesfärg
Inför en semantisk, lugn färg per område och återanvänd projektets designtokens:

- Hemma: varm aprikos/gul
- Skola: blå
- Mat: grön
- Hygien/rutiner: lila
- Transport: neutral blågrå
- Träning: orange
- Vård: mjuk rosa/röd
- Familj: turkos
- Återhämtning: mjuk grön
- Fritid: korall

Färgen visas konsekvent på aktivitetens kant eller diskreta bakgrund i **Vecka**, **Idag**, **Nu/Nästa**, väljare och aktivitetslistor. Pictogram och kort svensk text finns alltid kvar, så betydelsen beror aldrig enbart på färg. Nu/Nästa hålls extra lugn med en smal områdesmarkering.

### 5. Kodstruktur och tester
- Lägg områdesetiketter och semantiska färgklasser centralt i barnschemats befintliga hjälpbibliotek.
- Lägg rena hjälpfunktioner för sluttid/längd, återkomst, flerflytt och dubblettkontroll där de kan enhetstestas.
- Utöka barnschemats befintliga testfil för:
  - skapa och ändra aktivitet
  - pictogram- och områdesbyte
  - tid- och dagflytt utan nytt id/dubblett
  - flerflytt med bevarad ordning
  - återkommande aktivitet
  - metadata och privata anteckningar
  - områdesfärg i alla visningslägen
- Kontrollera hela flödet i webbläsaren vid 360, 375, 390, 430 och 1280 px, inklusive desktop-dragning och mobilens Flytta-flöde, utan horisontell overflow.
- Kör TypeScript-kontroll, riktade och fullständiga tester samt byggkontroll.
- Uppdatera båda ändringsloggarna med dagens datum.

## Tekniska detaljer
- Ingen ny auth, tabell, barnmodell, kalender eller task manager.
- Ingen ny drag-and-drop-dependency; använd webbläsarens inbyggda desktop-dragning och tillgängliga knappflöden.
- Befintliga egna foton, signerade länkar, pictogramlicens, kopieringsflöden, Nu/Nästa/Klar och energikoppling bevaras.
- Redigering och flytt ska anropa `updateItem(id, patch)`; `addItem` används endast när föräldern uttryckligen skapar en ny aktivitet.
