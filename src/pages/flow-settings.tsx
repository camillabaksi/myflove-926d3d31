import { Link } from "wouter";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FlowCharacter } from "@/components/flow/flow-character";
import { useFlowSettings, type FlowHelpLevel } from "@/hooks/use-flow-settings";
import { FLOW_PRIORITIES } from "@/lib/flow-priorities";

const LEVELS: Array<{ id: FlowHelpLevel; label: string; hint: string }> = [
  { id: "tyst", label: "Tyst", hint: "Flow syns men säger inget själv." },
  { id: "diskret", label: "Diskret", hint: "Flow hör bara av sig när det spelar roll." },
  { id: "aktiv", label: "Aktiv", hint: "Flow hör av sig oftare och tipsar mer." },
];

export default function FlowSettingsPage() {
  const { settings, update, togglePriority, reset } = useFlowSettings();

  return (
    <MyFlovePageGrid className="mx-auto w-full max-w-4xl pb-24">
      <MyFloveWide>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/hem">
              <ArrowLeft className="mr-1 size-4" />
              Tillbaka
            </Link>
          </Button>
        </div>
      </MyFloveWide>

      <MyFloveWide>
        <header className="flex items-center gap-4 rounded-3xl border-2 border-border/60 bg-card p-4 shadow-sm">
          <div className="shrink-0">
            <FlowCharacter
              scene="hello"
              seed={3}
              energy={settings.enabled ? 70 : 30}
              stage="inline"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Flow-inställningar</h1>
            <p className="text-sm text-muted-foreground">
              Du bestämmer hur mycket Flow får säga, när han får höra av sig och vad han ska hålla
              koll på. Inget av det här ändrar dina uppgifter.
            </p>
          </div>
        </header>
      </MyFloveWide>

      <Card className="rounded-3xl xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Hjälpnivå</CardTitle>
          <CardDescription>Hur mycket plats Flow får ta i vardagen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="flow-enabled" className="text-sm font-normal">
              Visa Flow i appen
            </Label>
            <Switch
              id="flow-enabled"
              checked={settings.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <Button
                key={l.id}
                variant={settings.level === l.id ? "default" : "outline"}
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
              Flow får berätta vad han lär sig om dig
            </Label>
            <Switch
              id="flow-learning"
              checked={settings.learning}
              onCheckedChange={(v) => update({ learning: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">När får Flow höra av sig?</CardTitle>
          <CardDescription>
            Utanför det här fönstret är Flow tyst – han finns kvar men säger inget själv.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Förvarning innan en viktig tid</Label>
              <span className="text-sm font-medium">{settings.leadMinutes} min</span>
            </div>
            <Slider
              value={[settings.leadMinutes]}
              min={5}
              max={90}
              step={5}
              onValueChange={([v]) => update({ leadMinutes: v })}
              aria-label="Förvarning i minuter"
            />
            <p className="text-xs text-muted-foreground">
              Flow säger till i god tid, t.ex. "om cirka {settings.leadMinutes} minuter", och länkar
              till rätt vy.
            </p>
          </div>
        </CardContent>
      </Card>

      <MyFloveWide>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Vad ska Flow prioritera?</CardTitle>
            <CardDescription>
              Välj vilka typer av tider Flow håller extra koll på. Resten ligger kvar i appen som
              vanligt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {FLOW_PRIORITIES.map((p) => (
              <div key={p.key} className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor={`flow-p-${p.key}`} className="text-sm font-normal">
                    {p.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{p.hint}</p>
                </div>
                <Switch
                  id={`flow-p-${p.key}`}
                  checked={settings.priorities[p.key] !== false}
                  onCheckedChange={(v) => togglePriority(p.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
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
              Se Flow live
            </Link>
          </Button>
        </div>
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}
