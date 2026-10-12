import { PUBLIC_BASE_URL } from "@/lib/public-url";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { withBackendRecovery, isBackendAsleepError } from "@/lib/backend-wake";

export const Route = createFileRoute("/glomt-losenord")({
  head: () => ({
    meta: [
      { title: "Glömt lösenord – Paceable" },
      {
        name: "description",
        content:
          "Återställ ditt lösenord till Paceable. Vi skickar en länk till din e-post så du kan välja ett nytt lösenord.",
      },
      { property: "og:title", content: "Glömt lösenord – Paceable" },
      {
        property: "og:description",
        content: "Få en återställningslänk till din e-post och välj ett nytt lösenord.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${PUBLIC_BASE_URL}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Paceable – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: `${PUBLIC_BASE_URL}/og-image.jpg` },
      { property: "og:url", content: `${PUBLIC_BASE_URL}/glomt-losenord` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${PUBLIC_BASE_URL}/glomt-losenord` }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await withBackendRecovery(() =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nytt-losenord`,
      }),
    );
    setLoading(false);
    if (error) {
      toast({
        title: "Kunde inte skicka länken",
        description: isBackendAsleepError(error)
          ? "Tjänsten vaknar fortfarande. Vänta en liten stund och försök igen."
          : (error as { message?: string }).message,
        variant: "destructive",
      });
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary">Glömt lösenord</h1>
        {sent ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Om det finns ett konto för <span className="font-medium">{email}</span> har vi skickat
              en återställningslänk dit. Kolla din inkorg – och skräpposten, ibland gömmer den sig
              där.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Skicka igen
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Ingen stress. Skriv din e-post så skickar vi en länk där du kan välja ett nytt
              lösenord.
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
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Skickar länk…" : "Skicka återställningslänk"}
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
