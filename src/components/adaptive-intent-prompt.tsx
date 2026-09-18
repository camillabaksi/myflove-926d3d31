import { useState } from "react";

import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { useLang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const CHIPS = ["Jag vill träna", "Jag behöver plugga", "Jag behöver städa", "Jag vill gå en promenad"];

/**
 * "Vad vill eller behöver du göra?" – samma lilla ingång överallt.
 *
 * Användaren ska tänka på vad hen vill göra, inte på vilken funktion som ska
 * öppnas. Svaret skickas rakt in i det befintliga kapacitetsanpassade
 * Flow-kortet. Inget formulär, inga extra inställningar.
 */
export function AdaptiveIntentPrompt({
  source,
  chips = CHIPS,
  placeholder = "Vad vill du göra? T.ex. träna, plugga, städa",
  className,
}: {
  source: string;
  chips?: string[];
  placeholder?: string;
  className?: string;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState("");
  const [text, setText] = useState("");

  return (
    <div className={cn("space-y-3", className)} data-testid="adaptive-intent-prompt">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setDraft(chip);
              setText(chip);
            }}
            className="press rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-ink hover:border-primary"
          >
            {t(chip)}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setText(draft.trim());
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(placeholder)}
          aria-label={t("Vad vill du göra?")}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="press min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {t("Fråga Flow")}
        </button>
      </form>

      {text && (
        <AdaptiveActivityCard
          text={text}
          source={source}
          onDone={() => {
            setText("");
            setDraft("");
          }}
        />
      )}
    </div>
  );
}

export default AdaptiveIntentPrompt;
