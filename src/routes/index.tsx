import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyFlow – Din personliga vardagsassistent" },
      { name: "description", content: "Håll koll på uppgifter, humör, ekonomi och mer på ett ställe." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/hem" });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);


  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">MyFlow</h1>
          <p className="text-muted-foreground">
            Din personliga vardagsassistent – uppgifter, humör, ekonomi och mer på ett ställe.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/sign-up">Skapa konto</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link to="/sign-in">Logga in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
