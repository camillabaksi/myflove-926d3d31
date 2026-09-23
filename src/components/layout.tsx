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
  NotebookPen,
  Calendar,
  Menu,
  X,
  BellRing,
  Timer,
  Pill,
  BarChart3,
  Trophy,
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
  ChevronRight,
  MessageCircle,
  Hand,
  Wind,
} from "lucide-react";
import { initAlarmAudioUnlock } from "@/lib/push-notifications";
import { initPersonalization } from "@/lib/personalization";
import { useMedicationAlerts } from "@/hooks/use-medication-alerts";
import { useShoppingProximityAlerts } from "@/hooks/use-shopping-proximity-alerts";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { useAchievementPush } from "@/hooks/use-achievement-push";
import { usePurgeRevisions } from "@/hooks/use-purge-revisions";
import { usePushSubscriptionSync } from "@/hooks/use-push-subscription-sync";
import { useFlowProactivePush } from "@/hooks/use-flow-proactive-push";
import { useNotificationActions } from "@/hooks/use-notification-actions";

import { useIsAdmin } from "@/hooks/use-is-admin";
import ViewCollapseToggle from "@/components/view-collapse-toggle";
import FlowCompanion from "@/components/flow/flow-companion";
import FlowCheckinPopup from "@/components/flow-checkin-popup";
import GlobalActivityEnergyPrompt from "@/components/global-activity-energy-prompt";
import AutoTranslateProvider from "@/components/auto-translate-provider";
import DemoBanner from "@/components/demo-banner";
import { useDemoAccount } from "@/hooks/use-demo-account";

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

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useNpfSettings, plainLabel } from "@/lib/npf-mode";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { trackRetention } from "@/lib/analytics-retention";
import { rememberPlace } from "@/lib/flow-context";
import { Button } from "@/components/ui/button";
import { Show } from "@clerk/react";

interface LayoutProps {
  children: ReactNode;
}

/** Egen färgton per navigationskategori – gör mer-vyn lätt att skanna. */
const CATEGORY_HUE: Record<string, string> = {
  myflow: "258 62% 60%",
  flowflow: "285 52% 58%",
  quickflow: "38 82% 56%",
  healthflow: "327 62% 62%",
  insightflow: "285 52% 58%",
  flowhelp: "258 62% 60%",
  homeflow: "196 48% 52%",
  familyflow: "348 62% 66%",
  studyflow: "232 58% 64%",
  workflow: "212 48% 52%",
  avancerat: "258 20% 48%",
  ovrigt: "258 12% 52%",
};
const catColor = (id: string, alpha?: number) => {
  const hue = CATEGORY_HUE[id] ?? "220 10% 42%";
  return alpha === undefined ? `hsl(${hue})` : `hsl(${hue} / ${alpha})`;
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
  "/mitt-batteri": T.sage,
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
  "/familj": T.gold,
  "/familjeflow": T.gold,
  "/beloningar": T.gold,
  "/statistik": T.ink,
  "/historik": T.ink,
  "/friktionsindex": T.terracotta,
  "/insight": {
    "--primary": "285 52% 58%",
    "--ring": "285 52% 58%",
    "--accent": "285 55% 93%",
    "--accent-foreground": "285 45% 30%",
  },
};

import QuickflowFab from "@/components/quickflow-fab";
import QuickflowCapture from "@/components/quickflow-capture";
import { useSmartBack } from "@/hooks/use-smart-back";

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    alerts: medicationAlerts,
    dismissAlert: dismissMedicationAlert,
    takeAlert: takeMedicationAlert,
    snoozeAlert: snoozeMedicationAlert,
  } = useMedicationAlerts();
  const { alerts: proximityAlerts, dismissAlert: dismissProximityAlert } =
    useShoppingProximityAlerts();
  useNotificationScheduler();
  useAchievementPush();
  usePurgeRevisions();
  usePushSubscriptionSync();
  useFlowProactivePush();
  useNotificationActions();

  const { isAdmin } = useIsAdmin();
  const { isDemo } = useDemoAccount();
  const { enabled: enabledAreas } = useEnabledAreas();
  const { settings: npf } = useNpfSettings();
  const { t } = useLang();

  // Använd TanStack-routerns faktiska location så tillbakaknappen alltid
  // synkar med appens historik – även vid djupa länkar eller SPA-navigering.
  const goBack = useSmartBack("/hem");
  const tanstackLocation = router.state.location.pathname;
  const canGoBack = tanstackLocation !== "/";
  const handleBack = goBack;

  useEffect(() => {
    initAlarmAudioUnlock();
    initPersonalization();
  }, []);
  // Ett app_opened per webbläsarsession (inte per navigering).
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("myflove-app-opened") !== "1") {
        window.sessionStorage.setItem("myflove-app-opened", "1");
        track("app_opened");
        trackRetention();
      }
    } catch {
      // Statistik får aldrig störa appen.
    }
  }, []);

  // Sidvisningar loggas på EN plats (trackPageView i __root) så att samma
  // navigering aldrig räknas två gånger. Här minns vi bara var användaren är.
  useEffect(() => {
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
    {
      href: "/hem",
      label: "Översikt",
      icon: Home,
      hint: "Dagen, energin och nästa steg",
      essential: true,
    },

    {
      href: "/idag",
      label: "Idag",
      icon: CalendarDays,
      hint: "Vad som händer idag – hela dagens lista",
      essential: true,
    },
    {
      href: "/halsa",
      label: "Hälsa",
      icon: HeartPulse,
      hint: "Energi, mående, träning, medicin och vila",
      essential: true,
    },
    {
      href: "/mitt-batteri",
      label: "Mitt batteri",
      icon: Heart,
      hint: "Energi och mående – checka in på några sekunder",
    },

    {
      href: "/energifloede",
      label: "Energins historik",
      icon: Zap,
      hint: "Mönster: vad som brukar ge och ta energi",
    },
    {
      href: "/aterhamtning",
      label: "Återhämtning",
      icon: Wind,
      hint: "Paus du väljer längden på, Ljusboost och Stopp-knappen",

      essential: true,
    },
    {
      href: "/stop-paus",
      label: "Stop-paus",
      icon: Hand,
      hint: "🛑 En paus mellan impuls och beslut",
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
      href: "/morgonstart",
      label: "Morgonstart",
      icon: Sun,
      hint: "Kom igång på morgonen – finns under rutiner",
    },

    {
      href: "/quickflow",
      label: "QuickFlow",
      icon: Brain,
      hint: "Fånga något snabbt – sortera sedan",
      essential: true,
    },
    {
      href: "/anteckningar",
      label: "Anteckningar",
      icon: NotebookPen,
      hint: "Din idébank – tankar utan krav",
    },
    {
      href: "/assistant",
      label: "Prata med Flow",
      icon: MessageCircle,
      hint: "Chatta med Flow – din personliga följeslagare",
      essential: true,
    },
    {
      href: "/kalender",
      label: "Kalender",
      icon: Calendar,
      hint: "Tider och händelser, dag för dag",
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
      label: "Alla uppgifter",
      icon: CheckSquare,
      hint: "Hela listan framåt – dagens saker bor i Idag",
    },
    {
      href: "/flowscore",
      label: "Dagens balans",
      icon: Gauge,
      hint: "Hur dagens krav matchar din ork",
    },
    { href: "/pomodoro", label: "Timer", icon: Timer, hint: "Jobba en stund, ta paus" },
    { href: "/shopping", label: "Inköpslista", icon: ShoppingBag, hint: "Inköpslista du kan dela" },
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
      href: "/relationer",
      label: "Relationer",
      icon: Heart,
      hint: "Personerna som hör till ditt liv",
      essential: true,
    },
    {
      href: "/familjeflow",
      label: "Familj",
      icon: Users,
      hint: "Få vardagen att fungera för hela familjen",
      essential: true,
    },
    { href: "/familj", label: "Dela & bjud in", icon: Users, hint: "Dela listor och kalender med andra" },
    { href: "/barn", label: "Barn", icon: Baby, hint: "Scheman och rutiner för barnen" },
    {
      href: "/historik",
      label: "Historik",
      icon: CalendarDays,
      hint: "Vad hände dina dagar – och vad gav eller tog energi",
    },
    { href: "/statistik", label: "Statistik", icon: BarChart3, hint: "Se dina mönster över tid" },
    {
      href: "/beloningar",
      label: "Belöningar",
      icon: Trophy,
      hint: "Små morötter när du gjort något",
    },
    {
      href: "/insight",
      label: "Insikter",
      icon: Brain,
      hint: "Beskrivande mönster från din egen data",
      essential: true,
    },
    {
      href: "/flowplan",
      label: "Planera",
      icon: Sparkles,
      hint: "Planeringsläget i Flow – ordna dagens saker",
    },
    {
      href: "/flow",
      label: "Flow",
      icon: Sparkles,
      hint: "Hjälp, planering och chatt på ett ställe",
      essential: true,
    },
    {
      href: "/assistant",
      label: "Chatta med Flow",
      icon: MessageCircle,
      hint: "Chatten i Flow",
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
            hint: "Schema, studiehjälp och vad du ska plugga nu",
            essential: true,
          },
        ]
      : []),

    ...(enabledAreas.includes("jobb")
      ? [
          {
            href: "/jobb",
            label: "Jobb",
            icon: Briefcase,
            hint: "Plan, uppgifter, projekt och jobbhjälp",
            essential: true,
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
            essential: true,
          },
          {
            href: "/admin-statistik",
            label: "Appstatistik",
            icon: BarChart3,
            hint: "Besökare och användning",
            essential: true,
          },
        ]
      : []),
    {
      href: "/installningar",
      label: "Inställningar",
      icon: Settings2,
      hint: "Anpassa MyFlove, konto och appens inställningar",
      essential: true,
    },
  ].map((i) => ({ ...i, label: t(plainLabel(i.label, npf.plainWords)), hint: t(i.hint) }));

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
        label: "Översikt",
        hint: "Dagen, energin och nästa steg",
        icon: CalendarDays,
        hrefs: ["/hem", "/idag", "/kalender", "/lagg-till", "/paminnelser", "/pomodoro"],
      },
      {
        id: "flowflow",
        label: "Flow",
        hint: "Chatt, planering, QuickFlow och anteckningar",
        icon: Sparkles,
        hrefs: ["/flow", "/assistant", "/flowplan", "/quickflow", "/anteckningar", "/tasks"],
      },
      {
        id: "healthflow",
        label: "Hälsa",
        hint: "Energi, mående, träning, rutiner och medicin",
        icon: HeartPulse,
        hrefs: [
          "/halsa",
          "/mitt-batteri",
          "/energifloede",
          "/traning",
          "/daglig-rutin",
          "/morgonstart",
        ],
      },
      {
        id: "recoveryflow",
        label: "Återhämtning",
        hint: "Paus, Ljusboost och Stopp-knappen",
        icon: Wind,
        hrefs: ["/aterhamtning", "/stop-paus"],
      },
      {
        id: "studyflow",
        label: "Studier",
        hint: "Nästa steg, deadlines och uppgifter",
        icon: BookOpen,
        hrefs: ["/studyflow", "/studybuddy"],
      },
      {
        id: "workflow",
        label: "Jobb",
        hint: "Uppgifter, möten och deadlines",
        icon: Building2,
        hrefs: ["/jobb"],
      },
      {
        id: "familyflow",
        label: "Familj",
        hint: "Personer du delar vardagen med",
        icon: HeartPulse,
        hrefs: ["/familjeflow", "/relationer", "/familj", "/barn"],
      },
      {
        id: "homeflow",
        label: "Hem",
        hint: "Mat, inköp, städning och pengar",
        icon: House,
        hrefs: ["/matlista", "/shopping", "/stadning", "/finances"],
      },
      {
        id: "insightflow",
        label: "Insikter",
        hint: "Beskrivande mönster från din egen data",
        icon: Brain,
        hrefs: ["/insight", "/historik", "/statistik", "/beloningar"],
      },
      {
        id: "avancerat",
        label: "Avancerat",
        hint: "Detaljerna bakom planeringen – bara om du vill se dem",
        icon: Gauge,
        hrefs: ["/flowscore", "/friktionsindex"],
      },
      // Inställningar har en egen sektion längre ner i "Mer" – därför ligger
      // de inte som kategori här. Admin är det enda som blir kvar som grupp.
      {
        id: "admin",
        label: "Admin",
        hint: "Roller, åtkomst och appstatistik",
        icon: LayoutGrid,
        hrefs: ["/admin", "/admin-statistik"],
      },

    ];

    return groups
      .map((g) => ({
        ...g,
        label: t(g.label),
        hint: t(g.hint),
        items: g.hrefs.map(byHref).filter(Boolean) as typeof navItems,
      }))
      .filter((g) => g.items.length > 0);
  }, [navItems, t]);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [navSearch, setNavSearch] = useState("");
  // Egna platser i bottennavet – du byter dem själv i "Mer".
  const [navSlots, setNavSlots] = useCloudSyncedStorage<string[]>("myflove-bottom-nav-slots", [
    "/idag",
    "/flowplan",
  ]);
  // Tidigare hette platsen "Planera" men ledde till Flow-hjälpen.
  // Nu leder den till planeringssidan – en gång, sedan bestämmer du själv.
  const [navMigrated, setNavMigrated] = useCloudSyncedStorage<boolean>(
    "myflove-bottom-nav-planering-v1",
    false,
  );
  useEffect(() => {
    if (navMigrated) return;
    setNavMigrated(true);
    if (navSlots.includes("/flow") && !navSlots.includes("/flowplan")) {
      setNavSlots(navSlots.map((h) => (h === "/flow" ? "/flowplan" : h)));
    }
  }, [navMigrated, navSlots, setNavMigrated, setNavSlots]);
  

  /** Stänger "Mer" och nollställer vilken kategori som var öppen. */
  const closeMenu = () => {
    setMobileMenuOpen(false);
    setOpenCategory(null);
  };

  // Enkelt läge: AV som standard – slås bara på om användaren själv väljer det.
  // Tidigare versioner sparade "true" som standard; rensa det om valet aldrig gjorts aktivt.
  const [simpleModeChosen, setSimpleModeChosen] = useCloudSyncedStorage<boolean>(
    "myflove-simple-mode-chosen",
    false,
  );
  const [simpleModeRaw, setSimpleModeRaw] = useCloudSyncedStorage<boolean>(
    "myflove-simple-mode",
    false,
  );
  useEffect(() => {
    if (!simpleModeChosen && simpleModeRaw) setSimpleModeRaw(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const simpleMode = simpleModeChosen && simpleModeRaw;
  const setSimpleMode = (value: boolean) => {
    setSimpleModeChosen(true);
    setSimpleModeRaw(value);
  };
  const essentialItems = useMemo(() => navItems.filter((i) => i.essential), [navItems]);

  const searchResults = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return [];
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q),
    );
  }, [navSearch, navItems]);

  /**
   * Huvudnavigationen: Översikt · Flow · Hälsa · Återhämtning,
   * med allt annat under "Mer". Samma för alla, oavsett konto eller läge.
   */
  const primaryNav = useMemo(() => {
    const pick = (href: string) => navItems.find((i) => i.href === href);
    return [pick("/hem"), pick("/flow"), pick("/halsa"), pick("/aterhamtning")].filter(
      Boolean,
    ) as typeof navItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems]);


  return (
    <div className="app-shell-bg h-[100dvh] overflow-hidden overscroll-none flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-52 border-r border-border bg-card p-3 shrink-0 overflow-y-auto">
        <div className="mb-4 px-2 py-1">
          <h1 className="text-xl font-bold text-primary tracking-tight">MyFlove</h1>
        </div>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                className="flex items-center gap-1.5 px-1 mb-1 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: catColor(cat.id) }}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md"
                  style={{ backgroundColor: catColor(cat.id, 0.14) }}
                  aria-hidden="true"
                >
                  <cat.icon size={12} />
                </span>
                {cat.label}
              </div>

              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                      <span className="truncate leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-3 pb-1">
          <Link href="/installningar">
            <Button variant="outline" size="sm" className="w-full rounded-lg gap-2">
              <Settings2 size={15} /> Inställningar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <DemoBanner isDemo={isDemo} />

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

        <div className="hidden md:flex items-center gap-1.5 px-6 pt-4">
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-primary transition-transform active:scale-95"
          >
            <Brain size={14} /> QuickFlow
          </button>
        </div>

        <div className="hidden md:flex items-center justify-between px-6 pt-2">
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

        {medicationAlerts.length > 0 && (
          <div className="px-4 pt-4 md:px-6 md:pt-4 space-y-2">
            {medicationAlerts.map((alert) => (
              <div
                key={alert.key}
                className="flex flex-wrap items-center justify-between gap-3 bg-gold/15 border border-gold/30 text-ink rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Pill size={20} className="shrink-0" />
                  <p className="text-sm font-medium truncate">
                    Dags att ta <strong>{alert.name}</strong>
                    {alert.dosage ? ` (${alert.dosage})` : ""} – {alert.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => takeMedicationAlert(alert)}
                    aria-label={`Markera ${alert.name} ${alert.time} som tagen`}
                    className="inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Check size={13} /> Tagen
                  </button>
                  <button
                    type="button"
                    onClick={() => snoozeMedicationAlert(alert)}
                    aria-label={`Påminn om ${alert.name} igen om 10 minuter`}
                    className="inline-flex items-center gap-1 rounded-pill bg-secondary px-3 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-80"
                  >
                    ⏰ 10 min
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissMedicationAlert(alert)}
                    aria-label={`Hoppa över ${alert.name} ${alert.time} idag`}
                    className="shrink-0 p-1.5 rounded-full hover:bg-gold/25"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {proximityAlerts.length > 0 && (
          <div className="px-4 pt-4 md:px-6 md:pt-4 space-y-2">
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
          className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8"
          style={CATEGORY_THEMES[location] as React.CSSProperties}
        >
          <div key={location} className="max-w-6xl mx-auto w-full p-4 md:p-6 page-enter">
            {!FLOW_HIDDEN_PATHS.has(location) && <FlowCompanion stage="mini" className="mb-4" />}
            <FlowCheckinPopup />
            <GlobalActivityEnergyPrompt />
            <AutoTranslateProvider />
            {children}
          </div>

          <footer className="max-w-6xl mx-auto w-full px-4 md:px-6 pt-4 pb-8 mt-8 border-t border-border/40">
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
      {/* EN QuickFlow-dialog för hela appen – bottennav, FAB och hemskärmens +
          öppnar alla samma flöde via händelsen "myflove:quickflow". */}
      <QuickflowCapture variant="global" />

      {/* Mobile Bottom Bar – Översikt · Flow · Hälsa · Återhämtning · Mer
          QuickFlow ligger inne i Flow (och som flytande knapp), inte som egen punkt. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/70 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="flex items-end justify-around px-1 pt-1.5 pb-1">
          {primaryNav.slice(0, 4).map((item) => (
            <BottomNavLink
              key={item.href}
              item={item}
              active={location === item.href || location.startsWith(`${item.href}/`)}
              onClick={() => setMobileMenuOpen(false)}
              label={item.href === "/assistant" ? "Flow" : item.label}
            />
          ))}




          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-1.5 min-w-[3.2rem] press ${
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
            <span className="text-[10px] font-medium">{t("Mer")}</span>
          </button>
        </div>
      </nav>

      {/* Mer – appens områden först, med en enda ingång till inställningar. */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-border/50">
              <h2 className="text-lg font-medium text-muted-foreground">
                {openCategory
                  ? (categories.find((c) => c.id === openCategory)?.label ?? t("Mer"))
                  : t("Mer")}
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
                  <h3 className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Mina områden
                  </h3>
                  <p className="mb-2 text-xs text-muted-foreground/80">
                    Allt som hör till studier, jobb, hem och relationer.
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
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
                            <span className="text-[11px] leading-snug opacity-70">{cat.hint}</span>
                          </button>
                        );
                      })}
                  </div>

                  <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Appen
                  </h3>
                  <NavRow
                    item={{
                      href: "/installningar",
                      label: "Inställningar",
                      icon: Settings2,
                      hint: "Anpassa MyFlove, konto och appens inställningar",
                    }}
                    isActive={location === "/installningar"}
                    onClick={closeMenu}
                  />
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
      className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-1.5 min-w-[3.2rem] press ${
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
