# Förenkla Mer och samla inställningar

## Resultat
- Den öppna Mer-vyn visar främst appens områden och funktioner.
- Alla nuvarande profil-, anpassnings-, introduktions-, ljud- och kontoåtgärder ersätts där av en enda post: **Inställningar**.
- Inställningar öppnas som en egen sida med tydliga grupper, utan att befintliga val eller funktioner tas bort.

## Ändringar
1. Skapa en separat Inställningar-vy med grupper för profil och konto, anpassning, Flow, introduktion/app samt ljud.
2. Flytta befintliga länkar och åtgärder från den öppna Mer-vyn till den nya sidan: Min profil, Anpassa appen, Hemskärm, Flow-inställningar, menyns visningsläge, information om bottenmenyn, Så funkar MyFlove, introduktionen, installation på hemskärmen, alarmljud och Logga ut.
3. Låt Mer behålla områdena Studier, Jobb, Familj, Hem, Insikter, Avancerat och eventuell Admin, följt av en enda tydlig Inställningar-post med kugghjul.
4. Behåll befintliga underliggande sidor, sparade val och utloggningsflöde oförändrade.
5. Uppdatera changeloggarna.

## Teknisk kontroll
- Lägg till en skyddad TanStack-route för `/installningar` med egen sidmetadata.
- Kontrollera att Mer inte längre visar de enskilda inställningskorten och att varje funktion nås från Inställningar.
- Testa mobilvyn på 360, 375, 390 och 430 px, inklusive scroll och att inga element går utanför skärmen.
- Kontrollera appens automatiska buildresultat och kör relevanta tester.
