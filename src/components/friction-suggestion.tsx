import { Waves } from "lucide-react";
import { useFrictionLibrary } from "@/hooks/use-friction-library";

/**
 * Kopplar Friktionsbiblioteket till en enskild uppgift: om du redan
 * rapporterat något liknande som tungt föreslås friktionsvärdet här,
 * i stället för att du ska gissa själv.
 */
export function FrictionSuggestion({
  title,
  current,
  onApply,
}: {
  title: string;
  current: number;
  onApply: (friction: number) => void;
}) {
  const { suggestFor } = useFrictionLibrary();
  const suggestion = suggestFor(title);
  if (!suggestion || suggestion.friction === current) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <Waves className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="min-w-0 flex-1 text-balance">
        {suggestion.reason} Förslag: {suggestion.friction}/10.
      </span>
      <button
        type="button"
        onClick={() => onApply(suggestion.friction)}
        className="press rounded-pill border border-border bg-card px-3 py-1 font-medium text-ink hover:border-primary/50 transition-colors"
      >
        Använd
      </button>
    </div>
  );
}

export default FrictionSuggestion;
