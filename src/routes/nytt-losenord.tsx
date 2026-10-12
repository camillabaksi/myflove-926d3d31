import { PUBLIC_BASE_URL } from "@/lib/public-url";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/nytt-losenord")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Välj nytt lösenord – Paceable" },
      {
        name: "description",
        content: "Skapa ett nytt lösenord till ditt Paceable-konto och logga in igen.",
      },
      { property: "og:title", content: "Välj nytt lösenord – Paceable" },
      { property: "og:description", content: "Skapa ett nytt lösenord till ditt Paceable-konto." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${PUBLIC_BASE_URL}/nytt-losenord` },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPasswordPage,
});

function NewPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast({
        title: "För kort lösenord",
        description: "Använd minst 8 tecken.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Lösenorden matchar inte",
        description: "Skriv samma lösenord i båda fälten.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Klart", description: "Ditt lösenord är uppdaterat." });
    navigate({ to: "/idag" });
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary">Välj nytt lösenord</h1>
        {ready && !hasSession ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Länken verkar ha gått ut eller redan använts. Begär en ny återställningslänk så fixar
              vi det.
            </p>
            <Link to="/glomt-losenord">
              <Button className="w-full">Begär ny länk</Button>
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Skriv ditt nya lösenord två gånger, så är du inne igen.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nytt lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Upprepa lösenord</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading || !ready} className="w-full">
                {loading ? "Sparar…" : "Spara nytt lösenord"}
              </Button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/sign-in" className="text-primary underline underline-offset-4">
            Tillbaka till inloggning
          </Link>
        </p>
      </div>
    </div>
  );
}
