# Frivillig veckopuls v1

## Användarflöde

En liten ruta sist på Idag erbjuder Svara eller Inte nu. Den öppnar aldrig en dialog automatiskt.
En läsning när sidan visas skriver ingenting. Svara registrerar en start för kontot och veckan;
Inte nu sparar en paus för veckan. Efter paus eller svar visas endast en liten ingång för att
öppna eller ändra veckopulsen. En ny vecka får en ny inbjudan.

De tre frågorna och skalan är fasta:

1. Paceable hjälpte mig att få överblick denna vecka.
2. Paceable minskade min upplevda mentala belastning.
3. Att använda Paceable kändes som ytterligare en uppgift.

1 = Instämmer inte alls; 5 = Instämmer helt. Inga förvalda svar eller fritextfält. Alla tre
behöver besvaras för att knappen Skicka mina svar ska aktiveras. Formuläret förklarar kontokoppling,
ändamål, frivillighet och att adminvyn visar sammanställningar utan namn. Val lagras enbart i
dialogens minne tills användaren skickar dem. Det finns ingen autosparning, kö, AI eller analysloggning
för svaren. Vid sparfel ligger dialog och val kvar; ingen lyckad bekräftelse visas.

Aktuell veckas svar kan ändras eller tas bort med ett andra, uttryckligt val. Borttagning rensar
alla tre svaren och samtyckesversionen, medan den redan registrerade starten kvarstår i nämnaren.
Historiska svar hanteras via kontaktvägen i integritetspolicyn. Kontoavslut raderar raderna via FK.

## Databas och behörigheter

Migration `0022_pilot_weekly_pulse` är additiv. Tabellen `pilot_weekly_pulses` har primärnyckeln
`(user_id, week_start)`, tre heltal 1–5, tidsstämplar, revision och samtyckesversion 1. Veckan är
måndag–söndag i Europe/Stockholm och beräknas igen i databasen. Fullständighetsvillkor förbjuder
halva svar. Inga befintliga app-, familje- eller energidata ändras.

Autentiserade användare kan läsa endast sina egna rader via RLS. Tabellens direkta skrivbehörighet
är återkallad. `update_my_weekly_pulse` tar ägaren från `auth.uid()`, tillåter bara aktuell vecka
och validerar kompletta svar samt uttryckligt delningsval. Radlås och fryst formulärrevision
stoppar samtidiga överskrivningar. Identiska sparförsök och upprepad borttagning är idempotenta.
Serverfunktionerna stoppar även byte av konto mellan klick och anrop med expectedUserId.

`get_weekly_pulse_stats` kräver adminrollen i databasen; serverfunktionen kontrollerar rollen före
RPC. Den lämnar bara veckovisa aggregat: antal startade/svarade samt fem antal per fråga. Varken
namn, konto-ID eller enskilda svar returneras till admin. Admin och demo undantas enligt befintlig
metadata-/e-postdefinition. Inga nya rättigheter till råa användarsvar ges till adminrollen.

## Statistik och tolkning

Admin visar den pågående veckan och sju tidigare veckor, separat från den rullande 30-dagarsperioden
för användningsstatistik. Varje fråga har fördelning och median; tomma underlag visas som streck.
Appens belastning slås aldrig ihop med de andra frågorna till ett index. Veckovisa grupper kan
innehålla olika konton och redovisas inte som matchad förändring eller som bevisad effekt.

Nämnaren är konton som aktivt valt Svara. Visade inbjudningar räknas inte. Det här är därför ingen
svarsfrekvens bland alla inbjudna eller alla aktiva användare. Avstängd anonym analys påverkar inte
uttryckligen inskickad produktfeedback; inga poäng läggs i analytics, user_kv eller familjedelning.
Om statistiken inte kan hämtas visas fel och okänt resultat i stället för falska nollor.

## Kontroller och aktivering

Riktade Vitest-tester omfattar skala, svenska veckogränser/sommartid, frivillighet, bevarat utkast,
ändring, borttagning, misslyckat sparande och konto-/veckobyte. `scripts/test-weekly-pulse-db.mjs`
kör migrationen i en isolerad PGlite/PostgreSQL med syntetiska konton och verifierar RLS,
RPC-gränser, aggregering, admin-/demofilter, idempotens, stale edits och kaskadradering.

För att köra databaskontrollen utan att lägga till ett runtimepaket i appen:

```sh
npm install --prefix /tmp/paceable-pulse-db --no-save --no-package-lock @electric-sql/pglite@0.3.14
PGLITE_MODULE=/tmp/paceable-pulse-db/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-weekly-pulse-db.mjs
```

Koden och migrationen ska granskas tillsammans. Före publicering: applicera den versionshanterade
migrationen genom projektets befintliga migrationsflöde, kontrollera att den nya tabellen och båda
funktionerna finns, och publicera därefter appversionen. Publicera inte en klient som förutsätter
tabellen före migrationen. Inga produktionssvar eller befintliga tabeller behövs för kontrollen.
Fysisk iOS/Android-verifiering är separat; inga nya nativepaket krävs.
