# Visuell UI/UX-granskning av Paceable (endast granskning)

Ingen kod, databas, inställning, API eller publicering ändras. Leverans: en granskningsrapport med skärmbilder i Filer.

## Vad som granskas
Idag, Kalender (dag/vecka/månad), Tankar, Min plats, Mer och menyer, Pace-chatten, Planera, Mitt batteri/Historik/Insikter, Kvällsstund, Familj/Barn, Hälsa/Återhämtning, Uppgifter/Påminnelser/Rutiner, Studier, Ekonomi, Profil/Inställningar samt öppnade dialoger (loggning, Fånga, lägg till aktivitet, prickmenyer).

## Hur
1. Öppna förhandsvisningen inloggad med ditt eget konto, enbart läsande: inga sparningar, avbockningar eller utkast. Dialoger öppnas och stängs utan att skicka något.
2. Skärmbilder per vy i 320, 360, 390 px (Android-mått), 768 px och 1280 px, normal och stor text (appens textinställning tillfälligt i webbläsarens minne, inte sparad på kontot), ljust läge plus stickprov i mörkt.
3. Mätningar i webbläsaren: sidledes scroll, avklippta/ellipsade ord, tvingade enradiga rubriker, tryckytor under 44 px, avvikande rubrikmönster, röd/grön-signaler, andel färgyta.
4. Jämför mot befintliga gemensamma regler för att skilja globala grundproblem från sådant som redan rättas, så att inga dubbla åtgärder föreslås.
5. Vyer som inte går att se (t.ex. barnkonto, tomma tillstånd, native-specifikt) listas uttryckligen som "ej visuellt sett".

## Rapporten (svenska)
- Tabell med 5–12 högst prioriterade visuella avvikelser: vy/komponent, vad som syns (med bild), konsekvens för NPF/hög belastning, minsta föreslagna justering.
- Varje punkt märks **Visuellt verifierad** eller **Endast kod**.
- Globala grundproblem vs redan korrigerat av befintliga regler.
- Lista över vyer som inte kunde ses och varför.
- Sparas som `/mnt/documents/Paceable-visuell-granskning-2026-10-23/` (rapport + skärmbilder).

## Begränsningar
Webbläsartest ersätter inte fysisk Android/iPhone, systemets textstorlek i appen, tangentbord eller skärmläsare; det anges tydligt.
