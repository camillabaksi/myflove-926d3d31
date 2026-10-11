import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ensureDevTestUserFn } from "@/lib/dev-session.functions";

export const Route = createFileRoute("/dev-session")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Utvecklingsläge – testsession | Paceable" },
      {
        name: "description",
        content:
          "Internt utvecklingsläge för Paceable: skapa en testsession för att QA:a klickflöden i previewen.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Utvecklingsläge – testsession | Paceable" },
      {
        property: "og:description",
        content: "Internt utvecklingsläge för QA av klickflöden i Paceable-previewen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DevSessionPage,
});

function DevSessionPage() {
  const isDev = import.meta.env.DEV;
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function mintSession() {
    setBusy(true);
    setStatus("Skapar testkonto …");
    try {
      const creds = await ensureDevTestUserFn();
      setStatus(`Loggar in som ${creds.email} …`);
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw new Error(error.message);
      setStatus("Inloggad! Skickar dig till Hem …");
      window.location.href = "/idag";
    } catch (e) {
      setStatus(`Misslyckades: ${(e as Error).message}`);
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStatus("Utloggad.");
  }

  if (!isDev) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Utvecklingsläge är avstängt</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Testsessioner går bara att skapa i previewen, inte i den publicerade appen.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Till startsidan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Utvecklingsläge · testsession</h1>
        <p className="text-sm text-muted-foreground">
          Skapar (eller återställer) testkontot och loggar in direkt, så att du kan QA:a klickflöden
          på Hem utan att skriva lösenord.
        </p>
        <Button className="w-full" onClick={mintSession} disabled={busy}>
          {busy ? "Arbetar …" : "Logga in som testanvändare"}
        </Button>
        <Button variant="outline" className="w-full" onClick={signOut} disabled={busy}>
          Logga ut
        </Button>
        {status && <p className="text-sm text-ink">{status}</p>}
        <p className="text-xs text-muted-foreground">
          Sidan finns bara i previewen och är blockerad i publicerad app.
        </p>
      </div>
    </main>
  );
}
