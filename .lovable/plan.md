# Medicinpåminnelsen kl 10:00 – spårning

## Kort svar

Det är ingen förvarning och ingen tidszonsbugg. Du har **två Elvanse-poster** i medicinlistan: en gammal **"Elvanse 50mg kl 10:00"** och din nya **"Elvanse 50 mg kl 11:30"**. Båda schemaläggs som separata pushnotiser.

## Vad databasen visar

Köade, oskickade notiser på ditt konto:

```text
med:40dwl7cm4:<datum>:10:00   💊 Elvanse   "50mg – kl 10:00"    10 st, t.o.m. 2 sep
med:6hh0xoqp5:<datum>:11:30   💊 Elvanse   "50 mg – kl 11:30"
med:5e6klu8dl:<datum>:06:15   💊 Morgonmedicin
```

`deliver_at` för 10:00-posten är 08:00 UTC = 10:00 svensk tid, alltså korrekt omräknat. Ingen offset, ingen fallback-tid, ingen hårdkodad standardtid (det finns ingen "10:00" i koden).

## Svar på dina frågor

1. **Vilken kod skapar 10:00-påminnelsen?** `src/hooks/use-reminder-sync.ts` (medicin-loopen som lägger 14 dagar framåt) → `syncReminder` i `src/lib/push.functions.ts` → raden i `push_reminders` → utskick av `src/routes/api/public/hooks/push-tick.ts`.
2. **Vilken tid tror appen att medicinen är?** Både 10:00 och 11:30 – två skilda medicin-ID:n med olika tider.
3. **Standard, fallback eller förvarning?** Ingetdera. Medicinnotiser skickas exakt på tiden (ingen lead-tid finns för medicin). 10:00 kommer från gammal data.
4. **Andra källor?** Ja, i teorin tre: (a) medicinlistan, (b) Rutiner (`myflove-routines` – tom just nu), (c) kalenderpåminnelser (du har t.ex. "Dricka ett glas vatten kl 05:00"). Ingen av dessa skapar dubbletten just nu – det gör medicinlistan.
5. **Varför gick den inte bort när du trodde att du tagit bort den?** Medicinlistan sparas **bara i localStorage** (`myflow-medications` i `src/hooks/use-data.ts`), inte i molnet. Om 10:00-posten togs bort på en annan enhet/webbläsare finns den kvar på den enhet som ursprungligen synkade, och avbokningen körs bara från den enheten. Redan köade rader i `push_reminders` avbokas dessutom bara medan appen är öppen på just den enheten.

## Rekommenderad minimal fix (när du säger till)

1. Öppna Rutiner & medicin på den enhet du använder och ta bort Elvanse-posten med tiden 10:00 (behåll 11:30). Med appen öppen avbokar synken de 10 köade 10:00-notiserna automatiskt.
2. Om posten inte syns på den enheten: avboka de 10 raderna direkt i databasen (`canceled_at` på `client_key like 'med:40dwl7cm4%'`).

## Rekommenderad varaktig fix (större, valfritt)

- Flytta `myflow-medications` + medicinloggen från `useLocalStorage` till `useCloudSyncedStorage`, så att medicinlistan är densamma på alla enheter och borttagning slår igenom överallt.
- Låt `push-tick` hoppa över medicinnotiser vars medicin inte längre finns (kräver molnlagring enligt ovan).

Inget är ändrat – varken kod eller data.
