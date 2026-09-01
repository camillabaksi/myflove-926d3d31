import { useState } from "react";
import Layout from "@/components/layout";
import {
  MyFlovePageGrid,
  MyFloveWide,
  MyFloveBlock,
  MyFloveStat,
} from "@/components/myflove/block";
import { useFinances, Transaction } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import BudgetPanel from "@/components/budget-panel";
import { MyFloveHeader } from "@/components/myflove";
import { MyFloveBalanceBars } from "@/components/myflove/motion";
import CollapsibleSection from "@/components/collapsible-section";
import { todayISO } from "@/lib/day";

const CATEGORIES = ["Mat", "Boende", "Transport", "Nöje", "Övrigt"];

const todayIso = () => todayISO();

export default function Finances() {
  const { transactions, addTransaction, deleteTransaction } = useFinances();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Mat");
  const [note, setNote] = useState("");
  const [billStatus, setBillStatus] = useState<"paid" | "upcoming">("paid");
  const [billDate, setBillDate] = useState(todayIso());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const date =
      type === "expense" && billStatus === "upcoming" && billDate
        ? new Date(`${billDate}T12:00:00`).getTime()
        : Date.now();

    addTransaction({
      type,
      amount: Number(amount),
      category: type === "income" ? "Inkomst" : category,
      note: note.trim() || undefined,
      date,
    });

    setAmount("");
    setNote("");
    setBillStatus("paid");
    setBillDate(todayIso());
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  return (
    <Layout>
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <MyFloveHeader
            title="Din ekonomi"
            emojiKey="finance"
            description="Den här månaden – inkomster, utgifter och det som är på väg."
          />
        </MyFloveWide>

        <MyFloveWide>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <MyFloveStat label="Inkomster" value={`+${totalIncome} kr`} />
            <MyFloveStat label="Utgifter" value={`-${totalExpense} kr`} />
            <MyFloveStat
              label="Kvar"
              value={`${balance} kr`}
              tone="lavender"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </MyFloveWide>

        <MyFloveWide>
          <MyFloveBlock title="Balans den här månaden" icon={Wallet}>
            <MyFloveBalanceBars
              bars={[
                { label: "In", value: totalIncome, tone: "mint" },
                { label: "Ut", value: totalExpense, tone: "blush" },
                { label: "Kvar", value: Math.max(0, balance), tone: "primary" },
              ]}
            />
          </MyFloveBlock>
        </MyFloveWide>

        <MyFloveWide>
          <BudgetPanel transactions={transactions} categories={CATEGORIES} />
        </MyFloveWide>

        <MyFloveWide>
          <MyFloveBlock title="Ny transaktion" icon={Plus}>
            <CollapsibleSection
              title="Lägg till"
              help="Här skriver du in pengar in eller ut. Välj typ, skriv summa och vad det gällde – det räcker."
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex bg-secondary/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${type === "expense" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
                  >
                    Utgift
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${type === "income" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
                  >
                    Inkomst
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Belopp (kr)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="h-14 text-lg rounded-2xl"
                      required
                      min="1"
                    />
                  </div>

                  {type === "expense" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Kategori</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              category === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === "expense" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <div className="flex bg-secondary/50 p-1 rounded-xl mb-3">
                        <button
                          type="button"
                          onClick={() => setBillStatus("paid")}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${billStatus === "paid" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
                        >
                          Redan betald
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillStatus("upcoming")}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${billStatus === "upcoming" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
                        >
                          Kommande räkning
                        </button>
                      </div>
                      {billStatus === "upcoming" && (
                        <Input
                          type="date"
                          value={billDate}
                          onChange={(e) => setBillDate(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Anteckning (frivillig)</label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="T.ex. ICA, Hyra..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-medium">
                  <Plus className="mr-2" size={24} />
                  Lägg till
                </Button>
              </form>
            </CollapsibleSection>
          </MyFloveBlock>
        </MyFloveWide>

        {transactions.length > 0 && (
          <MyFloveWide>
            <div className="rounded-3xl border-2 border-border/60 bg-card p-3 sm:p-5 shadow-soft">
              <CollapsibleSection
                title="Senaste transaktioner"
                help="De tio senaste sakerna du lagt in. Bra för att snabbt se vart pengarna tog vägen."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {transactions.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-soft"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${t.type === "income" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
                        >
                          {t.type === "income" ? (
                            <TrendingUp size={24} />
                          ) : (
                            <TrendingDown size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-lg">{t.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(t.date).toLocaleDateString("sv-SE", {
                              month: "short",
                              day: "numeric",
                            })}
                            {t.note ? ` • ${t.note}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-lg font-semibold ${t.type === "income" ? "text-primary" : "text-foreground"}`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {t.amount} kr
                        </span>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Ta bort"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          </MyFloveWide>
        )}
      </MyFlovePageGrid>
    </Layout>
  );
}
