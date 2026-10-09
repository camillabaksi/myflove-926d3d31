import { Link } from "wouter";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { RotateCcw, Sparkles } from "lucide-react";
import { PaceBlock as MyFloveBlock, PaceButton as Button, PaceInput as Input, PacePageTitle } from "@/components/paceable/design-system";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FlowCharacter } from "@/components/flow/flow-character";
import { useFlowSettings, type FlowHelpLevel } from "@/hooks/use-flow-settings";
import { FLOW_PRIORITIES } from "@/lib/flow-priorities";

const LEVELS: Array<{ id: FlowHelpLevel; label: string; hint: string }> = [
  { id: "tyst", label: "Tyst", hint: "Pace syns men säger inget själv." },
  { id: "diskret", label: "Diskret", hint: "Pace hör bara av sig när det spelar roll." },
  { id: "aktiv", label: "Aktiv", hint: "Pace hör av sig oftare och tipsar mer." },
];

export default function FlowSettingsPage() {
  const { settings, update, togglePriority, reset } = useFlowSettings();

  return (
    <Layout>
    <MyFlovePageGrid className="pace-ds pace-account-forms mx-auto w-full max-w-4xl pb-24">

      <MyFloveWide>
        <header className="pace-account-heading flex flex-wrap items-center gap-4">
          <div className="shrink-0">
            <FlowCharacter
              alt="Pace – Paceables följeslagare"
              scene="hello"
              seed={3}
              energy={settings.enabled ? 70 : 30}
              stage="inline"
            />
          </div>
          <div className="min-w-0 flex-1 basis-64 space-y-1">
            <PacePageTitle>
              Pace-inställningar
            </PacePageTitle>
            <p className="text-sm text-muted-foreground">
              Du bestämmer hur mycket Pace får säga, när Pace får höra av sig och vad Pace ska hålla
              koll på. Inget av det här ändrar dina uppgifter.
            </p>
          </div>
        </header>
      </MyFloveWide>

      <MyFloveWide span="wide">
        <MyFloveBlock title="Hjälpnivå" subtitle="Hur mycket plats Pace får ta i vardagen.">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="flow-enabled" className="text-sm font-normal">
              Visa Pace i appen
            </Label>
            <Switch
              className="pace-ds-switch"
              id="flow-enabled"
              checked={settings.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {LEVELS.map((l) => (
              <Button
                key={l.id}
                variant={settings.level === l.id ? "default" : "outline"}
                aria-pressed={settings.level === l.id}
                className="rounded-2xl"
                onClick={() => update({ level: l.id })}
              >
                {l.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {LEVELS.find((l) => l.id === settings.level)?.hint}
          </p>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="flow-learning" className="text-sm font-normal">
              Pace får berätta vad Pace lär sig om dig
            </Label>
            <Switch
              className="pace-ds-switch"
              id="flow-learning"
              checked={settings.learning}
              onCheckedChange={(v) => update({ learning: v })}
            />
          </div>
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide span="wide">
        <MyFloveBlock
          title="När får Pace höra av sig?"
          subtitle="Utanför det här fönstret är Pace tyst – Pace finns kvar men säger inget själv."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="flow-from" className="text-sm font-normal">
                Tidigast
              </Label>
              <Input
                id="flow-from"
                type="time"
                value={settings.quietFrom}
                onChange={(e) => update({ quietFrom: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flow-to" className="text-sm font-normal">
                Senast
              </Label>
              <Input
                id="flow-to"
                type="time"
                value={settings.quietTo}
                onChange={(e) => update({ quietTo: e.target.value })}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-normal">Förvarning innan en viktig tid</Label>
              <span className="text-sm font-medium">{settings.leadMinutes} min</span>
            </div>
            <Slider
              className="min-h-11"
              value={[settings.leadMinutes]}
              min={5}
              max={90}
              step={5}
              onValueChange={([v]) => update({ leadMinutes: v })}
              aria-label="Förvarning i minuter"
            />
            <p className="text-xs text-muted-foreground">
              Pace säger till i god tid, t.ex. "om cirka {settings.leadMinutes} minuter", och länkar
              till rätt vy.
            </p>
          </div>
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide>
        <MyFloveBlock
          title="Vad ska Pace prioritera?"
          subtitle="Välj vilka typer av tider Pace håller extra koll på. Resten ligger kvar i appen som vanligt."
        >
          {FLOW_PRIORITIES.map((p) => (
            <div key={p.key} className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor={`flow-p-${p.key}`} className="text-sm font-normal">
                  {p.label}
                </Label>
                <p className="text-xs text-muted-foreground">{p.hint}</p>
              </div>
              <Switch
                className="pace-ds-switch"
                id={`flow-p-${p.key}`}
                checked={settings.priorities[p.key] !== false}
                onCheckedChange={(v) => togglePriority(p.key, v)}
              />
            </div>
          ))}
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={reset}>
            <RotateCcw className="mr-2 size-4" />
            Återställ till standard
          </Button>
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link href="/flow">
              <Sparkles className="mr-2 size-4" />
              Se Pace live
            </Link>
          </Button>
        </div>
      </MyFloveWide>
    </MyFlovePageGrid>
    </Layout>
  );
}
