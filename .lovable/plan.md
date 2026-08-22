# Hem – analys av de fyra snabbalternativen (ingen kod ändrad)

## 1. De fyra snabbalternativen

De ligger i blocket "Vad behöver du just nu?" (block-id `vagar`) på Hem. Exakt som de står i koden idag:

| Ikon | Namn (tanken) | Undertext | Leder till |
|---|---|---|---|
| ➕ | Jag behöver planera något | "Lägg till en sak – med tid om du vill" | `/tasks` (Att göra) |
| ✅ | Jag gjorde redan något | "Registrera det du hunnit med" | Öppnar modalen "Jag gjorde något" direkt på Hem |
| 💜 | Jag vet inte vad jag ska göra nu | "Få ett förslag i taget" | `/flow` (Planera) |
| ⚡ | Jag har mycket i huvudet | "Skriv av dig – jag sorterar sen" | `/quickflow` |

De fungerar bra och rörs inte.

## 2. Vad de täcker redan

- **"Lägg till"** täcks av alternativ 1 (➕ Jag behöver planera något).
- **"Jag gjorde något"** täcks av alternativ 2 (✅ Jag gjorde redan något) – samma modal, samma sparlogik, samma dubblettskydd.
- **"Lägg till det du gjorde"** är samma funktion som ovan, fast som fast panel istället för modal.

## 3. Varför de tre ändå syns separat

Hem består av fristående block som var och en kan slås på/av i "Anpassa hemskärmen":

- `gjort-knapp` = "Jag gjorde något" som egen knapp (syns som standard).
- `lagg-till` = snabbfältet "Lägg till" (syns som standard).
- `gjort` = hela panelen "Lägg till det du gjorde" (avstängd som standard, men på om du själv slagit på den).
- `vagar` = de fyra snabbalternativen (syns som standard).

Blocken byggdes vid olika tillfällen och ingen av dem vet om de andra. Därför visas samma funktion flera gånger.

## 4. Dubbla vägar till samma funktion

- "Jag gjorde något" finns på **tre** ställen på Hem: snabbknappen, snabbalternativ ✅, och panelen "Lägg till det du gjorde".
- "Lägg till" finns på **två** ställen: snabbfältet och snabbalternativ ➕ (som leder till Att göra).
- "Få ett förslag" finns på **två** ställen: kortet "Just nu" och snabbalternativ 💜.

## 5. Rekommendation för Hem (mindre brus, inga funktioner förlorade)

**Behåll:**
- Hälsning
- "Hur är det just nu?" (mående/energi)
- Mitt energibatteri
- Nästa
- Dagens saker
- De fyra snabbalternativen – oförändrade

**Ta bort från Hem (funktionen finns kvar i snabbalternativen):**
- Snabbknappen "Jag gjorde något" (`gjort-knapp`) → täcks av ✅
- Snabbfältet "Lägg till" (`lagg-till`) → täcks av ➕
- Panelen "Lägg till det du gjorde" (`gjort`) → täcks av ✅

**Flytta:**
- Kortet "Just nu" (rekommendation) – behåll bara om du vill se förslaget utan att klicka; annars räcker 💜. Förslag: stäng av på Hem, finns kvar i Planera.
- "Energins historik" och "Områdesväljare" – ligger redan avstängda som standard, låt dem vara valbara i Anpassa hemskärmen.

**Placering:** flytta de fyra snabbalternativen högre upp, direkt efter hälsning + batteri, så att Hem läses som: *hur mår jag → vad händer härnäst → vad vill jag göra*.

## Teknisk not

Allt ovan kan genomföras enbart genom att ändra standardvärdena i `DEFAULT_PREFS` (`src/lib/home-layout.ts`) – inga komponenter behöver tas bort, ingen navigation ändras, och användare kan slå på blocken igen i "Anpassa hemskärmen".

Ingen kod är ändrad i detta steg.
