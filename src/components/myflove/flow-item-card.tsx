import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUCKET_META } from "@/lib/quickflow-priority";
import { normalizeBucket } from "@/lib/priority-engine";
import { FlowItemActions } from "@/components/flow-item-actions";
import { areaChipStyle, areaColor, AREA_META } from "@/lib/life-areas";
import {
  describeEnergy,
  describeWhen,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  type FlowItem,
} from "@/lib/flow-items";

/**
 * Ett flow-objekt ser likadant ut överallt i MyFlove: livsområde, när,
 * prioritet, energibehov och nästa lilla steg. Samma sak – samma kort.
 */
export function FlowItemCard({
  item,
  onToggle,
  className,
}: {
  item: FlowItem;
  /** Finns bara för sådant man faktiskt kan bocka av. */
  onToggle?: (item: FlowItem) => void;
  className?: string;
}) {
  const when = describeWhen(item);
  const energy = describeEnergy(item.energy);
  const meta = AREA_META[item.area];
  // Engångsreaktion när man bockar av – ingen loop, ingen konfetti.
  const [justToggled, setJustToggled] = useState(false);

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-300",
        item.done && "opacity-90",
        className,
      )}
      style={{ borderLeft: `4px solid ${areaColor(item.area)}` }}
    >
      <div className="flex items-start gap-3">
        {onToggle ? (
          <button
            type="button"
            onClick={() => {
              setJustToggled(true);
              window.setTimeout(() => setJustToggled(false), 320);
              onToggle(item);
            }}
            aria-label={item.done ? `Ångra ${item.title}` : `Klarmarkera ${item.title}`}
            className="press mt-0.5 shrink-0"
          >
            {item.done ? (
              <CheckCircle2 size={20} className={cn("text-primary", justToggled && "check-pop")} />
            ) : (
              <Circle size={20} className="text-muted-foreground" />
            )}
          </button>
        ) : (
          <span aria-hidden className="mt-0.5 shrink-0 text-lg">
            {item.emoji}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn("text-sm font-semibold text-ink", item.done && "line-through opacity-60")}
          >
            {item.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className="rounded-pill border px-2 py-0.5" style={areaChipStyle(item.area)}>
              {meta.emoji} {meta.label}
            </span>
            <span className="rounded-pill bg-muted px-2 py-0.5 text-muted-foreground">
              {SOURCE_LABEL[item.source]}
            </span>
            {when && <span className="rounded-pill bg-lavender px-2 py-0.5 text-ink">{when}</span>}
            <span className="inline-flex items-center gap-1 rounded-pill bg-muted px-2 py-0.5 text-muted-foreground">
              {item.quickflowBucket && (
                <span
                  className={`h-2 w-2 rounded-full ${BUCKET_META[normalizeBucket(item.quickflowBucket)].dot}`}
                  aria-hidden="true"
                />
              )}
              {PRIORITY_LABEL[item.priority]}
            </span>
            {energy && (
              <span
                className="rounded-pill bg-muted px-2 py-0.5 text-muted-foreground"
                title={item.energyReason ?? undefined}
              >
                {energy}
              </span>
            )}
          </div>

          {item.nextStep && (
            <p className="mt-2 text-xs text-muted-foreground">Nästa steg: {item.nextStep}</p>
          )}
        </div>

        <FlowItemActions itemId={item.id} className="mt-0.5 flex shrink-0 items-center gap-0.5" />

        {item.href && (
          <Link
            href={item.href}
            aria-label={`Öppna ${item.title}`}
            className="press mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
          >
            <ArrowRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default FlowItemCard;
