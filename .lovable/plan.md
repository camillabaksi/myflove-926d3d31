# Samla all träning i Träningsprogram

## Mål
Göra Träningsprogram till den enda tydliga platsen för träning, utan att ändra befintliga program, passdata, historik, energianpassning eller AI-generatorns logik.

## Det som byggs
- Flytta den befintliga upplevelsen “Skapa mitt pass med Flow” in i Träningsprogram och visa den som primär ingång högst upp där.
- Låta skapandet, det färdiga passet, startläget och klartläget visas i samma Träningsprogram-vy.
- Samla befintliga färdiga program, sparade pass och genomförda pass under tydliga delar i samma träningssektion.
- Behålla `/skapa-pass` som bakåtkompatibel adress, men låta den leda till Träningsprogram i stället för en separat träningssida.
- Säkerställa att eventuella tips eller genvägar pekar till Träningsprogram och inte skapar en andra ingång.

## Bevaras oförändrat
- Befintliga träningsprogram, deras redigering och slutförande.
- AI-generatorn, den lokala reservgeneratorn, övningsbiblioteket, bilderna och säkerhetsnotiserna.
- Molnsynk, sparade pass, genomförda pass, historik, energi och FlowScore.
- Övriga träningsdelar som Steg, Vardagsmotion, Veckoplan och Vikt.

## Teknisk lösning
- Bryt ut passbyggaren till en återanvändbar träningspanel utan egen sidlayout.
- Montera panelen i den befintliga programvyn och växla lokalt mellan översikt, skapande, resultat och körläge.
- Använd befintliga MyFlove-kort, knappar och typografi; undvik parallell state eller nya datamodeller.
- Behåll den gamla rutten endast som redirect till `/traning`.

## Kontroll
- Verifiera hela flödet: öppna Träningsprogram → skapa pass → starta/spara → se det i Mina pass/historik.
- Kontrollera att gamla färdiga program fortfarande fungerar.
- Kontrollera 360, 375, 390 och 430 px samt desktop utan sidleds-scroll eller överlappning.
- Kör relevanta tester, TypeScript-kontroll och full build.
- Uppdatera båda changeloggarna med dagens datum.
