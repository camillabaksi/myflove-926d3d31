# Rutiner och Medicin som en samlad sida

## Mål
Göra `/daglig-rutin` till den enda tydliga platsen för rutiner och medicin, med dagens viktigaste innehåll först och all befintlig funktionalitet kvar.

## Förändringar
- Ersätt flikarna **Alla / Morgon / Rutiner / Medicin** med ett enda lodrätt flöde.
- Visa **I dag** överst som en kompakt gemensam lista för dagens rutiner och doser, med befintlig avbockning och ångra-funktion.
- Samla **Rutiner** och **Medicin** under varsin tydlig, hopfällbar hanteringsdel där användaren kan lägga till, ändra, pausa, bocka av och ta bort precis som nu.
- Lägg **Morgonstart** under en hopfälld fördjupning längst ned, så den finns kvar utan att konkurrera med dagens rutiner och medicin.
- Ta bort den fullständiga medicinhanteringen från Påminnelser och ersätt den med en kompakt länk till den samlade sidan. Vanliga påminnelser påverkas inte.
- Behåll befintliga länkar till `/daglig-rutin` från Hem, Hälsa, Lägg till, Flow och notiser. Den gamla `/morgonstart`-länken fortsätter att skicka vidare dit.

## Teknisk lösning
- Återanvänd `RoutinesMedicationToday`, `RoutinesContent`, `MedicationContent`, `WakeUpCard`, `PushStatusCard` och `WakeUpSettings`.
- Ändra endast presentation och exponering; inga nya modeller, routes eller lagringsnycklar skapas.
- Behåll all befintlig lokal lagring, molnsynkning, återkommande regler, medicinlogg och påminnelselogik.
- Undvik dubbla instanser av medicinhooken på Påminnelser-sidan genom att inte rendera hela `MedicationContent` där.

## Kontroll
- Sök efter döda eller dubbla ingångar och imports.
- Kontrollera sidan och Påminnelser på 360, 375, 390, 430 och 1280 px utan horisontell overflow.
- Kör typkontroll, tester, lint och bygge.
- Uppdatera båda ändringsloggarna och roadmapen med datum.
