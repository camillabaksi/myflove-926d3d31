import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FlowCharacter, type FlowStage } from "@/components/flow/flow-character";
import { useFlowMoment } from "@/hooks/use-flow-moment";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Flow i den inloggade appen – samma karaktär som i Flow-previewen,
 * men som en liten kontextuell följeslagare i vanliga vyer.
 *
 * Visar EN sak i taget och använder bara befintlig data (se useFlowMoment).
 */
export default function FlowCompanion({
  stage = "inline",
  className,
}: {
  stage?: FlowStage;
  className?: string;
}) {
  const moment = useFlowMoment();

  return (
    <section
      data-flow-companion
      aria-label="Flow"
      className={cn(
        "flex items-center gap-3 overflow-hidden rounded-3xl border border-border/60 bg-card p-3 shadow-sm",
        className,
      )}
    >
      <div className="shrink-0">
        <FlowCharacter
          scene={moment.scene}
          seed={moment.seed}
          energy={moment.energy}
          kids={moment.kids}
          rain={moment.rain}
          stage={stage}
          className="w-auto"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-pretty text-sm leading-relaxed text-foreground">{moment.message}</p>

        <div className="flex flex-wrap items-center gap-2">
          {moment.action && (
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                haptic("success");
                moment.action?.run();
              }}
            >
              {moment.action.label}
            </Button>
          )}
          {moment.link && (
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link href={moment.link.href}>{moment.link.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
