import * as React from "react";
import { SyncStatusNote } from "@/components/sync-status-note";
import { UnownedDataPrompt } from "@/components/unowned-data-prompt";
import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Link as RouterLink, useRouter } from "@tanstack/react-router";
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
import { MyPlaceIcon, ThoughtsIcon, TodayHorizonIcon } from "@/components/paceable/navigation-icons";
import MoreView from "@/components/paceable/more-view";
import { BrandLogo } from "@/components/paceable/brand-logo";
import { initAlarmAudioUnlock } from "@/lib/push-notifications";
import { initPersonalization } from "@/lib/personalization";
import { useMedicationAlerts } from "@/hooks/use-medication-alerts";
import { useShoppingProximityAlerts } from "@/hooks/use-shopping-proximity-alerts";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { usePurgeRevisions } from "@/hooks/use-purge-revisions";
import { usePushSubscriptionSync } from "@/hooks/use-push-subscription-sync";
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
  "/kalender",
  "/quickflow",
  "/halsa",
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

const PACEABLE_PATHS = new Set(["/idag", "/kalender", "/quickflow", "/halsa"]);
/** Primary pages keep their locked presentation; all other app pages share Paceable surfaces. */
function isPaceableAppPath(path: string) {
  return !PACEABLE_PATHS.has(path);
}

import QuickflowFab from "@/components/quickflow-fab";
import QuickflowCapture from "@/components/quickflow-capture";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useTextLayout } from "@/hooks/use-text-layout";

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const mainScrollRef = React.useRef<HTMLDivElement>(null);
  const paceableApp = isPaceableAppPath(location);
  const textLayout = useTextLayout();
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    if (paceableApp) root.dataset.paceableApp = "true";
    else delete root.dataset.paceableApp;
    return () => { delete root.dataset.paceableApp; };
  }, [paceableApp]);
  const desktopMoreTriggerRef = React.useRef<HTMLButtonElement>(null);
  React.useLayoutEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [location]);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMoreTriggerRef = React.useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileMenuOpen(false); mobileMoreTriggerRef.current?.focus({ preventScroll: true }); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [mobileMenuOpen]);
  const {
    alerts: medicationAlerts,
    dismissAlert: dismissMedicationAlert,
    takeAlert: takeMedicationAlert,
    snoozeAlert: snoozeMedicationAlert,
  } = useMedicationAlerts();
  const { alerts: proximityAlerts, dismissAlert: dismissProximityAlert } =
    useShoppingProximityAlerts();
  useNotificationScheduler();
  usePurgeRevisions();
  usePushSubscriptionSync();
  useNotificationActions();

  const { isAdmin } = useIsAdmin();
  const { isDemo } = useDemoAccount();
  const { enabled: enabledAreas } = useEnabledAreas();
  const { settings: npf } = useNpfSettings();
  const { t } = useLang();

  // Använd TanStack-routerns faktiska location så tillbakaknappen alltid
  // synkar med appens historik – även vid djupa länkar eller SPA-navigering.
  const goBack = useSmartBack("/idag");
  // Tillbakapil på alla sidor utom startsidan (/hem och /).
  const canGoBack = location !== "/" && location !== "/hem" && location !== "/idag";
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
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    hint: string;
    essential?: boolean;
  };
  const navItems: NavItem[] = [
    {
      href: "/hem",
      label: "Hem",
      icon: Home,
      hint: "Dagen, energin och nästa steg",
      essential: true,
    },

    {
      href: "/idag",
      label: "Idag",
      icon: TodayHorizonIcon,
      hint: "Vad som händer idag – hela dagens lista",
      essential: true,
    },
    {
      href: "/halsa",
      label: "Min plats",
      icon: MyPlaceIcon,
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
      hint: "En paus mellan impuls och beslut",
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
      label: "Tankar",
      icon: ThoughtsIcon,
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
      hint: "Anpassa Paceable, konto och appens inställningar",
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
        label: "Min dag",
        hint: "Dagen, kalendern och påminnelser",
        icon: CalendarDays,
        hrefs: ["/hem", "/idag", "/kalender", "/lagg-till", "/paminnelser", "/pomodoro"],
      },
      {
        id: "flowflow",
        label: "Flow",
        hint: "Chatt och planering",
        icon: Sparkles,
        hrefs: ["/flow", "/assistant", "/flowplan", "/anteckningar", "/tasks"],
      },
      {
        id: "healthflow",
        label: "Hälsa & ork",
        hint: "Energi, mående, träning, rutiner och medicin",
        icon: HeartPulse,
        hrefs: [
          "/halsa",
          "/mitt-batteri",
          "/energifloede",
          "/traning",
          "/daglig-rutin",
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
        label: "Studier & jobb",
        hint: "Schema, uppgifter, möten och deadlines",
        icon: BookOpen,
        hrefs: ["/studyflow", "/studybuddy", "/jobb"],
      },
      {
        id: "familyflow",
        label: "Familj",
        hint: "Barnens dagar och personer du delar vardagen med",
        icon: Users,
        hrefs: ["/familjeflow", "/barn", "/relationer", "/familj"],
      },
      {
        id: "homeflow",
        label: "Hem & vardag",
        hint: "Mat, inköp, städning och pengar",
        icon: House,
        hrefs: ["/matlista", "/shopping", "/stadning", "/finances"],
      },
      {
        id: "insightflow",
        label: "Insikter",
        hint: "Mönster, historik och detaljer – bara om du vill se dem",
        icon: Brain,
        hrefs: ["/insight", "/historik", "/statistik", "/beloningar", "/flowscore", "/friktionsindex"],
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
  // Behåll tidigare valda navigationsplatser; huvudfliken Flow leder till Min Flow.
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
    mobileMoreTriggerRef.current?.focus({ preventScroll: true });
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
   * Paceables huvudnavigation. Adresser och lagring behålls oförändrade.
   */
  const primaryNav = useMemo(() => {
    const pick = (href: string) => navItems.find((i) => i.href === href);
    return [pick("/idag"), pick("/kalender"), pick("/quickflow"), pick("/halsa")].filter(
      Boolean,
    ) as typeof navItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems]);

  // Desktop: Mer öppnas som panel bredvid menyn. Samma navItems som mobilen.
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [desktopMoreSection, setDesktopMoreSection] = useState<string | null>(null);
  useEffect(() => {
    setDesktopMoreOpen(false);
  }, [location]);
  const closeDesktopMore = React.useCallback(() => {
    setDesktopMoreOpen(false);
    desktopMoreTriggerRef.current?.focus({ preventScroll: true });
  }, []);
  const prepareDesktopMoreNavigation = () => {
    // Layout is mounted per page: keep this one-shot listener across its unmount.
    const unsubscribe = router.subscribe("onRendered", () => {
      unsubscribe();
      document.querySelector<HTMLElement>('main [data-page-focus-target]')?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    if (!desktopMoreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDesktopMore();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopMoreOpen, closeDesktopMore]);
  const desktopMoreGroups = useMemo(() => {
    const byHref = (href: string) => navItems.find((i) => i.href === href);
    const groups: { id: string; label: string; hrefs: string[]; legacy?: boolean; rename?: Record<string, string> }[] = [
      { id: "dag", label: "Min dag", hrefs: ["/paminnelser", "/tasks", "/pomodoro"] },
      { id: "stod", label: "Stöd & samtal", hrefs: ["/assistant", "/flow", "/flowplan", "/anteckningar"] },
      { id: "ork", label: "Ork & återhämtning", hrefs: ["/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/traning", "/daglig-rutin"] },
      { id: "familj", label: "Familj", hrefs: ["/familjeflow", "/barn", "/relationer"] },
      { id: "vardag", label: "Hem & vardag", hrefs: ["/matlista", "/shopping", "/stadning", "/finances"] },
      { id: "studier-jobb", label: "Studier & jobb", hrefs: ["/studyflow", "/jobb"] },
      { id: "monster", label: "Mönster", hrefs: ["/insight", "/historik", "/statistik"] },
      {
        id: "konto",
        label: "Konto & app",
        hrefs: ["/familj", "/friktionsindex", "/installningar", "/admin", "/admin-statistik"],
        rename: { "/familj": "Delning & åtkomst", "/admin": "Administration – översikt", "/admin-statistik": "Administration – appstatistik" },
      },
      { id: "aldre", label: "Äldre funktioner", hrefs: ["/hem", "/flowscore", "/beloningar"], legacy: true },
    ];
    return groups
      .map((g) => ({
        ...g,
        label: t(g.label),
        items: g.hrefs
          .map(byHref)
          .filter((i): i is NavItem => Boolean(i))
          .filter((i) => !simpleMode || i.essential)
          .map((i) => (g.rename?.[i.href] ? { ...i, label: t(g.rename[i.href]) } : i)),
      }))
      .filter((g) => g.items.length > 0);
  }, [navItems, t, simpleMode]);



  return (
    <div data-paceable-surface={PACEABLE_PATHS.has(location) ? "true" : undefined} data-paceable-app={paceableApp ? "true" : undefined} className={`app-shell-bg h-[100dvh] overflow-hidden overscroll-none flex flex-col md:flex-row relative${paceableApp && textLayout.enlarged ? " pace-app-text-enlarged" : ""}`}>
      <span ref={textLayout.ref} className="pace-text-probe" aria-hidden="true" />
      {/* Desktop Sidebar */}
      <nav
        aria-label={t("Huvudnavigation")}
        className="relative z-30 hidden md:flex flex-col w-[13rem] border-r border-border bg-card/95 p-4 shrink-0 overflow-y-auto"
      >
        <div className="mb-6 flex items-center justify-between gap-2 px-1 py-1">
          <BrandLogo compact className="w-full" />
        </div>
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const isActive = !desktopMoreOpen && (location === item.href || location.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive ? "bg-lavender text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.8} className="shrink-0" />
                  <span className="min-w-0 whitespace-normal break-words">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              ref={desktopMoreTriggerRef}
              onClick={() => desktopMoreOpen ? closeDesktopMore() : setDesktopMoreOpen(true)}
              aria-expanded={desktopMoreOpen}
              aria-controls="desktop-more-panel"
              className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                desktopMoreOpen ? "bg-lavender text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Menu size={20} strokeWidth={1.8} className="shrink-0" />
              <span className="min-w-0 whitespace-normal break-words">{t("Mer")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {desktopMoreOpen && (
        <aside id="desktop-more-panel" aria-label={t("Mer")} data-paceable-surface="true" className="pace-more-desktop fixed inset-y-0 left-[13rem] z-30 hidden overflow-y-auto md:block">
          <MoreView items={navItems} simpleMode={simpleMode} enlarged={textLayout.enlarged} t={t} onClose={closeDesktopMore} onNavigate={prepareDesktopMoreNavigation} />
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <DemoBanner isDemo={isDemo} />
        <SyncStatusNote />
        <UnownedDataPrompt />

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
          <h1 className="min-w-0 flex-1">
            <BrandLogo compact className="mx-auto w-32 max-w-full" />
          </h1>
          <ViewCollapseToggle />
        </header>


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
                    10 min
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
          ref={mainScrollRef}
          tabIndex={-1}
          data-page-focus-target
          className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8"
          style={PACEABLE_PATHS.has(location) ? undefined : CATEGORY_THEMES[location] as React.CSSProperties}
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
              © {new Date().getFullYear()} Paceable
            </p>
          </footer>
        </div>
      </main>

      <QuickflowFab />
      {/* EN QuickFlow-dialog för hela appen – bottennav, FAB och hemskärmens +
          öppnar alla samma flöde via händelsen "myflove:quickflow". */}
      <QuickflowCapture variant="global" />

      {/* Paceable mobile navigation. Technical routes remain unchanged. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/70 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="grid grid-cols-5 items-end px-1 pb-1 pt-1.5">
          {primaryNav.map((item) =>
            <BottomNavLink
              key={item.href}
              item={item}
              active={location === item.href || location.startsWith(`${item.href}/`)}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}




          <button
            ref={mobileMoreTriggerRef}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-more-panel"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-current={mobileMenuOpen ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 press ${
              mobileMenuOpen ? "text-ink" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center rounded-2xl px-3 py-1 transition-colors ${
                mobileMenuOpen ? "bg-lavender" : ""
              }`}
            >
              <Menu size={22} strokeWidth={1.8} />
            </span>
            <span className="text-[10px] font-medium">{t("Mer")}</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-more-panel" aria-label={t("Mer")} data-paceable-surface="true" className="pace-more-mobile fixed inset-x-0 top-0 z-30 overflow-y-auto md:hidden">
          <MoreView items={navItems} simpleMode={simpleMode} enlarged={textLayout.enlarged} t={t} onClose={closeMenu} onNavigate={() => { prepareDesktopMoreNavigation(); closeMenu(); }} />
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
  item: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    hint: string;
  };
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

function DesktopMoreLink({
  item,
  active,
  onNavigate,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> };
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const cls = `flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    active ? "bg-lavender text-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;
  const content = (
    <>
      <Icon size={18} strokeWidth={1.8} className="shrink-0" />
      <span className="min-w-0 whitespace-normal break-words">{item.label}</span>
    </>
  );
  // Träning behåller sin vanliga sidladdning.
  if (item.href === "/traning") {
    return (
      <RouterLink to="/traning" reloadDocument aria-current={active ? "page" : undefined} className={cls}>
        {content}
      </RouterLink>
    );
  }
  return (
    <Link href={item.href} onClick={(event) => {
      if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !active) onNavigate();
    }} aria-current={active ? "page" : undefined} className={cls}>
      {content}
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
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 press ${
        active ? "text-ink" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-2xl px-3 py-1 transition-colors ${
          active ? "bg-lavender" : ""
        }`}
      >
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="text-[10px] font-medium">{label ?? item.label}</span>
    </Link>
  );
}
