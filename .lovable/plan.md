# En sammanhållen Paceable-app, steg för steg

## Mål
Använd det färdiga Pace-designsystemet för samma godkända utseende i hela appen. Börja med menyn och sidrubrikerna, fortsätt därefter formulär för formulär. Ingen ny designriktning och ingen publicering.

## Etapp 1 – menyn och sidrubrikerna
- Granska den synliga mobilmenyn, desktopmenyn, Mer och sidornas faktiska rubriker före ändring.
- Enhetliggör endast avvikande textroller, avstånd, kontrast, fokus och markeringar med befintliga byggdelar.
- Behåll menyernas struktur, ordning, benämningar, länkar, sökning, Enkelt läge, expansioner och behörighetsfilter. Behåll även Äldre Hem.
- Orienterande sidrubriker får den godkända, uttryckliga Fraunces-rollen; funktionella rubriker, knappar, etiketter och kalenderperioder använder Inter. Ingen automatisk serif på alla rubriker.
- Idags hälsning, godkända primärvyer, logotyper och stenarnas exakta utseende/placering lämnas oförändrade där de redan följer systemet.

## Följande etapper – formulär för formulär
Varje etapp består av en liten grupp, inte en global massändring:

1. **Konto och inställningar:** kvarvarande profil-, anpassnings- och inställningsformulär.
2. **Ork och återhämtning:** kvarvarande mående-, energi-, återhämtnings-, rutin- och påminnelseformulär.
3. **Min vardag:** uppgifter, planering, arbete, studier, ekonomi och hemverktyg.
4. **Stöd och samtal:** kvarvarande antecknings-, reflektions- och samtalsformulär samt äldre Hem/Pace-ytor.
5. **Familj och övrigt:** familje- och barnformulär, historik, fördjupningar och behörighetsstyrda verktyg.

För varje grupp:
- Inventera även dialoger, utfällda delar, redigering och fel-/tomlägen. Markera varje formulär som redan enhetligt, behöver anpassning, verifierat eller blockerat.
- Öppna och granska formuläret före ändring; färgklassnamn ensamma bevisar inte en visuell avvikelse.
- Anpassa yta, rubrikhierarki, fält, val, hjälp, fel och åtgärder med befintliga Pace-mönster. Redan anpassade pilotformulär kontrolleras men görs inte om i onödan.
- Behåll exakt samma alternativ, värden, fält-ID:n, ordning, validering och handlingar. Osparade val, Avbryt, Spara och felhantering får inte ändras.
- Kalender-, Fånga- och visningsnamnsformulär granskas också; redan godkända lösningar bevaras. Eventuell nödvändig presentation där avgränsas särskilt utan ändrad geometri eller beteende.
- Redovisa gruppens resultat och kvarstående begränsningar före nästa grupp. Pausa om fortsatt arbete kräver funktionsändring eller ett nytt designbeslut.

## Skyddsgränser
Ingen ändring av data, lagring, synk, auth, behörigheter, familjedelning, notiser, routes, tekniska identifierare eller native-appar. Capacity, Load, Pace och kalenderns tids-/draggeometri bevaras. Betydelsebärande områdesfärger och destruktiva varningar behålls. Pace och Din takt förblir separata; pausat 3D-/animationsarbete återupptas inte.

## Verifiering och leverans per etapp
- Ljust/mörkt läge, 360/390/430/768/1024/1280/1440 px och 200 % text.
- Långa namn, naturlig radbrytning, inga kapade texter, läsbar kontrast, minst 44×44 px för handlingar.
- Tangentbord, synligt fokus, dialogöppning/stängning och fokusåtergång samt reducerad rörelse.
- Relevanta tester för sparning, utkast och avbrytning utan att ändra användarens riktiga uppgifter; full testsvit och aktuell felkontroll inför etappavslut.
- Skärmbilder, formulärlista och ändringsloggar. Fysiska telefoner, skärmläsare eller verklig fler-enhetssynk markeras som ej verifierade om de inte faktiskt testats.

## Tekniskt genomförande och insats
Återanvänd `PacePage`, `PaceHeading`, fält-/dialogmönstren och befintliga semantiska tokens. Presentation optas in lokalt; gemensamma ändringar får inte spridas till oinventerade ytor. Inga nya paket, assets eller parallella formulär-/sparningssystem.

Etapp 1 är den minsta starten: främst gemensam menypresentation och sidrubriker, liten till medelstor insats. Formulärgrupperna är medelstora och familj/komplex planering kräver mer verifiering. Exakt antal och insats fastställs efter öppnad-formulärinventeringen; någon fast kostnad eller fullständig täckning utlovas inte innan dess.

Godkännande av planen ger klartecken för denna stegvisa presentationsanpassning, med etapp 1 först. Publicering kräver ett separat uttryckligt godkännande.