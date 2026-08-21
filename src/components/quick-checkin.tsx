import { useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { cn } from "@/lib/utils";

const MOODS = [
  { score: 1, emoji: "😞", label: "Tungt" },
  { score: 2, emoji: "😕", label: "Lite låg" },
  { score: 3, emoji: "😐", label: "Okej" },
  { score: 4, emoji: "🙂", label: "Bra" },
  { score: 5, emoji: "😍", label: "Toppen" },
];

const ENERGY = [
  { level: 1, label: "Nästan tomt" },
  { level: 2, label: "Lågt" },
  { level: 3, label: "Halvfullt" },
  { level: 4, label: "Bra" },
  { level: 5, label: "Fullt" },
];

/** Snabbmeny för framtida loggtyper – bara det som redan finns i appen. */
const LOG_LINKS = [
  { href: "/ma-bra", emoji: "❤️", label: "Mående" },
  { href: "/energifloede", emoji: "⚡", label: "Energi" },
  { href: "/anteckningar", emoji: "✍️", label: "Anteckning" },
];

/**
 * "Hur är det just nu?" – ett tryck registrerar mående respektive energi.
 * Två separata värden, går att ändra hur många gånger som helst samma dag.
 */
export default function QuickCheckin({ className }: { className?: string }) {
  const { todayMood, todayEnergy, logMood, logEnergy } = useQuickCheckin();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section
      className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-soft", className)}
      aria-label="Hur är det just nu"
    >
      <CollapsibleSection
        id="hem::mående-energi"
        title={
          <span className="flex items-center gap-2">
            <span aria-hidden>❤️</span> Hur är det just nu?
          </span>
        }
        headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        className="space-y-4"
        actions={
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus size={13} /> Logga
          </button>
        }
      >
        {menuOpen && (
          <div className="flex flex-wrap gap-2 rounded-2xl bg-secondary/30 p-3">
            {LOG_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-ink shadow-soft transition-colors hover:bg-primary/10"
              >
                <span aria-hidden>{l.emoji}</span> {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Mående</p>
          <div className="flex items-center justify-between gap-1">
            {MOODS.map((m) => {
              const active = todayMood?.score === m.score;
              return (
                <button
                  key={m.score}
                  type="button"
                  onClick={() => logMood(m.score)}
                  aria-pressed={active}
                  aria-label={`Mående: ${m.label}`}
                  title={m.label}
                  className={cn(
                    "flex-1 rounded-2xl py-2 text-2xl transition-all hover:scale-110",
                    active ? "bg-primary/15 ring-2 ring-primary scale-110" : "opacity-60",
                  )}
                >
                  <span aria-hidden>{m.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Energi</p>
          <div className="flex items-center justify-between gap-1">
            {ENERGY.map((e) => {
              const active = (todayEnergy?.level ?? 0) >= e.level;
              const selected = todayEnergy?.level === e.level;
              return (
                <button
                  key={e.level}
                  type="button"
                  onClick={() => void logEnergy(e.level)}
                  aria-pressed={selected}
                  aria-label={`Energi ${e.level} av 5: ${e.label}`}
                  title={e.label}
                  className={cn(
                    "flex-1 rounded-2xl py-2 text-2xl transition-all hover:scale-110",
                    active ? "opacity-100" : "opacity-30 grayscale",
                    selected && "bg-primary/15 ring-2 ring-primary scale-110",
                  )}
                >
                  <span aria-hidden>🔋</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {todayMood || todayEnergy
            ? "Sparat. Du kan ändra när du vill under dagen."
            : "Ett tryck räcker. Inget är rätt eller fel."}
        </p>
      </CollapsibleSection>
    </section>
  );
}
