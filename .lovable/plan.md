# Paceable – prototypplan för följeslagaren Pace

## Resultat av inventeringen

**Rekommendation: börja med alternativ B, en isolerad 2D-prototyp med bild 2 som exakt visuell förlaga.** Det bevarar identiteten bäst och kräver minst resurser. Alternativ A ger verkligt djup och föränderliga kontaktskuggor, men kräver ny, separat godkänd modellering.

**Referenserna är nu granskade:** bild 1 (`a_clean_soft_pastel_friendly_ui_illustration_co.png`, 1536 × 1024 RGB) styr endast känslan av naturligt material, mjukt ljus och lugn närvaro. Bild 2 (`Paceable_stensymbol.png`) är exakt förlaga för former, färger, proportioner och stapling. Bild 1:s sidoordnade formationer, ljusbågar, glitter, växter, fem tillstånd och prestationscopy som ”när du gjort något” överförs inte. Den visar stillbilder, inte verifierad rörelse.

Ingen appkod, bild, funktion eller publicering ändras i detta steg. Ingen maskot skapas nu.

## 1. Tillgängliga stenfiler

| Källa | Innehåll | Begränsning/användning |
|---|---|---|
| **Bild 2: `Paceable_stensymbol.png`** | **235 × 200 RGB**, staplade originalstenar med ljus bakgrund och markskugga | Exakt visuell förlaga enligt senaste beslutet. Sammansatt bild, ingen transparens eller separata lager. Lämplig för en liten första originaltrogen demonstration, inte stor skarp presentation. |
| Godkänt `Paceable_Lovable_korrigerat_paket.zip`: `symbols/paceable-stones-exact-1024.png` | 1024 × 1024 RGBA, transparent bakgrund; salviagrön underst, persika i mitten, lavendel överst | Tidigare godkänt original, **en sammansatt rasterbild**, inte tre lager. Visuellt samma typ av stapling; pixelidentitet med nya bild 2 är inte verifierad. Används inte automatiskt i dess ställe. |
| Samma ZIP: `symbols/paceable-stones-trimmed.png` | 684 × 727 RGBA | Samma symbol med borttagna transparenta marginaler, inte en ny formation eller separat stenresurs. |
| `src/assets/paceable-brand/paceable-horizontal-{light,dark}.png.asset.json` | Godkända liggande logotyper; originalbilder 1861 × 695 RGBA | Text, slogan och stenar i samma bild. Helt oförändrade; inte animationskälla. |
| `src/assets/paceable-brand/paceable-compact-{light,dark}.png.asset.json` | Godkända kompakta logotyper, 1287 × 470 respektive 1277 × 465 RGBA | Logotyper, inte frilagda stenar. Lämnas oförändrade. |
| ZIP: ljusa/mörka appikoner samt `public`-ikoner | Storleksanpassade symboler med bakgrund | Inte separata stenar; favicon/PWA/native lämnas orörda. |
| `src/assets/paceable-stones.png` | 1425 × 546 RGBA; realistisk illustration med tre stenar **bredvid varandra** | Redan låst på Idag. Andra former/proportioner och arrangemang än varumärkets staplade original. Ska varken ersättas, animeras om eller användas som en alternativ Pace-modell. |
| `PaceableStones` standard-SVG | Tre förenklade stenformer | Inte originalsymbolen och inte en fotorealistisk modell; inget substitut för Pace. |

**Inga tre separat godkända stenlager, 3D-modeller eller materialkartor har hittats i det godkända paketet.** Originalsymbolen har redan stenstruktur, ljus och kontaktpartier inbakade i bilden. PNG-upplösningen är inte ett mått på tredimensionell detalj eller vektorkvalitet.

**Källbegränsning för bild 2:** dess bakgrund följer med vid visning i mörkt läge. Första demonstrationen kan visa den oförändrad på en avgränsad ljus yta i båda teman; det är inte en färdig integrerad mörkerlösning. För skarp, fristående Pace behövs en högupplöst transparent originalexport av exakt bild 2, eller uttrycklig bekräftelse att ZIP-symbolen får vara dess produktionskälla. Ingen AI-uppskalning, bakgrundsborttagning eller ny stenbild görs nu.

## 2. Teknikjämförelse

| Egenskap | A – gemensam 3D-modell | B – originalbild / godkända 2D-lager |
|---|---|---|
| Identitet | Kan närma sig originalets silhuett i en bestämd vinkel; dolda sidor och verklig volym är okända | Sammansatt original ger oförändrade bildpixlar, former och proportioner |
| Realism | Starkast för verklig volym, ljusrespons och kontaktskuggor under rörelse | Originalets fotografiska material/ljus bevaras i den befintliga vinkeln; ingen verklig ombelysning |
| Rörelse | Kontrollerad rörelse med trovärdig kontakt mellan stenar | Hel formation kan förflyttas mycket lite; separata rörelser behöver godkända lager |
| Nytt källmaterial | Kräver modellering av tre stenar och godkännande av fasta material, kamera och ljus | Originalet räcker för hela formationen. Separata lager kräver nya godkända exporter |
| Kostnad | Högre skapande- och granskningsinsats; eventuell realtidsvisning behöver ytterligare beroenden | Låg för hel formation; medel för separata lager och kvalitetssäkrade skuggor |
| Mobilprestanda | WebGL belastar GPU/batteri; ska laddas endast vid behov och alltid ha statisk fallback | Bild + små CSS-rörelser; inget nytt paket krävs, ingen kontinuerlig renderloop |

**En 2D-bild kan inte automatiskt bli en exakt 3D-modell.** Automatiskt genererad 3D eller generiska stenmodeller riskerar nya former, material och färger. Det är inte en godkänd genväg här. En modell behöver ytterligare vyer/mått eller manuell rekonstruktion och separat visuell acceptans. Exakthet för osynliga sidor kan inte utlovas med nuvarande material.

**2D kan inte heller garantera konceptets dynamiska realism.** Kontaktskuggorna mellan stenarna sitter i originalbilden. Separering/maskning skapar inte de dolda ytorna och kan ge dubbla skuggor eller glapp. Ingen automatisk friläggning, beskärning av stenformer eller AI-fyllning föreslås. En eventuell separat markskugga ska vara subtil, ha samma ljusriktning och granskas först; inte läggas in i originalfilen.

Om kravet senare blir verkliga rotationsvinklar eller förändrad belysning är A rätt teknik. En möjlig senare kompromiss är att rendera godkända rörelser från **samma** 3D-modell till lätta 2D-sekvenser: identiteten återanvänds utan WebGL i varje appvy, men modelleringen behövs fortfarande och filstorlek/transparens måste provas.

## 3. Högst fyra tillstånd

| Tillstånd | Förslag för första 2D-prototypen |
|---|---|
| Vilar | Statisk grundbild; ingen ständig rörelse behövs. |
| Hälsar | En kort, mjuk förflyttning av hela formationen som återgår till startläget. Ingen deformation eller hopp. |
| Lyssnar | Nästan omärklig förflyttning under aktivt samtal, utan blinkning, blick eller påhittad känslorespons. |
| Ger stöd | En enda långsam, varm rörelse när ett befintligt stödmeddelande visas; samma grundbild, inga belöningssignaler. |

Förflyttningarnas storlek och tid fastställs i prototypen, inte genom att ändra stenarna. Alltid samma slutposition. Inga poäng, behov, krav, glödshower, besvikelse eller bedömningar av mående/prestation. Inga ansikten, ögon, armar eller ben.

Systemets reducerade rörelse, appens befintliga stillaläge och följeslagarens befintliga rörelseval ska samtliga stoppa animation. Statiskt val finns alltid. Rörelse stoppas när vyn inte är synlig. Samtalsstatus förmedlas även med befintlig text, aldrig enbart genom animation.

## 4. Konsekvens och framtida återanvändning

- En gemensam visuell källa och en särskild följeslagarpresentation, föreslaget namn `PaceCompanionVisual`, med endast tillstånd, storlek och stillaläge som indata. Ingen ny lagring, chatt eller beteendemotor.
- Samma proportioner, formation, färger, ljusriktning och rörelsedefinitioner överallt; ingen AI-generering per scen och inga scenvisa figuralternativ.
- Mörkt läge ändrar omgivningen, inte stenarnas färger via filter. Granska transparenta kanter och skuggor på båda bakgrunderna.
- **Prata med Pace:** befintlig samtalsyta kan senare få den gemensamma presentationen utan ändringar av samtal, sparning eller åtgärder.
- **Utvalda stödmeddelanden:** ersätt endast bildpresentationen efter separat godkännande; behåll befintliga villkor, tystning, länkar och avvisning.
- **Min Pace:** den tidigare Min Flow-vyn är för närvarande avstängd. Prototypen får illustrera användningsfallet men återinför ingen sida. Rummets figur är inbakad i en scenbild och kan inte bytas med en liten bildersättning.
- **Idag:** endast en framtida möjlighet. Dagens låsta stenar, hälsningslayout och Din takt lämnas orörda; ingen extra följeslagare eller dubblering införs i denna prototyp.

Pace följeslagaren hålls åtskild från **Din takt** i namn och kod. Befintliga `DayPace`, `deriveDayPace` och `day-pace.ts` lämnas helt oförändrade. Tillstånden kommer från samtal/presentation, inte från Capacity eller nivåerna Varsamt/Jämnt/Utrymme. Tekniska Flow/MyFlove-namn, rutter, inställningsnycklar, data, auth, synk, notiser och native-projekt bevaras.

## 5. Minsta isolerade prototyp efter godkännande

1. Bild 1 är inspiration och bild 2 exakt förlaga. Godkänn B och liten oförändrad bild-2-demo; för större/transparant presentation krävs motsvarande originalexport eller godkännande av ZIP-källan.
2. Skapa en fristående lokal demonstrationsyta **utanför appens källkod och navigation**, under en temporär prototypmapp. Ingen anslutning till konto, data, familj, chatt eller publicerad app.
3. Visa samma originalbild i ljust/mörkt på små/stora ytor, statisk samt de fyra tillstånden. Befintlig logotyp visas bara som oförändrad referens om den behövs.
4. Kontrollera mobil/desktop, 200 % text i omgivande exempel, reducerad rörelse och statiskt val. Granska bildens skärpa, silhuett, färger, kontaktpartier och ljusriktning. Redovisa filstorlek och rörelseprestanda; fysiska iOS/Android-enheter behöver separat kontroll.
5. Visa skärmbilder och en kort inspelning för **visuellt godkännande**. Ingen integration eller maskotersättning följer automatiskt av teknikgodkännandet.

**Beslut att godkänna:** B med oförändrad bild 2 som liten första pilot, med ovanstående bakgrunds-/upplösningsbegränsningar. Separata stenlager, annan produktionskälla och 3D är senare, uttryckliga beslut. Ingen implementation eller publicering sker nu.