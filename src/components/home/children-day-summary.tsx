import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

import { ActivityPictogram } from "@/components/family/activity-pictogram";
import { PersonAvatar } from "@/components/day/person-switcher";
import { Button } from "@/components/ui/button";
import { useChildren, type Child, type ChildItem } from "@/hooks/use-children";
import { useLang } from "@/hooks/use-language";
import {
  activityOccursOn,
  CATEGORY_LABELS,
  compareDayItems,
  decodeVisualNotes,
  pictogramForActivity,
} from "@/lib/child-visual-schedule";
import { todayISO } from "@/lib/day";
import { cn } from "@/lib/utils";
import { useCollapsible } from "@/lib/collapse-store";

const FEATURED_CHILD_NAMES = ["bella", "bianca"];

function featuredChildren(children: Child[]): Child[] {
  const byName = FEATURED_CHILD_NAMES
    .map((name) => children.find((child) => child.name.trim().toLocaleLowerCase("sv") === name))
    .filter((child): child is Child => child != null);
  if (byName.length === FEATURED_CHILD_NAMES.length) return byName;
  return children.slice(0, 2);
}

export default function ChildrenDaySummary() {
  const { t } = useLang();
  const { children, items, loading, toggleItem } = useChildren();
  const day = todayISO();
  const visibleChildren = featuredChildren(children);
  const { collapsed, toggle } = useCollapsible("/hem::home-children-day", true);

  if (!loading && visibleChildren.length === 0) return null;

  const markDone = async (item: ChildItem, child: Child) => {
    if (item.kind !== "task") return;
    const done = !item.completed;
    try {
      await toggleItem(item.id, done);
    } catch {
      toast.error(t("Det gick inte att spara just nu. Försök igen."));
    }
  };

  return (
    <section className="mt-5 space-y-3 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft" aria-labelledby="children-day-heading" data-testid="home-children-day">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="h-auto min-w-0 justify-start gap-2 p-0 text-left hover:bg-transparent"
        >
          <ChevronDown
            size={16}
            aria-hidden
            className={cn("shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <span className="min-w-0">
            <span id="children-day-heading" className="block font-display text-base font-bold text-ink">
              {t("Barnens dag")}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {loading
                ? t("Hämtar dagens aktiviteter")
                : visibleChildren
                    .map((child) => {
                      const count = items.filter(
                        (item) =>
                          item.child_id === child.id &&
                          (item.kind === "activity" || item.kind === "task") &&
                          activityOccursOn(item, day),
                      ).length;
                      return `${child.name}: ${count}`;
                    })
                    .join(" · ")}
            </span>
          </span>
        </Button>
        {!collapsed && (
          <Link
            href="/familjeflow"
            className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-primary"
          >
            {t("Hela schemat")}
            <ChevronRight size={14} aria-hidden />
          </Link>
        )}
      </div>

      {!collapsed && <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3">
        {loading
          ? [0, 1].map((index) => (
              <div key={index} className="h-32 animate-pulse rounded-3xl bg-secondary/40" aria-hidden />
            ))
          : visibleChildren.map((child) => {
              const childItems = items
                .filter(
                  (item) =>
                    item.child_id === child.id &&
                    (item.kind === "activity" || item.kind === "task") &&
                    activityOccursOn(item, day),
                )
                .sort(compareDayItems);

              return (
                <article key={child.id} className="min-w-0 rounded-3xl border border-border/60 bg-card/80 p-2.5 shadow-soft sm:p-3">
                  <h3 className="mb-2 flex min-w-0 items-center gap-2 font-display text-sm font-bold text-ink">
                    <PersonAvatar person={child} className="h-7 w-7" />
                    <span className="truncate">{child.name}</span>
                  </h3>

                  {childItems.length === 0 ? (
                    <p className="rounded-2xl bg-secondary/35 px-2.5 py-4 text-center text-xs leading-relaxed text-muted-foreground">
                      {t("Inget inlagt idag.")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {childItems.map((item) => {
                        const { meta } = decodeVisualNotes(item.notes);
                        return (
                          <li
                            key={item.id}
                            className={cn(
                              "min-w-0 rounded-2xl border border-border/50 bg-background/75 p-2",
                              item.kind === "task" && item.completed && "bg-muted/35 opacity-65",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-1.5">
                              {item.kind === "task" && <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void markDone(item, child)}
                                aria-pressed={item.completed}
                                aria-label={item.completed ? `${t("Ångra klar")}: ${item.title}` : `${t("Markera som klar")}: ${item.title}`}
                                title={item.completed ? t("Ångra klar") : t("Markera som klar")}
                                className={cn(
                                  "h-8 w-8 shrink-0 rounded-full border-2 p-0",
                                  item.completed
                                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border-border bg-card text-transparent hover:border-primary/60 hover:text-transparent",
                                )}
                              >
                                <Check size={14} strokeWidth={3} aria-hidden />
                              </Button>}
                              <ActivityPictogram
                                id={pictogramForActivity(item.title, meta.pictogram)}
                                tone={meta.tone}
                                className="h-8 w-8 rounded-lg"
                                iconClassName="h-4 w-4"
                              />
                              <div className="min-w-0 flex-1 text-right">
                                {item.time && (
                                  <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                                    {item.time.slice(0, 5)}
                                  </p>
                                )}
                                <p className="truncate text-[9px] font-medium text-muted-foreground">
                                  {t(CATEGORY_LABELS[meta.category])}
                                </p>
                              </div>
                            </div>
                            <p className={cn("pace-type-activity font-display mt-1.5 break-words text-xl font-semibold leading-tight text-ink", item.kind === "task" && item.completed && "line-through")}>
                              {item.title}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}
      </div>}
    </section>
  );
}
