# Energiflöde – förslag på integration

Energiflöde blir en ny del som beskriver **vad som påverkar din kapacitet**, till skillnad från kalender/att göra som beskriver **vad du ska göra**. Det byggs in i befintlig FlowScore-, Friktions- och Flow-logik – inget parallellt system.

## Så hänger det ihop med det som redan finns

```text
Energikartan (nivå 1–5 just nu)  ─┐
Energiflöde (faktorer: ger/tar)  ─┼─► FlowScore  ─► Min dag / Fokus / Omplanera
Friktionsbiblioteket (tunga saker)┘        │
                                           └─► Flow (chatt, förslag, mönster)
```

- **Energikartan** svarar på "hur är min energi nu". **Energiflöde** svarar på "vad gjorde att den blev så". De ligger därför ihop: Energiflöde blir en egen sida `/energifloede`, med tydliga länkar mellan de två (och en genväg från FlowScore-sidan). Ingen ny plats i bottennavigationen.
- **FlowScore** får en ny faktor "Energiflöde idag" bredvid Energi, Mående, Tid på dygnet osv. Den visas med samma förklaringsspråk (källa, avläsning, varför) som övriga faktorer.
- **Friktionsbiblioteket** kopplas ihop: en energipost kan märkas som återkommande dränare, och Flow kan då föreslå att den läggs in i friktionsbiblioteket. Matchande friktion nämns i förklaringen.

## Vad användaren kan göra

- Lägga till en energipost: titel, 🔋 ger energi / 🪫 tar energi, styrka 1–5, valfri kategori (sömn, socialt, rörelse, ljud/miljö, stress, återhämtning, egentid, annat) och valfri anteckning. Snabbknappar för egna, sparade favoriter så att vardagsloggning tar två tryck.
- Se dagens energibalans: en lugn rad med det som gett och tagit energi idag, samt nettosumma.
- Se enkla mönster över tid (14/30 dagar): vilka kategorier och vilka egna poster som oftast ger respektive tar energi, och hur ofta.
- Styra påverkan själv: reglage "Hur mycket får Energiflöde påverka FlowScore?" (av / lite / normal / mycket) och möjlighet att stänga av enskilda posters påverkan.

## Flow och rekommendationer

Flow får mönstren som kontext och kan säga saker som:
"Jag ser att dålig sömn ofta drar ner din kapacitet. Idag är det flera krävande saker inplanerade – vill du att jag gör planen lättare?"
Knappen kopplas till befintlig omplanera-logik (Behåll plan / Gör lättare / Bara det viktigaste). Språket följer Flow-voice: aldrig dömande, alltid ett erbjudande.

Låg energibalans + hög belastning sänker FlowScore, vilket automatiskt påverkar "Ditt fokus idag", antal föreslagna uppgifter och maxfriktion – ingen extra logik behövs där.

## Teknisk plan

1. **Databas** (migration): tabell `energy_factors` (id, user_id, title, direction 'gives'|'drains', strength 1–5, category, note, occurred_at, created_at) plus `energy_factor_presets` för egna snabbknappar. RLS scoped till `auth.uid()`, GRANT till `authenticated` + `service_role`. Inställningar (påverkansgrad) lagras i befintliga `user_kv`.
2. **`src/lib/energy-flow.ts`** – rena funktioner: dagens balans, mönster per kategori/titel, och `energyFlowDelta()` som översätter balans + påverkansgrad till en FlowScore-delta med färdig `FlowFactor`-förklaring.
3. **`src/hooks/use-energy-flow.ts`** – laddning, tillägg, borttagning, presets, inställningar (samma mönster som `use-energy-pattern`).
4. **FlowScore**: `FlowScoreInput` får `energyFlow?: { net: number; topDrain?: string; topBoost?: string; weight: number }`; `computeFlowScore` lägger till faktorn; `useFlowScore` matar in den. Vikt 0 = ingen påverkan alls.
5. **Sida `src/pages/energy-flow.tsx` + route `_app.energifloede.tsx`** – byggd med befintliga MyFlove-komponenter, kollaps/minimera-stöd, hjälptext (i-knapp), enkel och normal vy.
6. **Flow-koppling**: mönstren läggs i Flow-kontexten (`flow-context` / assistentens systemkontext) och används i förslagen på Hem/Min dag, återanvänder omplanera-flödet.
7. **Navigation**: kort i Hälsa-gruppen bredvid Energikartan och genväg från FlowScore – ingen ändring av bottennavigationen.
8. **CHANGELOG.md + src/lib/changelog.ts** uppdateras.

Energiposter skapar aldrig kalenderhändelser eller uppgifter.
