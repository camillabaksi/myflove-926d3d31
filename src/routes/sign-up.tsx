import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/sign-up")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: SignUpPage,
});

function safeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/hem";
  return next;
}

function SignUpPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast({
        title: "Godkänn villkoren",
        description: "Du behöver godkänna villkor och integritetspolicy för att skapa konto.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const target = safeNext(next);
    const redirectUrl = `${window.location.origin}${target}`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Kunde inte skapa konto", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Konto skapat", description: "Du kan logga in nu." });
    navigate({ to: "/sign-in", search: { next: target } });
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-primary tracking-tight">Skapa konto</h1>
        <p className="mb-6 text-sm text-muted-foreground">Kom igång med MyFlove på en minut.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
            />
            <span>
              Jag godkänner{" "}
              <Link to="/villkor" className="text-primary underline underline-offset-4" target="_blank">
                användarvillkoren
              </Link>{" "}
              och{" "}
              <Link to="/integritet" className="text-primary underline underline-offset-4" target="_blank">
                integritetspolicyn
              </Link>
              .
            </span>
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Skapar konto…" : "Skapa konto"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Har du redan ett konto?{" "}
          <Link to="/sign-in" className="text-primary underline underline-offset-4">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}
