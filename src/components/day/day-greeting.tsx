import type { ReactNode } from "react";
import { Sun } from "lucide-react";
import { greetingNameParts } from "@/lib/greeting-presentation";

/** Presentational only: Today owns the name, translations, date and menu. */
export function DayGreeting({
  tagline,
  greeting,
  name,
  date,
  action,
}: {
  tagline: string;
  greeting: string;
  name: string;
  date?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pace-greeting-layout grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <h1 className="pace-editorial-greeting min-w-0 text-ink">
        <span className="pace-greeting-prefix">{greeting}</span>
        {name && <>{" "}{greetingNameParts(name).map((part, index) => <span key={index} className="pace-greeting-name-part">{part}</span>)}</>}
      </h1>
      <div className="row-span-2 shrink-0">{action}</div>
      <p className="min-w-0 text-sm text-muted-foreground">{tagline}</p>
    </div>
  );
}
