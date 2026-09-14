# Lugnare Barn, Familj och Relationer

Tre sidor kvar i menyn — Relationer, Familj, Barn — men var och en följer samma
princip som Studier och Jobb: visa → klicka → fördjupa, och överst väljer du
alltid vem det gäller.

## Barn

Ordning på sidan:

1. **Vem gäller det?** — barnen som runda val högst upp, alltid synliga. Knappen
   "Lägg till barn" ligger som ett diskret val i samma rad i stället för ett
   öppet formulär.
2. **Dagens hållpunkter för valt barn** — en enda kompakt lista med tid framför
   raden, samma visuella språk som dagvyn. Klara saker visas dämpade i samma lista.
3. **Allt för barnet** — den befintliga listan med filter (Allt, Aktiviteter,
   Att göra, Anteckningar, Dokument), oförändrad funktionalitet.
4. **+ Lägg till** — formuläret för aktivitet/att göra/anteckning/dokument
   fälls ut vid behov i stället för att ligga öppet.
5. **Mer om barnen** (hopfälld) — veckoschema, påminnelseinställningar och
   delning. Inget tas bort.

## Familj

1. **Din familj** överst: namn, medlemmar med färg, inbjudningskod att kopiera.
2. **Vad ni delar** — kort rad som visar att kalender och listor delas, med
   länkar till kalender, inköp och matlista.
3. **Mer** (hopfälld) — byt namn/färg, lämna familjen.
4. Har du ingen familj: ett enda lugnt kort med "Skapa familj" eller "Gå med med
   kod", inte två öppna formulär samtidigt.

## Relationer

1. **Dina personer** överst — alla tillagda personer i en enkel lista oavsett
   typ, med typ-emoji som liten markering. Ingen sektion per typ som idag.
2. **+ Lägg till person** — ett val där du anger namn och väljer relationstyp.
3. **Mer** (hopfälld) — "Vilka relationer vill du ha med?" (typvalen) och
   länkarna till Familj och Barn.
4. Energiloggen (🔋/🪫) finns kvar på varje person, oförändrad.

## Vad som inte ändras

Inga routes, datamodeller, hooks eller molnsynk ändras. Ingen funktion tas bort —
allt som flyttas hamnar under ett hopfällbart avsnitt. Delning, dokument,
påminnelser, barnscheman och hushållet fungerar som idag.

## Tekniskt

- Ändras: `src/pages/children.tsx`, `src/pages/family.tsx`, `src/pages/relations.tsx`.
- Dagens hållpunkter för barn byggs på befintliga `useChildEvents`/`use-children`
  — ingen ny dagmodell.
- Befintliga `CollapsibleSection`, `MyFloveHeader`, `surface-card` och
  personfärger från `src/lib/palette.ts` återanvänds.
- Efteråt: `bunx tsgo --noEmit`, `bunx vitest run`, `bun run lint`,
  `bun run build` samt kontroll på 360/375/390/430 px och desktop utan sidoscroll.
- `CHANGELOG.md`, `src/lib/changelog.ts` och `roadmap.md` uppdateras.
