# Mindre och enhetligare storlekar i hela Paceable

## Mål
Använd din kalenderbild som riktmärke: lugnt, sammanhängande och lätt att överblicka. Gör normalstorleken något mindre och använd samma storlek för samma textroll genom **hela appen**, inte bara huvudsidorna. Rubriker ska fortfarande vara tydligt större än vanlig text.

## Föreslagen normalstorlek
Storlekarna nedan gäller vid standardtext och är gemensamma på mobil och dator, utan automatiskt större rubriker på breda skärmar:

| Textroll | Storlek |
|---|---:|
| Sidrubrik och hälsning | 24 px |
| Sektionsrubrik | 18 px |
| Mindre underrubrik/korttitel | 16 px |
| Brödtext och aktivitetsnamn | 15 px |
| Knapptext, val och formuläretiketter | 14 px |
| Förklaringar, kategorier och vanliga klockslag | 14 px |
| Korta sekundära uppgifter och navigationsetiketter | 12 px |

Behåll nuvarande typsnitt och vikter som igenkänning, men ta bort oavsiktliga storleksskillnader mellan motsvarande roller. Logotypen är en bild och ändras inte. Stora batterital, timers och diagramvärden behandlas som informationsvisning, inte som vanliga rubriker. Skrivfält behåller minst 16 px normalstorlek där mobilen annars zoomar in automatiskt.

## Alla sidor omfattas
- Idag, Hem, Kalender med alla vyer, Planera, aktiviteter och Uppgifter.
- Pace med chatt, förslag, historik och planering.
- Fånga/Tankar, Dagbok, Beslut, Tankekarta och Reflektioner. Papperskänslan och personlig skrivstil bevaras; verktyg och rubriker får gemensamma storlekar. Kartans zoom och sparade positioner ändras inte.
- Min plats, loggning, batteri, Insikter, historik, återhämtning och övriga personliga verktyg.
- Familj, barnschema, delning, påminnelser, listor, dokument, träning och andra djupare verktyg.
- Mer, inställningar, konto, hjälp samt tillgängliga admin-/pilotvyer.
- Inloggning och registrering, liksom menyer, formulär, dialoger och tom-/fel-/laddningslägen som hör till appen.

En fullständig sidlista används för avprickning, så att kvarvarande äldre vyer inte lämnas utanför. Den offentliga presentationssidan och filmer/dokument ingår inte i appens storleksändring.

## Knappar och tätare ytor
- Mindre synlig knapphöjd, ikoner och avstånd där de i dag är oproportionerligt stora, enligt samma regler överallt.
- Behåll minst 44 × 44 px tryckyta utan överlapp mellan kontroller.
- Låt text och innehåll bestämma nödvändig höjd; kapa inte längre rubriker eller instruktioner för att få dem att passa.
- Bevara kalenderns redan kompakta tidslinje och exakta tidplacering. Justera bara läsbar presentation och nödvändigt utrymme runt text.

## Större text fortsatt valbar
Återanvänd befintliga **Större text** i inställningarna. Normalstorleken blir mindre, men den personliga inställningen och telefonens/webbläsarens textförstoring ska fortsätta förstora innehållet. Ändra inte någon användares sparade val. Stor text får fler rader och staplade kontroller, inte krympt text.

## Genomförande och kontroll
1. Samla storlekarna och anpassa gemensamma rubriker, aktivitetsrader, knappar och dialoger.
2. Gå igenom samtliga sidor och djupare vyer; ersätt avvikande storlekar per textroll utan att bygga om funktioner.
3. Kontrollera mobil 320/360/390/411/430 px, surfplatta och dator 768/1280/1600 px, ljust/mörkt, standardtext, inställningen Större text och 200 % textförstoring.
4. Kontrollera formulär, längre aktivitetsnamn, chatt, kalender, anteckningsbok, fokus, intern scroll och att sidan inte får oavsiktlig sidledsscroll.
5. Kör relevanta befintliga tester och automatisk byggkontroll. Visa före-/efterbilder och redovisa exakt vilka vyer och flöden som verifierats samt eventuella begränsningar.

## Skyddsgränser
Endast presentation. Behåll data, utkast, autosparning, kontoseparering, synk, behörigheter, beräkningar, navigation, tider och funktioner. Inga nya paket, nativeversioner, domänändringar eller publicering. Testa inte sparning genom att ändra ditt privata innehåll.

## Tekniskt upplägg
Återanvänd `src/app-typography.css` för gemensamma rem-baserade storleksroller och appens befintliga textinställning. Normalisera sidvisa storleksundantag och använd befintliga gemensamma kontrollkomponenter; undvik en generell förminskning av hela sidan som även krymper tryckytor eller kalenderkoordinater. Behåll separat presentation för varumärkesbilder, anteckningspapper och specialiserade numeriska verktyg. Dokumentera reglerna och uppdatera båda ändringsloggarna efter genomförandet.