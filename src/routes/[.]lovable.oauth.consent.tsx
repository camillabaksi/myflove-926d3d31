import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta @supabase/supabase-js OAuth namespace shim.
type OAuthResult = {
  data: {
    client?: { name?: string; client_id?: string };
    redirect_url?: string;
    redirect_to?: string;
    scope?: string;
  } | null;
  error: { message: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function oauth(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Godkänn appkoppling – Paceable" },
    { name: "description", content: "Granska och godkänn eller avböj en appkoppling till ditt Paceable-konto." },
    { property: "og:title", content: "Godkänn appkoppling – Paceable" },
    { property: "og:description", content: "Granska åtkomsten innan du godkänner en appkoppling." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/sign-in", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-2xl font-semibold text-primary">Något gick fel</h1>
      <p className="text-sm text-muted-foreground">
        Kunde inte läsa den här kopplingen: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "En app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Ingen returadress från auktoriseringsservern.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center p-6">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-primary">
          Koppla {clientName} till Paceable
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Detta låter <strong>{clientName}</strong> använda Paceables verktyg som dig — läsa och
          lägga till dina uppgifter samt logga humör. Dina rättigheter i appen gäller fortfarande.
        </p>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button disabled={busy} onClick={() => decide(true)} className="w-full">
            {busy ? "Kopplar…" : "Godkänn"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(false)}
            variant="outline"
            className="w-full"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </main>
  );
}
