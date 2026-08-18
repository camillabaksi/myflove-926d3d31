import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Accessibility } from "lucide-react";
import { useNpfSettings, type NpfSettings } from "@/lib/npf-mode";

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
  const { settings, update, reset } = useNpfSettings();

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
      </div>
    </Layout>
  );
}
