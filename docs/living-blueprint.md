# Paceable Living Blueprint
Version 5.1 · 12 oktober 2026

## 1. Syfte och produktläge
Paceable hjälper människor att bära mindre i vardagen: samla det som snurrar, se dagens plan och anpassa den efter egen ork. Produkten riktar sig särskilt till människor som upplever svårigheter med igångsättning, överblick och kognitiv belastning, inklusive personer med ADHD och annan NPF.

Den här utgåvan beskriver webbappen och ändringarna i PR #33–36. Tidigare MyFlove-blueprints bevaras som historiska utgåvor. Äldre visioner är inte bevis på att en funktion fungerar idag.

De viktigaste sex förbättringarna är sammanhängande navigation, enklare vardagsloggning, nyanserad energipåverkan, redigerbar energihistorik, tillförlitligare dokument- och notislänkar samt en gemensam ram för offentliga sidor.

Paceable är ett stöd för egen planering och reflektion. Registrerad energi är användarens bedömning. Produkten gör inga anspråk på att mäta fysiologisk energi eller ge medicinsk effekt.

## 2. En lugn väg genom vardagen
Idag samlar dagens aktiviteter och registrerade kapacitet. Kalendern ger månadsöverblick och dagsplan. Fånga samlar tankar och uppgifter; i enklare språk kan ingången heta Skriv av dig. Min plats samlar personliga stödytor. Mer ger tillgång till övriga områden.

Lägg till skiljer en framtida plan från något användaren redan har gjort. Snabbregistrering börjar med en vald aktivitet och följs av en frivillig fråga om hur den kändes. En manuellt tillagd aktivitet som sparas som redan gjord visar frågan direkt.

Pace-chatten ger en ingång till stöd kring nästa steg. Planändringar kräver användarens godkännande. Återhämtning skapar inte automatiskt fler uppgifter.

Barnens kalender kan visa behörigt familjesammanhang. Det sammanhanget räknas inte som förälderns egen tidsåtgång eller belastning utan uttrycklig egen närvaro. Barnscheman behåller sina egna identiteter och behörigheter.

## 3. Personlig energi med tydliga gränser
Användaren kan registrera energi från 0 till 100 procent. Idag, kalendern och batteriet använder samma registrerade kapacitet. Noll procent visas som ett tomt batteri. Ett procenttal är en självskattning, inte en objektiv mätning.

Aktivitetsfrågan erbjuder Gav lite energi, Gav energi, Tog lite energi, Tog energi, Både och, Ingen skillnad och Vet inte / hoppa över. Små förändringar sparas som små observationer. Både och behandlas inte som en förlust, och ett överhoppat svar skapar ingen energifaktor.

En observation som gav eller tog energi idag kan följas av ett märkt förslag att justera batteriet. Standardförslaget är fem procentenheter; det är ett gränssnittsförslag och ingen personlig eller fysiologisk omräkning. Batteriet ändras först efter ett uttryckligt godkännande. Användaren kan också finjustera procenttalet. Utan registrerad kapacitet används den vanliga incheckningen.

Historiken kan öppnas för idag, igår eller ett valt datum. Påverkan och styrka kan rättas i samma post. Att rätta historik ändrar inte dagens batteri. Datum utgår från användarens lokala dag och hämtningen hanterar fler poster genom paginering.

Framtida kapacitet är okänd tills den registreras. Sekundära uppskattningar och kvalitativ planbelastning ska vara tydligt åtskilda från egen registrering. Aktivitetsmängd, startmotstånd eller återhämtning får inte ensamma bli en ny energimätning.

## 4. Tillit, dokument och påminnelser
Kontobunden data, befintlig kryptering och synk ska bevaras när gränssnittet förändras. Kontobyten måste avbryta gamla hämtningar och rensa tillfälliga energiförslag. En pågående formulärtext ska inte skrivas över av en bakgrundsuppdatering.

Privata barn-, studie- och jobbdokument öppnas via tidsbegränsade signerade länkar. En flik reserveras vid användarens klick för att minska popupblockering. Fel och blockering visas i appen; en hämtning som tillhör ett tidigare konto får inte öppna dokumentet efter kontobyte.

Webbläsarnotiser leder till appens egen domän och bevarar relevanta avsnittslänkar. Påminnelser och native-notiser följer befintliga uttryckliga val, behörigheter och tyst läge. Publicering av webbappen installerar inte ett nytt iOS- eller Android-bygge.

Inga nya schema-, kontobehörighets- eller delningsändringar ingår i PR #33–36. De här förbättringarna förändrar främst presentation, navigering och robusthet i befintliga flöden.

## 5. Uttryck och publicerade förbättringar
Godkänd Paceable-logotyp och stenmotiv är produktens visuella ankare. Appens typografi använder Fraunces för rubriker och Lora för aktiviteter, lästext och kontroller. Lugna ytor, tydliga val och tillgängliga tryckytor ska göra det lättare att välja nästa handling.

Startsidan, Om oss och ADHD-guiden delar nu meny, logotyp, språkval och sidfot. Funktionen-länken leder till startsidans avsnitt även från undersidor. Svenska och engelska använder samma offentliga sidram.

PR #33 samordnar navigation, vardagsloggning och namn, inklusive små energiförändringar och direkt energifråga för redan gjorda aktiviteter. PR #34 inför datumstyrd, redigerbar energihistorik och korrekt tomt 0-procentsbatteri. PR #35 förbättrar privata dokumentflikar och notislänkar. PR #36 samlar de offentliga sidorna i samma ram.

## 6. Validering och nästa steg
Riktade tester, produktionsbygge och typkontroll är godkända för de fyra etapperna. Energiflöden, historikhämtning, kontoskydd, dokumentöppning, notislänkar och den gemensamma offentliga sidramen har automatiska kontroller. 32 befintliga statiska pitch- och blueprintfiler har klarat lokal filintegritetskontroll.

Kvarvarande kontroller omfattar verklig öppning av privata dokument, fullständig nedladdning av arkivfiler i produktionsmiljön och notistryck på fysiska iOS- och Android-enheter. Dessa ska följas upp separat; lokala tester ersätter inte fysisk verifiering.

En pilot bör undersöka upplevd kognitiv belastning, hur lätt det är att börja, planens rimlighet och känslan av kontroll. Detta är planerade utvärderingsfrågor. Inga användarresultat eller medicinska effekter redovisas som uppmätta här.

Pitchbilderna från 12 oktober visar den riktiga webbappen med demokontots exempeldata: Idag, månadskalender, dagsplan, snabbregistrering, energipåverkan och batteri. Exemplet 65 procent är en vald självskattning för demonstrationen. Bilderna illustrerar produkten och är inte användarstatistik eller evidens för effekt.

Källor: CHANGELOG.md, docs/quick-personal-energy.md, AGENTS.md, berörda komponenter och tester i PR #33–36 samt demokontots synliga webbgränssnitt. Changelog är ändringshistorik; denna blueprint är den aktuella produktbeskrivningen.
