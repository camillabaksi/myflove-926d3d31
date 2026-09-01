import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { PiggyBank, Pencil, Check } from "lucide-react";
import { useBudget, type BudgetPeriod, type Transaction } from "@/hooks/use-data";
import CollapsibleSection from "@/components/collapsible-section";

const PERIODS: { key: BudgetPeriod; label: string }[] = [
  { key: "day", label: "Dag" },
  { key: "week", label: "Vecka" },
  { key: "month", label: "Månad" },
];

/** Start på vald period (dag = idag 00:00, vecka = måndag, månad = den 1:a). */
function periodStart(period: BudgetPeriod): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "week") {
    const dow = (d.getDay() + 6) % 7; // måndag = 0
    d.setDate(d.getDate() - dow);
  } else if (period === "month") {
    d.setDate(1);
  }
  return d;
}

/** Antal dagar i perioden och hur många som gått (inkl. idag). */
function periodProgress(period: BudgetPeriod) {
  const now = new Date();
  if (period === "day") return { total: 1, elapsed: 1 };
  if (period === "week") return { total: 7, elapsed: ((now.getDay() + 6) % 7) + 1 };
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { total, elapsed: now.getDate() };
}

function Bar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const over = budget > 0 && spent > budget;
  const near = !over && pct >= 80;
  return (
    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          over ? "bg-destructive" : near ? "bg-accent" : "bg-primary"
        }`}
        style={{ width: `${Math.max(pct, budget > 0 && spent > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}

function AmountField({
  value,
  onSave,
  placeholder = "Ingen budget",
}: {
  value?: number;
  onSave: (n: number | null) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ? String(value) : "");

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ? String(value) : "");
          setEditing(true);
        }}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {value ? `${value} kr` : placeholder}
        <Pencil size={14} />
      </button>
    );
  }

  const save = () => {
    const n = Number(draft);
    onSave(draft.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        type="number"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-9 w-28 rounded-xl"
        placeholder="0"
        aria-label="Budgetbelopp i kronor"
      />
      <button
        type="button"
        onClick={save}
        className="p-2 rounded-xl bg-primary text-primary-foreground"
        aria-label="Spara budget"
      >
        <Check size={16} />
      </button>
    </div>
  );
}

export default function BudgetPanel({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: string[];
}) {
  const [period, setPeriod] = useState<BudgetPeriod>("month");
  const { budget, setTotal, setCategory } = useBudget();

  const start = useMemo(() => periodStart(period).getTime(), [period]);

  // Räknar om automatiskt så fort en transaktion läggs till, ändras eller tas bort.
  const { spentByCategory, income, txCount } = useMemo(() => {
    const acc: Record<string, number> = {};
    let inc = 0;
    let count = 0;
    for (const t of transactions) {
      if (t.date < start) continue;
      count += 1;
      if (t.type === "income") inc += t.amount;
      else acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    }
    return { spentByCategory: acc, income: inc, txCount: count };
  }, [transactions, start]);

  const spent = Object.values(spentByCategory).reduce((s, n) => s + n, 0);
  const net = spent - income; // utgifter minus inkomster i perioden
  const total = budget.total[period];
  const left = total ? total - net : null;
  const { total: days, elapsed } = periodProgress(period);
  const daysLeft = Math.max(1, days - elapsed + 1);
  const perDay = left !== null ? Math.round(left / daysLeft) : null;

  const periodLabel = period === "day" ? "idag" : period === "week" ? "denna vecka" : "denna månad";

  return (
    <section className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm space-y-5">
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <PiggyBank size={22} />
            </span>
            Budget
          </span>
        }
        help="Skriv in hur mycket du vill lägga på en period. Appen räknar ut hur mycket som är kvar."
        headingClassName="text-xl font-medium"
        description="Sätt en ram per dag, vecka eller månad."
      >
        <div
          className="flex bg-secondary/50 p-1 rounded-xl"
          role="tablist"
          aria-label="Budgetperiod"
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                period === p.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Förbrukat {periodLabel}</p>
              <p className="text-2xl font-semibold">{Math.max(0, net)} kr</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Budget</p>
              <AmountField value={total} onSave={(n) => setTotal(period, n)} />
            </div>
          </div>

          <Bar spent={Math.max(0, net)} budget={total ?? 0} />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-2 text-center">
            <div className="rounded-xl bg-secondary/50 py-2">
              <p className="text-xs text-muted-foreground">Utgifter</p>
              <p className="text-sm font-semibold">-{spent} kr</p>
            </div>
            <div className="rounded-xl bg-secondary/50 py-2">
              <p className="text-xs text-muted-foreground">Inkomster</p>
              <p className="text-sm font-semibold text-primary">+{income} kr</p>
            </div>
            <div className="rounded-xl bg-secondary/50 py-2">
              <p className="text-xs text-muted-foreground">Netto</p>
              <p className="text-sm font-semibold">
                {net > 0 ? `-${net}` : `+${Math.abs(net)}`} kr
              </p>
            </div>
          </div>

          {total ? (
            <p
              className={`text-sm ${left! < 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}
            >
              {left! < 0
                ? `Du är ${Math.abs(left!)} kr över budgeten. Inget drama – justera resten av perioden.`
                : `${left} kr kvar${period !== "day" ? ` • ca ${perDay} kr/dag i ${daysLeft} dagar` : ""}.`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tryck på ”Ingen budget” för att sätta en ram.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Uppdateras automatiskt från dina transaktioner ({txCount} {periodLabel}). Inkomster i
            perioden räknas av mot förbrukningen.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Per kategori</h3>
          {categories.map((cat) => {
            const catBudget = budget.categories[cat]?.[period];
            const catSpent = spentByCategory[cat] ?? 0;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {catSpent} kr{catBudget ? ` / ${catBudget} kr` : ""}
                    </span>
                    <AmountField
                      value={catBudget}
                      onSave={(n) => setCategory(cat, period, n)}
                      placeholder="Sätt"
                    />
                  </div>
                </div>
                <Bar spent={catSpent} budget={catBudget ?? 0} />
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </section>
  );
}
