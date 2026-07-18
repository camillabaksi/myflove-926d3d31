import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Home, Target, CheckSquare, ShoppingBag, Smile, Sparkles, Wallet, Navigation, Calendar, Menu, X, BellRing, Timer, Pill, BarChart3, Trophy, Inbox, Users, UtensilsCrossed, MapPin, ListOrdered, Flame, Battery, Settings2, Check, RotateCcw, ArrowUp, ArrowDown, LogOut, Volume2, VolumeX, Shield } from "lucide-react";
import { isAlarmSoundEnabled, setAlarmSoundEnabled, subscribeAlarmPref, playAlarmPreview, initAlarmAudioUnlock } from "@/lib/push-notifications";
import { useCommuteAlerts } from "@/hooks/use-commute-alerts";
import { useMedicationAlerts } from "@/hooks/use-medication-alerts";
import { useShoppingProximityAlerts } from "@/hooks/use-shopping-proximity-alerts";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLocalStorage } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useClerk, Show } from "@clerk/react";
import { DeleteAccountButton } from "@/components/delete-account-button";


interface LayoutProps {
  children: ReactNode;
}

const SECTION_BY_PATH: Record<string, string> = {
  "/": "home",
  "/mood": "mood",
  "/dump": "dump",
  "/kalender": "calendar",
  "/fokus": "fokus",
  "/tasks": "tasks",
  "/pomodoro": "pomodoro",
  "/medicin": "medicin",
  "/shopping": "shopping",
  "/finances": "finances",
  "/travel": "travel",
  "/statistik": "statistik",
  "/beloningar": "beloningar",
  "/assistant": "assistant",
  "/flowplan": "flowplan",
  "/admin-statistik": "admin",
  "/admin": "admin",
  "/friktionsindex": "friktionsindex",
  "/familj": "familj",
  "/matlista": "matlista",
  "/energikarta": "energikarta",
};

/**
 * Per-category color themes, all drawn from the warm MyFlove preview palette.
 * They override --primary / --accent / --ring so text-primary, bg-primary, etc.
 * re-tint automatically per page.
 */
const T = {
  terracotta: { "--primary": "7 47% 49%", "--ring": "7 47% 49%", "--accent": "8 45% 84%", "--accent-foreground": "7 50% 24%" },
  sage:       { "--primary": "138 24% 40%", "--ring": "138 24% 40%", "--accent": "138 30% 84%", "--accent-foreground": "138 40% 22%" },
  gold:       { "--primary": "35 65% 45%",  "--ring": "35 65% 45%",  "--accent": "35 55% 82%",  "--accent-foreground": "35 45% 22%" },
  ink:        { "--primary": "194 13% 25%", "--ring": "194 13% 25%", "--accent": "194 10% 80%", "--accent-foreground": "194 20% 18%" },
};

const CATEGORY_THEMES: Record<string, Record<string, string>> = {
  "/mood":           T.sage,
  "/pomodoro":       T.terracotta,
  "/fokus":          T.terracotta,
  "/finances":       T.gold,
  "/kalender":       T.ink,
  "/flowplan":       T.ink,
  "/shopping":       T.sage,
  "/matlista":       T.sage,
  "/medicin":        T.terracotta,
  "/travel":         T.ink,
  "/familj":         T.gold,
  "/beloningar":     T.gold,
  "/statistik":      T.ink,
  "/friktionsindex": T.terracotta,
  "/energikarta":    T.sage,
};


export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { alerts, dismissAlert } = useCommuteAlerts();
  const { alerts: medicationAlerts, dismissAlert: dismissMedicationAlert } = useMedicationAlerts();
  const { alerts: proximityAlerts, dismissAlert: dismissProximityAlert } = useShoppingProximityAlerts();
  useNotificationScheduler();
  const { isAdmin } = useIsAdmin();

  const [alarmEnabled, setAlarmEnabledState] = useState<boolean>(() => isAlarmSoundEnabled());
  useEffect(() => subscribeAlarmPref((v) => setAlarmEnabledState(v)), []);
  useEffect(() => { initAlarmAudioUnlock(); }, []);
  const toggleAlarm = () => {
    const next = !alarmEnabled;
    setAlarmSoundEnabled(next);
    setAlarmEnabledState(next);
    if (next) playAlarmPreview();
  };





  useEffect(() => {
    const section = SECTION_BY_PATH[location] ?? (location.replace(/^\//, "") || "home");
    trackEvent(section, "view");
  }, [location]);

  const navItems = [
    { href: "/hem", label: "Hem", icon: Home },
    { href: "/mood", label: "Mående", icon: Smile },
    { href: "/dump", label: "Dumping", icon: Inbox },
    { href: "/kalender", label: "Kalender", icon: Calendar },
    { href: "/fokus", label: "Fokus", icon: Target },
    { href: "/tasks", label: "Att göra", icon: CheckSquare },
    { href: "/flowplan", label: "FlowPlan", icon: ListOrdered },
    { href: "/pomodoro", label: "Timer", icon: Timer },
    { href: "/medicin", label: "Medicin", icon: Pill },
    { href: "/shopping", label: "Inköp", icon: ShoppingBag },
    { href: "/matlista", label: "Matlista", icon: UtensilsCrossed },
    { href: "/finances", label: "Ekonomi", icon: Wallet },
    { href: "/travel", label: "Resor", icon: Navigation },
    { href: "/familj", label: "Familj", icon: Users },
    { href: "/statistik", label: "Statistik", icon: BarChart3 },
    { href: "/beloningar", label: "Belöningar", icon: Trophy },
    { href: "/assistant", label: "Hjälp", icon: Sparkles },
    { href: "/friktionsindex", label: "Feedback", icon: Flame },
    { href: "/energikarta", label: "Energi", icon: Battery },
    ...(isAdmin
      ? [
          { href: "/admin", label: "Adminöversikt", icon: Shield },
          { href: "/admin-statistik", label: "Appstatistik", icon: BarChart3 },
        ]
      : []),
  ];

  // Bottom nav: Home is fixed, the remaining 3 slots are user-customizable.
  const [bottomNavHrefs, setBottomNavHrefs] = useLocalStorage<string[]>("myflow-bottom-nav", [
    "/mood",
    "/dump",
    "/kalender",
  ]);
  const [editingBottomNav, setEditingBottomNav] = useState(false);

  const mobileNavItems = useMemo(() => {
    const home = navItems.find((i) => i.href === "/hem")!;
    const chosen = bottomNavHrefs
      .map((href) => navItems.find((i) => i.href === href))
      .filter(Boolean) as typeof navItems;
    // Ensure we always have 3 valid slots; fill missing with defaults.
    const defaults = [navItems[1], navItems[2], navItems[3]].filter(Boolean) as typeof navItems;
    const filled = [...chosen];
    for (const d of defaults) {
      if (filled.length >= 3) break;
      if (!filled.some((i) => i.href === d.href)) filled.push(d);
    }
    return [home, ...filled.slice(0, 3)];
  }, [bottomNavHrefs, navItems]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background md:flex-row relative">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 shrink-0 overflow-y-auto">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">MyFlove</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => {
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
        <div className="mt-auto pt-4 pb-2 space-y-2">
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
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={() => signOut()}
            >
              <LogOut size={16} /> Logga ut
            </Button>
            <DeleteAccountButton className="w-full" />
          </Show>

        </div>

      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-center p-4 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
          <h1 className="text-xl font-bold text-primary tracking-tight">MyFlove</h1>
        </header>

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
                    Dags att gå! <strong>{alert.label}</strong> avgår {alert.minutesUntilDeparture <= 0 ? "nu" : `om ${alert.minutesUntilDeparture} min`} ({alert.departureTime}, {alert.lineName})
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
                    Dags att ta <strong>{alert.name}</strong>{alert.dosage ? ` (${alert.dosage})` : ""} – {alert.time}
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

        <div className="flex-1 overflow-y-auto pb-24 md:pb-8" style={CATEGORY_THEMES[location] as React.CSSProperties}>
          <div className="max-w-2xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
          <footer className="max-w-2xl mx-auto w-full px-4 md:px-8 pt-4 pb-8 mt-8 border-t border-border/40">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <Link href="/integritet" className="hover:text-primary underline-offset-2 hover:underline">
                Integritet
              </Link>
              <span aria-hidden>·</span>
              <Link href="/villkor" className="hover:text-primary underline-offset-2 hover:underline">
                Villkor
              </Link>
              <span aria-hidden>·</span>
              <Link href="/cookies" className="hover:text-primary underline-offset-2 hover:underline">
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

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] z-40">
        <div className="flex items-center justify-around p-2">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-xl min-w-[4rem] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`p-1.5 rounded-lg mb-1 transition-all duration-300 ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center p-2 rounded-xl min-w-[4rem] transition-colors ${
              mobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1.5 rounded-lg mb-1 transition-all duration-300 ${mobileMenuOpen ? "bg-primary/10" : ""}`}>
              <Menu size={24} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">Mer</span>
          </button>
        </div>
      </nav>

      {/* Mobile Fullscreen Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-border/50">
              <h2 className="text-lg font-medium text-muted-foreground">
                {editingBottomNav ? "Anpassa bottennav" : "Alla sektioner"}
              </h2>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEditingBottomNav(false);
                }}
                className="p-2 text-muted-foreground hover:bg-secondary rounded-full"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              {editingBottomNav ? (
                  <BottomNavEditor
                    allItems={navItems.filter((i) => i.href !== "/hem")}
                    selected={bottomNavHrefs.filter((href) =>
                      navItems.some((i) => i.href === href)
                    )}
                    onChange={setBottomNavHrefs}
                    onClose={() => setEditingBottomNav(false)}
                    onReset={() => setBottomNavHrefs(["/mood", "/dump", "/kalender"])}
                  />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {navItems.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center transition-all duration-200 ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium shadow-sm"
                              : "bg-card text-foreground border border-border shadow-sm"
                          }`}
                        >
                          <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-xs leading-tight">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBottomNav(true)}
                      className="rounded-xl gap-2"
                    >
                      <Settings2 size={16} /> Redigera bottennav
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={toggleAlarm}
                    >
                      {alarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      Alarmljud: {alarmEnabled ? "på" : "av"}
                    </Button>
                  </div>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3">
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

interface BottomNavEditorProps {
  allItems: { href: string; label: string; icon: typeof Home }[];
  selected: string[];
  onChange: (hrefs: string[]) => void;
  onClose: () => void;
  onReset: () => void;
}

function BottomNavEditor({ allItems, selected, onChange, onClose, onReset }: BottomNavEditorProps) {
  const selectedItems = selected
    .map((href) => allItems.find((i) => i.href === href))
    .filter(Boolean) as { href: string; label: string; icon: typeof Home }[];

  const toggle = (href: string) => {
    if (selected.includes(href)) {
      onChange(selected.filter((h) => h !== href));
    } else if (selected.length < 3) {
      onChange([...selected, href]);
    }
  };

  const move = (href: string, dir: -1 | 1) => {
    const idx = selected.indexOf(href);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= selected.length) return;
    const arr = [...selected];
    [arr[idx], arr[next]] = [arr[next]!, arr[idx]!];
    onChange(arr);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Välj 3 ikoner som ska visas bredvid Hem. Ordningen bestämmer ordningen i bottennavet.
      </p>

      {/* Selected slots preview */}
      <div className="grid grid-cols-3 gap-3">
        {selectedItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              className="relative aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center bg-primary text-primary-foreground font-medium shadow-sm"
            >
              <Icon size={26} strokeWidth={2.5} />
              <span className="text-xs leading-tight">{item.label}</span>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => move(item.href, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded-md bg-primary-foreground/20 text-primary-foreground disabled:opacity-30"
                  aria-label="Flytta vänster"
                >
                  <ArrowUp size={12} className="rotate-[-90deg]" />
                </button>
                <button
                  type="button"
                  onClick={() => move(item.href, 1)}
                  disabled={idx === selectedItems.length - 1}
                  className="p-1 rounded-md bg-primary-foreground/20 text-primary-foreground disabled:opacity-30"
                  aria-label="Flytta höger"
                >
                  <ArrowDown size={12} className="rotate-[-90deg]" />
                </button>
              </div>
            </div>
          );
        })}
        {Array.from({ length: 3 - selectedItems.length }).map((_, idx) => (
          <div
            key={idx}
            className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40"
          >
            <span className="text-xs text-muted-foreground">Plats {idx + 1}</span>
          </div>
        ))}
      </div>

      {/* All items */}
      <div className="grid grid-cols-3 gap-3">
        {allItems.map((item) => {
          const isSelected = selected.includes(item.href);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => toggle(item.href)}
              className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                  : "bg-card text-foreground border border-border shadow-sm"
              }`}
            >
              <Icon size={26} strokeWidth={isSelected ? 2.5 : 2} />
              <span className="text-xs leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="ghost" size="sm" onClick={onReset} className="rounded-xl gap-1">
          <RotateCcw size={14} /> Återställ
        </Button>
        <Button size="sm" onClick={onClose} className="rounded-xl gap-1">
          <Check size={14} /> Klar
        </Button>
      </div>
    </div>
  );
}
