import { Link } from "wouter";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { paceEveryday } from "@/components/paceable/design-system";
import { cn } from "@/lib/utils";
import DidThisQuickAdd from "@/components/did-this-quick-add";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useActiveArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";
import { Bell, Pill, Repeat, Baby, ArrowRight, Plus, ChevronDown } from "lucide-react";

/** De vägar som inte är vanliga aktiviteter – en rad var, utan dubbletter. */
const MORE: { href: string; icon: typeof Bell; label: string; what: string }[] = [
  { href: "/paminnelser", icon: Bell, label: "Påminnelse", what: "Något du vill bli påmind om" },
  { href: "/daglig-rutin#Rutiner", icon: Repeat, label: "Rutin", what: "Något som återkommer" },
  { href: "/daglig-rutin#Medicin", icon: Pill, label: "Medicin", what: "Doser och tider" },
  { href: "/barn", icon: Baby, label: "Barnens dag", what: "Hållpunkter för barnen" },
];

/**
 * Den gemensamma vägen in för aktiviteter. QuickFlow fortsätter vara en
 * mental inbox – här sparas bara sådant som redan hänt eller ska hända.
 */
export function AddToDay() {
  const { addTask } = useTasks();
  const { addReminder: addPeriodReminder } = useReminders();
  const { activeArea } = useActiveArea();
  const { t } = useLang();

  const handleAdd = (result: QuickAddResult) => {
    if (result.endDate) {
      addPeriodReminder(result.title, result.dueDate, undefined, "none", undefined, undefined, "Sammanhängande period – ingen automatiskt upptagen tid.", activeArea === "alla" ? "vardag" : activeArea, result.endDate, "unknown");
      return;
    }
    addTask(result.title, result.dueDate, {
      time: result.time,
      completed: result.completed,
      completedAt: result.completedAt,
      area: activeArea === "alla" ? "vardag" : activeArea,
    });
  };

  return (
    <MyFlovePageGrid area="kalender">
      <MyFloveWide>
        <h1 className="flex items-center gap-2 font-display text-2xl text-ink">
          <Plus className="h-6 w-6 text-primary" /> {t("Lägg till")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Synliggör det du bär – eller lägg något på en dag.")}
        </p>
      </MyFloveWide>

      <MyFloveWide>
        <TaskQuickAdd onAdd={handleAdd} initialMode="planned" label={t("Lägg i min plan")} />
      </MyFloveWide>

      <MyFloveWide>
        <DidThisQuickAdd />
      </MyFloveWide>

      <MyFloveWide>
        <details className={cn(paceEveryday.surface, "group px-3 py-1")}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {t("Fler sätt att lägga till")}
            <ChevronDown size={17} className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="grid gap-2 pb-3 sm:grid-cols-2">
          {MORE.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn("press group", paceEveryday.surface, paceEveryday.row)}
                >
                  <Icon size={18} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{t(item.label)}</span>
                    <span className="block text-xs text-muted-foreground">{t(item.what)}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-muted-foreground group-hover:text-foreground"
                  />
                </Link>
              </li>
            );
          })}
          </ul>
        </details>
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

export default AddToDay;
