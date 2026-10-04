import { Fragment, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, ListTree, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import type { FlowActionKind } from "@/lib/flow-actions";

/** Visar Flows svar med fetstil och punktlistor i stället för råa stjärntecken. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part.replace(/(^|\s)\*(\S[^*]*)\*/g, "$1$2")}</Fragment>
    ),
  );
}

export function FlowRichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[*-]\s+(.*)$/);
        const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
        const content = bullet ? bullet[1] : heading ? heading[1] : line;
        return (
          <Fragment key={i}>
            {bullet ? (
              <span className="block pl-4 -indent-3">
                <span aria-hidden>• </span>
                {inline(content)}
              </span>
            ) : heading ? (
              <strong className="font-semibold">{inline(content)}</strong>
            ) : (
              inline(content)
            )}
            {!bullet && i < lines.length - 1 ? "\n" : null}
          </Fragment>
        );
      })}
    </>
  );
}

const ACTION_ICONS = {
  flytta: CalendarClock,
  forenkla: Sprout,
  dela: ListTree,
  klar: CheckCircle2,
  ny: Plus,
  andra: Pencil,
  "ta-bort": Trash2,
} as const;

/** Pictogram för Flows förslagskort – samma ikonstil som resten av appen. */
export function FlowActionIcon({ kind }: { kind: FlowActionKind }) {
  const Icon = ACTION_ICONS[kind];
  return <Icon aria-hidden size={16} className="mr-1 inline -mt-0.5 text-primary" />;
}
