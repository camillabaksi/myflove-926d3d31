# Återstående säkerhetsskydd

## Det som ska rättas
- Uppdatera sårbara underberoenden med kompatibla säkerhetsversioner, utan att ändra mobilapparnas identitet, versionsnummer eller signering.
- Inför blockerande webbskydd mot otillåten inbäddning och riskfyllda innehållstyper. Behåll Lovables förhandsvisning, inloggning, chatt, filmer och kalenderkopplingar. Stramare skriptskydd aktiveras bara där kompatibiliteten har verifierats; kvarvarande undantag redovisas.
- Sluta skicka privata texter, råa felrapporter och leverantörssvar till de berörda loggarna. Behåll innehållsfria felkoder för felsökning. Befintliga sparade loggar raderas inte.
- Säkra återregistrering av notiser så att kännedom om en gammal notisadress inte räcker för att flytta någon annans prenumeration. Återanvänd kontots befintliga inloggade registrering; lagra inga inloggningshemligheter i service workern. Om en förnyelse inte kan verifieras medan appen är stängd sker den när appen öppnas och användaren är inloggad, vilket kan ge ett tillfälligt notisuppehåll.
- Rätta de identifierade kontopreferensernas separering och synkmanifest utan namnbyten eller radering av osynkade uppgifter.

## Kontroll och skyddsgränser
- Lägg till och kör riktade tester för avvisade notisförnyelser, minimerade loggar, webbskydd och kontoseparering.
- Kör ny beroendeskanning och kontrollera den automatiska byggkontrollen. Kontrollera inloggade sidor utan att skriva till ditt konto eller läsa anteckningarnas innehåll.
- Granska tidigare familje-/barnrättningar med isolerade testdata. Verkliga åtkomsttester utförs endast om separata testkonton kan användas säkert; annars redovisas den kontrollen som återstående.
- Uppdatera ändringsloggarna och redovisa vad som är verifierat respektive kvarstår. Ingen publicering.

## Tekniskt genomförande
Ändringarna avgränsas till befintliga säkerhetsheaders, berörda felvägar, push-återregistrering, kontonyckelklassning, beroendeversioner och deras tester. Ingen ny datalagring, ingen ändring av autentiseringens tokensändning, inga nya paket och inga destruktiva databasändringar. En fullständig nonce-baserad skriptpolicy ingår inte om den kräver en separat större ombyggnad.