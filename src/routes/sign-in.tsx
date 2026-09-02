import { track } from "@/lib/analytics";
import { isDemoUser, setDemoSession } from "@/lib/demo-account";
import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { withBackendRecovery, isBackendAsleepError } from "@/lib/backend-wake";
import PwaInstallButton from "@/components/pwa-install-button";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Logga in – MyFlove" },
      {
        name: "description",
        content:
          "Logga in på MyFlove – din lugna följeslagare för vardagen med kalender, uppgifter, humör och mer.",
      },
      { property: "og:title", content: "Logga in – MyFlove" },
      {
        property: "og:description",
        content: "Logga in på MyFlove och fortsätt där du släppte – lugnt och samlat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Logga in – MyFlove" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "MyFlove – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:url", content: "https://myflove.lovable.app/sign-in" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/sign-in" }],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  component: SignInPage,
});

function safeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/hem";
  return next;
}

function SignInPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await withBackendRecovery(
      () => supabase.auth.signInWithPassword({ email, password }),
      (status) => setWaking(status === "waking"),
    );
    setLoading(false);
    setWaking(false);
    if (error) {
      toast({
        title: "Kunde inte logga in",
        description: isBackendAsleepError(error)
          ? "Tjänsten vaknar fortfarande. Vänta en liten stund och försök igen."
          : (error as { message?: string }).message,
        variant: "destructive",
      });
      return;
    }
    setDemoSession(isDemoUser(data.user));
    track("login", { result: "completed" });
    const target = safeNext(next);
    window.location.href = target;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-primary tracking-tight">
          Logga in på MyFlove — Ditt stöd i vardagen
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Välkommen tillbaka. Logga in för att fortsätta din flow.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {waking ? "Väcker tjänsten…" : loading ? "Loggar in…" : "Logga in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/glomt-losenord" className="text-muted-foreground underline underline-offset-4">
            Glömt lösenord?
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Inget konto?{" "}
          <Link
            to="/sign-up"
            search={{ next }}
            className="text-primary underline underline-offset-4"
          >
            Skapa ett här
          </Link>
        </p>
        <div className="mt-6 border-t border-border pt-4">
          <PwaInstallButton variant="outline" />
        </div>
      </div>
    </div>
  );
}
