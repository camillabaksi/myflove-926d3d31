# Roadmap

Uppdaterad 2026-10-23. Listan innehåller bara det som faktiskt återstår. Allt äldre,
genomfört eller inte längre aktuellt ligger oförändrat i `docs/roadmap-arkiv-2026-10-23.md`
(565 rader, 45 öppna punkter före städningen).

## Väntar på ditt beslut
- [ ] Taktilt djup: jämförelse mellan Fraunces och Newsreader. Newsreader finns inte i appen än, så jämförelsen är inte gjord.
- [ ] Etapp 2: sid-specifika gradienter och hårdkodade färger. 316 färgkoderna ligger kvar i 21 filer, mest i kalendern, Kvällsstund och test-sidan.
- [ ] Läsbarhet i de fasta veckoblocken vid 200 % text. Kräver att dagbredderna låses upp, vilket ändrar kalenderns tidsgeometri.
- [ ] Flows sittande pose och hårspänne. Figur och scen behöver ditt godkännande innan de byggs.
- [ ] Rumsbilder i Anpassa och Min samling. Flows figur är inbakad i hela scenen och kan inte tas bort som en egen bild.

## Blockerat – kräver något utanför mig
- [ ] Android 6.8/29 och iOS 1.6/18 till TestFlight och Play. Codemagic-flödena finns i `codemagic.yaml`, men jag saknar Codemagic-nyckeln och uppladdningsnyckeln till Google Play.
- [ ] Riktig synkkontroll mellan två enheter. Kräver ett isolerat testkonto och två telefoner; jag vill inte spara testgrejer i ditt personliga konto.
- [ ] Djupare säkerhetskontroll av koden, plus kontroll av flera konton och notiser. Kräver en aktuell djupskanning och en egen testmiljö.
- [ ] Dagsanteckningen "Det som också tog plats" in i Pace-förslag. Spärrad tills AI-tjänstens loggning är verifierat innehållsfri. Ingen text skickas idag.
- [ ] Kontroller i mobilappen: ljud, vibration, notiser, inloggning, kontobyte, utseende och skärmkanter. Kräver fysiska telefoner.
- [ ] Filmgranskningar som väntar: den förfina 3D-filmen saknar sin ursprungliga källa, två filmer om Min plats/chatt/återhämtning fastnade i renderingsfelet, och en verklig realtidsgranskning kräver en spelare som fungerar.

## Ej påbörjat
- [ ] Serverstyrd versionshantering för synkkonflikter. En serverstyrd tidsstämpel styr redan vilken skrivning som får gå igenom, men en egen räknare per post saknas, så vid motsatta ändringar på två enheter vinner den senaste ändringstiden – och enheternas klockor kan skilja sig något.

## Klart och stängt i denna städning
- Landningssidan: sloganen "Ditt liv, i din takt.", rubriken "Du behöver inte hålla allt i huvudet." och ett språkval mellan svenska och engelska finns på plats. Engelskan översätter sidans exempel och dialoger; sloganen står kvar på svenska med flit.
- Kalender: månad, vecka och dag finns. Dagvyn listar aktiviteter med och utan bestämd tid, med pågående perioder och "Just nu". Den grafiska tidslinjen ligger i veckodelen "Visa veckans tidslinje", och en aktivitet bockas av i sin detaljvy.
- Historik: ligger i Mer under Insikter & historik och syns även i enkelt läge.
- Rubriker och kompakta avstånd: 42 sidor använder gemensamma sidhuvudet och 42 den kompakta layouten.
- Fånga: heter Fånga i huvudmenyn även med enkelt språk, och undersidors ordval behålls.
- Hem-dialogens fokus efter Escape: Hem är idag bara en omdirigering till Idag, så dialogen finns inte kvar. Skriv till om du ändå ser ett fokusproblem.
- Designlåset från etapp 1–2, Kvällsstund och Mer: godkänt och publicerat 2026-10-23.
- Samlad kalenderplanering, återstående rubriker och formulär samt etapp 1D:s bilder: ersatta av senare etapper som är godkända och publicerade.
