import { useState } from "react";
import { Link } from "wouter";
import {
  Smile, Target, CheckSquare, ShoppingBag, Calendar, Pill, Timer, Wallet, BarChart3, OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { useMoods, useFocus, useTasks, useShoppingList, useReminders, useMedications, useFinances } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { getWeeklyMoodStats } from "@/lib/mood-stats";
import StopModal from "@/components/stop-modal";

const EMOJI_BY_SCORE: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const PREVIEW_PALETTE = [
  { bg: "bg-terracotta/10", color: "text-terracotta" },
  { bg: "bg-sage/15", color: "text-sage" },
  { bg: "bg-gold/15", color: "text-gold" },
  { bg: "bg-ink/10", color: "text-ink" },
  { bg: "bg-terracotta-soft/10", color: "text-terracotta-soft" },
];

interface Widget {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export default function WidgetGrid() {
  const [stopOpen, setStopOpen] = useState(false);
  const { moods } = useMoods();
  const { currentFocus, completedFocusCount } = useFocus();
  const { activeTasks } = useTasks();
  const { activeItems } = useShoppingList();
  const { activeReminders } = useReminders();
  const { medications, isTaken } = useMedications();
  const { transactions } = useFinances();
  const [sessionLog] = useLocalStorage<{ date: string; count: number }>("myflow-pomodoro-sessions", {
    date: "",
    count: 0,
  });

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

  const widgets: Widget[] = [
    {
      href: "/ma-bra",
      icon: Smile,
      label: "Mående idag",
      value: todayMood ? `${EMOJI_BY_SCORE[todayMood.score]} idag` : "Checka in",
    },
    {
      href: "/flowplan",
      icon: Target,
      label: "Dagens fokus",
      value: currentFocus ? currentFocus.text : "Inget valt",
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      label: "Att göra",
      value: `${activeTasks.length} kvar`,
    },
    {
      href: "/shopping",
      icon: ShoppingBag,
      label: "Inköp",
      value: `${activeItems.length} varor`,
    },
    {
      href: "/kalender",
      icon: Calendar,
      label: "Nästa händelse",
      value: nextReminder ? nextReminder.title : "Inget inplanerat",
      hint: nextReminder ? (nextReminder.date === todayStr ? "Idag" : nextReminder.date) : undefined,
    },
    {
      href: "/daglig-rutin",
      icon: Pill,
      label: "Medicin idag",
      value: totalTimesToday > 0 ? `${takenTimesToday} av ${totalTimesToday} tagna` : "Inget bokat",
    },
    {
      href: "/pomodoro",
      icon: Timer,
      label: "Fokuspass idag",
      value: `${todaysSessions} genomförda`,
    },
    {
      href: "/finances",
      icon: Wallet,
      label: "Ekonomi denna månad",
      value: monthlyTransactions.length > 0 ? `${monthBalance >= 0 ? "+" : ""}${monthBalance} kr` : "Inget bokfört",
    },
    {
      href: "/statistik",
      icon: BarChart3,
      label: "Veckotrend",
      value: trendLabel,
    },
    {
      onClick: () => setStopOpen(true),
      icon: OctagonAlert,
      label: "Stop!",
      value: "Pausa impulsen",
      emphasis: true,
    },
  ].map((w, i) => {
    const palette = PREVIEW_PALETTE[i % PREVIEW_PALETTE.length];
    return { ...w, iconBg: palette.bg, iconColor: palette.color };
  });

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Överblick</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          const tileClass = `flex flex-col gap-2 p-4 bg-card border rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all text-left ${
            widget.emphasis ? "border-terracotta/40 hover:border-terracotta" : "border-border hover:border-primary/40"
          }`;
          const inner = (
            <>
              <div className={`w-9 h-9 rounded-full ${widget.iconBg} ${widget.iconColor} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{widget.label}</p>
                <p className="font-medium leading-snug text-sm line-clamp-2">{widget.value}</p>
                {widget.hint && <p className="text-xs text-primary font-medium mt-0.5">{widget.hint}</p>}
              </div>
            </>
          );
          if (widget.onClick) {
            return (
              <button key={widget.label} type="button" onClick={widget.onClick} className={tileClass}>
                {inner}
              </button>
            );
          }
          return (
            <Link key={widget.label} href={widget.href ?? "#"} className={tileClass}>
              {inner}
            </Link>
          );
        })}
      </div>
      <StopModal open={stopOpen} onOpenChange={setStopOpen} />
    </div>
  );
}


