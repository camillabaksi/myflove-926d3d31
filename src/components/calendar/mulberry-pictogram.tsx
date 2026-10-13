import { useState, type CSSProperties } from "react";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import type { PictogramId, VisualActivityTone } from "@/lib/child-visual-schedule";
import { mulberrySymbolUrl, type MulberrySymbolId } from "@/lib/mulberry-symbols";
import { cn } from "@/lib/utils";

/** Calendar opt-in only. Original symbols stay readable on a white inset. */
export function MulberryPictogram({ id, tone = "lavender", className, style }: {
  id: MulberrySymbolId;
  tone?: VisualActivityTone;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
}) {
  const url = mulberrySymbolUrl(id);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return <ActivityPictogram id={id in EXTRA_FALLBACKS ? EXTRA_FALLBACKS[id] : id as PictogramId} tone={tone} className={className} style={style} />;
  return <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-white p-0.5", className)} style={style} aria-hidden="true" data-mulberry-symbol={id}>
    <img src={url} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" draggable={false} onError={() => setFailedUrl(url)} />
  </span>;
}

const EXTRA_FALLBACKS: Record<string, PictogramId> = { coffee: "meal", phone: "conversation", mail: "task", birthday: "family", pets: "home", medication: "pharmacy" };

export function MulberryAttribution() {
  return <p className="text-[10px] leading-relaxed text-muted-foreground">
    <a href="https://mulberrysymbols.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Mulberry Symbols</a>{" · Steve Lee · "}
    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">CC BY-SA 4.0</a>
  </p>;
}
