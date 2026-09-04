import { Link } from "wouter";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import { useTasks } from "@/hooks/use-data";
import { useActiveArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";
import { Bell, Pill, Repeat, Baby, ArrowRight, Plus } from "lucide-react";

/** De vägar som inte är vanliga aktiviteter – en rad var, utan dubbletter. */
const MORE: { href: string; icon: typeof Bell; label: string; what: string }[] = [
  { href: "/paminnelser", icon: Bell, label: "Påminnelse", what: "Något du vill bli påmind om" },
  { href: "/daglig-rutin", icon: Repeat, label: "Rutin", what: "Något som återkommer" },
  { href: "/halsa", icon: Pill, label: "Medicin", what: "Doser och tider" },
  { href: "/barn", icon: Baby, label: "Barnens dag", what: "Hållpunkter för barnen" },
];

/**
 * Den gemensamma vägen in för aktiviteter. QuickFlow fortsätter vara en
 * mental inbox – här sparas bara sådant som redan hänt eller ska hända.
 */
export function AddToDay() {
  const { addTask } = useTasks();
  const { activeArea } = useActiveArea();
  const { t } = useLang();

  const handleAdd = (result: QuickAddResult) => {
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
        <TaskQuickAdd onAdd={handleAdd} />
      </MyFloveWide>

      <MyFloveWide>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MORE.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="press group flex items-center gap-3 rounded-3xl border-2 border-border bg-card px-4 py-3 shadow-soft transition-colors hover:bg-secondary/50"
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
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

export default AddToDay;
