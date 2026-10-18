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
    <div className="pace-greeting-layout grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
      <h1 className="pace-welcome-title col-span-2 flex items-start gap-2 text-primary">
        <Sun size={20} className="mt-1.5 shrink-0 text-sun-ink" aria-hidden />
        <span>{tagline}</span>
      </h1>
      <div className="min-w-0">
        <p className="pace-editorial-greeting text-ink">
          <span className="pace-greeting-prefix">{greeting}</span>
          {name && (
            <>
              {" "}
              {greetingNameParts(name).map((part, index) => (
                <span key={index} className="pace-greeting-name-part">
                  {part}
                </span>
              ))}
            </>
          )}
        </p>
        {date && <p className="pace-type-help mt-1 text-muted-foreground">{date}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
