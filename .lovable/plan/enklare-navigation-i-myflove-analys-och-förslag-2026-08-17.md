# Enklare navigation i MyFlove – analys och förslag

## Vad som finns idag

Botten­menyn har fem platser: Hem, två användarvalda genvägar, QuickFlow-knappen i mitten och "Mer". "Mer" öppnar en helskärmsmeny som har tre olika lägen samtidigt:

- Enkelt läge (bara "essential"-sidor)
- Kategoriläge (8 kategorier: Din dag, Flow, Hälsa, Hemma, Familj, Studier, Jobb, Övrigt)
- Redigeringsläge för bottennav

I samma vy ligger dessutom sök, alarmljud, logga ut, radera konto och "Anpassa appen". Sidomenyn på desktop visar i stället _alla_ ~28 sidor på en gång som rutnät.

Problemen: bottennavet betyder olika saker för olika användare (två slots är fritt valbara), "Mer" har tre parallella lägen som konkurrerar, och Flow (assistenten) ligger nedgrävd i kategorin Flow trots att den ska vara nåbar överallt.

## Föreslagna ändringar

### 1. Fast huvudnavigation med fem vägar

Botten­menyn blir alltid: **Hem · Min dag · QuickFlow (mitten) · Flow · Mer**. Inga fritt valbara slots i själva navet – det byter man i stället i "Mer" (se punkt 4). Samma fem vägar visas som en lugn topprad på desktop, ovanför sidomenyn.

### 2. Min dag

Ny route `/min-dag` som visar dagens konkreta plan: dagens hållpunkter, dagens uppgifter, rutiner och FlowScore i kort form. Den återanvänder befintliga komponenter (dagens tidslinje, daglig fokus, uppgiftslista) – ingen ny logik.

### 3. Flow överallt och kontextmedveten

Flow-knappen i navet öppnar assistenten med ett sammanhang som säger vilken del av appen man står i ("du är i Studier"), så första förslaget passar platsen. Assistentsidan finns kvar som idag.

### 4. "Mer" blir en enda lugn vy

Ett läge i stället för tre: sökfältet överst, sedan de befintliga livsområdena som kort (Din dag, Hälsa, Familj, Jobb, Studier, Hemma, Flow, Övrigt). Inget försvinner. Under korten ligger en liten rad med "Anpassa appen", alarmljud och konto – hopfällt som en sekundär del, inte som likvärdiga val. Enkelt läge blir en filterknapp inne i vyn i stället för ett eget parallellt läge.

### 5. Hem svarar på "vad behöver jag veta nu?"

Hem behåller sina block men får en tydligare toppdel: dagens viktigaste sak, nästa händelse, FlowScore och ett Flow-förslag. Resten ligger kvar under, styrt av användarens egna val (block-ordning och genvägar fungerar som idag).

### 6. Sök finns kvar

Söket flyttar överst i "Mer" och söker som idag på både namn och förklaring, så man slipper klicka sig genom kategorier.

## Rörelse – lugnt, inte sterilt

- Navet: mjuk skala/färgtoning på aktiv flik, inget som pulserar hela tiden.
- Flow: subtil "andning" på knappen bara medan Flow tänker eller har ett nytt förslag.
- Klarmarkering: liten positiv respons (bock som växer fram, mjuk fade) när något blir klart.
- Övriga sidor: befintlig `page-enter`-övergång behålls oförändrad.

## Tekniskt

- `src/components/layout.tsx`: fast fem-vägs bottennav, sammanslagen "Mer"-vy, desktop-topprad.
- Ny `src/routes/_app.min-dag.tsx` + `src/pages/my-day.tsx` som återanvänder befintliga kort.
- Kontext till Flow via befintlig area-/route-information (ingen ny backend).
- Befintliga routes, funktioner och användarval rörs inte – bara hur man tar sig dit.
- CHANGELOG.md och `src/lib/changelog.ts` uppdateras.
