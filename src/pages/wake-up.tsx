import Layout from "@/components/layout";
import WakeUpCard from "@/components/wake-up-card";
import WakeUpSettings from "@/components/wake-up-settings";

/** Landningssida för morgonpuffarna – hit leder notisen. */
export default function WakeUpPage() {
  return (
    <Layout>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-24">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Morgonstart</h1>
          <p className="text-sm text-muted-foreground">
            Dagen behöver inte börja perfekt. Kryssa ett steg så vet jag att du är igång.
          </p>
        </header>

        <WakeUpCard always />
        <WakeUpSettings />
      </div>
    </Layout>
  );
}
