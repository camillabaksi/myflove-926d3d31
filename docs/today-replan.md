# Få ihop dagen

Idag visar en frivillig ingång under Din dag. Den öppnar ett granskningsbart förslag, med val per ändring och ett separat godkännande. Ingen plan skapas eller lagras genom att bara öppna dialogen, avbryta eller ändra ett kapacitetsval. Bekräftelseknapparna är kvar under den rullbara förslagsytan.

## Kapacitet

- TodayContent läser `useDayCapacity` en gång och skickar samma procent som visas i TodayCapacity. Senaste tidsstämplade energilogg eller morgonregistrering gäller enligt befintlig dayCapacity-logik.
- Vid låg loggad kapacitet enligt den gemensamma capacityTone kan användaren välja ett litet första steg på en egen uppgift. Procenten ändras inte, översätts inte till minuter och används inte för att uppskatta framtida ork.
- Användaren kan avmarkera kapacitetsunderlaget. Saknad kapacitet förblir okänd och hindrar inte tidsförslag eller egna val. 0 % är ett riktigt värde.
- Hög kapacitet fyller aldrig på dagen med nya uppgifter. Den befintliga FlowPlan-/kapacitetslägesmodellen skrivs inte om eller ändras.

## Förslag och avgränsning

1. Tidsförslag gäller egna, ej färdiga uppgifter i dagens behöriga kalenderprojektion. Start och sluttid måste vara kända, och en krock måste gå att konstatera. Förslaget använder bara luckor mellan kända tider och lämnar en uttalad marginal på 15 minuter på båda sidor. Marginalen är ett planeringsförslag, ingen uppskattning av verklig restid.
2. Alla andra originaltider, samt redan föreslagna nya intervall, reserveras. Därmed bygger inget förslag på att användaren också måste godkänna ett annat. Delmängder av förslagen fungerar; kända beroenden kontrolleras mot både ursprungliga och föreslagna tider.
3. Okänd längd, väntande eller misslyckad hämtning av barn-/familje-/extern kalender får inte bli en påstådd fri lucka. Statiska tidsförslag uppdateras efter nytt underlag, inte under en pågående granskning.
4. Barnens kontext tar inte föräldratid. Uttrycklig föräldranärvaro reserverar registrerad förberedelse och resa. Länkade föräldrauppgifter ändras inte och deras koppling får inte dölja barnhändelsens reserverade tid.
5. Bokningar, omsorg, hälsa, påminnelser, explicita deadlinepåminnelser, kurskopplade/genererade uppgifter och QuickFlow-länkade uppgifter skyddas. Väntande, färdiga, framtida, passerade eller redan förfallna tidsuppgifter flyttas inte automatiskt.
6. Användaren kan separat ange vilka lågprioriterade egna uppgifter som får vänta. Detta är ett uttryckligt val att ändra uppgiftens datum; befintligt dueDate är också appens planeringsdatum och kan inte säkert klassas som flyttbart automatiskt. Konsekvenskänsliga uppgifter och kända beroenden undantas. Morgondagen får ingen föreslagen tid eller uppskattad kapacitet.
7. Ett mindre första steg läggs bara till efter val och godkännande, på den befintliga uppgiften utan att ändra titel, datum, energiskattning eller befintliga delsteg. Inga nya uppgifter eller pauser skapas som belöning för energi/återhämtning.

## Sparning och integritet

- Förslaget hålls i komponentens minne, inte i en extra lokal plan eller ny databas.
- Kontot, datumet, senaste taskvärdet och förslaget kontrolleras igen vid godkännande. Uppgifterna uppdateras atomiskt i samma useTasks/useCloudSyncedStorage-väg som vanliga redigeringar. Förändrat underlag avbryter innan någon rad ändras.
- Befintliga ID:n, anteckningar, bilagor, slutförandestatus och andra uppgifter bevaras. Kontobyte stänger förslaget, och ett gammalt kontos förslag får aldrig skrivas till ett nytt konto. Midnatt kräver en ny dagsvy.
- Ingen privat kalender-/hälsoinformation skickas till en AI-tjänst. Befintliga anonymiserade händelsetyper `planning_viewed` och `day_replanned` använder bara källa och antal, aldrig procent, uppgiftsnamn eller ID:n.
- Godkänd omplanering räknas som en konkret planeringshandling i pilotstatistiken, inte som bevis för förbättrad ork eller nytta.
