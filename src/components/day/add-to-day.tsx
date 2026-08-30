import { Link } from "wouter";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import DidThisQuickAdd from "@/components/did-this-quick-add";
import WhyHint from "@/components/why-hint";
import { useTasks } from "@/hooks/use-data";
import { useActiveArea } from "@/lib/life-areas";
import { Bell, Pill, Repeat, Baby, Plus, ArrowRight } from "lucide-react";

/** De vägar som inte ryms i snabbtillägget – en rad var, aldrig dubbletter. */
const MORE: { href: string; icon: typeof Bell; label: string; what: string }[] = [
  { href: "/paminnelser", icon: Bell, label: "Påminnelse", what: "Något du vill bli påmind om" },
  { href: "/daglig-rutin", icon: Repeat, label: "Rutin", what: "Något som återkommer" },
  { href: "/halsa", icon: Pill, label: "Medicin", what: "Doser och tider" },
  { href: "/barn", icon: Baby, label: "Barnens dag", what: "Hållpunkter för barnen" },
];

/**
 * ➕ Lägg till – den gemensamma vägen in för allt som ska hända.
 * Aktivitet skapas här; rutin, medicin och barn har egna hem men nås härifrån.
 */
export function AddToDay() {
  const { addTask } = useTasks();
  const { activeArea } = useActiveArea();

  const handleAdd = (r: QuickAddResult) => {
    addTask(r.title, r.dueDate, {
      time: r.time,
      energyImpact: r.energyImpact,
      friction: r.friction,
      area: activeArea === "alla" ? "vardag" : activeArea,
    });
  };

  return (
    <MyFlovePageGrid area="kalender">
      <MyFloveWide>
        <h2 className="font-display text-2xl text-ink">Lägg till</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Allt du vill lägga till i dagen börjar här.
        </p>
      </MyFloveWide>

      <MyFloveBlock
        title="Ny aktivitet"
        subtitle="Med tid om du vill – annars bara idag"
        icon={Plus}
        tone="mint"
        surface="mint"
        className="col-span-full md:col-span-2"
      >
        <TaskQuickAdd onAdd={handleAdd} />
        <p className="text-xs text-muted-foreground">
          En planerad aktivitet är bara en plan. Den påverkar inte din energi förrän du markerat
          den som genomförd och sagt hur den kändes.
        </p>
      </MyFloveBlock>

      <MyFloveBlock
        title="Jag gjorde redan något"
        subtitle="Registrera det du hunnit med"
        tone="lavender"
        surface="lavender"
        className="col-span-full md:col-span-2"
        action={
          <WhyHint label="vi frågar om energin">
            Vi frågar hur något påverkade dig för att Flow över tid ska kunna förstå vad som ger och
            tar energi för just dig.
          </WhyHint>
        }
      >
        <DidThisQuickAdd />
      </MyFloveBlock>

      <MyFloveWide>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MORE.map((m) => {
            const Icon = m.icon;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="press group flex items-center gap-3 rounded-3xl border-2 border-border bg-card px-4 py-3 shadow-soft transition-colors hover:bg-secondary/50"
                >
                  <Icon size={18} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.what}</span>
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
