# Barn som etikett inom Familj

## Det här bygger vi
- Behåll **Familj** som huvudområde och lägg till valen **Barn**, **Familj gemensamt** och **Förälder/omsorg** inuti området.
- Utöka Familjs pictogrambank med barnvardag: omsorg, hämta/lämna, lek, bad, tänder, måltid, läggning, fri tid, läsa, förskola/skola, vårdbesök och medicin.
- Visa den valda etiketten med pictogram och kort text i Vecka, Idag och Nu/Nästa, men med samma lugna Familj-färg.
- När etiketten är Barn visar schemat även det redan valda barnets namn, exempelvis **Barn · Bella**.

## Tekniskt
- Återanvänd befintlig `child_items`-rad och dess `child_id`; ingen ny tabell eller separat aktivitetsmodell skapas.
- Spara den valfria Familj-etiketten i samma befintliga visuella metadata som pictogram, område och sluttid.
- Bevara bakåtkompatibilitet: äldre aktiviteter utan etikett fortsätter fungera som tidigare.
- Mallar och kopior behåller etiketten, medan befintligt dubblettskydd fortsätter gälla.

## Kontroll
- Testa metadata, sökning, kopiering/mallar och att Barn aldrig blir ett huvudområde.
- Kontrollera mobil 360/375/390/430 och desktop utan horisontell overflow.
- Kör typkontroll, relevanta tester och byggkontroll.
