# Steg 4 – En tydlig kapacitetsupplevelse

## Mål
Göra gränssnittet lika enkelt som den verifierade modellen: ett kapacitetsval, en plan från FlowPlan och ett lugnare Lågt-läge. Ingen historik eller äldre planeringskod raderas.

## Genomförande
1. **En kapacitetskontroll på Hem**
   - Behåll “Hur är läget idag?” som enda väljare.
   - Ta bort den dubbla “Kapacitetsläge”-väljaren från Hem, men behåll bakåtkompatibla hjälpfunktioner som fortfarande används.
   - Visa kort hjälptext och en kort förklaring för valt läge.

2. **Samma läge i aktiva vyer**
   - Kontrollera alla aktiva kapacitetskontroller och koppla dem till `useCapacityMode`.
   - Vyer som bara behöver informera visar värdet utan en extra lokal väljare.
   - Ta bort tekniska ord som P1–P4, FlowPlan, FlowScore och energipoäng från vanliga planeringsytor.

3. **Lugnare Lågt-läge**
   - Visa bara Nu där planen presenteras.
   - Dölj Sedan, Kan vänta, extraförslag, parallellförslag och onödiga statusmarkeringar.
   - Behåll alla data och åtgärder; detaljer återkommer när läget höjs.

4. **Planera använder samma kapacitet och plan**
   - Behåll `useCapacityMode` som enda väljarkälla.
   - Låt FlowPlans ordning vara styrande och begränsa AI till förklaring och tidsuppskattning.
   - Ta bort energibaserade och tekniska formuleringar från Planera utan att ändra FlowPlans regler.

5. **Historik och mönster**
   - Märk befintliga batteri-, FlowScore- och energivärden som historik/mönster där det kan göras säkert.
   - Flytta eller radera inte historik i detta steg.

6. **Inventering utan radering**
   - Spåra gammal batteribaserad rangordning, FlowScore-baserad omplanering och gammal Just nu-väljare genom hela kodbasen.
   - Rapportera användning, behov, borttagningsrisk och rekommendation för varje del.

7. **Verifiering och dokumentation**
   - Uppdatera båda ändringsloggarna och roadmap.
   - Kör typkontroll, relevanta tester, hela testsviten och automatisk byggkontroll.
   - Kontrollera 390 px för Hem, Idag, Planera, QuickFlow, Flow, Träning, Familj, Återhämtning och Hälsa utan sidscroll.
   - Kontrollera Fullt → Mellan → Lågt → Fullt, lagring/synk, förenklat Lågt-läge och att historiken fortfarande visas.
   - Bekräfta att FlowPlans regler och resultat är oförändrade.

## Tekniska ramar
- Ingen ändring av routing, auth, datamodeller, P1–P4-regler eller FlowPlans grundlogik.
- Ingen radering av äldre planeringsdelar, energihistorik eller sparad data.
- Befintliga komponenter och designtokens återanvänds; ingen redesign eller paketinstallation.
