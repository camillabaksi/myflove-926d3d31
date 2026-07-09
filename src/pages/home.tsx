import { useMemo, useState } from "react";
import { Link } from "wouter";
import HomeShortcuts from "@/components/home-shortcuts";
import Layout from "@/components/layout";
import OverwhelmedModal from "@/components/overwhelmed-modal";
import HelpMeModal from "@/components/help-me-modal";
import WeatherCard from "@/components/weather-card";
import ProactiveSuggestions from "@/components/proactive-suggestions";
import { Button } from "@/components/ui/button";
import {
  useFocus,
  useTasks,
  useReminders,
  useFinances,
  useMedications,
  type Task,
} from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { getGreeting } from "@/lib/greeting";
import { emptyState } from "@/lib/flow-voice";
import { buildHelpPlan, type HelpFeelingId, type HelpPlan } from "@/lib/help-me";
import {
  HeartHandshake,
  CheckCircle2,
  Circle,
  Calendar,
  Wallet,
  Pill,
  Sparkles,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

function sortTasksByPriority(tasks: Task[]): Task[] {
  const withDueDate = tasks
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const withoutDueDate = tasks
    .filter((t) => !t.dueDate)
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...withDueDate, ...withoutDueDate];
}

export default function Home() {
  const { currentFocus, toggleFocusCompleted } = useFocus();
  const { activeTasks, toggleTask } = useTasks();
  const { activeReminders } = useReminders();
  const { transactions } = useFinances();
  const { medications, isTaken } = useMedications();
  const { activeItems: shoppingItems } = useSharedShoppingList();

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [overwhelmedOpen, setOverwhelmedOpen] = useState(false);
  const [helpPlan, setHelpPlan] = useState<HelpPlan | null>(null);



  const todayStr = new Date().toISOString().split("T")[0] as string;

  const prioritizedTasks = useMemo(() => sortTasksByPriority(activeTasks), [activeTasks]);
  const visibleTasks = prioritizedTasks.slice(0, helpPlan?.taskLimit ?? 3);

  const nextReminder = activeReminders[0];

  const now = Date.now();
  const pastOrTodayTransactions = transactions.filter((t) => t.date <= now);
  const balance = pastOrTodayTransactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0
  );
  const upcomingBills = transactions
    .filter((t) => t.type === "expense" && t.date > now)
    .sort((a, b) => a.date - b.date);
  const upcomingBillsTotal = upcomingBills.reduce((sum, t) => sum + t.amount, 0);
  const moneyLeftAfterPlanned = balance - upcomingBillsTotal;

  const medicationsDueToday = medications
    .map((med) => ({
      med,
      nextTime: med.times.find((time) => !isTaken(med.id, time)),
    }))
    .filter((entry): entry is { med: (typeof medications)[number]; nextTime: string } => !!entry.nextTime)
    .sort((a, b) => a.nextTime.localeCompare(b.nextTime));
  const nextMedication = medicationsDueToday[0];

  const handleSelectFeeling = (feeling: HelpFeelingId) => {
    if (feeling === "overwhelmed") {
      setOverwhelmedOpen(true);
      return;
    }
    setHelpPlan(buildHelpPlan(feeling));
  };

  const showExtras = !helpPlan?.hideExtras;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{getGreeting()}</h1>
          <p className="text-muted-foreground">Här är en lugn överblick över idag.</p>
        </div>

        <WeatherCard />

        <ProactiveSuggestions />


        <button
          type="button"
          onClick={() => setHelpModalOpen(true)}
          className="w-full flex items-center gap-4 p-6 rounded-3xl bg-primary text-primary-foreground shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform text-left"
        >
          <div className="w-14 h-14 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <HeartHandshake size={28} />
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold">Hjälp mig</p>
            <p className="text-primary-foreground/85 text-sm">
              Känns det tungt just nu? Berätta hur du mår, så gör jag idag lite mindre.
            </p>
          </div>
        </button>

        {helpPlan && (
          <div className="bg-accent/40 border border-accent rounded-2xl p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Sparkles size={20} className="text-accent-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-accent-foreground leading-relaxed">{helpPlan.message}</p>
              <button
                type="button"
                onClick={() => setHelpPlan(null)}
                className="text-sm font-medium text-primary mt-2 underline underline-offset-2"
              >
                Visa allt igen
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {helpPlan ? "Det viktigaste just nu" : "Dagens viktigaste"}
          </h2>

          {currentFocus && !helpPlan && (
            <button
              onClick={toggleFocusCompleted}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                currentFocus.completed
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-card border-primary/40 shadow-sm"
              }`}
            >
              {currentFocus.completed ? (
                <CheckCircle2 size={24} className="fill-primary text-primary-foreground shrink-0" />
              ) : (
                <Circle size={24} className="text-primary shrink-0" />
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                  Dagens fokus
                </p>
                <p className={`font-medium ${currentFocus.completed ? "line-through opacity-70" : ""}`}>
                  {currentFocus.text}
                </p>
              </div>
            </button>
          )}

          {visibleTasks.length === 0 && !currentFocus ? (
            <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
              {emptyState.tasks}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-all text-left"
                >
                  <Circle size={20} className="text-muted-foreground shrink-0" />
                  <span className="flex-1">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground shrink-0">{task.dueDate}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {showExtras && (
          <>
            <HomeShortcuts />


            {upcomingBills.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Kommande räkningar</h2>
                <div className="space-y-3">
                  {upcomingBills.slice(0, 3).map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm"
                    >
                      <div>
                        <p className="font-medium">{bill.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(bill.date).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })}
                          {bill.note ? ` · ${bill.note}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold">{bill.amount} kr</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextMedication && (
              <Link
                href="/medicin"
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  <Pill size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Medicinpåminnelse
                  </p>
                  <p className="font-medium truncate">
                    {nextMedication.med.name}
                    {nextMedication.med.dosage ? ` · ${nextMedication.med.dosage}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{nextMedication.nextTime}</p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            )}
          </>
        )}

        <Button
          variant="outline"
          onClick={() => setOverwhelmedOpen(true)}
          className="w-full h-12 rounded-2xl"
        >
          Jag är överväldigad — hjälp mig prioritera
        </Button>

      </div>

      <HelpMeModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
        onSelectFeeling={handleSelectFeeling}
      />
      <OverwhelmedModal open={overwhelmedOpen} onOpenChange={setOverwhelmedOpen} />
    </Layout>
  );
}
