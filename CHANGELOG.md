# Changelog

## 2026-08-21 – Bocka av dagens uppgifter direkt på Hem

- Nytt block "Dagens uppgifter" på hemskärmen: allt som hör till idag – även det QuickFlow har strukturerat – går att bocka av direkt, utan att gå till Att göra.
- Samma kort och samma avbockning som i Min dag, så status är densamma överallt (Hem, Min dag, Att göra).
- Kalenderhändelser, lektioner och rutiner visas inte som avbockningsbara – de hör hemma i tidslinjen.
- Blocket går att stänga av eller flytta i Anpassa hemskärmen.
- Samma lista finns nu även i Flow → Idag, så dagens uppgifter kan bockas av där utan att gå till Att göra.

## 2026-08-21 – QuickFlow sparar på riktigt

- Fix: när du tryckte "Godkänn allt" eller "Spara bara texten som den är" stängdes rutan innan sparningen hann köras – uppgiften, inköpet eller tanken försvann. Nu sparas allt innan dialogen stängs och dyker direkt upp i Att göra, Kalender, Inköp och QuickFlow.

## 2026-08-20 – Min livsprofil ersätter jobb- och studieprofilen

- Ny samlad profil 👤 Min livsprofil (Mer → högst upp): livssituation, anpassade följdfrågor, styrkor, svårigheter, vad du vill ha hjälp med, vad som ger/tar energi och hur du vill att Flow hjälper dig.
- Livssituationerna är utökade: Arbetar, Studerar, Arbetar och studerar, Söker jobb / mellan jobb, Föräldraledig, Sjukskriven, Frilansar / egenföretagare, Hemma / hushåll och familj, Praktik / arbetsträning och Annat – flera samtidigt.
- Följdfrågorna visas bara för det du valt, så profilen aldrig blir ett långt formulär. Sjukskriven frågar varsamt om vardagen – inga medicinska antaganden.
- "Profil klar X %" visas, men allt är frivilligt och appen fungerar med tom profil.
- Gamla Min jobbprofil och Min studieprofil är borta ur gränssnittet och navigationen. Det du fyllt i migreras automatiskt till livsprofilen – ingen data raderas.
- /min-situation leder nu till Min livsprofil.
- Flow, StudyFlow, FlowStudy, WorkFlow och Livspusslet använder livsprofilen som kontext.

## 2026-08-20 – Dubblettskydd i databasen

- Servern hindrar nu identiska registreringar: samma aktivitet med samma riktning inom samma minut kan bara sparas en gång per användare, även från två flikar samtidigt.
- Samma aktivitet vid en annan tidpunkt går att spara som vanligt.

## 2026-08-20 – Säkrare sparning av energiposter

- Energiflödet följer inloggningen: loggar man in i samma flik dyker posterna upp direkt, och vid utloggning töms de direkt (tidigare krävdes omladdning).
- Dubblettspärr: samma aktivitet med samma riktning inom en minut sparas inte två gånger – dubbeltryck skapar inte längre två poster.
- Om en borttagning eller ändring inte går igenom mot servern återställs vyn i stället för att visa ett felaktigt läge.



## 2026-08-20 – Snabbknapp "Jag gjorde något" på Hem

- Ny alltid synlig snabbknapp ➕ Jag gjorde något direkt under Mitt batteri på Hem – öppnar ett 3–5 sekunders flöde: välj/skriv aktivitet → 🔻/🔺/➖ sparar direkt.
- Friktion är ett frivilligt extrasteg efter att posten sparats, med Ångra och "Lägg till en till".
- Samma datamodell, energi- och friktionslogik som Energiflöde – dagens energiflöde och FlowScore uppdateras direkt.
- Den stora panelen "Lägg till det du gjorde" är dold som standard på Hem (kan slås på i Anpassa hemskärmen).

## 2026-08-20 – Lägg till det du gjorde & Dagens energiflöde

- Ny lågfriktionsfunktion "Lägg till det du gjorde": ett tryck för vanliga vardagssaker (middag, tvätt, undanplock, barn, packa inför imorgon) med val av när det hände, fritext och förberedd röstinmatning.
- Energi in/ut per aktivitet: 🔻 tar energi, 🔺 ger energi, ➖ neutral – går alltid att ändra i efterhand.
- Friktion är nu en egen dimension skild från energi (lätt/lagom/tungt att komma igång).
- Nytt kort "Dagens energiflöde" med uppdelning i Planerat, Vardag, Spontant och Återhämtning samt netto för dagen.
- Registrerade aktiviteter räknas in i FlowScore, så en tom kalender läses inte längre som en lätt dag.
- Nya mönster: "Tungt att komma igång med (30 dagar)" som visar när friktion och energikostnad skiljer sig åt.
- Hem och Min dag har fått blocken; på Hem kan de döljas/sorteras i Anpassa hemskärmen.


Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

### Added

- **Anpassa hemskärmen är tillbaka** (2026-08-20): Ny sida under Mer → Inställningar (och en liten länk längst ner på Hem) där du slår av/på och sorterar de block Hem faktiskt visar – Mitt batteri, Nästa, Flow-förslag, ＋ Lägg till, Dina genvägar, Korta vägar och Områdesväljare. Här väljer du också dina fyra egna genvägar, som nu kan visas direkt på Hem igen. Valen sparas i molnet.

### Changed

- **En enda förslagskälla** (2026-08-20): Hem, Min dag och Flow → Nu använder nu samma Flow-motor, så du får samma svar på "vad är viktigast just nu?" oavsett var du står. Kortet "Dagens fokus" på Min dag är borttaget (det upprepade tidslinjen), och den extra energimeningen är ersatt av Flows egen bedömning av dagens belastning.
- **Ett namn på varje sak** (2026-08-20): "Daily Flow", "Vad ska jag göra nu?" och "Dagens fokus" är borta ur gränssnittet. Allt heter Flow (Nu / Idag / Hjälp), och "Daglig rutin" heter nu **Rutiner & medicin** så att den inte konkurrerar med Min dag.
- **En väg in till Energiflöde** (2026-08-20): Energiflöde finns bara som del av Må bra i stället för att dessutom ligga under Hälsa och Avancerat. Gamla länkar till /energifloede fungerar fortfarande.

- **Ett samlat Flow** (2026-08-21): Flow är nu en enda hjälpare med tre lager – **Nu** (ett tydligt förslag med Ja, börja / Senare / Redan klar), **Idag** (dagens belastning i klarspråk och förslag att flytta något till imorgon) och **Hjälp** (Flow-chatten). FlowPlan, "Vad ska jag göra nu?" och Flow-chatten är sammanslagna och når du via /flow – gamla länkar pekar om automatiskt. FlowScore, Energiflöde, Veckans flow och Friktionsindex ligger kvar under Mer → Avancerat.
- **Förenklad Hem-landning** (2026-08-20): Hem är nu en lugn landningssida som svarar på "Vad behöver jag veta just nu?" – med hälsning, Mitt batteri, Nästa aktivitet, ett Flow-förslag och en tydlig ＋ Lägg till-knapp. Inga långa listor, grafer eller flera AI-förslag. All sekundär funktionalitet finns kvar på sina egna sidor och nås via Mer.
- **Enklare huvudnavigation** (2026-08-20): Appen har nu fem tydliga ingångar – Hem, Min dag, QuickFlow, Flow och Mer. Kalender, Att göra, FlowPlan, Vad ska jag göra nu?, Energiflöde, Må bra, FlowScore och Statistik är inte längre egna huvuddestinationer utan ligger under Min dag, Flow respektive Insights. Mer är omgrupperat i Min dag · Flow · Studier · Jobb · Familj · Hemma · Resor · Insights · Inställningar. Alla sidor, länkar och redirects fungerar precis som förut, och du kan fortfarande byta de två valfria platserna i bottenmenyn.

### Removed

- **Anpassa hemskärmen och död kod** (2026-08-20): Den gamla blockinställningen för hemskärmen beskrev block som inte längre finns på nya Hem och togs bort tillsammans med sina oanvända komponenter.

### Added

- **Min dag är appens kärna** (2026-08-20): Min dag samlar nu dagens tidslinje (händelser, uppgifter och rutiner med ändra/ta bort direkt i raden), Mitt batteri högst upp med nivå, riktning och detaljer vid tryck, en stor ＋ Lägg till-knapp för uppgifter på sekunder, en enkel mening om dagens energibalans och ETT förslag från Flow. Ingen ny data eller kalender – allt bygger på befintlig logik.
- **Mitt batteri – din energikurva över dagen** (2026-08-20): Ett lugnt, levande batteri högst upp i kalendern och som eget block på hemskärmen visar din energinivå just nu, om den stiger eller sjunker, och när du brukar vara starkast respektive lägst. Expandera för kurvan över dagen och mjuka förslag om placering och återhämtning. Kurvan bygger på FlowScore, ditt eget energimönster, Energiflöde™ och dagens aktiviteters energipåverkan – inga nya listor att fylla i. I kalenderns dagsvy tonas timmarna svagt efter din energi.
- **Dagen just nu på hemskärmen** (2026-08-20): Ett nytt block högt upp visar dagens tidslinje – hållpunkter, uppgifter med klockslag, rutiner och medicintider – med en mjuk Nu-markering. Går att flytta eller stänga av i Anpassa hemskärmen.
- **Medicinpåminnelser finns i Påminnelser** (2026-08-20): Mediciner och tider hanteras nu direkt på Påminnelser-sidan, så allt som påminner dig ligger på samma ställe.
- **Snabbknapp för Att göra på hemskärmen** (2026-08-20): En stor ＋ Lägg till-knapp högt upp på hemskärmen skapar en ny Att göra-post på sekunder. Dialogen frågar direkt om energi och föreslår en tid (avrundat uppåt till närmaste kvart), samtidigt som den plockar upp det aktiva rummet (Vardag, Privat, Studier, Jobb eller Barn) så inget behöver sorteras i efterhand.
- **Att göra är MyFloves dagliga agenda** (2026-08-20): Att göra har flikarna ☀️ Idag (standard), 📅 Kommande och ✅ Klart, en snabb ＋-knapp med val för när, energi och friktion, mjuka förslag från Flow när dagen inte matchar din energi, och en frivillig fråga om faktisk energi när du bockar av. Uppgifter med tid syns även i kalendern – utan tid stannar de i Att göra.
- **Anteckningar & idébank som egen del under Flow** (2026-08-19): Anteckningarna har fått en egen sida (/anteckningar) i Flow-gruppen i stället för att ligga inbakade i Quickflow – Quickflow länkar dit.
- **Flytta en anteckning tillbaka till Quickflow** (2026-08-19): Varje anteckning har nu "Tillbaka till Quickflow" – tanken blir ett aktivt flow-block igen, med möjlighet att ångra.
- **Idébanken bor i Anteckningar** (2026-08-19): Den gamla idébanken i Quickflow är borta – dina sparade idéer flyttas automatiskt in bland Anteckningar med gissat livsområde, så allt ligger på ett ställe.
- **Flytta befintliga tankar till Anteckningar** (2026-08-19): Varje tanke i "Du bad mig komma ihåg" har nu en anteckningsknapp – tanken flyttas till Anteckningar med gissat livsområde.
- **Redigera och radera anteckningar** (2026-08-19): Varje anteckning kan ändras direkt i listan – text och livsområde – och tas bort med möjlighet att ångra.
- **Spara direkt som anteckning från Quickflow** (2026-08-19): I Kom ihåg-rutan finns nu "📝 Spara som anteckning" – tanken landar direkt bland Anteckningar i stället för i triagelistan.
- **Medicinpåminnelser på förstasidan** (2026-08-19): Hemskärmen visar nu alla dagens kvarvarande doser (inte bara nästa) med en "Tagen"-knapp direkt i kortet, och blocket ligger högt upp och syns även i förenklad vy och i alla rum.
- **Energiflöde som egen del i Hälsa** (2026-08-19): Energiflöde ligger nu som en egen ingång i Hälsa-gruppen under Mer, vid sidan av Må bra, Träning, FlowScore och Statistik.
- **Barn som eget livsområde** (2026-08-19): I Att göra (och övriga vyer med livsområden) kan en sak nu läggas i Barn, vid sidan av Vardag, Privat, Studier och Jobb.

### Changed

- **Ingen "Sätt dagens fokus"-knapp på hemskärmen** (2026-08-20): Den tomma dagen visar inte längre en uppmaning att sätta fokus – Daily Flow visar bara det som faktiskt finns, och du sätter fokus via Flow eller FlowPlan som vanligt.
- **Ett sammanhängande Daily Flow-kort** (2026-08-19): Ditt fokus idag och dagens viktigaste ligger nu i samma kort – fokuslistan högst upp och "Resten av dagen" direkt under, i stället för två separata kort.
- **Inga dubbletter i Daily Flow** (2026-08-19): En uppgift som redan står i "Ditt fokus idag" eller som dagens fokus visas inte en gång till i listan under.
- **Daily Flow och Dagens viktigaste är nu ett block** (2026-08-19): Daily Flow är tillbaka på hemskärmen och innehåller incheckningen, Ditt fokus idag och dagens viktigaste saker i samma sektion – i stället för två block som visade samma sak.
- **Framtida saker stannar på sin dag** (2026-08-19): Hemskärmens lista visar bara det som gäller idag (eller saknar datum). Uppgifter, händelser och påminnelser med ett datum framåt syns först den dagen – de finns kvar under "Visa alla uppgifter som inte är klara".
- **Städad kodbas** (2026-08-18): Alla ~6 000 lintanmärkningar är åtgärdade – enhetlig formatering i hela projektet, tydliga typer i stället för lösa `any`, kommenterade undantag där de behövs och regler anpassade för UI-bibliotek och genererade filer. Inget i appens funktion har ändrats; alla flöden testades efteråt.

### Fixed

- **Uppgifter försvinner inte längre vid synk** (2026-08-18): Om molnläsningen misslyckades, eller om appen öppnades i en ny webbläsare/PWA med tom lokal lagring, kunde en tom lista skrivas över dina sparade uppgifter. Nu skrivs molnet bara över efter en avsiktlig ändring – aldrig av ett tomt startvärde eller ett misslyckat anrop.
- **Flow svarar igen i chatten** (2026-08-18): När du startade ett nytt samtal byttes sidan direkt när chatten skapades, vilket avbröt anropet till Flow så att svaret aldrig kom. Nu skickas frågan klart och svaret sparas innan sidan byter till det nya samtalet.
- **Snabbare start på varje sida** (2026-08-18): Molnsynken frågade efter inloggad användare en gång per sparad inställning – över 130 nätverksanrop per sidladdning. Nu delas svaret mellan alla, vilket tar ner det till en handfull och gör sidorna snabbare, särskilt på mobil och dålig uppkoppling.
- **Gamla påminnelser borttagna** (2026-08-18): Inaktuella notiser som låg kvar i kön är avbokade – Elvanse 12:15 och 11:30 från gamla medicinposter, morgonmedicin från ett gammalt id, samt vattenpåminnelserna 05:00/05:05 (inklusive den dagliga upprepningen) och en gammal testnotis. Aktuella påminnelser och mediciner (Elvanse 13:00, morgonmedicin 06:15) är orörda.

### Added

- **Energiflöde som egen rubrik under Må bra** (2026-08-19): I "Alla"-vyn på Må bra ligger Energiflöde nu som en egen hopfällbar sektion med rubriken "🔋 Energiflöde", bredvid Mående och Energi, i stället för ett länkkort gömt inuti Energi-sektionen.
- **Stop-samtal sparas** (2026-08-18): Chattarna du har med Flow via Stop-knappen sparas nu automatiskt och dyker upp bland dina Flow-samtal, så att du kan läsa dem igen senare.
- **Egna steg i städlistan** (2026-08-18): Du kan nu lägga till egna steg i städlistan och ta bort steg du inte behöver – per rum och läge. Borttagna standardsteg går att ta tillbaka igen.
- **Min situation överst i Mer** (2026-08-18): "Mer"-menyn inleds nu med ett eget kort för Min situation som visar vilka situationer som är aktiva just nu och tar dig direkt dit.
- **Kalendern i bottenmenyn och egna platser** (2026-08-18): Hela kalendern nås nu direkt från bottenmenyn. Hem och QuickFlow ligger fast, och de två övriga platserna byter du själv under "Mer" → "Din bottenmeny". Hemskärmens block och genvägar går att anpassa som tidigare.
- **Adminvyn visar namn, besök och inloggning** (2026-08-18): Användarlistan i adminöversikten visar nu namn, senaste besök (med antal händelser) och senaste inloggning, och går att filtrera på datumintervall. Besök loggas dessutom kopplat till inloggat konto i stället för bara anonym session. Tabellrubrikerna för namn, senaste besök, senaste inloggning och skapad går nu att sortera stigande/fallande.
- **Aviseringar för aktiva påminnelser** (2026-08-18): Aktiva påminnelser ger nu en notis när det är dags – på tiden eller med förvarning (5/15/30/60 min), och även för upprepningar (varje dag, vardagar, varje vecka). Push-notiser når dig när appen är stängd, och avbokade påminnelser skickar aldrig något. På sidan Påminnelser finns nu en ruta där du slår på notiser.

- **Sidan Påminnelser** (2026-08-18): Ny vy på `/paminnelser` där du lägger till, ändrar och avbokar påminnelser med datum, tid och anteckning. Varje påminnelse visar tydlig status – Aktiv eller Avbokad – och avbokade ligger kvar så att du kan aktivera dem igen eller ta bort dem helt.

- **GitHub-issues från checklistan** (2026-08-18): 70 färdiga issues (26 kapitel-epics + delmoment) med rubrik, beskrivning och acceptance criteria utifrån Utvecklarchecklista 2.9 – som markdown, JSON och ett gh-skript för import.
- **Utvecklarchecklista 2.9** (2026-08-18): Konkret checklista utifrån Living Blueprint 2.9 – ett avsnitt per kapitel (1–18) med avbockningsbara delmoment och status (klart/delvis/kvar), samt tre prioriterade nästa steg.
- **Blueprint 2.9** (2026-08-19): Living Blueprint uppdaterad till 2.9 – nytt kapitel 17.9 "Material och kommunikation" (blueprint, pitchdeck i PPTX och PDF, marknadsföringsvideo och changelog i Flow-röst), städad kapitelordning, versionshistorik 18.7 och rätt versionsnummer i sidhuvudet. Finns som DOCX och PDF.
- **Pitchdeck som PDF** (2026-08-19): Pitchdecket finns nu även som nedladdningsbar PDF (20 sidor) med de nya skärmbilderna och en avslutande sammanfattningsslide – "MyFlove i korthet" med vad appen är, hur den fungerar, vad som är nytt i 2.8 och status/nästa steg.
- **Pitchdeck 2.8 uppdaterat** (2026-08-19): Alla skärmbilder i pitchdecket är omtagna från den nya lila appen (hem, Min dag, Relationer, Flow, FlowScore, Feedback, QuickFlow, Insight). "Familj" heter nu Relationer i problem-, lösnings- och personabilderna, rubriken "Status idag" är renodlad, och citat/siffror på testarsidan visas som tydliga platshållare tills riktig data finns.
- **Marknadsföringsvideo 2.8** (2026-08-19): Videon har fått tre nya scener – Min situation, Relationer och FlowPlan som förslag – i samma lila MyFlove-uttryck. Blueprinten är uppdaterad till 2.8 och pitchdecket har en ny slide om vad som är nytt.
- **FlowPlan är ett förslag – du bestämmer ordningen** (2026-08-19): När Flow lagt en plan visas den som **förslag** tills du säger ja. Flytta uppgifterna upp och ner med pilarna tills ordningen känns rätt, tryck "Ja, kör den här ordningen" eller be Flow föreslå på nytt. Din ordning sparas och ligger kvar, och du kan alltid gå "Tillbaka till Flows ordning".
- **Ändra eller ta bort från alla vyer** (2026-08-19): Uppgifter, påminnelser, QuickFlow-tankar och rutiner har nu en liten ändra-knapp direkt där de visas – i Min dag, på hemskärmen, i kalenderns tidslinje, i flödeskorten och i QuickFlow. Du kan justera text, datum, tid, sluttid, livsområde och anteckning, eller ta bort helt, utan att leta upp rätt sida först. Poster som kommer från schema eller barnens dag visar i stället en länk till sin källa.
- **Förslagen följer din situation direkt** (2026-08-18): När du aktiverar, pausar eller byter situation under Min situation uppdateras Flow-förslagen på hemskärmen och QuickFlow-sorteringen på en gång. Aktiva situationer lyfts fram överst bland förslagen, QuickFlow sorterar valen så att det som passar din situation kommer först och det som vilar (t.ex. jobb när du inte arbetar) hamnar sist – med en kort rad som förklarar varför.
- **Min situation** (2026-08-18): Ett nytt övergripande lager på `/min-situation` (Övrigt i menyn) där du väljer vilka livssituationer som pågår just nu – 💼 Jobb, 🎓 Studier, 🏡 Föräldraledig, 🌿 Sjukskriven, 🔎 Arbetssökande, 🔄 Mellan arbeten eller 🧭 Annat. Flera kan vara aktiva samtidigt. Jobb öppnar **Min jobbprofil** (nu även arbetsplats) och Studier öppnar **Min studieprofil** direkt i vyn, och situationen slår på rätt livsområde utan att ersätta det. Varje situation kan få en egen beskrivning, och pausar du en situation raderas ingenting – den kan återaktiveras senare. Flow väger situation + profiler + livspusslet + FlowScore + Energiflöde när den ger förslag.
- **Gamla Familj-objekt mappas till Relationer** (2026-08-19): Uppgifter, kalenderhändelser, påminnelser och QuickFlow-regler som tidigare låg under "Familj" visas nu automatiskt som **Relationer** – kalenderfiltret döps om och ditt sparade val följer med, så ingen historik tappar sitt sammanhang.
- **Relationer – ett livsområde du formar själv** (2026-08-19): "Familj" har blivit **Relationer**. Du väljer vilka relationstyper som ska synas – ❤️ Partner, 👧 Barn, 👨‍👩‍👧 Familj, 🧑‍🤝‍🧑 Vänner, 👵 Anhöriga, 🐾 Husdjur eller ➕ Annan viktig person – och lägger till de personer du vill, med namn och egen information. Nämner du någon vid namn i Quickflow föreslår Flow kopplingen, som följer med som kontext till uppgift, kalender och påminnelse. Varje person kan markeras som något som gav eller tog energi, vilket landar i Energiflöde och FlowScore. Ingen behöver ha partner, barn eller familj – hushållet och barnens scheman finns kvar precis som förut.
- **Flashcards och quiz anpassade efter din studieprofil** (2026-08-18): När du laddar upp material i StudyBuddy visar Flow vad som styr anpassningen (t.ex. "Mest flashcards", "Kortare pass", "Extra tydliga formuleringar", "Provfokus") utifrån dina stödbehov och inlärningspreferenser. Antalet kort och frågor och betoningen sätts automatiskt – och du kan alltid byta mellan Balanserat, Mest flashcards och Mest quiz innan Flow kör.
- **Min studieprofil** (2026-08-18): I StudyFlow och StudyBuddy kan du frivilligt berätta ålder, utbildningsnivå, klass/årskurs, program eller inriktning, kurser och ämnen, studietakt, distans eller på plats, vad du främst vill ha hjälp med (komma igång, bryta ner stora uppgifter, hålla deadlines, planera inför prov, repetition, förstå instruktioner, komma ihåg uppgifter) och hur du lär dig bäst (korta pass, många pauser, tydliga instruktioner, visuellt stöd, quiz, flashcards, frågor och svar). Du kan välja flera och skriva egna. Flow använder det som personlig kontext – aldrig som fasta antaganden – när den skapar quiz, flashcards, sammanfattningar och delar upp uppgifter, och profilen vägs ihop med FlowScore, energi, Min dag och kalendern så att plugget anpassas efter hur veckan faktiskt ser ut. Allt går att ändra, pausa eller ta bort.
- **Min jobbprofil** (2026-08-18): Under Jobb och WorkFlow kan du frivilligt berätta yrkesroll, bransch, huvudsakliga ansvarsområden (välj flera eller skriv egna), arbetstider/arbetssätt och vad du främst vill ha hjälp med. Flow använder det som personlig kontext – aldrig som fasta regler – när den ger förslag inom Jobb, t.ex. "Du har ett möte imorgon, vill du lägga in 15 minuter för förberedelse?". Profilen vägs ihop med FlowScore, energi och Min dag, så att en krävande arbetsdag inte följs av en full kväll. Du kan pausa, ändra eller ta bort profilen när du vill.
- **Ångra hanterade QuickFlow-tankar** (2026-08-18): Råkar du markera en vilande tanke som "Hanterad" dyker den upp under "Nyligen hanterade" i QuickFlow-listan och sorteringen. Tryck "Ångra" så återaktiveras tanken – den får tillbaka sitt sparade datum och ligger kvar i QuickFlow igen. Syns i 24 timmar efter att den markerades hanterad.
- **Markera "Återkom senare"-tankar som hanterade** (2026-08-18): Vilande tankar göms nu automatiskt från sorteringen tills tiden är inne – du ser bara en liten rad med hur många som vilar, och kan visa dem om du vill. Varje sparad tanke har en tydlig knapp "Hanterad – göm den" i både QuickFlow-listan och sorteringen, så den försvinner ur vyn utan att du behöver leta.
- **Sparläge för "Återkom senare" i QuickFlow** (2026-08-18): Väljer du "Återkom senare" får du nu bestämma när tanken ska dyka upp igen – i kväll, imorgon bitti, om 3 dagar, nästa vecka eller eget datum och klockslag. Tanken ligger kvar i QuickFlow som vilande, du ser tidpunkten på kortet och kan ändra den när du vill.
- **QuickFlow: "Vart ska det här hamna?"** (2026-08-18): Efter att du fångat något föreslår Flow vart det hör hemma och visar alla val på ett ställe – uppgift, kalender, påminnelse, barn, familj, studier, jobb, hemma, hälsa, ekonomi, inköpslista, anteckning, energifaktor, återkom senare eller ta bort. Barn är nu ett eget val: nämner du ett av barnen vid namn föreslår Flow rätt barn, och du väljer om det blir kalenderhändelse, uppgift, anteckning eller inköp. Väljer du energifaktor anger du själv om den gav eller tog energi och hur mycket den ska påverka FlowScore. Alla förslag går att ändra manuellt.
- **"Omvandla till …" på anteckningar** (2026-08-18): Varje anteckning har nu en tydlig knapp där du väljer om den ska bli uppgift, kalenderhändelse eller energifaktor. Du kan justera text, datum, tid, påminnelse eller energiriktning, styrka och kategori – och inget sparas förrän du trycker Bekräfta.

### Fixed

- **Notiser kommer nu även när appen är stängd** (2026-08-18): Telefonens push-prenumeration kunde bytas ut i bakgrunden utan att servern fick veta – då skickades notisen till en gammal nyckel och syntes aldrig. Nu förnyas prenumerationen varje gång du öppnar appen, och tjänsten uppdaterar sig själv direkt om webbläsaren byter nyckel. Gamla, döda prenumerationer för samma enhet rensas bort.
- **Tider för personliga puffar sparas igen** (2026-08-17): Morgonpuff, kvällspuff och Morgonstart sparade inte de tider du valde – sparningen avvisades tyst i bakgrunden. Nu skickas bara dina inställningar, och tiderna ligger kvar och styr när notiserna kommer.

- **"Nyligen hanterade" syns även när allt är hanterat** (2026-08-18): Om du markerade alla QuickFlow-tankar som hanterade försvann ångra-sektionen helt, eftersom listan då dolde hela komponenten. Nu visas "Nyligen hanterade" så länge det finns något att ångra, både i listan och i sorteringen.

- **Resor och familjekalender fungerar igen** (2026-08-17): Reseökningen hämtar återigen riktiga avgångar i realtid, och familjens kalender, inköpslista och familjeuppgifter läser och sparar mot molnet igen i stället för att bara låtsas lyckas.

### Changed

- **Tydlig regelmotor för "Ditt fokus idag"** (2026-08-17): En enda plats (`src/lib/focus-rules.ts`) avgör nu vad som hör hemma i dagens fokus, i tydlig ordning: klara saker och undanstoppade göms, automatiska poster (prov/repetition) styr inte dagen, passerade datum och dagens datum visas, framtida datum väntar och saker utan datum kan alltid göras. Varje beslut har en kort motivering i Flow-röst.
- **"Ditt fokus idag" visar bara dagens saker** (2026-08-17): Uppgifter med ett framtida datum syns inte längre i "Ditt fokus idag" på hemskärmen – de ligger kvar i kalendern och dyker upp först när dagen är inne. Passerade datum och dagens datum visas fortfarande.

### Added

- **Spara som anteckning i QuickFlow** (2026-08-18): QuickFlow är fortsatt appens universella infångning – du behöver inte veta vad något är för att skriva ner det. Efter infångning kan du välja vad det ska bli: uppgift, kalenderhändelse, inköpslista, påminnelse, studier, jobb, livsområde, anteckning, energifaktor eller "Annat – behåll här". Väljer du anteckning sparas texten som den är, utan deadline eller krav på åtgärd, under "Anteckningar" på QuickFlow-sidan. Där kan varje anteckning senare omvandlas till något annat; Flow föreslår när det finns en tydlig koppling men omvandlar aldrig något automatiskt.
- **Färdiga regelmallar i QuickFlow** (2026-08-18): Åtta färdiga mallar för vanliga mönster – "boka …", "köpa …", "handla …", "påminn …", "ring …", "betala …", "idé: …" och "träffa …". Lägg till en mall direkt eller välj Anpassa för att ändra ord, destination, livsområde, klockslag och om ordet ska tas bort innan du sparar. Redan sparade regler går att ändra med pennknappen.

- **Egna sorteringsregler i QuickFlow** (2026-08-18): Du kan nu skapa dina egna regler för vart texter hamnar – t.ex. "börjar med köpa" → Inköpslistan (utan ordet "köpa" i titeln) eller "börjar med boka" → Kalendern kl 09:00. Varje regel kan sätta livsområde och klockslag, slås av/på och flyttas i ordning; översta regeln som passar vinner, annars föreslår MyFlove som vanligt. Reglerna finns på QuickFlow-sidan under "Mina sorteringsregler".
- **QuickFlow sorterar till alla delar av appen** (2026-08-18): Det du fångar i QuickFlow kan nu skickas vidare till inköpslistan, kalendern, att göra, påminnelser eller idébanken. MyFlove föreslår vart det hör hemma – "köpa schampo" hamnar i inköpslistan (som bara "schampo"), "förbereda middag" i kalendern – och förslaget är markerat men du väljer alltid själv.
- **Inställningar för energipåverkan** (2026-08-18): Ny inställningsvy i Energiflöde där du kan stänga av energipåverkan helt med ett reglage, sätta en samlad vikt och dessutom ställa vikten för varje energifaktor (sömn, socialt, rörelse, ljud & miljö, stress, återhämtning, egentid, annat) oberoende av varandra. Allt går att återställa till Normalt.
- **Energiflöde** (2026-08-19): Ny del under Må bra där du registrerar vad som ger 🔋 och tar 🪫 energi – sömn, socialt, ljud och miljö, stress, återhämtning, egentid. Dagens balans blir en egen faktor i FlowScore (du väljer själv: Av/Lite/Normalt/Mycket), och mönster över 14–30 dagar visar vad som återkommer. Posterna blir aldrig kalenderhändelser eller uppgifter – de beskriver bara din kapacitet, och Flow erbjuder en lättare plan när dagen tagit mer än den gett.

- **Ändra barn i sammanfogad händelse** (2026-08-18): Barnhändelser i kalendern har nu knappen "Ändra barn" – lägg till eller ta bort barn i efterhand utan att skapa en ny händelse.
- **Flera barn i samma händelse** (2026-08-18): I "Ny händelse" kan du nu välja flera barn samtidigt – t.ex. lämning av både Bella och Bianca. Det blir en händelse i kalendern och en påminnelse ("Lämning – Bella & Bianca"), men syns i varje barns schema. Dagens vy slår ihop identiska barnhändelser till en rad.
- **Ändra allt i efterhand** (2026-08-19): Nu kan du ändra allt du lagt in manuellt – titel, datum, starttid, sluttid, påminnelse, livsområde och anteckning. I kalendern öppnar "Ändra" en full dialog för både uppgifter och påminnelser, och på uppgiftssidan finns samma val under "Anteckning & delsteg".
- **Snabbval direkt i notisen** (2026-08-19): Påminnelser och notiser har nu två knappar – "✓ Klart" och "⏰ 10 min". Du kan bocka av eller skjuta upp utan att öppna appen; är appen redan igång sker det direkt, annars utförs valet nästa gång du öppnar MyFlove.
- **Anteckningar på uppgifter och kalenderhändelser** (2026-08-18): Du kan nu skriva en fri anteckning till det du lägger in – vad det gäller, adress eller vad du behöver ta med. Fältet finns i "Ny händelse" i kalendern och på uppgifter (öppna "Anteckning & delsteg"), och texten visas under titeln.
- **Framtida datum stannar i framtiden** (2026-08-17): Lägger du in något på ett datum längre fram – t.ex. en läkartid den 25 augusti – dyker det inte längre upp i dagens vy. Saker med datum prioriteras nu enbart efter datumet (Idag / Snart / Senare), och tankar i QuickFlow med en tid framåt räknas till den dagen i stället för idag.
- **Heldag som standard i QuickFlow** (2026-08-17): Nämner du ett datum men inget klockslag ("läkartid med Cassie den 25 augusti") läggs det nu in som heldag i stället för kl 09. Är tolkningen otydlig – t.ex. "kl 3" (morgon eller eftermiddag?) eller "fredag" (den här veckan eller nästa?) – frågar MyFlove i stället för att gissa, med tydliga val plus alternativet Heldag.
- **QuickFlow läser datum i texten** (2026-08-17): Skriver du "läkartid med Cassie den 25 augusti" föreslår MyFlove nu 25 augusti i stället för idag. Förstår "25 augusti", "25/8", "2026-08-25", "imorgon", "i övermorgon", "på fredag"/"nästa tisdag" samt klockslag ("kl 14", "14:30"). Utan klockslag föreslås kl 09, och allt går att ändra. Triagen visar det hittade datumet och föreslår Kalender.
- **Behaglig väckning** (2026-08-17): Morgonstart känns nu mjuk i stället för skarp. En varm, långsamt stigande klockklang (C–E–G–C) tonar in när du öppnar Morgonstart, med en ljudknapp om du vill tysta eller spela om den. Vibrationerna i puffarna är kortare och rundare, och texterna är lugnare ("Sträck på dig i sängen", "Ingen stress – tryck när du är redo").
- **Morgonstart för dig som snoozar** (2026-08-17): Nytt läge som fångar upp när alarmet snoozas bort. Flow puffar mjukt på vald tid och följer sedan upp med jämna mellanrum (t.ex. var 8:e minut, max 4 gånger) med stigande tydlighet: först en varm rad, sedan en tydligare, sedan en notis som ligger kvar tills du svarar. Puffarna slutar direkt när du trycker "Jag är vaken" eller kryssar ett steg i den lilla morgonrutinen (fötterna i golvet, ett glas vatten, släpp upp gardinen). Notisen öppnar den nya sidan **Morgonstart** (`/morgonstart`), och kortet syns på hemskärmen under morgonfönstret. Allt styrs från Påminnelser på hemskärmen.
- **Ny marknadsföringsvideo** (2026-08-17): Renderad om i MyFloves lila designspråk (Plus Jakarta Sans, violett/rosa palett i stället för de gamla jordtonerna). 2:27 min, 1280x720 – `myflove-marknadsforing-2026-08.mp4`.
- **Omplanering när kapaciteten är låg** (2026-08-17): När FlowScore är lågt frågar Min dag "Ska vi lägga om dagen?" med en konkret förklaring till varför (passerade datum, tunga saker, redan bokade hållpunkter) och tre lägen: _Behåll planen_, _Gör dagen lättare_ (färre saker och bara det som inte känns tungt) och _Bara det nödvändigaste_ (hållpunkter plus en enda sak). Valet ändrar direkt vad som ligger i dagens plan och vad som flyttas till "Resten kan vänta" – inget tas bort. Läget gäller resten av dagen och nollställs automatiskt till imorgon.
- **Ett gemensamt språk för allt i livet – steg 1** (2026-08-17): Ny delad modell (`src/lib/flow-items.ts` + `useFlowItems`) där en uppgift, en deadline, en lektion, en kalenderhändelse, barnens hållpunkt, en rutin och en tanke i Quickflow beskrivs på exakt samma sätt: livsområde, när, prioritet, energibehov och nästa steg. Nytt kort `<FlowItemCard />` visar dem likadant oavsett var i appen de skapades. Min dag läser nu från den delade källan, så en skoluppgift med deadline når dagen automatiskt, och kapaciteten från FlowScore avgör vad som visas – resten ligger kvar under "Resten kan vänta" i stället för att försvinna. Friktionsbiblioteket sätter energibehov på allt, inte bara jobb och studier.
- **Brödsmulor och tillbaka-knapp på Flow** (2026-08-17): Flow-sidan visar nu en tydlig sökväg – Hem › livsområde › platsen du kom ifrån › Flow – och en knapp "Tillbaka till …" som tar dig direkt tillbaka dit du var.
- **Flow visar var i livet du är** (2026-08-17): Flow-sidan har nu en kontextrubrik – "Du är i 🏠 Vardag · Att göra" – med genvägar till de sidor som hör till området (t.ex. Min dag, Rutiner, FlowScore) och chips för att byta del av livet (Vardag, Privat, Studier, Jobb). Inga nya menyval; genvägarna pekar på sidor som redan finns.
- **Enklare navigation** (2026-08-17): Fem fasta vägar i navet – Hem, Min dag, QuickFlow (mitten), Flow och Mer – lika på mobil och desktop. Ny sida **Min dag** (`/min-dag`) med dagens hållpunkter, dagens viktigaste sak, FlowScore och bara de uppgifter som gäller idag. "Mer" är nu en lugn vy med sök, kategorier, chippet "Visa bara det viktigaste" och inställningar (bottennav-redigeraren behövs inte längre). Flow vet varifrån du kom och föreslår något som passar platsen.
- **Smart framförhållning** (2026-08-17): Nytt läge som justerar påminnelsetiden per typ av hållpunkt (lektioner, barnens dag, uppgifter, kalender, rutiner) utifrån om du brukar bli sen eller tidig. Max 30 min tidigare / 15 min senare, styrs från hemskärmen.
- **Notiser för barnens hållpunkter** (2026-08-17): Skolschemat och barnens aktiviteter med klockslag skickar nu push-notiser innan de börjar ("🎒 Om 30 min: Idrott – Liam, kl 09:00 i Sporthallen"), 14 dagar framåt. Ny inställningspanel på Barn-sidan där du väljer om notiserna är på, hur långt innan de kommer (på slaget, 10, 15, 30 eller 60 min) och om du vill ha en morgonöversikt över hela barnens dag i en enda lugn notis vid vald tid. Tyst läge pausar dem som vanligt.

### Added

- **De sista kopplingarna (10–12)** (2026-08-17): (10) _Barnens dag räknas in_ – skolschema och barnens aktiviteter med klockslag blir hållpunkter i livspusslet på samma sätt som lektioner, så hemskärmen och FlowScore vet hur bunden dagen faktiskt är. (11) _Insight blir inställningar_ – valda strategier har nu knappen "Slå på åt mig" som ställer in det som redan finns i appen (dämpade färger, ingen rörelse, större text, symbolstöd, enkla ord, förenklad vy) i stället för att bara beskriva det. (12) _Lugnt förslag om block du inte använder_ – appen håller en lokal användningslogg (bara på din enhet, bara vilken del som öppnats) och föreslår efter en tid att dölja ett hemskärmsblock du inte tittat på på tre veckor. Du väljer "Dölj det" eller "Behåll", och allt går att slå på igen.

### Added

- **Fem kopplingar till mellan funktionerna** (2026-08-17): (5) _QuickFlow sorterar till rätt livsområde_ – i triagen väljer du (eller så gissar MyFlove) Vardag, Privat, Studier eller Jobb, och tanken blir en uppgift i rätt rum direkt. (6) _Rutiner, medicin och rörelse räknas i kvällens Flow Reset_ – "Det här blev gjort idag" visar nu även avklarade rutiner, tagna medicintider, träningspass och steg, inte bara uppgifter. (7) _Gårdagens Flow Reset sätter startläget_ – hur igår kändes påverkar förmiddagens FlowScore: kaos ger en lugnare start, en bra dag ger lite mer utrymme. (8) _Rörelse höjer kapaciteten_ – steg från hälsoappen och genomförda pass syns som en egen signal i FlowScore-nedbrytningen ("Du har rört dig idag"). (9) _Stopp-knappen kan pengar_ – vid impulsköp visas hur mycket som finns kvar av månadens budget och du kan parkera köpet i inköpslistan i stället för att bestämma nu.

### Added

- **Fyra nya kopplingar mellan funktionerna** (2026-08-17): (1) _Energimönster över dygnet_ – Energikartans loggar från de senaste 30 dagarna byggs till ett dygnsmönster (`src/lib/energy-pattern.ts`) som justerar FlowScore: "Du brukar ha lägre energi mellan 14 och 16. Planen tar höjd för det." (2) _Friktionsbiblioteket föreslår friktion_ – uppgifter i WorkFlow och StudyFlow matchas mot dina friktionsrapporter (`src/lib/friction-match.ts`) och föreslår ett friktionsvärde i stället för att du ska gissa. (3) _Vädret påverkar planeringen_ – Promenadvägar visar om det passar att vara ute (och föreslår inomhus vid hårt väder) och Nästa lektion lägger på marginal och föreslår en tidigare avgång när det regnar eller snöar (`src/lib/weather-advice.ts`). (4) _Bokad tid räknas bort från kapaciteten_ – möten med klockslag och dagens lektioner summeras (`src/lib/booked-time.ts`) och dras från FlowScores fokustid: "120 min av dagen är redan bokad – 95 min är dina."

- **Livspusslet – MyFloves delar börjar samarbeta** (2026-08-17): Ny gemensam kontext (`src/lib/life-puzzle.ts` + `useLifePuzzle`) som väger ihop FlowScore, energi, mående, tid kvar, osorterade tankar, deadlines per livsområde (Vardag, Privat, Studier, Jobb) och dagens fasta hållpunkter (uppgifter med klockslag och lektioner från schemat). Nytt block "Livspusslet" högst upp på hemskärmen visar hur delarna hänger ihop i stället för att räkna upp dem – med konkreta kopplingar ("Studier har deadline om 2 dagar och energin är låg – vi tar en liten bit idag") och, vid låg kapacitet, knappen "Flytta resten till imorgon". Flow får samma helhetsbild med varje meddelande och kan därför prioritera, dela upp och lägga om planen utifrån hela livet. Flows personlighet är uppdaterad: FlowScore är kapacitet, aldrig ett betyg, och en missad uppgift leder till omplanering – inte skuld. Stopp-knappen har fått ett känslosteg (stressad, trött, arg, ledsen, taggad, vet inte) som skapar ett mellanrum mellan känsla och handling innan samtalet med Flow. Inga befintliga funktioner är borttagna eller ersatta.

### Changed

- **En enda "Vad ska jag göra nu?" på hemskärmen** (2026-08-16): Dubbletten inne i Daily Flow-kortet (knapp + dialogruta) är borttagen. Kvar finns kortet högst upp på hemskärmen som leder till sidan `/vad-nu` med ett förslag i taget.

### Added

- **Enhetliga emojis, animationer och knapptexter** (2026-08-16): Alla emojis kommer nu från samma mappning (`src/lib/myflove-emoji.ts`, utökad med bl.a. FlowPlan, FlowScore, StudyFlow, Pomodoro, Rutiner, Väder och Stopp) och visas genom en gemensam `MyFloveEmoji`-komponent med samma storlekar och samma lugna andning. Knappar i hela appen klipper inte längre av text: de växer i höjd i stället, radbryts snyggt och centreras, och chips har samma höjd och trunkerar långa etiketter. Ingen funktionalitet ändrad.
- **Living UI på resten av appen** (2026-08-16): Samma rörelsetema finns nu i Flow-assistenten (tänkande i steg i stället för spinner), FlowPlan och Träning (Flow visar hur planen/passet växer fram), Studier och StudyFlow (uppdelning som process), Pomodoro och Må bra (andning), Energikartan och FlowScore (energi som levande prickskala), Veckans Flow och Statistik (mönster som samlas), Belöningar (lugn bekräftelse), Promenadvägar (rutt som ritas), samt Familj, Städning, Veckomatlista och 404-sidan. Tomma lägen i Uppgifter, Inköpslista, Kalender, Medicin och Barn har fått levande illustrationer. Ingen funktionalitet är ändrad och all rörelse stängs av vid "reduce motion" och i NPF-läget.
- **Living UI i resterande moduler** (2026-08-16): Fokusläget andas mjukt bakom ringtimern och avslutas med en ritad bock och en lugn bekräftelse. WorkFlow visar energi som prickskala och hur MyFlove tänker (🎯 → 🧠 → ✂️ → ✨) när en tung uppgift delas upp. Startsidans "Hjälp mig" har ett andande hjärta med små gnistor. Studiematerial/dokument visar MyFloves läsprocess (📄 → 🧠 → 🃏 → ✨) och ett levande tomt läge. Notisinställningarna visar att MyFlove lyssnar när puffarna är på. Och när en uppgift flyttas till imorgon glider den mjukt iväg i stället för att bara försvinna. Ingen funktionalitet ändrad; all rörelse respekterar "reduce motion" och NPF-läget.
- **Living UI – levande mikroanimationer** (2026-08-16): Nytt gemensamt rörelsesystem i `src/components/myflove/motion.tsx` med `MyFloveHeart`, `MyFloveSparkle`, `MyFloveThinking`, `MyFloveBreathing`, `MyFloveListening`, `MyFloveSuccess`, `MyFloveCelebration`, `MyFloveEnergyDots`, `MyFlovePath`, `MyFloveBalanceBars`, `MyFloveInsightGather`, `MyFloveNightSky`, `MyFloveFloatingElement`, `MyFloveTransition` och `MyFloveEmptyIllustration`. Varje funktion har fått sitt eget lilla liv: "Vad ska jag göra nu?" visar hur MyFlove tänker (📅 → ⚡ → 🎯 → ✨) i stället för en spinner, QuickFlow visar att MyFlove lyssnar när du skriver eller pratar, Resor ritar en rutt som rör sig framåt, Ekonomi visar balans som mjukt växande staplar, Insight samlar punkter till ett mönster, Flow Reset tänder stjärnor och en måne på kvällen, och hjärtat i Daily Flow slår i takt med din angivna energi (lugnare vid låg energi, mer liv vid hög). All kontinuerlig rörelse stängs av vid "reduce motion" och i NPF-läget.
- **Gemensamt designsystem: MyFlove-komponenter** (2026-08-16): Nya återanvändbara byggstenar i `src/components/myflove` – `MyFloveHeader`, `MyFloveCard`, `MyFloveSection`, `MyFloveButton`, `MyFloveChip`, `MyFloveIcon`, `MyFloveEmptyState`, `MyFloveLoading`, `MyFloveProgress` och `MyFloveModal` – plus en gemensam emoji-mappning (`src/lib/myflove-emoji.ts`) så att samma funktion alltid får samma emoji. Ekonomi, Resor, Inköpslista, Må bra och WorkFlow använder nu samma sidhuvud med tillbakapil, emoji, rubrik och kort förklaring. Nya sidor följer designen automatiskt.
- **Egen sida: "Vad ska jag göra nu?"** (2026-08-16): Ny vy på `/vad-nu` som visar ett enda förslag i taget utifrån hur lång stund du har (10 min, 25 min eller en timme), din energi och dagens belastning – med tid, prioritet, friktion och en förklaring till varför just den. "Börja nu" öppnar fokusläget, "Välj något annat" hoppar vidare och "Inte idag" skjuter upp till imorgon. Nås direkt från startsidan.
- **Tidslinje i kalenderns dagsvy** (2026-08-16): Dagsvyn visar nu en tidslinje från 06:00 till 22:00 med pastellfärgade händelsekort, bildstöd och en mjuk "Nu"-markering för var på dagen du är. Saker utan klockslag samlas längst ner.

### Changed

- **Uppdaterad appikon och PWA-ikoner** (2026-08-16): favicon.svg och alla PWA-ikoner (192, 512, maskable, Apple touch) matchar nu den uppdaterade MyFlove-loggan med violett bakgrund, vitt flödesspår och rosa accent. Den gamla favicon.ico är borttagen.
- **"Sätt dagens fokus"-knappen håller sig inom kanterna** (2026-08-16): Knappen på hemskärmen använder nu samma `MyFloveLinkButton`-komponent som resten av appen, så texten alltid ligger inuti knappen även på smala skärmar.
- **Tydligare hjärta i Daily Flow** (2026-08-16): Hjärtat i "Din kapacitet idag" har fått en mjuk cremefärgad bakgrundscirkel, bättre placering och en skugga så det syns tydligt mot den lavendelfärgade gradienten.
- **Resten av appen i samma design** (2026-08-16): Uppgifter, Flow Reset och Insight har fått samma pastellhero med emoji, rundare kort och tryckkänsla. Filterknapparna på Uppgifter är nu lavendelpiller, Flow Reset visar humöret som tre stora emoji-kort och kalenderns dagsvy har en tydligare "Nu"-markering.
- **Idag och fokusläget enligt skissen** (2026-08-16): "Din kapacitet idag" visar energi och belastning som lugna prickskalor i pastellgradient, och "Ditt fokus idag" numrerar dina tre första steg med färgade cirklar, tid, prioritet och friktion. Fokusläget har fått en stor ringtimer med start/paus mitt i cirkeln samt "Ta paus" och "Klar". "Vad ska jag göra nu?" avslutas med ett litet tips i stället för fler krav.

- **Designtokens för hela appen** (2026-08-16): Palett, rundningar (`rounded-xs`–`rounded-2xl`, `rounded-pill`), avstånd (`gutter`, `card`, `section`, `block`), skuggor (`shadow-soft`, `shadow-lifted`, `shadow-float`, `shadow-hairline`, `ring-focus`) och kantlinjer (`border-hairline`, `border-strong`, `border-dashed-soft`, `border-accent-soft`, `divider-hairline`) är nu gemensamma tokens i temat. Nya komponenter följer designen automatiskt utan hårdkodade värden, och allt anpassar sig i mörkt läge och NPF-läget "lugnare färger".
- **Ikoner och brickor i nya designen** (2026-08-16): Genvägar och överblicksbrickor på startsidan har fått pastellfärgade ikonplattor (lavendel, rosa, mint, ljusblå, sol) med rundade former, tydligare ikoner och en liten emoji i hörnet – t.ex. 🌸 Må bra, ✅ Att göra, 📅 Kalender, 🛍️ Inköp, 💊 Medicin och 🛑 Stop. Korten är rundare med lena skuggor och svarar med ett lätt tryck.
- **Ny känsla på startsida och QuickFlow** (2026-08-16): Hemskärmens hero går i pastell (lavendel, ljusblå, rosa, mint) efter tid på dygnet, och QuickFlow har fått samma mjuka hero med andande illustration.

### Changed

- **Hoppa över onboarding** (2026-08-16): En tydlig "Hoppa över"-knapp syns nu hela tiden uppe till höger i onboarding, plus en fullbredd knapp under framåtknappen som tar dig direkt till startsidan. "Nu kör vi" på sista steget leder också till `/hem`.
- **Onboarding som sveps i sidled** (2026-08-16): Välkomstkorten ligger nu i en karusell du kan svepa mellan med fingret. Progressen visas med punkter du kan trycka på plus en tydlig räknare ("Steg 2 av 4"), och du kan gå tillbaka utan att börja om.
- **Ny känsla: pasteller, mjuk rörelse och QuickFlow i mitten** (2026-08-16): Paletten har byggts ut med pasteller (lavendel, rosa, mint, ljusblå, creme) som fungerar i både ljust och mörkt läge. Sidor tonar mjukt in, kort poppar upp, illustrationer andas och knappar får ett lätt tryck. Bottennavigationen har nu fem platser med en upphöjd QuickFlow-knapp i mitten – Hem, ditt val, QuickFlow, ditt val och Mer. All rörelse stängs av automatiskt i NPF-läget "ingen rörelse".
- **Lila även på sidteman** (2026-08-16): Kalender, FlowPlan, FlowScore, Resor, Statistik, Ekonomi, Familj, Belöningar och övriga kategorisidor tintas nu i lila/rosa/mint istället för de gamla jord- och gråtonerna, så hela appen följer samma palett.
- **Ny design – mjuk lila** (2026-08-16): Hela appen har fått en ny färgvärld inspirerad av den lila skissen: ljus lila bakgrund, violett primärfärg, rosa accent och vita kort med mjuka, rundade former (radie 1.5rem). Rubriker sätts i Plus Jakarta Sans. Startsida, integritetssida och guiden följer samma palett.
- **Egen kategori för Flow** (2026-08-16): FlowPlan, Fokus, Veckans Flow, Quickflow, Hjälp, Belöningar och MyFlove Insight ligger nu i en egen kategori "Flow" i navigationen. "Din dag" innehåller Hem, Daglig rutin, Kalender, Att göra och Timer.
- **Egen kategori för hälsa** (2026-08-16): Må bra, Träning, FlowScore och Statistik ligger nu i en egen kategori "Hälsa" i navigationen istället för i "Din dag".

### Added

- **Stop-knapp i Hälsa** (2026-08-16): Stop-knappen finns nu även högst upp på "Må bra" – ett tryck ger andning och samtal med Flow innan ett impulsivt beslut.
- **Anpassa appen / NPF-läge** (2026-08-16): Ny sida `/anpassa` med globala val som gäller hela appen – färre saker på skärmen (extra hjälptexter göms), lugnare färger och mjukare skuggor, ingen rörelse/animation, enkla svenska ord istället för namn som FlowPlan och FlowScore, mer luft och större knappar, större text samt globalt bildstöd (slår även på symboler i kalendern). Valen sparas tills du ändrar dem och kan återställas.

- **Egen ordning på hemskärmen** (2026-08-16): I "Anpassa hemskärmen" kan du nu dra och släppa blocken (eller använda pilarna) för att bestämma ordningen på startsidan. Ordningen sparas tills du ändrar den, och kan återställas med "Återställ ordningen".
- **Anpassa hemskärmen** (2026-08-16): Hemskärmen startar i ett lugnare läge med färre block, och du väljer själv vad som ska synas via "Anpassa hemskärmen" – valet sparas tills du ändrar det.

- **Bygg om dagen** (2026-08-16): När saker passerat sin tid frågar MyFlove "Din dag blev annorlunda än planerat – vill du att jag bygger om resten av dagen?" och räknar om en realistisk plan utifrån kvarvarande tid, deadlines, energi, friktion och prioritet.
- **Daily Flow** (2026-08-16): Daglig incheckning på startsidan (energi, mental belastning, tillgänglig tid) som anpassar dagens rekommendationer, plus "Din dag i Flow" med max tre förslag och "Starta mitt Flow".
- **Vad ska jag göra nu?** (2026-08-16): En knapp som väger prioritet, deadline, tidsåtgång, friktion, energi och FlowScore och föreslår en enda sak – med "Börja nu", "Välj något annat" och "Inte idag".
- **Fokusläge** (2026-08-16): Lugn vy med uppgift, beräknad tid, timer och progress, och mjuka val efteråt (nästa, paus eller tillbaka).
- **QuickFlow flytande knapp** (2026-08-16): Alltid nåbar snabbdump utan kategorival, med förslag på påminnelse, uppgift eller kalender direkt efteråt.
- **QuickFlow-sortering** (2026-08-16): "Vill du att jag hjälper dig sortera?" med typförslag (uppgift, påminnelse, kalender, idé, minne) som alltid kan ändras, samt varsam uppföljning av saker som legat kvar några dagar.
- **Flow Reset** (2026-08-16): Frivilligt kvällsläge med dagsform, sammanfattning av dagen och erbjudande om att planera om utan skuld.
- **Veckans Flow** (2026-08-16): Ny vy på `/veckans-flow` med veckans sammanfattning, vad som hjälpte mest och lugna observationer om mönster.
- **Onboarding** (2026-08-16): Kort första-gången-flöde där du väljer vad MyFlove främst ska hjälpa dig med.
- Barnvy: ladda upp en bild eller ett dokument på skolschemat som ligger kvar i schemavyn (2026-08-15).
- Barnvy: lägg in barnets skolschema (ämne, tid, sal, lärare) som ligger kvar vecka efter vecka, med inklistring av schematext, markering av dagens lektioner och "Nästa lektion" överst (2026-08-15).
- Tyst läge: pausa alla påminnelser i 30 min–8 timmar, eller ställ in en återkommande tyst period nattetid (2026-08-15).
- Inköpslista: välj själv hur nära butiken påminnelsen ska komma – "I affären" (80 m), "Alldeles nära" (300 m) eller "I området" (1 km) (2026-08-15).

### Changed

- Barnvyn fastnar inte längre på "Laddar barn" vid nätverksstrul – visar felmeddelande med "Försök igen" (2026-08-15).

### Deprecated

### Removed

### Fixed

- Hem: dubbla förslagsrubriker borttagna – bara "Förslag just nu" visas nu (2026-08-15).
- Kalender: "Ny händelse"-knappen fick samma utseende och format som "+ Påminnelse" för ett mer konsekvent gränssnitt (2026-08-15).

### Security

## [0.9.0] - 2026-08-15

### Added

- **Fullständig changelog** (2026-08-15): All historik sedan projektstart samlad i `CHANGELOG.md` och i appens changelog-export.

## [0.8.0] - 2026-08-14

### Added

- **Glömt lösenord** (2026-08-14): `/glomt-losenord` mejlar återställningslänk, `/nytt-losenord` sätter nytt lösenord, länk från inloggningen.
- **Promenadvägar** (2026-08-14): Riktningsbaserade gångvägar i närområdet via OpenStreetMap Overpass, höjddata och kartförhandsvisning, med "Uppdatera min plats".

### Fixed

- Overpass-anrop returnerade tidvis 406 (2026-08-14) – rättat med korrekt Accept-header och User-Agent.

### Security

- SEO- och metadatafixar (2026-08-14): sidspecifika og-taggar, Organization/WebSite JSON-LD, site verification.

## [0.7.0] - 2026-08-13

### Added

- **Hjälptexter** (2026-08-14): Kontextuella i-knappar på 17+ sidor.
- **Tillbakaknapp** (2026-08-14): Historikbaserad navigering i layouten.
- **Introtur & enkelt läge** (2026-08-14): Guidad rundtur, svenska underrubriker och naturligt språk för FlowScore.
- **Minimera/maximera** (2026-08-14): Persistenta kollapsbara sektioner i ~35 vyer.
- **Områdesfiltrering** (2026-08-14): Hemskärmen visar bara valt rum, "Alla" slår ihop.

### Changed

- Blueprint uppdaterad till 2.7, ny presentation och ny preview-video (v5) (2026-08-14).

## [0.6.0] - 2026-08-12

### Added

- **StudyFlow™** (2026-08-13): Pluggläge med föreläsningsläge, kapacitetsplanering och kalenderkoppling.
- **Schemaimport** (2026-08-14): AI-tolkning av schema samt "nästa lektion" med plats och vägbeskrivning.
- **Lektionspåminnelser** (2026-08-14): Push när nästa lektion närmar sig.
- **FlowScore-vy** (2026-08-13): Egen central vy för kapacitetspoäng.
- **MyFlove Insight™** (2026-08-13): Demoprofiler för NPF och adaptiva strategier.
- **WorkFlow™** (2026-08-13): Arbetsläge med omplanering, mötesläge och Nu-lista.
- **Quickflow** (2026-08-13): Snabbinfångst med automatisk dubbletthantering.
- **Budget** (2026-08-12): Budgetpanel i ekonomi.
- **StudyBuddy/FlowStudy** (2026-08-13): AI-flashcards, quiz och Leitner-repetition.
- **Träning** (2026-08-11): Styrka/kondition, AI-pass och hälsoapp-koppling via Capacitor.
- **Livsområden** (2026-08-13): Vardag, Studier, Jobb, Privat med egna färger, grupperad navigation och global sök.

### Changed

- Prov läggs inte längre in automatiskt i kalendern; repetition rensas via purge-hook (2026-08-14).

## [0.5.0] - 2026-07-20

### Added

- **Push-notiser** (2026-07-18): Service worker, `push_subscriptions` och notiser för medicin, väder och påminnelser.
- **Återkommande påminnelser** (2026-07-20): Dagligen, veckovis och vardagar.
- **MCP-server** (2026-07-20): Agentintegration på `/mcp`.
- **Capacitor** (2026-07-20): iOS/Android-paketering med `MOBILE_BUILD.md`.
- **Familj/hushåll** (2026-07-20): Join-koder, delad inköpslista och kalender.
- **Proaktiva förslag** (2026-07-20): Loop-nudgar utifrån uppgifter, humör och väder.
- **Adminöversikt** (2026-07-20): Friktionsrapporter, rollhantering och changelog-export.
- **Rutiner** (2026-07-19): Rutinlista med molnsynk och notiser.
- **Kalenderintegration** (2026-07-09): ICS-import/export.
- **Tid & påminnelse** (2026-07-20): Specifik tid på uppgifter med alarmljud.
- **Valbara genvägar** (2026-07-20): Fyra egna appar på hemskärmen.

### Fixed

- Uppgifter försvann mellan dagar (2026-07-20) – flyttade från localStorage till `user_kv`.

### Security

- RLS-härdning och återkallad publik exekvering på interna funktioner (2026-07-20).

## [0.3.0] - 2026-07-09

### Added

- **Energikarta** (2026-07-08): Loggning av energinivåer, integrerad i FlowPlan.
- **Väderkort** (2026-07-08): Open-Meteo med geolokalisering på startsidan.
- **Matlista utan familj** (2026-07-09): Lokalt läge för användare utan hushåll.
- **Admin & statistik** (2026-07-08): `user_roles`, admin-gating och appstatistik.
- **Resor** (2026-07-08): Trafiklab ResRobot v2.1 med pendlingsvarningar.
- **Friktionsindex** (2026-07-08): `friction_items`/`friction_votes` med röstning.
- **FlowPlan™** (2026-07-08): AI-driven sekvensplanering.
- **Flow AI-personlighet** (2026-07-08): Dagsformsanpassat stöd.
- **Designsystem** (2026-07-08): Jordnära palett och Flow-voice-copy.
- **Publicering** (2026-07-09): Delbar testapp med PWA-stöd.

### Fixed

- Kalendern nåddes inte (2026-07-09) – routing rättad till `/kalender`.

## [0.1.0] - 2026-07-23

Initial baseline av MyFlove — ett svenskspråkigt "lugnt livsflöde"-dashboard byggt med TanStack Start, React 19, Tailwind CSS och Lovable Cloud.

### Added

- **Autentisering** (2026-07-23): Inloggning/registrering och skyddade sidor under `/_app`.
- **Dashboard/Hem** (2026-07-23): Startsida med genvägar, widget-grid och väderkort.
- **Fokus & Att göra** (2026-07-23): Daglig fokuspunkt samt uppgiftshantering med kategorier, status, delsteg, snooze och kalenderkoppling.
- **Kalender & Påminnelser** (2026-07-23): Återkommande påminnelser med tid och notiser.
- **Daglig rutin & Pomodoro** (2026-07-23): Rutinvy samt fokus-timer.
- **Dumping (brain dump)** (2026-07-23): Snabb idé-/tankeinsamling.
- **Må bra** (2026-07-23): Humörloggning och wellness-vy.
- **Medicin** (2026-07-23): Medicinlistor med schemalagda tider och intagsloggning.
- **Inköp & Matlista** (2026-07-23): Delad hushållsbaserad inköpslista med lokal fallback.
- **Ekonomi** (2026-07-23): Enkel transaktionshantering per kategori.
- **Resor** (2026-07-23): Sparade resor/hållplatser med pendlingsvarningar.
- **Familj** (2026-07-23): Delade funktioner för hushåll/familj.
- **Statistik & Belöningar** (2026-07-23): Statistikvy och achievements.
- **AI-assistent (Flow)** (2026-07-23): Chattbaserad assistent med MCP-verktyg.
- **Molnsynk** (2026-07-23): Offline-first lagring med best-effort synk.
- **Juridiskt** (2026-07-23): Integritetspolicy, villkor och cookies.
