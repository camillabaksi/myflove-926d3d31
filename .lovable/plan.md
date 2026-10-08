# Ändra visningsnamn från Idag

## Vad granskningen visade
- Hälsningen på Idag läser namnet från den befintliga, kontobundna namnlagringen (samma som legacy-Hem och "Byt namn" där). Den synkas redan mellan enheter via kontots molnlagring och finns kvar efter ny inloggning.
- "Camillabaksi" uppstår när inget namn är sparat: då tas förnamn från kontoprofilen, annars gissas det från e-postadressens början (camillabaksi@… saknar punkt/bindestreck, så allt blir ett ord). Gissningen sparas sedan som om den vore vald.
- Familjemedlemmars och barns namn ligger i helt separata tabeller och berörs inte.

## Vad som byggs
1. Diskret ⋯-knapp (44×44 px, etikett "Fler val för hälsningen") uppe till höger i hälsningsraden, bredvid stenarna utan att flytta dem; vid trång bredd/200 % text placeras den i hälsningsradens övre hörn utan överlapp.
2. Meny med ett val: "✏️ Ändra visningsnamn".
3. Liten dialog: rubrik "Vad vill du bli kallad?", fält förifyllt med nuvarande namn (max 32 tecken som idag), "Avbryt" och "Spara". Fokus i fältet vid öppning, Escape stänger, fokus tillbaka till ⋯.
4. Validering: tomt eller bara mellanslag ger lugnt meddelande under fältet; Spara inaktiveras inte tyst.
5. Sparning: namnet skrivs till befintlig namnlagring och synkas direkt till kontot. Dialogen stängs och hälsningen visar nytt namn först när synken lyckats; vid fel återställs det gamla namnet och ett lugnt felmeddelande visas i dialogen ("Namnet kunde inte sparas just nu. Försök igen om en stund.").
6. Ett eget valt namn prioriteras alltid; den automatiska gissningen används bara när inget namn finns, och ersätter aldrig ett valt namn.

## Avgränsning
Ingen ändring av e-post, inloggning, användar-ID, familj/barn, Capacity, Din dag, Pace, kalender, stenar eller tekniska nycklar. Ingen databas-/behörighetsändring. Ingen publicering.

## Tekniska detaljer
- `src/hooks/use-user-profile.ts`: ny `saveName(value)` som trimmar, sätter värdet via `useCloudSyncedStorage`, väntar på en bekräftad synk av just namnnyckeln och returnerar ok/fel; återställer vid fel.
- `src/lib/cloud-storage.ts`: liten exporterad helper som synkar en enskild nyckel och kastar vid fel (befintliga `flushCloudSync` sväljer fel). Ingen ändring av merge-/lagringslogik.
- Ny `src/components/day/greeting-name-menu.tsx`: befintliga shadcn DropdownMenu + Dialog.
- `src/pages/today.tsx`: monterar menyn i hälsningsraden; `styles.css` endast lokal placering vid 200 %.
- Tester: tomt/mellanslagsnamn avvisas, dialogen stängs inte vid misslyckad synk, valt namn prioriteras över gissning. Kontroll 360/390/430/1024/1440, långt namn, 200 %, tangentbord, ljust/mörkt.
- CHANGELOG.md + src/lib/changelog.ts uppdateras.
