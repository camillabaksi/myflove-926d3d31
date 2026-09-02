# Investerar-/demokonto för MyFlove

Demokontot är ett vanligt användarkonto med samma normala behörighet som andra användare. Det får bara syntetisk exempeldata i sitt eget konto.

## Skapa kontot

1. Öppna **Cloud → Users** i projektets backend.
2. Skapa en användare med e-postadressen `investor@myflove.se`.
3. Välj ett unikt lösenord och dela det endast via en säker kanal till investeraren. Lösenordet ska inte skrivas in i projektfiler eller frontend.
4. Bekräfta e-postadressen enligt projektets vanliga authflöde.
5. Sätt användarens metadata till följande JSON genom Cloud-konsolens användarredigering:

```json
{
  "demo_account": true,
  "display_name": "MyFlove Demo"
}
```

Om Cloud-konsolen inte erbjuder metadataredigering räcker adressen `investor@myflove.se`; appen använder den som säker reservidentifiering. Lägg inte till kontot i `user_roles` – det ska inte vara admin.

## Aktivera exempeldata

Logga in en gång på [https://myflove.lovable.app/sign-in](https://myflove.lovable.app/sign-in). Appen fyller då automatiskt kontots befintliga användardata med syntetiska QuickFlow-, Flow-, Min dag-, Hälsa-, mående- och energiexempel. Seedingen är idempotent och körs inte på riktiga konton.

Efter första inloggningen kan du börja i **QuickFlow** och följa kedjan till **Flow → Prioritering → Min dag**. Demoetiketten `Demokonto · Exempeldata` visas i appens skal.

## Viktigt

- Använd inte en riktig persons e-post, anteckning eller annan personlig information i demokontot.
- Demokontot kan ändra eller radera sin egen data precis som ett vanligt konto. Om du vill återställa demon, radera endast demokontots egna `user_kv`- och `energy_logs`-rader via Cloud-backendens godkända verktyg och logga sedan in igen; rör inte andra användares rader.
- Adminstatistiken räknar inte demokontot i användar- eller registreringsmått. Händelser från demo-sessioner sparas inte i analytics.
