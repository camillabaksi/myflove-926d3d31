import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useReminderSync } from "@/hooks/use-reminder-sync";
import { useQuietModeSync } from "@/hooks/use-quiet-mode-sync";
import EnergySaveFeedback from "@/components/energy-save-feedback";

function AuthenticatedApp() {
  // Lever kvar mellan Idag, Kalender och övriga undersidor.
  useReminderSync();
  useQuietModeSync();
  return (
    <>
      <Outlet />
      <EnergySaveFeedback />
    </>
  );
}

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AuthenticatedApp,
});
