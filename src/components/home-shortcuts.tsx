import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Smile, Target, CheckSquare, ShoppingBag, Calendar, Pill, Timer, Wallet,
  BarChart3, Trophy, Inbox, UtensilsCrossed, Navigation, Battery,
  Sparkles, Pin, PinOff, ArrowUp, ArrowDown, Settings2, Check, RotateCcw,
import {
  Smile, Target, CheckSquare, ShoppingBag, Calendar, Pill, Timer, Wallet,
  BarChart3, Trophy, Inbox, UtensilsCrossed, Navigation, Battery,
  Sparkles, Pin, PinOff, ArrowUp, ArrowDown, Settings2, Check, RotateCcw,
  Hand, Heart, Sun,
  type LucideIcon,
} from "lucide-react";
import { useLocalStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import StopModal from "@/components/stop-modal";

interface Shortcut {
  id: string;
  href?: string;
  action?: "stop";
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  emphasis?: boolean;
}

const PREVIEW_PALETTE = [
  { bg: "bg-terracotta/10", color: "text-terracotta" },
  { bg: "bg-sage/15", color: "text-sage" },
  { bg: "bg-gold/15", color: "text-gold" },
  { bg: "bg-ink/10", color: "text-ink" },
  { bg: "bg-terracotta-soft/10", color: "text-terracotta-soft" },
];

const ALL_SHORTCUTS: Shortcut[] = ([
  { id: "stop",       action: "stop" as const, label: "Stop!",       icon: Hand, emphasis: true },
  { id: "mood",       href: "/mood",           label: "Mående",     icon: Smile },
  { id: "fokus",      href: "/fokus",          label: "Dagens fokus", icon: Target },
  { id: "tasks",      href: "/tasks",          label: "Att göra",   icon: CheckSquare },
  { id: "shopping",   href: "/shopping",       label: "Inköp",      icon: ShoppingBag },
  { id: "kalender",   href: "/kalender",       label: "Kalender",   icon: Calendar },
  { id: "medicin",    href: "/medicin",        label: "Medicin",    icon: Pill },
  { id: "pomodoro",   href: "/pomodoro",       label: "Fokuspass",  icon: Timer },
  { id: "finances",   href: "/finances",       label: "Ekonomi",    icon: Wallet },
  { id: "statistik",  href: "/statistik",      label: "Statistik",  icon: BarChart3 },
  { id: "beloningar", href: "/beloningar",     label: "Belöningar", icon: Trophy },
  { id: "dump",       href: "/dump",           label: "Dumping",    icon: Inbox },
  { id: "matlista",   href: "/matlista",       label: "Matlista",   icon: UtensilsCrossed },
  { id: "travel",     href: "/travel",         label: "Resor",      icon: Navigation },
  { id: "energikarta",href: "/energikarta",    label: "Energikarta",icon: Battery },
  { id: "flowplan",   href: "/flowplan",       label: "FlowPlan",   icon: Sparkles },
  { id: "assistant",  href: "/assistant",      label: "Flow-chatt", icon: Sparkles },
] as Omit<Shortcut, "iconBg" | "iconColor">[]).map((s, i) => {
  const palette = PREVIEW_PALETTE[i % PREVIEW_PALETTE.length];
  return { ...s, iconBg: palette.bg, iconColor: palette.color } as Shortcut;
});


const DEFAULT_FAVORITES = ["stop", "mood", "kalender", "tasks"];
const DEFAULT_ORDER = ALL_SHORTCUTS.map((s) => s.id);
const MAX_FAVORITES = 4;


interface Prefs {
  favorites: string[];
  order: string[];
}

const DEFAULT_PREFS: Prefs = { favorites: DEFAULT_FAVORITES, order: DEFAULT_ORDER };

export default function HomeShortcuts() {
  const [prefs, setPrefs] = useLocalStorage<Prefs>("myflow-home-shortcuts", DEFAULT_PREFS);
  const [editing, setEditing] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);


  // Merge in any new shortcuts added after user saved prefs
  const order = useMemo(() => {
    const known = new Set(prefs.order);
    const missing = ALL_SHORTCUTS.map((s) => s.id).filter((id) => !known.has(id));
    return [...prefs.order.filter((id) => ALL_SHORTCUTS.some((s) => s.id === id)), ...missing];
  }, [prefs.order]);

  const favorites = prefs.favorites.filter((id) => ALL_SHORTCUTS.some((s) => s.id === id));

  const byId = (id: string) => ALL_SHORTCUTS.find((s) => s.id === id);

  const favoriteShortcuts = favorites.map(byId).filter((s): s is Shortcut => !!s);
  const restShortcuts = order.filter((id) => !favorites.includes(id)).map(byId).filter((s): s is Shortcut => !!s);

  const toggleFavorite = (id: string) => {
    setPrefs((p) => {
      const isFav = p.favorites.includes(id);
      if (isFav) return { ...p, favorites: p.favorites.filter((f) => f !== id) };
      if (p.favorites.length >= MAX_FAVORITES) return p;
      return { ...p, favorites: [...p.favorites, id] };
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    setPrefs((p) => {
      const arr = [...order];
      const i = arr.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      return { ...p, order: arr };
    });
  };

  const reset = () => setPrefs(DEFAULT_PREFS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dina genvägar</h2>
          <p className="text-sm text-muted-foreground">
            {editing
              ? `Välj 4 favoriter. Resten hittar du i menyn.`
              : `4 favoriter — resten finns i menyn.`}
          </p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <Button variant="ghost" size="sm" onClick={reset} className="rounded-xl gap-1">
              <RotateCcw size={14} /> Återställ
            </Button>
          )}
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => setEditing((e) => !e)}
            className="rounded-xl gap-1"
          >
            {editing ? <><Check size={14} /> Klar</> : <><Settings2 size={14} /> Bytt</>}
          </Button>
        </div>
      </div>

      {/* Favorites — large tiles */}
      {favoriteShortcuts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {favoriteShortcuts.map((s) => (
            <ShortcutTile
              key={s.id}
              shortcut={s}
              size="large"
              editing={editing}
              isFavorite
              onToggleFavorite={() => toggleFavorite(s.id)}
              onAction={s.action === "stop" ? () => setStopOpen(true) : undefined}
            />
          ))}
        </div>
      )}

      {/* Rest — small tiles, only visible while editing */}
      {editing && restShortcuts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {restShortcuts.map((s, idx) => (
            <ShortcutTile
              key={s.id}
              shortcut={s}
              size="small"
              editing={editing}
              isFavorite={false}
              canPin={favorites.length < MAX_FAVORITES}
              onToggleFavorite={() => toggleFavorite(s.id)}
              onMoveUp={idx > 0 ? () => move(s.id, -1) : undefined}
              onMoveDown={idx < restShortcuts.length - 1 ? () => move(s.id, 1) : undefined}
              onAction={s.action === "stop" ? () => setStopOpen(true) : undefined}
            />
          ))}
        </div>
      )}
      <StopModal open={stopOpen} onOpenChange={setStopOpen} />
    </div>
  );
}


interface TileProps {
  shortcut: Shortcut;
  size: "large" | "small";
  editing: boolean;
  isFavorite: boolean;
  canPin?: boolean;
  onToggleFavorite: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAction?: () => void;
}

function ShortcutTile({ shortcut, size, editing, isFavorite, canPin = true, onToggleFavorite, onMoveUp, onMoveDown, onAction }: TileProps) {
  const Icon = shortcut.icon;
  const large = size === "large";
  const emph = shortcut.emphasis;

  const inner = (
    <div className={`flex ${large ? "flex-col gap-3 p-5" : "flex-col gap-2 p-3"} border rounded-2xl shadow-sm h-full ${
      emph
        ? "bg-terracotta text-cream border-terracotta"
        : "bg-card border-border"
    } ${!editing ? "hover:-translate-y-0.5 transition-all" : ""}`}>
      <div className={`${large ? "w-12 h-12" : "w-9 h-9"} rounded-full ${emph ? "bg-cream/20 text-cream" : `${shortcut.iconBg} ${shortcut.iconColor}`} flex items-center justify-center shrink-0`}>
        <Icon size={large ? 22 : 18} />
      </div>
      <p className={`font-medium ${large ? "text-base" : "text-sm"} leading-snug`}>{shortcut.label}</p>
    </div>
  );

  if (!editing) {
    if (shortcut.action || !shortcut.href) {
      return (
        <button type="button" onClick={onAction} className="block text-left w-full">
          {inner}
        </button>
      );
    }
    return (
      <Link href={shortcut.href} className="block">
        {inner}
      </Link>
    );
  }


  return (
    <div className="relative">
      {inner}
      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={!isFavorite && !canPin}
          className={`p-1.5 rounded-lg text-xs ${isFavorite ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground disabled:opacity-40"}`}
          aria-label={isFavorite ? "Ta bort favorit" : "Fäst som favorit"}
          title={isFavorite ? "Ta bort favorit" : canPin ? "Fäst som favorit" : `Max ${MAX_FAVORITES} favoriter`}
        >
          {isFavorite ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        {!isFavorite && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="p-1.5 rounded-lg bg-secondary text-foreground disabled:opacity-30"
              aria-label="Flytta upp"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="p-1.5 rounded-lg bg-secondary text-foreground disabled:opacity-30"
              aria-label="Flytta ner"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
