import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Home, Target, CheckSquare, ShoppingBag, Smile, Sparkles, Wallet, Navigation, Calendar, Menu, X, BellRing, Timer, Pill, BarChart3, Trophy, Inbox, Users, UtensilsCrossed, MapPin, ListOrdered, Flame, Battery, Settings2, Check, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { useCommuteAlerts } from "@/hooks/use-commute-alerts";
import { useMedicationAlerts } from "@/hooks/use-medication-alerts";
import { useShoppingProximityAlerts } from "@/hooks/use-shopping-proximity-alerts";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLocalStorage } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

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
  "/friktionsindex": "friktionsindex",
  "/familj": "familj",
  "/matlista": "matlista",
  "/energikarta": "energikarta",
};

/**
 * Per-category color themes. Overrides --primary / --accent / --ring so all
 * text-primary, bg-primary, bg-accent etc. classes automatically re-tint per page.
 * Values are HSL triples (used inside hsl(...)) to match src/styles.css tokens.
 */
const CATEGORY_THEMES: Record<string, Record<string, string>> = {
  "/mood":           { "--primary": "130 24% 40%", "--ring": "130 24% 40%", "--accent": "130 30% 84%", "--accent-foreground": "130 40% 22%" },
  "/pomodoro":       { "--primary": "14 55% 50%",  "--ring": "14 55% 50%",  "--accent": "20 55% 84%",  "--accent-foreground": "14 50% 24%" },
  "/fokus":          { "--primary": "14 55% 50%",  "--ring": "14 55% 50%",  "--accent": "20 55% 84%",  "--accent-foreground": "14 50% 24%" },
  "/finances":       { "--primary": "40 60% 42%",  "--ring": "40 60% 42%",  "--accent": "42 60% 84%",  "--accent-foreground": "38 55% 22%" },
  "/kalender":       { "--primary": "210 32% 44%", "--ring": "210 32% 44%", "--accent": "210 38% 84%", "--accent-foreground": "212 40% 22%" },
  "/flowplan":       { "--primary": "210 32% 44%", "--ring": "210 32% 44%", "--accent": "210 38% 84%", "--accent-foreground": "212 40% 22%" },
  "/shopping":       { "--primary": "32 45% 44%",  "--ring": "32 45% 44%",  "--accent": "34 55% 84%",  "--accent-foreground": "28 45% 22%" },
  "/matlista":       { "--primary": "32 45% 44%",  "--ring": "32 45% 44%",  "--accent": "34 55% 84%",  "--accent-foreground": "28 45% 22%" },
  "/medicin":        { "--primary": "18 45% 46%",  "--ring": "18 45% 46%",  "--accent": "22 45% 84%",  "--accent-foreground": "16 45% 22%" },
  "/travel":         { "--primary": "195 45% 38%", "--ring": "195 45% 38%", "--accent": "195 50% 84%", "--accent-foreground": "198 55% 20%" },
  "/familj":         { "--primary": "340 32% 50%", "--ring": "340 32% 50%", "--accent": "342 45% 86%", "--accent-foreground": "340 45% 24%" },
  "/beloningar":     { "--primary": "42 65% 46%",  "--ring": "42 65% 46%",  "--accent": "44 65% 84%",  "--accent-foreground": "38 60% 22%" },
  "/statistik":      { "--primary": "260 22% 48%", "--ring": "260 22% 48%", "--accent": "258 32% 86%", "--accent-foreground": "260 32% 24%" },
  "/friktionsindex": { "--primary": "25 18% 44%",  "--ring": "25 18% 44%",  "--accent": "25 22% 84%",  "--accent-foreground": "22 25% 22%" },
  "/energikarta":    { "--primary": "175 32% 38%", "--ring": "175 32% 38%", "--accent": "175 42% 84%", "--accent-foreground": "175 45% 20%" },
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { alerts, dismissAlert } = useCommuteAlerts();
  const { alerts: medicationAlerts, dismissAlert: dismissMedicationAlert } = useMedicationAlerts();
  const { alerts: proximityAlerts, dismissAlert: dismissProximityAlert } = useShoppingProximityAlerts();
  const { isAdmin } = useIsAdmin();



  useEffect(() => {
    const section = SECTION_BY_PATH[location] ?? (location.replace(/^\//, "") || "home");
    trackEvent(section, "view");
  }, [location]);

  const navItems = [
    { href: "/", label: "Hem", icon: Home },
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
      ...(isAdmin ? [{ href: "/admin-statistik", label: "Appstatistik", icon: BarChart3 }] : []),
    ];

  // Bottom nav: Home is fixed, the remaining 3 slots are user-customizable.
  const [bottomNavHrefs, setBottomNavHrefs] = useLocalStorage<string[]>("myflow-bottom-nav", [
    "/mood",
    "/dump",
    "/kalender",
  ]);
  const [editingBottomNav, setEditingBottomNav] = useState(false);

  const mobileNavItems = useMemo(() => {
    const home = navItems.find((i) => i.href === "/")!;
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
          <h1 className="text-2xl font-bold text-primary tracking-tight">MyFlow</h1>
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
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-center p-4 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
          <h1 className="text-xl font-bold text-primary tracking-tight">MyFlow</h1>
        </header>

        {alerts.length > 0 && (
          <div className="px-4 pt-4 md:px-8 md:pt-6 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.tripId}
                className="flex items-center justify-between gap-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
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
                  className="shrink-0 p-1.5 rounded-full hover:bg-yellow-200/60"
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
                className="flex items-center justify-between gap-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
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
                  className="shrink-0 p-1.5 rounded-full hover:bg-yellow-200/60"
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
                className="flex items-center justify-between gap-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2"
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
                  className="shrink-0 p-1.5 rounded-full hover:bg-yellow-200/60"
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
                  allItems={navItems.filter((i) => i.href !== "/")}
                  selected={mobileNavItems.slice(1).map((i) => i.href)}
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
