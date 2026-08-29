import { useEffect, useState } from "react";
import { ANALYTICS_OPT_OUT_KEY, track } from "@/lib/analytics";
import { DeleteAccountButton } from "@/components/delete-account-button";
import Layout from "@/components/layout";
import { MyFloveBlock } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Accessibility, BarChart3 } from "lucide-react";
import { useNpfSettings, type NpfSettings } from "@/lib/npf-mode";
import { Link } from "@tanstack/react-router";

function readAnalyticsOptOut(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

type Row = {
  key: keyof NpfSettings;
  title: string;
  text: string;
};

const ROWS: Row[] = [
  {
    key: "less",
    title: "Färre saker på skärmen",
    text: "Extra texter och tips göms. Du ser bara det viktigaste.",
  },
  { key: "calm", title: "Lugnare färger", text: "Mjukare skuggor och inga starka färgtoningar." },
  {
    key: "stillness",
    title: "Ingen rörelse",
    text: "Stänger av animationer som glider och blinkar.",
  },
  {
    key: "plainWords",
    title: "Enkla ord",
    text: "Vanlig svenska istället för namn som FlowPlan och FlowScore.",
  },
  {
    key: "roomy",
    title: "Mer luft och större knappar",
    text: "Lättare att träffa rätt och lättare att läsa.",
  },
  { key: "largeText", title: "Större text", text: "All text i appen blir lite större." },
  {
    key: "pictograms",
    title: "Bildstöd",
    text: "Visar symboler tillsammans med text där det går.",
  },
];

export default function NpfPage() {
  useEffect(() => {
    track("settings_opened", { source: "anpassa" });
  }, []);

  const { settings, update, reset } = useNpfSettings();
  const [statsOptOut, setStatsOptOut] = useState<boolean>(readAnalyticsOptOut);

  const toggleStats = (optOut: boolean) => {
    setStatsOptOut(optOut);
    try {
      if (optOut) {
        window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
      } else {
        window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
      }
    } catch {
      /* privat läge – valet gäller bara för den här sessionen */
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Accessibility size={22} />
            <h1 className="text-2xl font-bold">Anpassa appen</h1>
          </div>
          <p className="text-muted-foreground">
            Välj hur mycket du vill se och höra. Dina val sparas och ligger kvar tills du ändrar
            dem.
          </p>
        </header>

        <div className="space-y-3">
          {ROWS.map((row) => (
            <label
              key={row.key}
              className="surface-card flex items-start justify-between gap-4 p-4 cursor-pointer"
            >
              <span className="space-y-1">
                <span className="block font-medium">{row.title}</span>
                <span className="block text-sm text-muted-foreground">{row.text}</span>
              </span>
              <Switch
                checked={settings[row.key]}
                onCheckedChange={(v) => update({ [row.key]: v } as Partial<NpfSettings>)}
                aria-label={row.title}
              />
            </label>
          ))}
        </div>

        <Button variant="outline" className="rounded-xl gap-2" onClick={reset}>
          <RotateCcw size={16} /> Återställ till standard
        </Button>

        {/* Integritet – anonym användningsstatistik (speglar cookiepolicyn). */}
        <section aria-label="Integritet" className="mt-10 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 size={18} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Integritet
            </h2>
          </div>
          <label className="surface-card flex items-start justify-between gap-4 p-4 cursor-pointer">
            <span className="space-y-1">
              <span className="block font-medium">Dela anonym användningsstatistik</span>
              <span className="block text-sm text-muted-foreground">
                Hjälper oss förstå vilka funktioner som används – helt anonymt, utan personuppgifter
                eller innehåll. Inga marknads- eller tredjepartscookies.{" "}
                <Link to="/cookies" className="underline underline-offset-2">
                  Läs mer i cookiepolicyn
                </Link>
                .
              </span>
            </span>
            <Switch
              checked={!statsOptOut}
              onCheckedChange={(shareStats) => toggleStats(!shareStats)}
              aria-label="Dela anonym användningsstatistik"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Ändringen gäller direkt. Nödvändig lagring (inloggning, dina inställningar och data)
            påverkas aldrig.
          </p>
        </section>

        {/* Konto – längst ner, tydligt men sekundärt. */}
        <section
          data-testid="account-section"
          aria-label="Konto"
          className="mt-10 space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Konto
            </h2>
            <p className="text-sm text-muted-foreground">
              Att avsluta kontot raderar din data permanent. Du får bekräfta först.
            </p>
          </div>
          <DeleteAccountButton />
        </section>
      </div>
    </Layout>
  );
}
