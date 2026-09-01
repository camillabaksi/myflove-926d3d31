import { useEffect, useState } from "react";
import { ANALYTICS_OPT_OUT_KEY, track } from "@/lib/analytics";
import { DeleteAccountButton } from "@/components/delete-account-button";
import Layout from "@/components/layout";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Accessibility, BarChart3, Eye, Hand } from "lucide-react";
import { useNpfSettings, type NpfSettings } from "@/lib/npf-mode";
import { PersonalizationSettings } from "@/components/personalization-settings";
import { Link } from "@tanstack/react-router";

function readAnalyticsOptOut(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

type ToggleRow = {
  key: keyof NpfSettings;
  title: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
};

const SEE_LESS: ToggleRow[] = [
  { key: "less", title: "Färre saker" },
  { key: "calm", title: "Lugnare färger" },
  { key: "stillness", title: "Ingen rörelse" },
];

const EASIER: ToggleRow[] = [
  { key: "plainWords", title: "Enkla ord" },
  { key: "roomy", title: "Större knappar" },
  { key: "largeText", title: "Större text" },
  { key: "pictograms", title: "Bildstöd" },
];

function ToggleRowView({
  row,
  checked,
  onCheckedChange,
}: {
  row: ToggleRow;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 p-3">
      <span className="min-w-0 font-medium text-ink">{row.title}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={row.title}
        className="shrink-0"
      />
    </label>
  );
}

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
      <MyFlovePageGrid>
        <MyFloveWide>
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Accessibility size={22} />
              <h1 className="text-2xl font-bold">Anpassa appen</h1>
            </div>
            <p className="text-muted-foreground">Välj hur MyFlove ska se ut och kännas.</p>
          </header>
        </MyFloveWide>

        <MyFloveBlock
          title="Mindre på skärmen"
          subtitle="Dölj det som inte behövs"
          icon={Eye}
          tone="lavender"
          surface="lavender"
          collapsible
          collapseId="anpassa::se-mindre"
        >
          <div className="space-y-2">
            {SEE_LESS.map((row) => (
              <ToggleRowView
                key={row.key}
                row={row}
                checked={settings[row.key]}
                onCheckedChange={(v) => update({ [row.key]: v } as Partial<NpfSettings>)}
              />
            ))}
          </div>
        </MyFloveBlock>

        <MyFloveBlock
          title="Lättare att använda"
          subtitle="Större text och tydligare ord"
          icon={Hand}
          tone="mint"
          surface="mint"
          collapsible
          collapseId="anpassa::lattare"
        >
          <div className="space-y-2">
            {EASIER.map((row) => (
              <ToggleRowView
                key={row.key}
                row={row}
                checked={settings[row.key]}
                onCheckedChange={(v) => update({ [row.key]: v } as Partial<NpfSettings>)}
              />
            ))}
          </div>
        </MyFloveBlock>

        <MyFloveWide>
          <header className="space-y-1">
            <h2 className="text-lg font-bold text-ink">Din MyFlove</h2>
            <p className="text-sm text-muted-foreground">Gör appen lite mer till din.</p>
          </header>
        </MyFloveWide>

        <PersonalizationSettings />

        <MyFloveBlock
          title="Integritet"
          subtitle="Dela anonym statistik"
          icon={BarChart3}
          tone="sky"
          surface="sky"
          collapsible
          collapseId="anpassa::integritet"
        >
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 p-3">
            <span className="min-w-0 font-medium text-ink">Dela statistik</span>
            <Switch
              checked={!statsOptOut}
              onCheckedChange={(shareStats) => toggleStats(!shareStats)}
              aria-label="Dela anonym användningsstatistik"
              className="shrink-0"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Helt anonymt, inga cookies.{" "}
            <Link to="/cookies" className="underline underline-offset-2">
              Läs mer
            </Link>
          </p>
        </MyFloveBlock>

        <MyFloveBlock
          title="Konto"
          subtitle="Radera ditt konto"
          icon={Accessibility}
          tone="blush"
          surface="blush"
          className="border-destructive/30"
          data-testid="account-section"
        >
          <DeleteAccountButton />
        </MyFloveBlock>

        <MyFloveWide>
          <Button variant="outline" className="rounded-xl gap-2" onClick={reset}>
            <RotateCcw size={16} /> Återställ till standard
          </Button>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
