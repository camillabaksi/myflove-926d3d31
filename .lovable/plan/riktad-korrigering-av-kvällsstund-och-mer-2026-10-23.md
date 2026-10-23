# Riktad korrigering av Kvällsstund och Mer

## Endast detta ändras
- Gör Kvällsstunds sex stegrubriker tydligare och större i den faktiska appen. Behåll handskriften, men minska rubrikerna i energisektionen, styrkesektionen, slutöversikten och de fyra sammanfattningskorten.
- Jämna ut måendevalens ovala former och behåll deras mjuka, taktila yta, funktion och placering.
- Minska avslutningstexten och ge den ett diskret ljust underlag och plommontext för säker läsbarhet utan att byta kvällsbakgrund.
- Visa energivärden med högst en decimal och svensk decimalkomma, exempelvis **6,4 av 10**. Inga sparade värden eller beräkningar ändras.
- Öka Mers områdesfärger måttligt i vänsterlist, ikonbakgrunder och kortton. Samma kortlayout och navigation.

## Teknisk avgränsning
- Kvällsstunds befintliga typografiregler förlorar mot appens globala rubrikregler. Ge endast ritualens uttryckliga textroller tillräcklig prioritet; ändra inte appens globala textskala.
- Använd befintliga områdes- och yttokens i Mer. Behåll etapp 1–2, kontoägande, kryptering, sparning och stegflöde.
- Berörda appfiler: `src/styles.css`, `src/components/journey/evening-check.tsx`; riktade tester samt båda ändringsloggarna uppdateras.

## Kontroll
- Gå igenom alla sex steg i mobilförhandsvisning utan sparning, vid 360 px och 390 px med större text; kontrollera Mer, rullning, rubrikhierarki och sluttextens kontrast.
- Testa avrundning med det rapporterade flyttalet och att befintliga spar-/avbrytregler är oförändrade. Kör relevanta tester och kontrollera automatiska byggresultat.
- Rapportera faktiska ändringar, filer och eventuella verifieringsbegränsningar. Ingen publicering.