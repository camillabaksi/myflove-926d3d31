import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Smile,
  Target,
  CheckSquare,
  ShoppingBag,
  Calendar,
  Pill,
  Timer,
  Wallet,
  BarChart3,
  Inbox,
  UtensilsCrossed,
  Navigation,
  Battery,
  Sparkles,
  Pin,
  PinOff,
  ArrowUp,
  ArrowDown,
  Settings2,
  Check,
  RotateCcw,
  Hand,
  Heart,
  Sun,
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
  emoji?: string;
  iconBg: string;
  iconColor: string;
  emphasis?: boolean;
}

const PREVIEW_PALETTE = [
  { bg: "bg-lavender", color: "text-primary" },
  { bg: "bg-blush", color: "text-terracotta" },
  { bg: "bg-mint", color: "text-sage" },
  { bg: "bg-sky", color: "text-primary" },
  { bg: "bg-sun", color: "text-gold" },
];

const ALL_SHORTCUTS: Shortcut[] = (
  [
    {
      id: "stop",
      action: "stop" as const,
      label: "Stop!",
      icon: Hand,
      emoji: "🛑",
      emphasis: true,
    },
    { id: "ma-bra", href: "/ma-bra", label: "Må bra", icon: Heart, emoji: "🌸" },
    { id: "daglig-rutin", href: "/daglig-rutin", label: "Daglig rutin", icon: Sun, emoji: "☀️" },

    { id: "tasks", href: "/tasks", label: "Att göra", icon: CheckSquare, emoji: "✅" },
    { id: "shopping", href: "/shopping", label: "Inköp", icon: ShoppingBag, emoji: "🛍️" },
    { id: "kalender", href: "/kalender", label: "Kalender", icon: Calendar, emoji: "📅" },
    { id: "pomodoro", href: "/pomodoro", label: "Fokuspass", icon: Timer, emoji: "⏳" },
    { id: "finances", href: "/finances", label: "Ekonomi", icon: Wallet, emoji: "💰" },
    { id: "statistik", href: "/statistik", label: "Statistik", icon: BarChart3, emoji: "📈" },
    { id: "dump", href: "/quickflow", label: "Quickflow", icon: Inbox, emoji: "💭" },
    { id: "matlista", href: "/matlista", label: "Matlista", icon: UtensilsCrossed, emoji: "🍲" },
    { id: "travel", href: "/travel", label: "Resor", icon: Navigation, emoji: "🚌" },
    
    { id: "flow", href: "/flow", label: "Flow", icon: Sparkles, emoji: "✨" },
  ] as Omit<Shortcut, "iconBg" | "iconColor">[]
).map((s, i) => {
  const palette = PREVIEW_PALETTE[i % PREVIEW_PALETTE.length];
  return { ...s, iconBg: palette.bg, iconColor: palette.color } as Shortcut;
});

const DEFAULT_FAVORITES = ["stop", "ma-bra", "daglig-rutin", "kalender"];
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
  const restShortcuts = order
    .filter((id) => !favorites.includes(id))
    .map(byId)
    .filter((s): s is Shortcut => !!s);

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
            {editing ? (
              <>
                <Check size={14} /> Klar
              </>
            ) : (
              <>
                <Settings2 size={14} /> Bytt
              </>
            )}
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

function ShortcutTile({
  shortcut,
  size,
  editing,
  isFavorite,
  canPin = true,
  onToggleFavorite,
  onMoveUp,
  onMoveDown,
  onAction,
}: TileProps) {
  const Icon = shortcut.icon;
  const large = size === "large";
  const emph = shortcut.emphasis;

  const inner = (
    <div
      className={`press flex ${large ? "flex-col gap-3 p-5" : "flex-col gap-2 p-3"} border rounded-3xl shadow-soft h-full ${
        emph ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60"
      } ${!editing ? "hover:-translate-y-0.5 transition-all" : ""}`}
    >
      <div
        className={`relative ${large ? "w-14 h-14" : "w-10 h-10"} rounded-2xl ${emph ? "bg-primary-foreground/20 text-primary-foreground" : `${shortcut.iconBg} ${shortcut.iconColor}`} flex items-center justify-center shrink-0`}
      >
        <Icon size={large ? 24 : 18} strokeWidth={2.2} />
        {shortcut.emoji && (
          <span
            aria-hidden
            className={`absolute -right-1.5 -top-1.5 ${large ? "text-base" : "text-sm"} leading-none drop-shadow-sm`}
          >
            {shortcut.emoji}
          </span>
        )}
      </div>
      <p className={`font-semibold ${large ? "text-base" : "text-sm"} leading-snug`}>
        {shortcut.label}
      </p>
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
          title={
            isFavorite
              ? "Ta bort favorit"
              : canPin
                ? "Fäst som favorit"
                : `Max ${MAX_FAVORITES} favoriter`
          }
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
