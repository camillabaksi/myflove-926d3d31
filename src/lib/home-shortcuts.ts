import { useCallback, useMemo } from "react";
import {
  Baby,
  BarChart3,
  BatteryMedium,
  Brain,
  CalendarDays,
  ClipboardList,
  Heart,
  ListTodo,
  MessageCircle,
  NotebookPen,
  Pill,
  ShoppingBag,
  SprayCan,
  Sparkles,
  Timer,
  Users,
  UtensilsCrossed,
  Wallet,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Egna genvägar på Hem.
 *
 * Användaren väljer själv vad som ska ligga på startsidan. Katalogen pekar
 * bara på sidor som redan finns i appen – ingen ny funktion eller lagring
 * skapas här, valen sparas som en lista med adresser.
 */
export interface HomeShortcut {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const HOME_SHORTCUT_CATALOG: HomeShortcut[] = [
  { href: "/idag", label: "Idag", hint: "Dagens lista", icon: ClipboardList },
  { href: "/kalender", label: "Kalender", hint: "Se och lägg till", icon: CalendarDays },
  { href: "/tasks", label: "Uppgifter", hint: "Det du vill få gjort", icon: ListTodo },
  { href: "/quickflow", label: "QuickFlow", hint: "Få ur dig det som snurrar", icon: Brain },
  { href: "/anteckningar", label: "Anteckningar", hint: "Sådant du vill spara", icon: NotebookPen },
  { href: "/assistant", label: "Prata med Pace", hint: "Fråga eller tänk högt", icon: MessageCircle },
  { href: "/mitt-batteri", label: "Mitt batteri", hint: "Din energi just nu", icon: BatteryMedium },
  { href: "/mitt-batteri", label: "Energi & mående", hint: "Hur är det just nu?", icon: Heart },
  { href: "/aterhamtning", label: "Återhämtning", hint: "Paus, lugn och ljusboost", icon: Wind },
  { href: "/daglig-rutin", label: "Rutiner & medicin", hint: "Dagens doser och rutiner", icon: Pill },
  { href: "/pomodoro", label: "Timer", hint: "Jobba en stund, ta paus", icon: Timer },
  { href: "/shopping", label: "Inköpslista", hint: "Handla utan att glömma", icon: ShoppingBag },
  { href: "/matlista", label: "Matplanering", hint: "Veckans mat", icon: UtensilsCrossed },
  { href: "/stadning", label: "Städning", hint: "Vad som behöver göras hemma", icon: SprayCan },
  { href: "/finances", label: "Ekonomi", hint: "Räkningar och budget", icon: Wallet },
  { href: "/familjeflow", label: "Familj", hint: "Få vardagen att fungera för familjen", icon: Users },
  { href: "/barn", label: "Barn", hint: "Scheman och rutiner", icon: Baby },

  { href: "/statistik", label: "Statistik", hint: "Se dina mönster", icon: BarChart3 },
  { href: "/beloningar", label: "Belöningar", hint: "Det du klarat av", icon: Sparkles },
];

export function findShortcut(href: string): HomeShortcut | undefined {
  return HOME_SHORTCUT_CATALOG.find((item) => item.href === href);
}

const STORAGE_KEY = "myflove-home-shortcuts";
const DEFAULT_SHORTCUTS: string[] = [];

/** Gamla sparade genvägar som pekat på fel sida – Familj ska öppna Family Flow. */
const LEGACY_HREFS: Record<string, string> = { "/familj": "/familjeflow" };

export function useHomeShortcuts() {
  const [saved, setSaved] = useCloudSyncedStorage<string[]>(STORAGE_KEY, DEFAULT_SHORTCUTS);

  const shortcuts = useMemo<(HomeShortcut & { storedHref: string })[]>(
    () =>
      (saved ?? [])
        .map((href) => {
          const item = findShortcut(LEGACY_HREFS[href] ?? href);
          return item ? { ...item, storedHref: href } : null;
        })
        .filter((item): item is HomeShortcut & { storedHref: string } => item != null),
    [saved],
  );



  const add = useCallback(
    (href: string) =>
      setSaved((current) => {
        const list = current ?? [];
        return list.includes(href) ? list : [...list, href];
      }),
    [setSaved],
  );

  const remove = useCallback(
    (href: string) => setSaved((current) => (current ?? []).filter((item) => item !== href)),
    [setSaved],
  );

  const toggle = useCallback(
    (href: string) =>
      setSaved((current) => {
        const list = current ?? [];
        return list.includes(href) ? list.filter((item) => item !== href) : [...list, href];
      }),
    [setSaved],
  );

  const move = useCallback(
    (href: string, dir: -1 | 1) =>
      setSaved((current) => {
        const list = [...(current ?? [])];
        const i = list.indexOf(href);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return list;
        [list[i], list[j]] = [list[j]!, list[i]!];
        return list;
      }),
    [setSaved],
  );

  const reset = useCallback(() => setSaved(DEFAULT_SHORTCUTS), [setSaved]);

  return { shortcuts, add, remove, toggle, move, reset };
}
