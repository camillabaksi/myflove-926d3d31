import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type FlowStage } from "@/components/flow/flow-character";
import { useFlowMoment } from "@/hooks/use-flow-moment";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useFlowSettings, type FlowHelpLevel } from "@/hooks/use-flow-settings";
import { haptic } from "@/lib/haptics";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Flow i den inloggade appen – samma karaktär som i Flow-previewen,
 * men som en liten kontextuell följeslagare i vanliga vyer.
 *
 * Visar EN sak i taget, går alltid att vifta bort och kan tystas helt.
 */

const LEVELS: Array<{ id: FlowHelpLevel; label: string; hint: string }> = [
  { id: "tyst", label: "Tyst", hint: "Pace syns men säger inget" },
  { id: "diskret", label: "Diskret", hint: "Bara när det spelar roll" },
  { id: "aktiv", label: "Aktiv", hint: "Pace hör av sig oftare" },
];

function FlowSettingsPopover() {
  const { settings, update } = useFlowSettings();
  const knowledge = useFlowLearning();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-full text-muted-foreground"
          aria-label="Hur mycket ska Pace hjälpa till?"
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4 rounded-2xl">
        <div className="space-y-1">
          <p className="text-sm font-medium">Hur mycket ska Pace hjälpa till?</p>
          <p className="text-xs text-muted-foreground">
            Du bestämmer. Pace ska aldrig vara i vägen.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {LEVELS.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={settings.level === l.id ? "default" : "outline"}
              className="rounded-full text-xs"
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
            Pace får berätta vad Pace lär sig
          </Label>
          <Switch
            id="flow-learning"
            checked={settings.learning}
            onCheckedChange={(v) => update({ learning: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="flow-enabled" className="text-sm font-normal">
            Visa Pace i appen
          </Label>
          <Switch
            id="flow-enabled"
            checked={settings.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
          />
        </div>

        <Button asChild variant="outline" size="sm" className="w-full rounded-full text-xs">
          <Link href="/flow-installningar">Fler Pace-inställningar</Link>
        </Button>

        <div className="space-y-1 rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-medium">{knowledge.label}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(6, knowledge.level)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Du behöver inte lära dig hur jag fungerar. Jag lär mig hur du fungerar.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FlowCompanion({
  stage = "inline",
  className,
}: {
  stage?: FlowStage;
  className?: string;
}) {
  const moment = useFlowMoment();
  const { settings, dismiss } = useFlowSettings();
  const shownRef = useRef<string | null>(null);

  /* Endast användning mäts: vilket slags förslag som visades, aldrig innehållet. */
  useEffect(() => {
    if (!settings.enabled || moment.silent || !moment.message) return;
    if (shownRef.current === moment.id) return;
    shownRef.current = moment.id;
    track("flow_suggestion_shown", { source: moment.scene });
    if (moment.id.startsWith("missed-")) track("flow_missed_task_shown", { source: "flow" });
    if (moment.id === "done") track("flow_task_completion_reaction", { source: "flow" });
  }, [moment.id, moment.scene, moment.silent, moment.message, settings.enabled]);

  if (!settings.enabled) return null;

  const isMini = stage === "mini";

  return (
    <section
      data-flow-companion
      data-flow-scene={moment.scene}
      aria-label="Pace"
      className={cn(
        "flex items-center gap-3 overflow-hidden rounded-3xl border-2 border-border/60 bg-card shadow-sm",
        isMini ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        {moment.silent || !moment.message ? (
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Jag är här om du behöver mig.
          </p>
        ) : (
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-pretty text-sm leading-relaxed text-foreground animate-fade-in">
              {moment.learning && <span className="mr-1">💜</span>}
              {moment.message}
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 rounded-full text-muted-foreground"
              aria-label="Inte nu, tack"
              onClick={() => {
                haptic("soft");
                track("flow_suggestion_rejected", { source: moment.scene });
                dismiss(moment.id);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {moment.action && (
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                haptic("success");
                track("flow_suggestion_accepted", { source: moment.scene });
                moment.action?.run();
              }}
            >
              {moment.action.label}
            </Button>
          )}
          {moment.link && (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                // Endast användning mäts – aldrig vad Flow lärt sig eller några råvärden.
                if (moment.learning) track("flow_learning_opened", { source: "flow-companion" });
              }}
            >
              <Link href={moment.link.href}>{moment.link.label}</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="min-w-0 rounded-full px-3">
            <Link href="/assistant">Prata med Pace</Link>
          </Button>
          <div className="ml-auto">
            <FlowSettingsPopover />
          </div>
        </div>
      </div>
    </section>
  );
}
