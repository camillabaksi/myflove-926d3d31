import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useRouter } from "@tanstack/react-router";
import {
  Home,
  Target,
  CheckSquare,
  ShoppingBag,
  Sparkles,
  Wallet,
  Navigation,
  NotebookPen,
  Calendar,
  Menu,
  X,
  BellRing,
  Timer,
  Pill,
  BarChart3,
  Trophy,
  Inbox,
  Users,
  UtensilsCrossed,
  MapPin,
  ListOrdered,
  Flame,
  Settings2,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  LogOut,
  Volume2,
  VolumeX,
  Shield,
  Heart,
  Sun,
  Search,
  GraduationCap,
  Briefcase,
  Baby,
  CalendarDays,
  Brain,
  HeartPulse,
  House,
  BookOpen,
  Building2,
  LayoutGrid,
  Dumbbell,
  SprayCan,
  Zap,
  Gauge,
  ArrowLeft,
  Accessibility,
  Plus,
  Compass,
  ChevronRight,
} from "lucide-react";
import {
  isAlarmSoundEnabled,
  setAlarmSoundEnabled,
  subscribeAlarmPref,
  playAlarmPreview,
  initAlarmAudioUnlock,
} from "@/lib/push-notifications";
import { useCommuteAlerts } from "@/hooks/use-commute-alerts";
import { useMedicationAlerts } from "@/hooks/use-medication-alerts";
import { useShoppingProximityAlerts } from "@/hooks/use-shopping-proximity-alerts";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { useAchievementPush } from "@/hooks/use-achievement-push";
import { usePurgeRevisions } from "@/hooks/use-purge-revisions";
import { usePushSubscriptionSync } from "@/hooks/use-push-subscription-sync";
import { useNotificationActions } from "@/hooks/use-notification-actions";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { useSituation } from "@/hooks/use-situation";
import { lifeProfileSummary } from "@/lib/life-profile";
import ViewCollapseToggle from "@/components/view-collapse-toggle";
import FlowCompanion from "@/components/flow/flow-companion";

/** Vyer som redan har Flow på sitt eget sätt – där dubblerar vi inte. */
const FLOW_HIDDEN_PATHS = new Set([
  "/",
  "/hem",
  "/idag",
  "/flow",
  "/pitch",
  "/admin",
  "/admin-statistik",
  "/integritet",
  "/villkor",
  "/dev-session",
]);


import { useEnabledAreas } from "@/lib/life-areas";
import { useLocalStorage } from "@/lib/storage";
import { useNpfSettings, plainLabel } from "@/lib/npf-mode";
import { trackEvent } from "@/lib/analytics";
import { rememberPlace } from "@/lib/flow-context";
import { Button } from "@/components/ui/button";
import { useClerk, Show } from "@clerk/react";
import { DeleteAccountButton } from "@/components/delete-account-button";

interface LayoutProps {
  children: ReactNode;
}

/** Egen färgton per navigationskategori – gör mer-vyn lätt att skanna. */
const CATEGORY_HUE: Record<string, string> = {
  myflow: "258 62% 60%",
  flowflow: "285 52% 58%",
  healthflow: "327 62% 62%",
  homeflow: "196 48% 52%",
  familyflow: "348 62% 66%",
  studyflow: "232 58% 64%",
  workflow: "212 48% 52%",
  travelflow: "172 44% 46%",
  avancerat: "258 20% 48%",
  ovrigt: "258 12% 52%",
};
const catColor = (id: string, alpha?: number) => {
  const hue = CATEGORY_HUE[id] ?? "220 10% 42%";
  return alpha === undefined ? `hsl(${hue})` : `hsl(${hue} / ${alpha})`;
};

const SECTION_BY_PATH: Record<string, string> = {
  "/": "home",
  "/ma-bra": "ma-bra",
  "/energifloede": "energifloede",
  "/daglig-rutin": "daglig-rutin",
  "/quickflow": "quickflow",
  "/anteckningar": "anteckningar",
  "/kalender": "calendar",
  "/fokus": "fokus",
  "/tasks": "tasks",
  "/pomodoro": "pomodoro",
  "/shopping": "shopping",
  "/finances": "finances",
  "/travel": "travel",
  "/statistik": "statistik",
  "/beloningar": "beloningar",
  "/assistant": "assistant",
  "/flow": "flow",
  "/flowplan": "flowplan",
  "/flowscore": "flowscore",
  "/admin-statistik": "admin",
  "/admin": "admin",
  "/friktionsindex": "friktionsindex",
  "/familj": "familj",
  "/matlista": "matlista",
  "/stadning": "stadning",
  "/insight": "insight",
};

/**
 * Per-category color themes, all drawn from the soft lilac MyFlove palette.
 * They override --primary / --accent / --ring so text-primary, bg-primary, etc.
 * re-tint automatically per page – alltid inom lila/rosa/mint-familjen.
 */
const T = {
  terracotta: {
    "--primary": "327 62% 62%",
    "--ring": "327 62% 62%",
    "--accent": "327 70% 93%",
    "--accent-foreground": "327 45% 34%",
  },
  sage: {
    "--primary": "168 42% 44%",
    "--ring": "168 42% 44%",
    "--accent": "168 45% 90%",
    "--accent-foreground": "168 45% 24%",
  },
  gold: {
    "--primary": "285 52% 58%",
    "--ring": "285 52% 58%",
    "--accent": "285 55% 93%",
    "--accent-foreground": "285 45% 30%",
  },
  ink: {
    "--primary": "258 68% 62%",
    "--ring": "258 68% 62%",
    "--accent": "258 60% 93%",
    "--accent-foreground": "258 45% 30%",
  },
};

const CATEGORY_THEMES: Record<string, Record<string, string>> = {
  "/ma-bra": T.sage,
  "/energifloede": T.sage,
  "/daglig-rutin": T.terracotta,
  "/pomodoro": T.terracotta,
  "/fokus": T.terracotta,
  "/finances": T.gold,
  "/kalender": T.ink,
  "/flowplan": T.ink,
  "/flow": T.ink,
  "/flowscore": T.ink,
  "/shopping": T.sage,
  "/matlista": T.sage,
  "/stadning": T.sage,
  "/travel": T.ink,
  "/familj": T.gold,
  "/beloningar": T.gold,
  "/statistik": T.ink,
  "/friktionsindex": T.terracotta,
  "/insight": {
    "--primary": "285 52% 58%",
    "--ring": "285 52% 58%",
    "--accent": "285 55% 93%",
    "--accent-foreground": "285 45% 30%",
  },
};

import QuickflowFab from "@/components/quickflow-fab";

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { alerts, dismissAlert } = useCommuteAlerts();
  const { alerts: medicationAlerts, dismissAlert: dismissMedicationAlert } = useMedicationAlerts();
  const { alerts: proximityAlerts, dismissAlert: dismissProximityAlert } =
    useShoppingProximityAlerts();
  useNotificationScheduler();
  useAchievementPush();
  usePurgeRevisions();
  usePushSubscriptionSync();
  useNotificationActions();

  const { isAdmin } = useIsAdmin();
  const { enabled: enabledAreas } = useEnabledAreas();
  const { settings: npf } = useNpfSettings();

  // Använd TanStack-routerns faktiska location så tillbakaknappen alltid
  // synkar med appens historik – även vid djupa länkar eller SPA-navigering.
  const tanstackLocation = router.state.location.pathname;
  const canGoBack = tanstackLocation !== "/";
  const handleBack = () => {
    if (typeof window === "undefined") return;
    if (router.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/hem" });
    }
  };

  const [alarmEnabled, setAlarmEnabledState] = useState<boolean>(() => isAlarmSoundEnabled());
  useEffect(() => subscribeAlarmPref((v) => setAlarmEnabledState(v)), []);
  useEffect(() => {
    initAlarmAudioUnlock();
  }, []);
  const toggleAlarm = () => {
    const next = !alarmEnabled;
    setAlarmSoundEnabled(next);
    setAlarmEnabledState(next);
    if (next) playAlarmPreview();
  };

  useEffect(() => {
    const section = SECTION_BY_PATH[location] ?? (location.replace(/^\//, "") || "home");
    trackEvent(section, "view");
    rememberPlace(location);
  }, [location]);

  type NavItem = {
    href: string;
    label: string;
    icon: typeof Home;
    hint: string;
    essential?: boolean;
  };
  const navItems: NavItem[] = [
    { href: "/hem", label: "Hem", icon: Home, hint: "Din överblick över dagen", essential: true },
    {
      href: "/idag",
      label: "Min dag",
      icon: Heart,
      hint: "Vad din dag består av – och vad du gjort",
      essential: true,
    },
    {
      href: "/ma-bra",
      label: "Må bra",
      icon: Heart,
      hint: "Logga hur du mår och hur mycket ork du har",
    },
    {
      href: "/energifloede",
      label: "Energins historik",
      icon: Zap,
      hint: "Mönster: vad som brukar ge och ta energi",
    },

    {
      href: "/traning",
      label: "Träning",
      icon: Dumbbell,
      hint: "Enkla pass anpassade efter din ork",
    },
    {
      href: "/daglig-rutin",
      label: "Rutiner & medicin",
      icon: Sun,
      hint: "Fasta rutiner och dagens doser",
    },
    {
      href: "/quickflow",
      label: "QuickFlow",
      icon: Inbox,
      hint: "Fånga en tanke snabbt",
      essential: true,
    },
    {
      href: "/anteckningar",
      label: "Anteckningar",
      icon: NotebookPen,
      hint: "Din idébank – tankar utan krav",
    },
    {
      href: "/kalender",
      label: "Kalender",
      icon: Calendar,
      hint: "Allt som händer, dag för dag",
      essential: true,
    },
    {
      href: "/paminnelser",
      label: "Påminnelser",
      icon: BellRing,
      hint: "Lägg till, ändra och avboka påminnelser",
    },

    {
      href: "/tasks",
      label: "Att göra",
      icon: CheckSquare,
      hint: "Hela listan – även kommande dagar",
    },
    {
      href: "/flowscore",
      label: "Dagens balans",
      icon: Gauge,
      hint: "Hur dagens krav matchar din ork",
    },
    {
      href: "/veckans-flow",
      label: "Veckans översikt",
      icon: CalendarDays,
      hint: "Lugn tillbakablick på veckan",
    },
    { href: "/pomodoro", label: "Timer", icon: Timer, hint: "Jobba en stund, ta paus" },
    { href: "/shopping", label: "Inköp", icon: ShoppingBag, hint: "Inköpslista du kan dela" },
    {
      href: "/matlista",
      label: "Matlista",
      icon: UtensilsCrossed,
      hint: "Planera veckans mat",
      essential: true,
    },
    { href: "/stadning", label: "Städning", icon: SprayCan, hint: "Vad som behöver göras hemma" },
    { href: "/finances", label: "Ekonomi", icon: Wallet, hint: "Räkningar och budget" },
    {
      href: "/travel",
      label: "Resor",
      icon: Navigation,
      hint: "Buss och tåg i realtid",
      essential: true,
    },
    {
      href: "/relationer",
      label: "Relationer",
      icon: Heart,
      hint: "Personerna som hör till ditt liv",
      essential: true,
    },
    { href: "/familj", label: "Familj", icon: Users, hint: "Dela listor och kalender med andra" },
    { href: "/barn", label: "Barn", icon: Baby, hint: "Scheman och rutiner för barnen" },
    { href: "/statistik", label: "Statistik", icon: BarChart3, hint: "Se dina mönster över tid" },
    {
      href: "/beloningar",
      label: "Belöningar",
      icon: Trophy,
      hint: "Små morötter när du gjort något",
    },
    {
      href: "/insight",
      label: "Mina mönster",
      icon: Brain,
      hint: "Vad som brukar funka för dig",
      essential: true,
    },
    {
      href: "/flow",
      label: "Planera",
      icon: Sparkles,
      hint: "Vad är bäst just nu och vad hinner jag idag?",
      essential: true,
    },
    {
      href: "/friktionsindex",
      label: "Feedback",
      icon: Flame,
      hint: "Berätta vad som skaver i appen",
    },
    ...(enabledAreas.includes("studier")
      ? [
          {
            href: "/studyflow",
            label: "Studier",
            icon: GraduationCap,
            hint: "Schema, prov och vad du ska plugga nu",
            essential: true,
          },
          {
            href: "/studybuddy",
            label: "Studiehjälp",
            icon: Brain,
            hint: "Flashcards och quiz på ditt material",
          },
        ]
      : []),

    ...(enabledAreas.includes("jobb")
      ? [
          {
            href: "/jobb",
            label: "Jobb",
            icon: Briefcase,
            hint: "Dina arbetsuppgifter och möten",
            essential: true,
          },
          {
            href: "/workflow",
            label: "Jobbplanering",
            icon: Zap,
            hint: "Vad du ska göra härnäst på jobbet",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Adminöversikt",
            icon: Shield,
            hint: "Roller, åtkomst och rapporter",
          },
          {
            href: "/admin-statistik",
            label: "Appstatistik",
            icon: BarChart3,
            hint: "Besökare och användning",
          },
        ]
      : []),
    {
      href: "/oversikt",
      label: "Så funkar MyFlove",
      icon: Compass,
      hint: "Enkel sammanfattning av allt i appen – och vart du går",
      essential: true,
    },
    {
      href: "/min-livsprofil",
      label: "Min livsprofil",
      icon: Compass,
      hint: "Din vardag, styrkor, svårigheter och vad du vill ha hjälp med",
    },
    {
      href: "/anpassa-hem",
      label: "Anpassa hemskärmen",
      icon: Home,
      hint: "Välj vilka block som syns på Hem, ordning och dina genvägar",
    },
    {
      href: "/anpassa",
      label: "Anpassa appen",
      icon: Accessibility,
      hint: "Lugnare färger, färre saker, tyst läge och enkla ord",
      essential: true,
    },
  ].map((i) => ({ ...i, label: plainLabel(i.label, npf.plainWords) }));

  // Kategorier – gör navigationen lugnare genom att gruppera sektionerna.
  const categories = useMemo(() => {
    const byHref = (href: string) => navItems.find((i) => i.href === href);
    const groups: {
      id: string;
      label: string;
      hint: string;
      icon: typeof Home;
      hrefs: string[];
    }[] = [
      {
        id: "myflow",
        label: "Idag & planera",
        hint: "Dagen, kalendern, att göra och rutiner",
        icon: CalendarDays,
        hrefs: ["/idag", "/kalender", "/tasks", "/daglig-rutin", "/paminnelser", "/pomodoro"],
      },
      {
        id: "flowflow",
        label: "Planera",
        hint: "Nästa steg, ordning, ändra planen och hjälp",
        icon: Sparkles,
        hrefs: ["/flow", "/quickflow", "/anteckningar", "/beloningar"],
      },
      {
        id: "studyflow",
        label: "Studier",
        hint: "Schema, prov och plugg",
        icon: BookOpen,
        hrefs: ["/studyflow", "/studybuddy"],
      },
      {
        id: "workflow",
        label: "Jobb",
        hint: "Uppgifter och möten",
        icon: Building2,
        hrefs: ["/jobb", "/workflow"],
      },
      {
        id: "familyflow",
        label: "Familj",
        hint: "Personer du delar vardagen med",
        icon: HeartPulse,
        hrefs: ["/relationer", "/familj", "/barn"],
      },
      {
        id: "homeflow",
        label: "Hemma",
        hint: "Mat, inköp, städning och pengar",
        icon: House,
        hrefs: ["/matlista", "/shopping", "/stadning", "/finances"],
      },
      {
        id: "travelflow",
        label: "Resor",
        hint: "Buss och tåg i realtid",
        icon: Navigation,
        hrefs: ["/travel"],
      },
      {
        id: "healthflow",
        label: "Mina mönster",
        hint: "Din energi, hälsa, mönster och statistik",
        icon: Brain,
        hrefs: ["/insight", "/ma-bra", "/energifloede", "/statistik", "/traning"],
      },
      {
        id: "avancerat",
        label: "Avancerat",
        hint: "Detaljerna bakom planeringen – bara om du vill se dem",
        icon: Gauge,
        hrefs: ["/flowscore", "/veckans-flow", "/friktionsindex"],
      },
      {
        id: "ovrigt",
        label: "Inställningar",
        hint: "Rutiner, min livsprofil, anpassning och feedback",
        icon: LayoutGrid,
        hrefs: [
          
          "/min-livsprofil",
          "/anpassa-hem",
          "/anpassa",
          "/admin",
          "/admin-statistik",
        ],
      },
    ];

    return groups
      .map((g) => ({ ...g, items: g.hrefs.map(byHref).filter(Boolean) as typeof navItems }))
      .filter((g) => g.items.length > 0);
  }, [navItems]);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [navSearch, setNavSearch] = useState("");
  const { situation } = useSituation();
  const { profile: lifeProfile } = useLifeProfile();
  const situationLabel = lifeProfileSummary(lifeProfile, situation);
  // Egna platser i bottennavet – du byter dem själv i "Mer".
  const [navSlots, setNavSlots] = useLocalStorage<string[]>("myflove-bottom-nav-slots", [
    "/idag",
    "/flow",
  ]);
  const [editingNav, setEditingNav] = useState(false);

  // Enkelt läge: visar bara det viktigaste tills man själv vill se mer.
  const [simpleMode, setSimpleMode] = useLocalStorage<boolean>("myflove-simple-mode", true);
  const essentialItems = useMemo(() => navItems.filter((i) => i.essential), [navItems]);

  const searchResults = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return [];
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q),
    );
  }, [navSearch, navItems]);

  /**
   * Bottennavet: Hem är fast, sedan två platser du väljer själv.
   * Standard: Kalender (hela kalendern) och Flow.
   */
  const primaryNav = useMemo(() => {
    const pick = (href: string) => navItems.find((i) => i.href === href);
    const slot1 = pick(navSlots[0] ?? "") ?? pick("/idag") ?? pick("/kalender");
    const slot2 = pick(navSlots[1] ?? "") ?? pick("/flow");
    return [pick("/hem"), slot1, slot2].filter(Boolean) as typeof navItems;
  }, [navItems, navSlots]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background md:flex-row relative">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 shrink-0 overflow-y-auto">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">MyFlove</h1>
        </div>
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                className="flex items-center gap-2 px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: catColor(cat.id) }}
              >
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: catColor(cat.id, 0.14) }}
                  aria-hidden="true"
                >
                  <cat.icon size={14} />
                </span>
                {cat.label}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {cat.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-xs leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4 pb-2 space-y-2">
          <Link href="/anpassa">
            <Button variant="outline" className="w-full rounded-xl gap-2">
              <Accessibility size={16} /> Anpassa appen
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={toggleAlarm}
            title={alarmEnabled ? "Stäng av alarmljud" : "Slå på alarmljud"}
          >
            {alarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Alarmljud: {alarmEnabled ? "på" : "av"}
          </Button>
          <Show when="signed-in">
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => signOut()}>
              <LogOut size={16} /> Logga ut
            </Button>
            <DeleteAccountButton className="w-full" />
          </Show>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/80 p-3 backdrop-blur-md md:hidden">
          {canGoBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Gå tillbaka"
              className="justify-self-start rounded-full p-2 text-foreground transition-colors hover:bg-primary/10"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <span aria-hidden className="w-2 shrink-0" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-bold tracking-tight text-primary">
            MyFlove
          </h1>
          <ViewCollapseToggle />
        </header>

        <div className="hidden md:flex items-center gap-2 px-8 pt-6">
          {primaryNav.map((item) => {
            const active =
              item.href === "/flow"
                ? location.startsWith("/flow") || location.startsWith("/assistant")
                : location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-transform active:scale-95"
          >
            <Plus size={16} /> QuickFlow
          </button>
        </div>

        <div className="hidden md:flex items-center justify-between px-8 pt-4">
          {canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={18} /> Tillbaka
            </Button>
          ) : (
            <span />
          )}
          <ViewCollapseToggle />
        </div>

        {alerts.length > 0 && (
          <div className="px-4 pt-4 md:px-8 md:pt-6 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.tripId}
                className="flex items-center justify-between gap-3 bg-gold/15 border border-gold/30 text-ink rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-3">
                  <BellRing size={20} className="shrink-0" />
                  <p className="text-sm font-medium">
                    Dags att gå! <strong>{alert.label}</strong> avgår{" "}
                    {alert.minutesUntilDeparture <= 0
                      ? "nu"
                      : `om ${alert.minutesUntilDeparture} min`}{" "}
                    ({alert.departureTime}, {alert.lineName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert)}
                  aria-label="Stäng varning"
                  className="shrink-0 p-1.5 rounded-full hover:bg-gold/25"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {medicationAlerts.length > 0 && (
          <div className="px-4 pt-4 md:px-8 md:pt-6 space-y-2">
            {medicationAlerts.map((alert) => (
              <div
                key={alert.key}
                className="flex items-center justify-between gap-3 bg-gold/15 border border-gold/30 text-ink rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-3">
                  <Pill size={20} className="shrink-0" />
                  <p className="text-sm font-medium">
                    Dags att ta <strong>{alert.name}</strong>
                    {alert.dosage ? ` (${alert.dosage})` : ""} – {alert.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissMedicationAlert(alert)}
                  aria-label="Stäng varning"
                  className="shrink-0 p-1.5 rounded-full hover:bg-gold/25"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {proximityAlerts.length > 0 && (
          <div className="px-4 pt-4 md:px-8 md:pt-6 space-y-2">
            {proximityAlerts.map((alert) => (
              <div
                key={alert.storeId}
                className="flex items-center justify-between gap-3 bg-gold/15 border border-gold/30 text-ink rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="shrink-0" />
                  <p className="text-sm font-medium">
                    Du är nära <strong>{alert.storeName}</strong> – glöm inte inköpslistan!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissProximityAlert(alert)}
                  aria-label="Stäng varning"
                  className="shrink-0 p-1.5 rounded-full hover:bg-gold/25"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto pb-24 md:pb-8"
          style={CATEGORY_THEMES[location] as React.CSSProperties}
        >
          <div key={location} className="max-w-2xl mx-auto w-full p-4 md:p-8 page-enter">
            {!FLOW_HIDDEN_PATHS.has(location) && (
              <FlowCompanion stage="mini" className="mb-4" />
            )}
            {children}
          </div>

          <footer className="max-w-2xl mx-auto w-full px-4 md:px-8 pt-4 pb-8 mt-8 border-t border-border/40">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <Link
                href="/integritet"
                className="hover:text-primary underline-offset-2 hover:underline"
              >
                Integritet
              </Link>
              <span aria-hidden>·</span>
              <Link
                href="/villkor"
                className="hover:text-primary underline-offset-2 hover:underline"
              >
                Villkor
              </Link>
              <span aria-hidden>·</span>
              <Link
                href="/cookies"
                className="hover:text-primary underline-offset-2 hover:underline"
              >
                Cookies
              </Link>
              <span aria-hidden>·</span>
              <a
                href="mailto:camillabaksi@hotmail.com"
                className="hover:text-primary underline-offset-2 hover:underline"
              >
                Kontakt
              </a>
            </div>
            <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
              © {new Date().getFullYear()} MyFlove
            </p>
          </footer>
        </div>
      </main>

      <QuickflowFab />

      {/* Mobile Bottom Bar – Hem · Min dag · QuickFlow · Planera · Mer */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/70 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="flex items-end justify-around px-1 pt-1.5 pb-1">
          {primaryNav.slice(0, 2).map((item) => (
            <BottomNavLink
              key={item.href}
              item={item}
              active={location === item.href}
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}

          {/* QuickFlow – alltid en tumme bort */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
            aria-label="QuickFlow – få ut det ur huvudet"
            className="flex flex-col items-center gap-1 px-2 pb-1 press"
          >
            <span className="-mt-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lifted ring-4 ring-card transition-transform active:scale-95">
              <Plus size={26} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-semibold text-primary">QuickFlow</span>
          </button>

          {primaryNav.slice(2, 3).map((item) => (
            <BottomNavLink
              key={item.href}
              item={item}
              active={location.startsWith(item.href)}
              onClick={() => setMobileMenuOpen(false)}
              label={item.label}
            />
          ))}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 min-w-[3.7rem] press ${
              mobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center rounded-2xl px-3 py-1 transition-colors ${
                mobileMenuOpen ? "bg-primary/12" : ""
              }`}
            >
              <Menu size={22} strokeWidth={mobileMenuOpen ? 2.6 : 2} />
            </span>
            <span className="text-[10px] font-medium">Mer</span>
          </button>
        </div>
      </nav>

      {/* Mer – en lugn vy: sök, kategorier och inställningar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-border/50">
              <h2 className="text-lg font-medium text-muted-foreground">
                {openCategory
                  ? (categories.find((c) => c.id === openCategory)?.label ?? "Mer")
                  : "Mer"}
              </h2>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setOpenCategory(null);
                }}
                className="p-2 text-muted-foreground hover:bg-secondary rounded-full"
                aria-label="Stäng"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="search"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Sök i appen…"
                  aria-label="Sök i appen"
                  className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {navSearch && (
                  <button
                    type="button"
                    aria-label="Rensa sökning"
                    onClick={() => setNavSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:bg-secondary"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {navSearch.trim() ? (
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((item) => (
                      <NavRow
                        key={item.href}
                        item={item}
                        isActive={location === item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setOpenCategory(null);
                          setNavSearch("");
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center mt-8">
                    Hittade inget som matchar ”{navSearch}”.
                  </p>
                )
              ) : openCategory ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenCategory(null)}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw size={16} /> Alla kategorier
                  </button>
                  <div className="space-y-2">
                    {(categories.find((c) => c.id === openCategory)?.items ?? [])
                      .filter((item) => (simpleMode ? item.essential : true))
                      .map((item) => (
                        <NavRow
                          key={item.href}
                          item={item}
                          isActive={location === item.href}
                          tint={catColor(openCategory, 0.1)}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setOpenCategory(null);
                          }}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Min livsprofil – alltid överst i Mer */}
                  <Link
                    href="/min-livsprofil"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setOpenCategory(null);
                    }}
                    className="mb-4 flex items-center gap-3 rounded-3xl border border-primary/30 bg-primary/10 p-4 shadow-sm press"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Compass size={22} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">Min livsprofil</span>
                      <span
                        data-npf="optional"
                        className="block truncate text-xs text-muted-foreground"
                      >
                        {situationLabel}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSimpleMode(!simpleMode)}
                    className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      simpleMode
                        ? "border-primary bg-primary/12 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Check size={14} />
                    {simpleMode ? "Visar bara det viktigaste" : "Visa bara det viktigaste"}
                  </button>

                  {/* Byt platser i bottenmenyn */}
                  <div className="mb-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Din bottenmeny</p>
                        <p data-npf="optional" className="text-xs text-muted-foreground">
                          Hem, QuickFlow och Mer ligger fast. Två platser väljer du själv – normalt
                          Idag och Flow.
                        </p>
                      </div>
                      <Button
                        variant={editingNav ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl gap-1"
                        onClick={() => setEditingNav((v) => !v)}
                      >
                        {editingNav ? (
                          <>
                            <Check size={14} /> Klar
                          </>
                        ) : (
                          "Ändra"
                        )}
                      </Button>
                    </div>

                    {editingNav && (
                      <div className="mt-3 space-y-3">
                        {[0, 1].map((slot) => (
                          <label key={slot} className="block">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                              Plats {slot + 1}
                            </span>
                            <select
                              value={navSlots[slot] ?? ""}
                              onChange={(e) => {
                                const next = [navSlots[0] ?? "", navSlots[1] ?? ""];
                                next[slot] = e.target.value;
                                setNavSlots(next);
                              }}
                              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {navItems
                                .filter((i) => i.href !== "/hem")
                                .map((i) => (
                                  <option key={i.href} value={i.href}>
                                    {i.label}
                                  </option>
                                ))}
                            </select>
                          </label>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl gap-1"
                          onClick={() => setNavSlots(["/idag", "/flow"])}
                        >
                          <RotateCcw size={14} /> Återställ
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {categories
                      .filter((cat) =>
                        simpleMode ? cat.items.some((i) => i.essential) : cat.items.length > 0,
                      )
                      .map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setOpenCategory(cat.id)}
                            style={{
                              backgroundColor: catColor(cat.id, 0.12),
                              borderColor: catColor(cat.id, 0.35),
                              color: catColor(cat.id),
                            }}
                            className="flex flex-col items-center justify-center gap-2 rounded-3xl p-4 text-center border shadow-sm transition-all duration-200 active:scale-95"
                          >
                            <span
                              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                              style={{ backgroundColor: catColor(cat.id, 0.18) }}
                              aria-hidden="true"
                            >
                              <Icon size={26} />
                            </span>
                            <span className="text-sm font-medium leading-tight">{cat.label}</span>
                            <span
                              data-npf="optional"
                              className="text-[11px] leading-snug opacity-70"
                            >
                              {cat.hint}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3">
                    <Link href="/anpassa" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="rounded-xl gap-2">
                        <Accessibility size={16} /> Anpassa appen
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={toggleAlarm}
                    >
                      {alarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      Alarmljud: {alarmEnabled ? "på" : "av"}
                    </Button>
                    <Show when="signed-in">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut size={16} /> Logga ut
                      </Button>
                      <DeleteAccountButton />
                    </Show>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** En rad i menyn: ikon, namn och en förklaring i klartext. */
function NavRow({
  item,
  isActive,
  onClick,
  tint,
}: {
  item: { href: string; label: string; icon: typeof Home; hint: string };
  isActive: boolean;
  onClick: () => void;
  tint?: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={!isActive && tint ? { backgroundColor: tint } : undefined}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition-colors ${
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground"
      }`}
    >
      <span className="shrink-0">
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{item.label}</span>
        <span
          data-npf="optional"
          className={`block text-xs leading-snug ${isActive ? "opacity-80" : "text-muted-foreground"}`}
        >
          {item.hint}
        </span>
      </span>
    </Link>
  );
}

function BottomNavLink({
  item,
  active,
  onClick,
  label,
}: {
  item: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  };
  active: boolean;
  onClick: () => void;
  /** Kortare namn i navet, t.ex. "Flow" i stället för "Hjälp". */
  label?: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 min-w-[3.7rem] press ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-2xl px-3 py-1 transition-colors ${
          active ? "bg-primary/12" : ""
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.6 : 2} />
      </span>
      <span className="text-[10px] font-medium">{label ?? item.label}</span>
    </Link>
  );
}
