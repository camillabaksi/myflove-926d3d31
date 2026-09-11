# Zero-Guilt UX för MyFlove

## Mål

Göra MyFlove lugnare och lättare att förstå vid hög kognitiv belastning, utan att ta bort funktioner eller ändra användarens sparade innehåll.

## Det här byggs

1. **Lugn startsida**
   - Låt batteriet vara den tydligaste signalen när appen öppnas.
   - Visa en kort, varm hälsning och bara dagens två rekommenderade val ovanför övrigt innehåll.
   - Behåll övriga funktioner längre ned eller hopfällda.
   - Använd Flows befintliga långsamma andningsrörelse, med stöd för “Ingen rörelse”.

2. **Två tydliga val från FlowScore**
   - Ersätt öppna frågor på startsidan med exakt två konkreta val baserade på aktuell energi och befintliga uppgifter.
   - Första valet blir den enklaste rimliga saken, vanligtvis högst fem minuter.
   - Andra valet blir återhämtning, exempelvis en tvåminuters mikropaus.

3. **Ingen-skuld-logik för uppgifter**
   - Visa passerade uppgifter som “Saker vi tar när du har energi”, utan varningsikon eller röd markering.
   - Flytta dem visuellt och tyst till den trygga sektionen; ändra eller radera inte användarens ursprungliga datum.
   - Säkerställ varm återkomsttext efter frånvaro, utan skuld eller kommentarer om hur länge användaren varit borta.

4. **Mjuk återkoppling**
   - Ersätt konfetti och skarpa firanden vid slutförande med en mjuk upplösning/fade.
   - Använd diskret haptik där enheten stöder det och respektera tyst läge samt reducerad rörelse.
   - Visa korta grundande Flow-meddelanden efter slutförd eller uppskjuten uppgift.

5. **Akut Lugn i 15 minuter**
   - Lägg en diskret men lättåtkomlig knapp på Hem.
   - Vid aktivering används befintlig pauslogik för att tysta påminnelser i 15 minuter; scheman och kalenderposter ändras inte.
   - Visa en mörk, ombonad helskärmsvy med Flow, återstående tid och den angivna lugna texten.
   - Dölj uppgifter under pausen och ge möjlighet att avsluta tidigare.

6. **Konsekvent mikrotext**
   - Rensa berörda huvudflöden från varningsspråk, utropstecken och prestationsinriktade formuleringar.
   - Behåll säkerhetskritiska meddelanden tydliga där de måste vara det.

## Teknisk kontroll

- Återanvänd befintliga hooks för batteri, FlowScore, uppgifter, NPF-läge, haptik och pausade påminnelser.
- Lägg beteendet i små återanvändbara komponenter och ren logik med tester.
- Uppdatera båda ändringsloggarna.
- Kör formattering, typkontroll, riktade tester och full testsvit samt kontrollera aktuell byggstatus.
- Kontrollera Hem och uppgiftsvyn i mobilbredd 411 px och desktop; autentiserade vyer verifieras när testsession finns.
