# Pace – teknikbedömning och plan för riktig 3D

## Rekommendation

**En specialmodellerad 3D-prototyp med tre separata, slutna stenmodeller, visad med React Three Fiber/Three.js.** Inte tre generiska ellipsoider, inte en bild på en plan yta och inte en ny AI-genererad stenbild. Den godkända transparenta `symbols/paceable-stones-exact-1024.png` är låst frontreferens; logotyp och befintliga appbilder lämnas orörda.

## 1. Teknik och nuvarande möjligheter

- Appen använder React 19 och Vite. Den har framer-motion men **saknar Three.js, React Three Fiber och drei**. Framer-motion kan inte ensamt skapa verklig 3D-geometri med fysisk ljusrespons.
- Bun, Python, NumPy och Pillow finns. Blender hittades inte på kommandosökvägen; någon färdig 3D-modell eller modellering av de tre originalstenarna finns inte i det granskade materialet.
- **Ja, riktig geometri kan skapas i miljön genom specialskriven, konturstyrd modellering.** Det är ny modellering med visuell iteration, inte automatisk exakt rekonstruktion. Kvaliteten kan inte lovas innan front- och sidobilder granskats.
- Första vägen behöver inget externt modellprogram. Om kontrollerad kodmodellering inte ger tillräckligt originaltrogna former/material pausas arbetet och behov av manuell Blender-modellering eller en 3D-formgivare redovisas; inget generiskt stenpaket ersätter originalet.

## 2. Efterlikna originalet utan att dölja osäkerhet

| Kan styras av frontbilden | Kräver modellering eller uppskattning |
|---|---|
| Synliga silhuetter, bredd/höjd, ordning och asymmetrisk stapling | Stenarnas djup, baksidor, undersidor och överlappade partier |
| Synliga kontaktlägen och lutningar | Kontaktgeometri vid rörelse och rotationspunkter |
| Salviagrön, persika och lavendel samt synlig materialkaraktär | Grundmaterialets färg skild från bildens inbakade ljus/skugga, mikroyta på dolda sidor |

- Anpassa individuella mjuka nät till synliga konturer och proportioner från referensen. Modellera avrundad volym och kontaktpartier; inga enkla standardformer lämnas som färdig modell.
- Referensbilden är sammansatt, inte tre godkända lager. Konturanalys för modellering ändrar inte bildfilen och används inte för att skapa en ersättningsbild.
- Använd en fast frontkamera för jämförelse och en lätt sidovinkel, ungefär 20–30 grader, för att avslöja verkligt djup. Frontkameran kalibreras mot originalets bildprojektion; full pixelidentitet under ny belysning är inte ett rimligt löfte.
- Matt, icke-metalliskt stenmaterial med subtil finstruktur och färgvariation. Gemensam kontrollerad studioljusmiljö, mjuka kontaktskuggor och inga effekter som glitter, ljusbågar eller glöd.
- Originalets ljus/skuggor ska inte bara klistras på modellen: då uppstår dubbla skuggor. Materialfärger och struktur behöver justeras visuellt mot referensen; exakt fysisk materialrekonstruktion från en enda bild är inte möjlig.
- Ingen omgenerering per läge, ingen ändring av originalsymbol/logotyp och inga ansikten, ögon eller lemmar.

## 3. Arbetsordning med visuell kontroll

1. **Efter teknikgodkännande:** skapa separat lokal prototyp under en temporär mapp, med egna beroenden. Inga paket, filer, rutter eller länkar läggs till i appen.
2. Skapa en statisk första modell: tre separata stenar, fasta material och kontrollerat ljus. Visa original och frontvy sida vid sida, plus lätt sidovinkel. Redovisa uppskattade delar och eventuella tydliga skillnader.
3. **Invänta visuellt godkännande av modellens form/material innan rörelser färdigställs.** Om likheten inte räcker: korrigera inom godkänd modellering eller rapportera behov av annat verktyg innan större ändring.
4. Färdigställ de tre lägena med samma modell och material; visa mobil/desktop, båda teman och statiskt val. Kort film och fristående demonstration levereras för nytt godkännande.
5. Ingen integration eller publicering ingår. Befintlig maskot, logotyper och illustrationer ersätts inte.

## 4. Lägen och rörelse

| Läge | Utförande |
|---|---|
| **Vilar** | Helt stilla i originalformationen. Rendering sker bara när kamera, tema eller storlek ändras. |
| **Hälsar** | Lavendelstenen lutar försiktigt kring kontaktområdet och återgår. Övriga två reagerar minimalt, utan studs, glapp eller deformation. Spelas en gång på uttrycklig knapptryckning i demon. |
| **Lyssnar** | Mycket små, långsamma individuella lutningar under simulerat aktivt samtal. Ingen verklig samtalsanslutning eller tolkning av användarens mående. |

Rörelser begränsas kring kontaktpunkterna och granskas från båda vinklarna för genomskärning/glapp. Kontrollerad animation, inte fysiksimulering; trovärdig tyngd är ett visuellt mål, inte en verifierad fysisk modell. Inga belöningar, behov eller prestationssignaler. Reducerad rörelse och manuellt stillaläge stoppar all rörelse och återställer originalformationen. Dold flik/vy stoppar rendering; utan WebGL visas en tydligt märkt statisk originalbild, inte påstådd 3D.

## 5. Tekniska detaljer och prestandabudget

- Föreslagna nya beroenden **endast i det fristående prototypprojektet**: `three`, `@react-three/fiber` v9, `@react-three/drei` v10 samt `@types/three`. Återanvänd React 19/Vite-versionerna. Inga fysik-, AI- eller eftereffektspaket.
- En versionerad modell med tre namngivna stennät, fasta material och rörelsedefinitioner. Möjlig GLB-export för senare återanvändning; ingen integration nu.
- Budgetmål, inte uppmätta resultat: totalt cirka 6 000–12 000 trianglar, högst 1K materialkartor vid behov, en liten delad detaljkarta, skuggkarta 1024 och pixelratio högst 1,5 på mobil.
- Rendering på begäran i stillaläge; begränsad uppdatering, preliminärt 30 bilder/sekund, endast när rörelse är aktiv. Ingen ständigt körande renderloop i Vilar.
- Mät faktisk filstorlek, triangelantal och renderbeteende efter bygge. Programvarurenderad webbläsartest verifierar utseende/funktion, inte fysisk mobilprestanda. iOS/Android måste bedömas på riktiga enheter innan framtida integration.
- Helt frikopplat från konton, lagring, chatt, Capacity, Din takt, familj, notiser och native-projekt.

## 6. Arbetsinsats och begränsningar

**Medel–hög insats jämfört med 2D.** Grov planeringsram: 1–2 arbetsdagar för statisk geometri/material och front-/sidogranskning, därefter cirka 1 dag för rörelser, kontroller och demonstration. Det är en uppskattning, inte en leveranstidsgaranti; visuella korrigeringar eller manuell extern modellering kan kräva mer.

Största osäkerheten är originaltrogen tredimensionell form/material från endast en vy, inte själva 3D-visningen. Inga osynliga sidor kan verifieras som exakta och ingen fysisk mobilprestanda är ännu uppmätt.

**Godkännandet gäller bara den isolerade 3D-piloten och dess separata beroenden. Första leverans blir statisk front-/sidomodell för visuell granskning; integration och publicering kräver egna beslut.**

Teknikbedömningen följer riktlinjerna i **3d-game**, med specialmodellering för den skyddade originalidentiteten i stället för generiska stenmodeller.
