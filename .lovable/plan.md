# Beslut – närmare din anteckningsboksbild

## Resultat
Fördelar & nackdelar blir en mjuk, personlig papperssida närmare din bild, inte ett formulär med verktyg under varje rad. Denna etapp gäller **Beslut**, inte hela Tankar eller resten av appen.

## Utseende
- Behåll ivory `#FAF9F6`, plum `#512654` och befintliga lavendel-/salvia-/aprikostoner genom lokala boktokens, med läsbara motsvarigheter i mörkt läge.
- Visa ämnet som stor, redigerbar handskrift utan framträdande inmatningsram. Använd det redan inlästa Caveat för ämne och punkter; ingen ny font eller global typografiändring. Detta är typad text i handskriftsstil, inte användarens verkliga handstil eller fri pennritning.
- Två rena spalter med diskreta salvia-/aprikosrubriker, små plusknappar och tunn avdelare. Papperets linjer blir mycket diskreta; inga tydliga digitala punktkort.
- Flytta punktverktygen till en tillgänglig meny ”Fler alternativ” vid varje punkt. Bevara viktig, stjärna, stryk över, flytt mellan spalter, ordningsflytt och borttagning. Aktiva markeringar syns fortfarande intill texten.
- Låt ”Osäkert än”, fokusläge och historik nås genom diskreta tydliga kontroller. Hjälpknappen placeras efter pappersspalterna; befintliga frivilliga frågor och egen eftertanke behålls.
- Mobil visar två spalter endast när texten får tillräcklig plats; vid smal bredd eller stor text används enkolumn/fokusläge utan att minska handstilen till mikroskopisk storlek. Kontroller har minst 44 × 44 px tryckyta.

## Avgränsning
- Bilden är en utseendereferens, inte en beställning av alla dess funktioner. Inga nya viktighetsskalor, färgval, sammanfattningsflöden eller AI-anrop införs här.
- Befintliga texter, poster, autosparande, versioner, synk och privata kontogränser bevaras. Ingen ändring av datamodell, backend, auth, navigation, native eller paket.
- Logotyper och godkända stenar ändras inte; referensens andra stenformationer kopieras inte. Referensbilden bäddas inte in i appen.

## Tekniska ändringar
- `src/components/notebook/decision-editor.tsx`: presentation och återanvändning av befintlig menykomponent för punktåtgärder.
- `src/components/notebook/notebook.css`: avgränsade Beslut-regler, utan påverkan på övriga bokdelar eller globala stilar.
- Nödvändiga isolerade presentationstester samt båda changeloggarna och roadmap uppdateras. Eventuella strukturella beslut dokumenteras i `AGENTS.md`.

## Kontroll och leverans
- Testa skrivning, punktmenyer, markeringar, spalt-/ordningsflytt och fokus; bevara befintliga sparanrop.
- Kontrollera 320/390/430 px och desktop, ljust/mörkt samt 200 % text: läsbara spalter, synliga fokusmarkeringar och ingen horisontell dokumentscroll.
- Visa före-/efterbilder med syntetiskt innehåll i isolerad bildsession, utan skrivningar i ditt konto.
- Kör relevanta tester och kontrollera automatiskt bygge. Bilder eller lokala tester räknas inte som verifierad molnsynk eller fysisk mobilkontroll.

**Ingen appkod ändras innan planen godkänts. Ingen publicering ingår.**