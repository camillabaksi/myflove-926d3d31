# Paceable – gemensam visuell standard efter fullständig inventering

## Resultat och gräns
Inventeringen omfattar alla 53 sidfiler, 62 appadressfiler (45 innehållsadresser och 17 omdirigeringar), offentliga sidor och gemensamma formulär, dialoger, diagram och navigation. Rapporten redovisar varje vy, källhänvisningar, färger, återanvändning och risker. Kodfynd skiljs från ny respektive tidigare visuell kontroll.

Ingen appkod, funktion, data, auth, behörighet, beräkning, synk, kryptering, domän, nativekonfiguration eller publiceringsinställning har ändrats. Genomförandet väntar på uttryckligt godkännande.

## Gemensam målbild
- Behåll Paceables varma ljusa bas och lugna mjuka identitet; mörkt tema med samma tydliga roller.
- Använd befintlig senare plommonroll **#512654** för primära handlingar och orientering; bakgrund **#FAF8F5**, yta **#FDFCF9**, upphöjd yta **#FFFEFC**. Sekundär text **#716576**, valt underlag **#EFE5F0**. Mörka motsvarigheter från befintlig palett.
- #4F2753 är ett tidigare ungefärligt förslag; #512654 är faktiskt nuvarande lokal CSS. Ingen ny färgriktning eller global omfärgning föreslås.
- Fraunces endast för uttrycklig orienterande rubrik, Inter för funktionell text. Fasta rem-roller och naturlig brytning; ingen viktig textminskning eller ellips.
- Mobil sidmarginal normalt 16px, 24px på tablet och 32px på desktop. Dokumenterade breddroller 42rem för formulär/läsning, 52rem för listor och 60–72rem för bred analys.
- Gemensam avståndsskala 4/8/12/16/20/24/32/40px i rem. Standardkort 24px radie och innehållsstyrd höjd; 16px mobilpadding och 20–24px där större yta behövs.
- Kompakt knapp/valyta normalt 36–40px, personval 32–36px, verklig tryckyta minst 44×44px utan överlapp. Primär, sekundär, diskret och destruktiv roll.
- Formulär med riktiga etiketter, kopplad hjälp/feltext, gemensam fältroll och befintliga native datum-/tidväljare där de behövs. Dialoger med 44px kryss, synligt fokus och tema även i fristående dialoglager.
- Områdes-/person-/statusfärger och Capacity/Pace-betydelse hålls separat från dekoration. Kontrastbrister i befintlig röd/gul normaltext rättas först i isolerade exempel; mörka statuspar måste också kontrolleras.

## Återanvändning
Behåll BrandLogo, godkända stenar/navsymboler och befintliga UI-kontroller. Använd PacePageTitle/Heading, PaceSection/Card/Block, PaceButton/Field/Input/Choice/Switch/Actions/Status/DialogContent som tunna presentationsmönster. MyFloveBlock, ExpandableBlock och CollapsibleSection behåller innehåll och sparade öppet/stängt-nycklar. Diagram återanvänder befintligt bibliotek och text-/tooltiproller utan nya beräkningar.

## Små etapper
| Etapp | Leverans | Risk |
| --- | --- | --- |
| 1 – rekommenderad första kodetapp | Befintlig designreferens, semantiska alias och dokumenterade kompakta kontroll-/kort-/dialogroller, endast explicit aktivering. Inga kontosidor konverteras. | Låg–medel: CSS-kaskad och dialogtema; skyddade ytor jämförs före/efter. |
| 2 | Bekräftade mobilproblem på Om oss/juridik/guide och registreringens trånga juridiska länkar; kontrastroller i godkända användningar. | Medel: authhandlers, juridiskt innehåll och redirectmål måste bevaras. Zoom-/safe-area-frågan kräver separat beslut. |
| 3 | Städning och Matlista i en liten grupp, därefter Ekonomi separat; återstående vardagsformulär endast efter faktisk öppnad kontroll. | Medel: utkast, datum/tid, listdelning och belopp/formler. |
| 4 | Fördjupad hälsa/historik/diagram, därefter Träning/timer separat. | Medel–hög: delade underpaneler, axeltext och specialgeometri. |
| 5 | Profil/Livsprofil, Anpassa och hemskärmsanpassning i separata grupper; rumsbilder utanför. | Hög: känsliga fält, omedelbar sparning och bildbundna funktioner. |
| 6 | Arbete/Studier/Samtal/Anteckningar var för sig. | Medel–hög: inbäddade moduler, import/AI/konvertering och befintlig idéflytt. |
| 7 | Enbart presentation för familj/barn efter auktoriserad visuell kontroll. | Hög: read-only, ägarskap, mottagare och personfärg. Inga behörighetsändringar. |
| 8 | Godkänd synlig copy/titlar och specialvyer/status; inte global namnbyte. | Medel: juridik, notiser, export, historiskt material och kollapsnycklar. |
| 9 | Slutlig Android/iOS/webbkontroll med fysisk telefon, stora systemtexter, tangentbord och skärmläsare. | Hög verifierings-/enhetsberoenderisk; build/publicering separat. |

Godkännande bör omfatta **etapp 1 först**, inte en obegränsad omdesign. Varje följande grupp kräver tydlig avgränsning och verifiering innan nästa.

## Skydd
Idag, Kalender, Fånga, Min plats och Mer är godkända jämförelseytor, inte masskonverteringsmål. Mer behåller nuvarande utseende/hierarki/länkar. Inga ändringar av kalender-/draggeometri, namn-/captureformulär, Capacity/Load/Pace, FlowScore, familj, notiser, sparning, auth, lagring, native-IDs/serveradress, domäner eller godkända originalbilder. Inga nya paket. Ingen publicering.

## Verifiering per godkänd etapp
360/390/430/768/1024/1280/1440px samt 320px som stresstest; ljust/mörkt, 100/200% text, långa namn/etiketter, öppna fel/dialoger, tangentbord/fokus, 44px faktiska mål, kontrast och reduced motion. Före/efter-bilder och riktade save/draft/collapse/undo-regressioner, relevant befintlig svit och automatisk byggkontroll. Fysisk mobil/assistiv teknik redovisas som ej verifierad tills den verkligen testats.

Ny analysverifiering täcker offentliga sidor och designreferens; alla kontoformulär är kodinventerade men inte nybildgranskade. Diagram med faktiska loggar och skyddade familjvyer behöver auktoriserat testunderlag. Ingen sådan kontroll får skriva verklig användardata.

## Tekniskt upplägg
Behåll nuvarande HSL-format och Tailwind v4; HEX i rapporten används för beslut/inspektion, inte färgformatsmigration. Samla semantiska alias i befintlig CSS och välj dokumenterad prioritet mellan kategori-, Pace- och kompaktroller. Aktivering uttrycklig; globala primitives oförändrade i första etappen. Inga wrappers som remountar formulär eller ändrar persistenta nycklar.

Grund/referens: liten–medelstor insats. Full app: större insats, främst för öppna tillstånd och verifiering. Gemensamma mönster först, små sidgrupper sedan; inga nya bilder eller beroenden behövs.