import { useState } from "react";
import { Link } from "wouter";
import {
  Smile, Target, CheckSquare, ShoppingBag, Calendar, Pill, Timer, Wallet, BarChart3, OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { useMoods, useFocus, useTasks, useReminders, useMedications, useFinances } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { useLocalStorage } from "@/lib/storage";
import { getWeeklyMoodStats } from "@/lib/mood-stats";
import StopModal from "@/components/stop-modal";
import CollapsibleSection from "@/components/collapsible-section";

const EMOJI_BY_SCORE: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const PREVIEW_PALETTE = [
  { bg: "bg-lavender", color: "text-primary" },
  { bg: "bg-blush", color: "text-terracotta" },
  { bg: "bg-mint", color: "text-sage" },
  { bg: "bg-sky", color: "text-primary" },
  { bg: "bg-sun", color: "text-gold" },
];

interface Widget {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  emoji?: string;
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
  const { activeItems } = useSharedShoppingList();
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
      emoji: "🌸",
      label: "Mående idag",
      value: todayMood ? `${EMOJI_BY_SCORE[todayMood.score]} idag` : "Checka in",
    },
    {
      href: "/flowplan",
      icon: Target,
      emoji: "🎯",
      label: "Dagens fokus",
      value: currentFocus ? currentFocus.text : "Inget valt",
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      emoji: "✅",
      label: "Att göra",
      value: `${activeTasks.length} kvar`,
    },
    {
      href: "/shopping",
      icon: ShoppingBag,
      emoji: "🛍️",
      label: "Inköp",
      value: `${activeItems.length} varor`,
    },
    {
      href: "/kalender",
      icon: Calendar,
      emoji: "📅",
      label: "Nästa händelse",
      value: nextReminder ? nextReminder.title : "Inget inplanerat",
      hint: nextReminder ? (nextReminder.date === todayStr ? "Idag" : nextReminder.date) : undefined,
    },
    {
      href: "/daglig-rutin",
      icon: Pill,
      emoji: "💊",
      label: "Medicin idag",
      value: totalTimesToday > 0 ? `${takenTimesToday} av ${totalTimesToday} tagna` : "Inget bokat",
    },
    {
      href: "/pomodoro",
      icon: Timer,
      emoji: "⏳",
      label: "Fokuspass idag",
      value: `${todaysSessions} genomförda`,
    },
    {
      href: "/finances",
      icon: Wallet,
      emoji: "💰",
      label: "Ekonomi denna månad",
      value: monthlyTransactions.length > 0 ? `${monthBalance >= 0 ? "+" : ""}${monthBalance} kr` : "Inget bokfört",
    },
    {
      href: "/statistik",
      icon: BarChart3,
      emoji: "📈",
      label: "Veckotrend",
      value: trendLabel,
    },
    {
      onClick: () => setStopOpen(true),
      icon: OctagonAlert,
      emoji: "🛑",
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
      <CollapsibleSection title="Överblick" headingClassName="text-lg font-semibold text-muted-foreground">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          const tileClass = `press flex flex-col gap-2.5 p-4 bg-card border rounded-3xl shadow-soft hover:-translate-y-0.5 transition-all text-left ${
            widget.emphasis ? "border-accent bg-accent/40" : "border-border/60 hover:border-primary/40"
          }`;
          const inner = (
            <>
              <div className={`relative w-11 h-11 rounded-2xl ${widget.iconBg} ${widget.iconColor} flex items-center justify-center shrink-0`}>
                <Icon size={20} strokeWidth={2.2} />
                {widget.emoji && (
                  <span aria-hidden className="absolute -right-1.5 -top-1.5 text-sm leading-none drop-shadow-sm">
                    {widget.emoji}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground mb-0.5">{widget.label}</p>
                <p className="font-semibold leading-snug text-sm line-clamp-2 text-ink">{widget.value}</p>
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
      </CollapsibleSection>
      <StopModal open={stopOpen} onOpenChange={setStopOpen} />
    </div>
  );
}


