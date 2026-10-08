# Mer – lyft fram fyra befintliga kategorier

## Inventering
De fyra första kategorierna under **Fler funktioner** är, i nuvarande ordning:

| Kategori | Befintliga funktioner |
|---|---|
| Min dag | Idag, Kalender, Tankar, Påminnelser, Timer |
| Flow och samtal | Flow, Prata med Flow, Planera, Anteckningar |
| Ork och återhämtning | Min plats, Mitt batteri, Energins historik, Återhämtning, Stop-paus, Rutiner & medicin |
| Hem och vardag | Matlista, Inköpslista, Städning |

## Föreslagen placering och presentation
- Behåll profilkortet och samtliga huvudsektioner exakt som idag.
- Direkt efter **ÖVERBLICK & INSIKTER**, före **FLER VERKTYG**, placeras fyra egna sektioner i ordningen ovan.
- Funktionerna visas direkt som befintliga klickbara rader med ikon, namn, kort beskrivning och pil. Inget extra öppningssteg behövs.
- Återanvänd samma typografi, färger, illustrationer, ytor och avstånd. Ingen ny kortstil eller dekor införs.
- **Konto och app** och behörighetsstyrd **Admin** ligger kvar under **Fler funktioner**. **Äldre funktioner** och slutpåminnelsen ligger kvar som idag.
- Ta bort de fyra grupperna från den utfällbara listan när de lyfts fram. Visa Inställningar endast vid profilkortet, inte även under Konto och app; Feedback ligger kvar där. Sökresultat är en alternativ sökvy, inte en extra lista i normalvyn.
- Behåll Enkelt läge, områdesfilter och behörigheter; tomma kategorier visas inte. Alla tillåtna länkar finns kvar i sökningen.

## Teknisk avgränsning
- `src/components/paceable/more-view.tsx`: flytta presentationen av de fyra grupperna och återanvänd befintliga `section`, `rows` och filtrering.
- `src/components/paceable/more-view.test.tsx`: verifiera full länktäckning, korrekt gruppplacering och inga dubbla destinationer i normalvyn.
- `src/styles.css`: endast om befintlig radstil behöver en liten, Mer-avgränsad anpassning för direktvisade listor; inga globala ändringar.
- Uppdatera befintlig dokumentation och båda ändringsloggarna efter genomförandet.
- Inga nya komponenter, paket, rutter, funktioner eller lagringsändringar. Övrig navigation lämnas orörd.

## Kontroll efter godkännande
- Mobil 360/390/430 px och desktop 1024/1440 px, båda teman och 200 % text: läsbara rader, tydliga sektionsgränser, fungerande scroll och synlig bottennavigation.
- Kontrollera samtliga länkar, Enkelt läge, behörighetsfilter, sökning och kvarvarande utfällbara grupper.
- Kör relevanta tester och kontrollera automatiskt bygge; inga sparande tester i kontot.

**Ingen appkod ändras före godkännande. Ingen publicering ingår.**