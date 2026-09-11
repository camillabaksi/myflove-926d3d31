# CLAUDE.md — Projektregler & Instruktioner

## 🛠 Command Cheatsheet

- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Type Check:** `npx tsc --noEmit`
- **Lint:** `npm run lint`

## 🏗 Tech Stack & Principer

- **Framework:** TanStack Start (SSR, filbaserad routing i `src/routes/`, server-funktioner i `.server.ts`).
- **UI & Style:** React 19, Tailwind CSS, Lucide Icons, Shadcn/ui.
- **Backend & Auth:** Supabase (databas, lagring och autentisering). `src/compat/clerk.tsx` är endast ett kompatibilitetslager.
- **Language:** TypeScript. Använd **aldrig** `any` — skriv tydliga typer och interfaces.

## ⚠️ Strikta Skyddsregler (Bryt inte dessa)

1. **Rör inte `.env`:** Ändra aldrig miljövariabler eller Supabase/Clerk-nycklar utan explicit instruktion.
2. **Bevara authflödet:** Ändra inte Supabase-autentiseringen eller hur sessionstoken skickas till serverfunktioner utan godkännande.
3. **Bevara TanStack-routing:** Följ TanStack Starts filkonventioner under `src/routes/`. Skapa inte egna ad hoc-routrar.
4. **Inga onödiga paket:** Installera inga nya npm-paket om uppgiften kan lösas med befintlig tech-stack.

## 📝 Kodstil & Praxis

- Skriv ren, modulariserad kod. Håll komponenter i `src/components/` fokuserade på sin uppgift.
- Placera serverlogik och databasanrop i `.server.ts`-filer eller dedikerade hooks/API-klienter (`src/lib/`).
- Använd funktionella komponenter med moderna React 19-mönster.

## 🔄 Commit & Dokumentation

- Uppdatera alltid `CHANGELOG.md` när nya funktioner, fixar eller större ändringar genomförs.
- Skriv tydliga commit-meddelanden på svenska eller engelska (t.ex. `feat: lägg till ny meny` eller `fix: åtgärda inloggningsbugg`).
