# Paceable – fyra avgränsade rättningar

Ingen redesign eller publicering. Ikoner, färger, stenbild, fem huvudval, Core, familj, lagring och sidfunktioner bevaras.

## Rättningar
1. **Mer och fokus:** Escape och krysset återför fokus till öppningsknappen. Navigering via en länk stänger panelen utan att återföra fokus till den gamla menyn; fokus följer den nya sidans innehåll enligt befintligt mönster.
2. **200 % text:** tillåt menynamn att radbrytas och låt rader växa. Ingen minskning av användarens textstorlek; samma menybredd och huvudval.
3. **Enkelt läge:** desktop-Mers områden använder samma befintliga essential-markering och inställning som mobilens Mer. Sökningen följer mobilens befintliga beteende; inga nya etiketter eller inställningar.
4. **Hälsning:** balansera responsiva radbrytningar i långa namn, utan kapning eller ellips. Behåll typsnitt, textstorlek och de tre stenarnas bild, storlek och placering.

## Teknisk avgränsning
Ändra endast nödvändiga meny-/hälsningsdelar, eventuella lokala stilar och riktade tester. Dokumentera i AGENTS.md, roadmap och båda changelogs.

## Verifiering
Testa fokus efter Escape, kryss och sidbyte, tangentbordsnavigation, normalt/enkelt läge samt fullständiga namn och menynamn vid 200 % text. Kontrollera 360, 390, 430, 768, 1024 och 1440 px; kör relevanta regressioner och befintlig testsvit. Bekräfta oförändrad stenbild och redovisa kvarstående begränsningar.
