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
- Behåll även de fyra grupperna i den utfällbara listan. Alla befintliga huvudkort, sektioner och länkar lämnas kvar, inklusive Inställningar på sina befintliga platser. Upprepade genvägar mellan sektioner är avsiktliga; data och funktion dupliceras aldrig.
- Behåll Enkelt läge, områdesfilter och behörigheter; tomma kategorier visas inte. Alla tillåtna länkar finns kvar i sökningen.

## Teknisk avgränsning
- `src/components/paceable/more-view.tsx`: lägg till presentationen av de fyra grupperna och återanvänd befintliga `section`, `rows` och filtrering, utan att ändra befintliga grupper.
- `src/components/paceable/more-view.test.tsx`: verifiera full länktäckning, rätt destinationer, samma behörighetsfilter och inga dubbla destinationer inom samma sektion; tillåt avsiktliga upprepningar mellan sektioner.
- `src/styles.css`: endast om befintlig radstil behöver en liten, Mer-avgränsad anpassning för direktvisade listor; inga globala ändringar.
- Uppdatera befintlig dokumentation och båda ändringsloggarna efter genomförandet.
- Inga nya komponenter, paket, rutter, funktioner eller lagringsändringar. Övrig navigation lämnas orörd.

## Kontroll efter godkännande
- Mobil 360/390/430 px och desktop 1024/1440 px, båda teman och 200 % text: läsbara rader, tydliga sektionsgränser, fungerande scroll och synlig bottennavigation.
- Kontrollera samtliga länkar, Enkelt läge, behörighetsfilter, sökning och kvarvarande utfällbara grupper.
- Kör relevanta tester och kontrollera automatiskt bygge; inga sparande tester i kontot.

**Genomförandet godkänt med förtydligandet ovan. Ingen publicering ingår.**