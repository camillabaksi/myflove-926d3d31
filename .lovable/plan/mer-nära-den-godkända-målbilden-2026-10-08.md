# Mer – nära den godkända målbilden

## Förkontroll
Den tidigare visuella etappens dokumenterade kvalitetsgranskning är klar och skärmkontrollerna är godkända: 516/516 tester, 180 skärmkombinationer, nya text/ytpar över WCAG AA och kontrollerade dialoger/chattrullning. Inget nytt påstående om fullständig granskning av samtliga äldre diagram eller fysisk mobiltestning görs.

**Kvarstående separat problem:** Hem-dialogen återför inte fokus till öppningsknappen efter Escape. Detta är redan rapporterat och kräver separat godkännande; det ändras inte inom Mer. Tidigare skärmbildsfiler finns inte kvar i denna arbetsmiljö, men verifieringsrapporten finns. Nya före-bilder tas innan genomförandet.

## Nuvarande Mer jämfört med målbilden
Mobil har en fullskärmsmeny med sökfält och starkare färgade kategorikort. Desktop har en smal, 320 px bred panel med textgrupper bredvid den befintliga sidomenyn. Ingen har målbildens stora rubrik, profilkort, fyra vardagskort eller avslutande påminnelse. Mobilmenyn täcker dessutom bottennavigationen.

## Föreslagen minsta implementation
1. **En gemensam responsiv Mer-vy**, återanvänd i de befintliga menybehållarna, utan ny route eller ny navigationsmodell. Desktoppanelen får ett bredare, balanserat innehållsområde, cirka 600–680 px där utrymmet tillåter, bredvid den oförändrade sidomenyn. Mobilens fem befintliga huvudval hålls synliga och fungerande. Mer kan fortfarande stängas utan sidbyte; Escape/kryss och sidbyte behåller korrekt fokusbeteende.
2. **Överdel enligt bilden:** ”Mer av din vardag” i Fraunces, ”Dina verktyg, när du behöver dem.” i Inter. Stort profilkort till befintliga `/profil`. Behåll en tydlig direktlänk till Inställningar i anslutning till profilkortet, eftersom profilen inte ersätter alla inställningar.
3. **MIN VARDAG:** Uppgifter, Ekonomi, Studier, Arbete med exakt angivna beskrivningar, små färgade ikonkretsar, pil och diskret dekor. Två kolumner normalt, en vid mycket smal bredd eller 200 % text. Studier/Arbete följer befintliga valda livsområden; inget område aktiveras automatiskt.
4. **Breda kort:** Träning och rörelse leder direkt till befintlig träning. Familj öppnar en tydlig grupp med Familj, Barn, Relationer och Dela & bjud in. Insikter och historik öppnar Insikter, Historik och Statistik. Där flera länkar samlas bakom ett kort används en expanderbar lista i samma Mer-vy, inte en ny sida eller ny funktion.
5. **Fler funktioner:** tydliga befintliga verktygsgrupper för dag/påminnelser, Flow/samtal, ork/återhämtning, hem och vardag, konto/app samt behörighetsstyrd Admin. **Äldre funktioner visas som en egen tydlig rad direkt under Fler funktioner**, med Äldre Hem, Dagens balans och Belöningar. Inget raderas.
6. **Sök och Enkelt läge bevaras:** en diskret men synlig sökingång öppnar samma sökning nära överdelen. Alla befintliga sökträffar finns kvar, utan Enkelt läge-filter, men med oförändrade konto-/områdesfilter. Enkelt läge behåller dagens essential-regler; länkar göms inte permanent. Inga nya sparade menyval.
7. **Avslutning:** mjukt persikotonat, icke-interaktivt fält med ”Allt behöver inte få plats på en dag.”

## Fullständig länkinventering och åtkomst
Listan omfattar samtliga 34 deklarerade navItems, plus den befintliga profillänken som lyfts fram. Synlighet följer dagens filter.

| Ingång/grupp | Befintliga länkar som bevaras |
|---|---|
| Min profil + Inställningar | Min profil `/profil`; Inställningar `/installningar` med befintliga profil-, anpassnings-, språk-, Flow-, introduktions-, installations-, ljud- och utloggningsåtgärder |
| Min vardag, direktkort | Alla uppgifter `/tasks`; Ekonomi `/finances`; Studier `/studyflow`; Jobb `/jobb` |
| Träning och rörelse | Träning `/traning` |
| Familj, utfällbar grupp | Familj `/familjeflow`; Barn `/barn`; Relationer `/relationer`; Dela & bjud in `/familj` |
| Insikter och historik, utfällbar grupp | Insikter `/insight`; Historik `/historik`; Statistik `/statistik` |
| Fler funktioner → Min dag | Idag `/idag`; Kalender `/kalender`; Tankar `/quickflow`; Påminnelser `/paminnelser`; Timer `/pomodoro` |
| Fler funktioner → Flow och samtal | Flow `/flow`; Prata med Flow `/assistant`; Planera `/flowplan`; Anteckningar `/anteckningar` |
| Fler funktioner → Ork och återhämtning | Min plats `/halsa`; Mitt batteri `/mitt-batteri`; Energins historik `/energifloede`; Återhämtning `/aterhamtning`; Stop-paus `/stop-paus`; Rutiner & medicin `/daglig-rutin` |
| Fler funktioner → Hem och vardag | Matlista `/matlista`; Inköpslista `/shopping`; Städning `/stadning` |
| Fler funktioner → Konto och app | Inställningar `/installningar` som fortsatt direkt nås vid profilkortet; Feedback `/friktionsindex` |
| Fler funktioner → Admin, endast befintlig adminåtkomst | Adminöversikt `/admin`; Appstatistik `/admin-statistik` |
| Äldre funktioner, tydlig egen rad | Äldre Hem `/hem`; Dagens balans `/flowscore`; Belöningar `/beloningar` |

**Inventeringsdetalj:** mobilens kategorilista nämner `/lagg-till` och `/studybuddy`, men ingen av dem ingår i dagens navItems och de renderas därför inte som Mer-länkar. Deras befintliga funktioner/rutter påverkas inte; inga nya genvägar införs inom denna visuella etapp.

## Återanvändning och dekor
- Använd befintliga Paceable-ytor, lavendel/persika/sage-toner, tunna kanter och elevation-1; inga globala färg- eller rubrikändringar.
- Återanvänd MyFloveIcon, befintlig Button/länkar, Lucide-ikoner, Fraunces/Inter, navigationens filtrerade navItems och textförstoringsdetektering. Kort återanvänder befintlig kortyta utan att skapa ett konkurrerande designsystem.
- Små statiska blad-/kvistdetaljer och enkla bok-/hem-/rörelsemotiv kan göras som kompakta dekorativa SVG-delar med befintliga tokens, `aria-hidden` och utan paket eller bildgenerering. De får inte efterlikna eller ersätta varumärkesstenarna. Ingen animation behövs.
- **Bildens alternativa stenformationer kopieras inte.** Befintlig logotyp är helt orörd. Övre dekoren och slutraden kan använda en liten kvist utan stenar; inga nya stenplaceringar eller bearbetade stenar behövs. Övriga sidor lämnas oförändrade.
- Dessa små motiv blir förenklade jämfört med målbildens fotoliknande illustrationer; färg, typografi, kortstruktur och luft prioriteras för minsta resurskostnad.

## Tekniska ändringsfiler
| Fil | Ändring | Insats |
|---|---|---|
| `src/components/paceable/more-view.tsx` (ny) | En fokuserad responsiv presentation med huvudkort, grupper, sök och dekor | Medel |
| `src/components/layout.tsx` | Koppla samma Mer-vy till befintliga mobil-/desktopbehållare; behåll navItems, filter och navigations-/fokuslogik | Medel |
| `src/styles.css` | Endast avgränsade `.pace-more-*` regler; återanvänd befintliga tokens, teman och textförstoringsstöd | Låg |
| Riktat test för Mer | Länktäckning, filter, expansion, sök, fokus och stängning | Låg–medel |
| `AGENTS.md`, `roadmap.md`, `CHANGELOG.md`, `src/lib/changelog.ts` | Dokumentera avgränsning och genomförande efter godkännande | Låg |

Ingen ändring av profil-/familje-/authlogik, livsområdesinställningar, översättningsregler, databas eller andra sidkomponenter. Inga nya beroenden.

## Verifiering efter godkännande
- Före-/efterbilder av Mer mobil och desktop; jämför med referensen.
- 360/390/430/1024/1440 px, ljust/mörkt och 200 % text: läsbara kort, enkolumn vid behov, inga överlappningar eller horisontell scroll; kontrollera hela menyns scroll och synlig mobilnavigation.
- WCAG AA-kontrast, minst 44×44 px kontroller, tangentbord, skärmläsarnamn, utfällt/stängt läge samt fokus efter Escape/kryss/navigering.
- Automatisk täckningskontroll: varje tillåten befintlig navItem finns i huvudkort eller verktygsgrupp och i sök; testa normalt/Enkelt läge, aktiva/inaktiva Studier/Jobb och Admin utan att ändra användarens sparade val.
- Kontrollera att Uppgifter/Ekonomi/Studier/Arbete/Träning/Profil öppnar samma funktioner; att Familj/Insikter/Övriga/Äldre innehåller samtliga länkar.
- Ta aktuella skyddade före-bilder av Idag/Kalender/Tankar/Min plats, kontrollera efteråt att deras utseende och navigation är orörda. Sten- och logotypfiler ändras inte.
- Kör riktade tester och hela befintliga sviten; kontrollera automatiskt bygge. Inga sparande tester i användarens konto.

**Ingen appkod är ändrad. Genomförande inväntar ditt godkännande. Ingen publicering ingår.**