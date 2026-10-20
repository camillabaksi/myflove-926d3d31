# Samma kompakta layout på resterande appdelar

## Mål
Fortsätt den tidigare layoutplanen: samma rubrikblock, lugna valrader, tydliga huvudknappar och tätare avstånd på återstående sidor. Behåll befintliga områdesfärger, bakgrundsdetaljer och typografi — ingen ny designriktning.

## Genomförande i grupper
1. **Vardagsverktyg:** Uppgifter, Ekonomi, Inköpslista, Matlista, Städning, Jobb och Studier. Samma rubrikplacering och kompaktare sektioner. Befintliga filter och flikar får samma valstil där de har samma funktion; projektmappar och specialverktyg behåller sina egna betydelser.
2. **Familj och personliga inställningar:** Barn, Familj, Familjeflöde, Relationer, Min situation/livsprofil och Anpassa. Samma rubrikblock och läsbar formulärbredd; befintliga personval, delningsval, öppna formulär och utkast bevaras.
3. **Hälsa, fokus och fördjupning:** Rutiner & medicin, Mående, Energikarta, Energiflöde, Träning, Pomodoro, Stopp, veckosammanfattning och personlig statistik. Samma sidram och sektionsavstånd; diagram, timers, träningspass och registreringsformulär behåller innehåll, betydelser och funktioner.
4. **Övriga djupsidor:** granska befintliga hjälp-, äldre-, administrations- och investerarsidor och anpassa deras sidrubriker/avstånd där den gemensamma mallen passar. Behörighetsstyrda vyer kontrolleras med befintlig behörighet; inga borttagna funktioner återinförs.

List- och formulärsidor får läsbredd; sidor som behöver jämförelser eller två spalter behåller bredare arbetsyta. Kompakt betyder inte mindre text eller mindre tryckytor: knappar och val ska fortfarande vara minst 44 × 44 px.

## Kända gemensamma layoutfel
- Rätta sidomenyn som upptar för stor del av surfplattan vid stor text. Använd befintlig mobilnavigation när innehållet annars inte får användbar bredd; normalt datorutseende och länkar bevaras.
- Rätta rubrikkontrasten i det gemensamma rubrikblocket i mörkt läge och förhindra bokstavsvis radbrytning. Behåll godkänd typografi och temafärger.

Dessa två rättningar berör den gemensamma presentationen och kontrolleras därför även på redan godkända sidor.

## Skyddade vyer och funktioner
- Pace-sidans godkända bildmiljö/chatt och Mer-vyn görs inte om.
- Idag, Kalender, Fånga och reflektionsboken granskas för gemensamma layoutregressioner men får ingen ny sidlokal design. Kalenderns tidsgeometri och anteckningsbokens papperslayout är låsta.
- Inga ändringar i texter utöver befintliga dekorativa rubrikstreck, innehållsordning, funktioner, beräkningar, registreringar, aktivitetsval eller automatiska förslag.
- Navigation, person-/familjeval, privata uppgifter, kontoseparering, sparning, synk och behörigheter bevaras. Ingen databas-, auth-, native-, domän- eller paketändring.
- Den offentliga landningssidan och filmer/dokument ingår inte. **Ingen publicering.**

## Kontroll och redovisning
- Ta tillförlitliga före-/efterbilder efter att sidövergången är klar, med befintligt konto och utan testskrivningar i privata data.
- Kontrollera varje ändrad sida vid 360/390/430 px, surfplatta 768 px och dator 1280/1600 px, båda teman och normal/200 % text.
- Granska verklig läsbarhet, kontrast, radbrytning och överlapp — inte enbart frånvaro av horisontell sidscrollning.
- Öppna befintliga formulär/dialoger och prova flikar, filter, tillbakalänkar och avbryt. Kontrollera att osparade utkast består; inga kontoval eller aktiviteter sparas som del av bildkontrollen.
- Kör befintliga tester för ändrade beteendeytor och kontrollera det automatiska bygget. Redovisa äldre testfel separat utan att ändra funktioner för att uppfylla föråldrade tester.
- Uppdatera båda ändringsloggarna och lämna en per-sida-lista över genomförda ändringar, bilder och eventuella blockerade kontroller. Fysisk mobil och verklig OS-textförstoring anges som ej verifierade om enheter saknas.

## Tekniskt
Återanvänd `PacePageHeader`, befintliga breddvarianter och opt-in-klasserna `.pace-ds.pace-compact-page`, `.pace-compact-stack`, `.pace-segmented` och `.pace-segment`. Befintliga Radix-flikar, länkar och knappar behåller sina tillståndsägare och anrop. Undvik globala selektorer som gör om alla formulär, kort eller rubriker. Gemensamma sidomeny-/rubrikrättningar avgränsas till befintligt appskal och Pace-rubrikblock. Dokumentera strukturella regler i `AGENTS.md` och granskningsresultat i `docs/`.