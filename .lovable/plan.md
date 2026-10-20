# Kompaktare och enhetlig sidlayout

Granskat: 32 sidor på mobil (390 px) och dator (1280 px), inloggad.

## Vad som gör sidorna röriga i dag
1. **Mobilens sidhuvud tar ~165 px.** Stor logotyp på egen rad och sedan en rad till med tillbaka- och chattknapp, på varje sida.
2. **"Härnäst"-kortet från Pace ligger överst på nästan alla djupare sidor** (Insikter, Inställningar, Batteri, Återhämtning, Barn, Uppgifter, Planera, Anteckningar, Träning, Jobb, Profil m.fl.). Sidans egen rubrik hamnar därför långt ner.
3. **Rubrikerna ser olika ut.** Ibland finns ikon och linje, ibland ett streck efter texten ("Anteckningar —", "Dela & bjud in —"). Min plats har ett eget färgat kort, och vissa sidor har ingen ikon alls.
4. **Bredden varierar på datorn.** Inställningar, Återhämtning och Påminnelser sträcker kort över hela 1100 px med mycket tom yta. Planera och Kalender använder två spalter.
5. **Sektioner och knappar blandas.** Samma typ av innehåll visas ibland som öppet kort, ibland som hopfällbar rad. Primärknappar är ibland mörka och fullbreda, ibland små pillerknappar.
6. **Undermenyer har olika stil.** Tankar (Dagbok/För & emot), Pace (Planera/Chatta) och Kalender (Idag/Vecka/Månad) har var sin flikstil.
7. **Sidfoten** (Integritet/Villkor/Cookies) syns mitt i appen på många sidor.

## Förslag (en gemensam sidmall)
- **Kompakt mobilhuvud:** en rad på cirka 56 px med tillbaka, liten logotyp och chatt. På datorn ligger logotypen redan i sidomenyn.
- **"Härnäst" bara på Idag och Hem.** Djupare sidor börjar direkt med sin rubrik.
- **Samma rubrikblock överallt:** liten ikon i områdets färg, rubrik, kort linje, en rad undertext och eventuell huvudknapp till höger. Inga streck efter texten. Min plats får samma rubrik som övriga sidor.
- **Tre fasta bredder på datorn:**
  - Läsbredd cirka 720 px för listor och formulär (Inställningar, Återhämtning, Påminnelser, Profil).
  - Bred bredd för Kalender och Insikter.
  - Två spalter för Planera.
- **Tätare avstånd:** jämn 12–16 px luft mellan kort och kompaktare listrader som fortfarande har minst 44 px tryckyta.
- **Samma flikstil** för alla undermenyer (Kalender-stilen).
- **Samma huvudknapp:** en tydlig primärknapp per sida. Övriga knappar blir lugnare.
- **Sidfoten** visas bara under Mer/Inställningar, inte på varje sida.

## Etapper (var för sig, med bilder före/efter)
1. Mobilhuvud, "Härnäst" och sidfot. Störst effekt, påverkar ingen sida inuti.
2. Gemensamt rubrikblock och bredder.
3. Flikar, knappar och avstånd, sida för sida.

## Skydd
Inga ändringar i data, lagring, synk, funktioner, adresser, Pace-sidan (godkänd) eller den godkända Mer-vyn. Ingen publicering. Kontroll görs på 360/390/430 px, surfplatta och 1280/1600 px, i ljust och mörkt läge och vid 200 % text.

## Tekniskt
- Gemensam sidmall bygger på befintliga `PacePage`/`PacePageTitle`/`PaceContent` (width reading/list/wide).
- Ändringar görs främst i layouten (sidhuvud, villkor för FlowCompanion, sidfot) och i styles.css. Sidor byter sin egen rubrik till PacePageTitle med ikon.
- Område och färg kommer från den befintliga sökväg→område-mappningen.
