# Ny struktur i MyFlove – navigation, Återhämtning och områden

Stor omstrukturering i kontrollerade steg. Inget raderas: funktioner som flyttas eller göms behåller sin data och sina adresser.

## Steg 1 – Huvudstruktur och navigation

Fem tydliga vägar i botten på mobilen och samma gruppering i sidmenyn på desktop:

```text
Översikt | Flow | Hälsa | Återhämtning | Mer
```

- **Översikt**: dagen/kalendern, logga energi och mående, batteriöversikt, nästa steg från Flow. Morgonstart visas här på morgonen, men får ingen egen huvudingång.
- **Flow**: Flow/chatt, planering, QuickFlow, anteckningar och mappar, idébank.
- **Hälsa**: energi och mående (dag/vecka/månad), snabbknapp för loggning, steg, vardagsmotion, vikt (går att dölja helt), träning med Träningsprogram inkl. "Skapa mitt pass med Flow", rutiner, medicinpåminnelser, Morgonstart.
- **Återhämtning**: egen huvudsektion (steg 2).
- **Mer**: Studier, Jobb, Familj/relationer/barn, Hem, Insikter, Avancerat.

"Veckoplan" tas bort som egen sektion och ersätts inte. Adressen leder vidare till Översikt.
Träning och passbyggaren får inga egna toppnivåer.

## Steg 2 – Återhämtning

- **Paus**: en enda pausfunktion där man väljer tid – 5, 10, 20, 30, 60 minuter eller egen tid. Mikropaus och Akut Lugn försvinner som separata val; den befintliga lugna pausupplevelsen återanvänds som motor.
- **Stopp-knappen**: behålls som egen, lättillgänglig funktion med samma logik, och avslutas med ett enda lugnt nästa steg.
- **Ljusboost**: behålls som den är visuellt.
- Efter avslutad paus och avslutad Ljusboost: en snabb fråga "Hur känns energin nu?" med mer / oförändrat / mindre, som sparas i befintlig energilogg. Ett tryck, alltid möjligt att hoppa över.
- Sektionen byggs så att fler återhämtningssätt kan läggas till senare utan ombyggnad.

## Steg 3 – Områdena in i rätt sektion

- **Studier**: förenklas till nästa steg, deadlines, uppgifter, bryt ner, börja nu. Befintliga studieverktyg finns kvar men längre ned.
- **Jobb**: förenklas till uppgifter, möten, arbetspass, deadlines, nästa steg.
- **Familj/relationer/barn**: en sektion med inbjudan, valbar gemensam kalender och egna val för vad som delas.
- **Hem**: behålls; matplaneringen får val av måltidstyper (frukost, lunch, middag, mellis, kvällsmål) som sparas till nästa gång.
- **Insikter**: "Mönster" byter namn till Insikter och bygger vidare på befintlig funktion. Beskrivande observationer – inga omdömen eller medicinska slutsatser.
- **Avancerat**: lämnas orört.

## Energi som gemensamt lager

Befintlig energiloggning återanvänds. Aktiviteter i träning, återhämtning, studier, jobb, hem och familj kan kopplas till samma energi-/måendedata. Inget nytt analyssystem byggs nu.

## Teknisk lösning

- Navigationens grupper i `src/components/layout.tsx` skrivs om till de fem sektionerna; befintligt visuellt språk behålls.
- Nya samlingsvyer återanvänder befintliga sidkomponenter som innehåll – inga dubbletter av logik eller data.
- Gamla adresser behålls och leder till rätt ny sektion.
- Pausval, dolt vikt-block och måltidstyper sparas via befintlig molnsynkad lagring.
- Kontroll: TypeScript, tester, build samt 360/375/390/430 px och desktop. Changelog uppdateras.

## Leverans

Arbetet görs i tre omgångar (navigation → Återhämtning → områdena) så att appen fungerar efter varje steg.
