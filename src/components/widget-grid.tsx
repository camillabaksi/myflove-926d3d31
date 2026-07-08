import { Link } from "wouter";
import {
  Smile, Target, CheckSquare, ShoppingBag, Calendar, Pill, Timer, Wallet, BarChart3, Trophy,
} from "lucide-react";
import { useMoods, useFocus, useTasks, useShoppingList, useReminders, useMedications, useFinances } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { getWeeklyMoodStats } from "@/lib/mood-stats";
import { getAchievements } from "@/lib/achievements";

const EMOJI_BY_SCORE: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

interface Widget {
  href: string;
  icon: typeof Smile;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
}

export default function WidgetGrid() {
  const { moods } = useMoods();
  const { currentFocus, completedFocusCount } = useFocus();
  const { activeTasks, tasks } = useTasks();
  const { activeItems } = useShoppingList();
  const { activeReminders } = useReminders();
  const { medications, isTaken } = useMedications();
  const { transactions } = useFinances();
  const [sessionLog] = useLocalStorage<{ date: string; count: number }>("myflow-pomodoro-sessions", {
    date: "",
    count: 0,
  });
  const [pomodoroTotalSessions] = useLocalStorage<number>("myflow-pomodoro-total-sessions", 0);

  const todayStr = new Date().toISOString().split("T")[0] as string;

  const todayMood = moods.find((m) => new Date(m.date).toDateString() === new Date().toDateString());

  const nextReminder = activeReminders[0];

  const takenTimesToday = medications.reduce((sum, med) => sum + med.times.filter((t) => isTaken(med.id, t)).length, 0);
  const totalTimesToday = medications.reduce((sum, med) => sum + med.times.length, 0);

  const todaysSessions = sessionLog.date === todayStr ? sessionLog.count : 0;

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthBalance = monthlyTransactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0
  );

  const { trend } = getWeeklyMoodStats(moods);
  const trendLabel = trend === "up" ? "På uppgång ↑" : trend === "down" ? "Nedåt ↓" : trend === "same" ? "Stabilt →" : "Ingen data än";

  const completedTasks = tasks.filter((t) => t.completed);
  const achievements = getAchievements({
    moods,
    completedTasks,
    pomodoroTotalSessions,
    completedFocusCount,
    medicationLogCount: medications.length > 0 ? 1 : 0,
  });
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const widgets: Widget[] = [
    {
      href: "/mood",
      icon: Smile,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      label: "Mående idag",
      value: todayMood ? `${EMOJI_BY_SCORE[todayMood.score]} idag` : "Checka in",
    },
    {
      href: "/fokus",
      icon: Target,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      label: "Dagens fokus",
      value: currentFocus ? currentFocus.text : "Inget valt",
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      label: "Att göra",
      value: `${activeTasks.length} kvar`,
    },
    {
      href: "/shopping",
      icon: ShoppingBag,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700",
      label: "Inköp",
      value: `${activeItems.length} varor`,
    },
    {
      href: "/kalender",
      icon: Calendar,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      label: "Nästa händelse",
      value: nextReminder ? nextReminder.title : "Inget inplanerat",
      hint: nextReminder ? (nextReminder.date === todayStr ? "Idag" : nextReminder.date) : undefined,
    },
    {
      href: "/medicin",
      icon: Pill,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-700",
      label: "Medicin idag",
      value: totalTimesToday > 0 ? `${takenTimesToday} av ${totalTimesToday} tagna` : "Inget bokat",
    },
    {
      href: "/pomodoro",
      icon: Timer,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-700",
      label: "Fokuspass idag",
      value: `${todaysSessions} genomförda`,
    },
    {
      href: "/finances",
      icon: Wallet,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700",
      label: "Ekonomi denna månad",
      value: monthlyTransactions.length > 0 ? `${monthBalance >= 0 ? "+" : ""}${monthBalance} kr` : "Inget bokfört",
    },
    {
      href: "/statistik",
      icon: BarChart3,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      label: "Veckotrend",
      value: trendLabel,
    },
    {
      href: "/beloningar",
      icon: Trophy,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-700",
      label: "Belöningar",
      value: `${unlockedCount} av ${achievements.length}`,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Överblick</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Link
              key={widget.label}
              href={widget.href}
              className="flex flex-col gap-2 p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-9 h-9 rounded-full ${widget.iconBg} ${widget.iconColor} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{widget.label}</p>
                <p className="font-medium leading-snug text-sm line-clamp-2">{widget.value}</p>
                {widget.hint && <p className="text-xs text-primary font-medium mt-0.5">{widget.hint}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
