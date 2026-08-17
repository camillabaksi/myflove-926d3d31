import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PiggyBank, ShoppingBasket } from "lucide-react";
import { useBudget, useFinances } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";

function monthStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

/**
 * Stopp vid impulsköp: visa vad som faktiskt finns kvar denna månad och
 * erbjud inköpslistan i stället för köpet. Ingen moralisering – bara fakta.
 */
export default function StopBudget() {
  const { budget } = useBudget();
  const { transactions } = useFinances();
  const { addItem } = useSharedShoppingList();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  const monthBudget = budget.total?.month ?? null;

  const spent = useMemo(() => {
    const from = monthStart();
    return transactions
      .filter((t) => t.type === "expense" && t.date >= from)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const left = monthBudget != null ? Math.round(monthBudget - spent) : null;

  const park = () => {
    const title = text.trim();
    if (!title) return;
    addItem(title);
    setText("");
    setSaved(true);
    toast.success("Den ligger i inköpslistan. Du kan bestämma senare. 💙");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <PiggyBank size={18} className="text-primary" />
        <p className="text-sm font-semibold text-ink">Handlar det om pengar?</p>
      </div>

      {left != null ? (
        <p className="text-sm text-muted-foreground">
          Du har{" "}
          <span className={`font-semibold ${left < 0 ? "text-destructive" : "text-ink"}`}>
            {left.toLocaleString("sv-SE")} kr
          </span>{" "}
          kvar av månadens budget. Bara en siffra – du bestämmer.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Du har ingen månadsbudget inlagd. Du kan ändå parkera köpet här nedan.
        </p>
      )}

      {!saved ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") park();
            }}
            placeholder="Vad var du på väg att köpa?"
            aria-label="Vad var du på väg att köpa?"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={park}
            className="press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ShoppingBasket size={16} /> Spara
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sparad i inköpslistan. Om du fortfarande vill ha den imorgon finns den kvar.
        </p>
      )}
    </div>
  );
}
