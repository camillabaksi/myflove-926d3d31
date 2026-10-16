# Pilotstatistik i Paceable

Mål: följa om deltagare kommer igång, återkommer och upplever konkret vardagsnytta. Utgå från Paceable_Roadmap_NPF_Validering_2026_2027 och Paceable_Testprotokoll_NPF_Pilot (12 oktober 2026). Inga påhittade målgränser eller effektpåståenden.

## Visade mått

| Fråga | Mått och nämnare | Underlag och begränsning |
| --- | --- | --- |
| Vilka använder appen? | Unika aktiva externa konton, 30 och 7 rullande dygn | Max av user_last_active.last_active_at och auth.last_sign_in_at. Admin och demo undantas. Konto är inte bekräftad pilotdeltagare. |
| Kommer nya konton igång? | Konton skapade och aktiva senaste 7 dygn | Registrering ensam är inte aktivitet. Inloggning är inte bevis för kärnanvändning. |
| Var registrerades aktiva konton? | iOS / Android / webb / okänd, samma aktiva 30-dagarsgrupp | Endast ursprunglig registration_platform. Ingen gissning av historik, aktuell enhet eller TestFlight-/Play-teststatus. |
| Kommer stödet till användning? | Unika app-/webbläsar-ID med minst en uttryckligen listad kärnhandling | Exakta mängder över händelser, inte summor/max av delmått. Sidvisning, onboarding, öppnade menyer och visade förslag räknas inte. |
| Återkommer kärnanvändningen? | ID med kärnhandlingar på minst två svenska kalenderdagar / ID med minst en kärnhandling under 30 dygn | Beskrivande upprepning inom fönstret, inte D7-/D30-retention eller kontobaserad återkomst. Nya ID har kortare observationsmöjlighet. |
| Vilket stöd används? | Unika ID per handlingstyp / samtliga ID med kärnhandling | Fånga/planera, genomföra, energiincheckning, startad paus, valt nästa steg. Överlapp tillåts; aldrig summera kategorier till personer. Definitionerna finns i PILOT_FEATURES. |
| Finns friktion vid incheckning? | ID med start följd av slutförd energiincheckning inom 30 minuter / ID med registrerad start | Rätt tidsordning; ett ID en gång trots flera försök. Bara händelser inom perioden. Ingångar utan start ingår inte i nämnaren. Inte en försöksbaserad konvertering eller säker avbrottsgrad. |
| Blir vardagen lättare? | Frivillig veckopuls: svar av startade formulär, svarsfördelning och median per fråga | Tre fasta frågor om överblick, upplevd mental belastning och appen som extra arbete, skala 1–5. Egen period: pågående svensk kalendervecka och sju tidigare. Start betyder valt Svara, inte visad inbjudan. Ingen sammanslagen nyttopoäng eller effektinferens. |

## Avgränsning och integritet

- Inaktiva konton och historiska registreringar är dolda bakom ett uttryckligt val, aldrig borttagna. Kontolistan i admin innehåller även admin/demo för rollhantering; pilotöversikten gör inte det.
- Konto- och ID-statistiken har separata populationer och ska inte divideras med varandra. Flera enheter, delade webbläsare och återställd lagring påverkar ID-statistik.
- ID märkta is_internal=true undantas i pilotens användningsmått. Okänd intern/extern status redovisas öppet och räknas inte som verifierade externa deltagare. Ingen ny koppling till konton eller identitetsuppslag görs.
- Delade reserv-ID `unknown` och `server` kan inte identifiera installationer och undantas; antal undantagna händelser anges separat.
- Alla privilegierade läsningar sker efter adminprövning. Konton, aktivitetsobservationer, roller, händelser och internmärkningar pagineras. Misslyckade läsningar visar fel, inte falska nollor. Om händelseläsningen når skyddsgränsen om 500 000 rader med ytterligare data visas inget partiellt resultat som komplett.
- Vyn läser inga privata planer, hälsologgar, meddelanden eller fritextsvar. Veckopulsen är separat frivillig insamling, kopplad till kontot för deduplicering och ändring men bara aggregerad i admin. Den kopplas aldrig till anonyma användnings-ID. Se docs/weekly-pulse.md.
- Perioden är senaste 30 * 24 timmar fram till beräkningstidpunkten; dagliga grupper använder Europe/Stockholm, även vid sommartidsbyte. Dagstabellen visar 14 kalenderdagar inklusive den pågående dagen.
- Rågranskning och råexport har egna periodval och inkluderingsregler. Kopiera översikt att dela använder bara aggregat från pilotöversikten, med enheter och begränsningar.

## Nästa underlag från piloten

Veckopulsen är en separat, tydligt informerad och frivillig insamling. För en senare formell pilot behövs också antal inbjudna och bortfall. Jämför varje av de fem identiska T0-/T1-frågorna inom samma deltagare och redovisa antal matchade par. Lägre svar innebär förbättring på de fyra belastningsfrågorna, högre på frågan om energimönster. Uteblivet svar är inte negativt svar. Före/efter utan jämförelsegrupp visar inte att appen orsakat en förändring.

Veckopuls v1 ansluter endast de tre veckofrågorna, med uttrycklig inskickning och utan diagnoser eller fritext. Den samlar inte T0-/T1-frågorna eller verifierar pilotdeltagande. Veckomedianer kan avse olika personer och är inte en matchad före-/efteranalys. Antal som bara sett inbjudan mäts inte; svar av startade formulär får inte beskrivas som svarsfrekvens bland alla inbjudna. Bestäm urval och beslutströsklar separat inför en formell validering.
