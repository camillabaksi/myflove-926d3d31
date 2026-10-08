import { useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { User, Settings2, Search, X, ChevronRight, ChevronDown, CheckSquare, Wallet, BookOpen, Briefcase, HeartPulse, Users, BarChart3, Sparkles, History, CalendarDays, MessageCircle, BatteryCharging, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyFloveIcon } from "@/components/myflove";
import { cn } from "@/lib/utils";

export type MoreItem = {
  href: string;
  label: string;
  hint: string;
  essential?: boolean;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

export const MORE_GROUPS = [
  { title: "Min dag", hrefs: ["/idag", "/kalender", "/quickflow", "/paminnelser", "/pomodoro"] },
  { title: "Flow och samtal", hrefs: ["/flow", "/assistant", "/flowplan", "/anteckningar"] },
  { title: "Ork och återhämtning", hrefs: ["/halsa", "/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/daglig-rutin"] },
  { title: "Hem och vardag", hrefs: ["/matlista", "/shopping", "/stadning"] },
  { title: "Konto och app", hrefs: ["/installningar", "/friktionsindex"] },
  { title: "Admin", hrefs: ["/admin", "/admin-statistik"] },
] as const;
export const MORE_TOOL_GROUPS = MORE_GROUPS.slice(4);
export const MORE_FAMILY = ["/familjeflow", "/barn", "/relationer", "/familj"];
export const MORE_INSIGHTS = ["/insight", "/historik", "/statistik"];
export const MORE_LEGACY = ["/hem", "/flowscore", "/beloningar"];
const DAILY = [
  { href: "/tasks", label: "Uppgifter", hint: "Det du behöver göra", icon: CheckSquare, tone: "lavender" },
  { href: "/finances", label: "Ekonomi", hint: "Pengar och överblick", icon: Wallet, tone: "sage" },
  { href: "/studyflow", label: "Studier", hint: "Lärande i din takt", icon: BookOpen, tone: "peach" },
  { href: "/jobb", label: "Arbete", hint: "Din arbetsvardag", icon: Briefcase, tone: "blush" },
] as const;
export const MORE_FEATURED_HREFS: string[] = [...DAILY.map((item) => item.href), "/traning"];

export function getMoreItems(items: MoreItem[], hrefs: readonly string[], simpleMode: boolean) {
  return hrefs.flatMap((href) => {
    const item = items.find((entry) => entry.href === href);
    return item && (!simpleMode || item.essential) ? [item] : [];
  });
}

function Sprig({ className }: { className?: string }) {
  return <svg viewBox="0 0 100 120" fill="none" aria-hidden="true" className={cn("pace-more-sprig", className)}>
    <path d="M25 115C43 80 57 46 70 7" stroke="currentColor" strokeWidth="1.5" />
    {[ [65,17,-20], [48,34,-45], [69,44,25], [38,61,-48], [56,72,30], [27,89,-48] ].map(([x,y,rotation],i)=><ellipse key={i} cx={x} cy={y} rx="6" ry="16" fill="currentColor" opacity={0.38+i*0.06} transform={`rotate(${rotation} ${x} ${y})`} />)}
  </svg>;
}

type Props = {
  items: MoreItem[];
  simpleMode: boolean;
  enlarged: boolean;
  onClose: () => void;
  onNavigate: () => void;
  t: (text: string) => string;
};

export default function MoreView({ items, simpleMode, enlarged, onClose, onNavigate, t }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  const visible = (hrefs: readonly string[]) => getMoreItems(items, hrefs, simpleMode);
  const results = [...items, { href: "/profil", label: t("Min profil"), hint: t("Ditt konto, dina inställningar och din familj"), icon: User }]
    .filter((item) => `${item.label} ${item.hint}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  const navigate = (event: MouseEvent, href: string) => {
    onNavigate();
    if (href === "/traning" && window.matchMedia("(min-width: 768px)").matches && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      window.location.assign(href);
    }
  };
  const rows = (entries: MoreItem[]) => <ul className="pace-more-links">{entries.map((item) => {
    const Icon = item.icon;
    return <li key={item.href}><Link href={item.href} onClick={(event) => navigate(event, item.href)} className="pace-more-link">
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0"><span className="block font-semibold">{item.href === "/hem" ? t("Äldre Hem") : item.label}</span><span className="pace-more-muted block text-xs">{item.hint}</span></span>
      <ChevronRight size={16} className="shrink-0" />
    </Link></li>;
  })}</ul>;

  function card(label: string, hint: string, Icon: typeof User, tone: string, href?: string, group?: string, children?: ReactNode, compact = false, detached = false) {
    const expanded = Boolean(group && open.includes(group));
    const content = <>
      {compact && <span aria-hidden className="pace-more-card-tint"><Sprig /></span>}
      <MyFloveIcon icon={Icon} size="md" className="pace-more-icon" />
      <span className="pace-more-card-copy"><span className="pace-more-card-title">{t(label)}</span><span className="pace-more-muted pace-more-card-hint">{t(hint)}</span></span>
      {group && expanded ? <ChevronDown className="pace-more-arrow" aria-hidden /> : <ChevronRight className="pace-more-arrow" aria-hidden />}
      {!compact && group !== "legacy" && <Sprig className="pace-more-wide-decor" />}
    </>;
    return <div className={`pace-more-card-shell pace-more-tone-${tone}`}>
      {href ? <Button asChild variant="ghost" className={cn("pace-more-card", compact && "pace-more-small-card")}><Link href={href} onClick={(event) => navigate(event, href)}>{content}</Link></Button>
        : <Button variant="ghost" className={cn("pace-more-card", compact && "pace-more-small-card")} onClick={() => setOpen((current) => expanded ? current.filter((key) => key !== group) : [...current, group ?? ""]) } aria-expanded={expanded} aria-controls={`pace-more-group-${group}`}>{content}</Button>}
      {group && expanded && !detached && <div id={`pace-more-group-${group}`} className="pace-more-expanded">{children}</div>}
    </div>;
  }
  function section(title: string, content: ReactNode) {
    return <section className="pace-more-section"><h2>{t(title)}</h2>{content}</section>;
  }
  const family = visible(MORE_FAMILY), insights = visible(MORE_INSIGHTS), legacy = visible(MORE_LEGACY);
  const groupMeta: Record<string, { icon: typeof User; tone: string; hint: string }> = {
    "Min dag": { icon: CalendarDays, tone: "lavender", hint: "Din dag i din takt" },
    "Flow och samtal": { icon: MessageCircle, tone: "peach", hint: "Samtal och anteckningar" },
    "Ork och återhämtning": { icon: BatteryCharging, tone: "sage", hint: "Energi och vila" },
    "Hem och vardag": { icon: Home, tone: "blush", hint: "Vardagen hemma" },
  };
  const groupCard = (title: string, compact = false) => {
    const group = MORE_GROUPS.find((entry) => entry.title === title);
    const meta = groupMeta[title];
    const entries = group ? visible(group.hrefs) : [];
    return group && meta && entries.length ? card(title, meta.hint, meta.icon, meta.tone, undefined, `direct-${title}`, rows(entries), compact, compact) : null;
  };
  const minDag = groupCard("Min dag", true), hemVardag = groupCard("Hem och vardag", true), ork = groupCard("Ork och återhämtning"), flowSamtal = groupCard("Flow och samtal");
  const dailyExpansion = (title: string) => {
    const group = MORE_GROUPS.find((entry) => entry.title === title);
    const entries = group ? visible(group.hrefs) : [];
    return entries.length > 0 && open.includes(`direct-${title}`) ? <div id={`pace-more-group-direct-${title}`} className="pace-more-expanded col-span-full min-w-0" role="region" aria-label={t(title)}>{rows(entries)}</div> : null;
  };
  return <div className={cn("pace-more-view", enlarged && "pace-more-enlarged")}>
    <div className="pace-more-tools">
      <Button variant="ghost" onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen} aria-controls="pace-more-search" className="pace-more-search-trigger"><Search aria-hidden />{t("Sök i appen")}</Button>
      <Button ref={closeRef} variant="ghost" size="icon" onClick={onClose} aria-label={t("Stäng Mer")}><X /></Button>
    </div>
    <header className="pace-more-header"><div className="min-w-0"><h1>{t("Mer av din vardag")}</h1><p>{t("Dina verktyg, när du behöver dem.")}</p></div><Sprig /></header>
    {searchOpen && <div id="pace-more-search" className="pace-more-search"><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Sök i appen…")} aria-label={t("Sök i appen")} /></div>}
    {query.trim() ? <section aria-label={t("Sökresultat")}>{results.length ? rows(results) : <p className="pace-more-muted">{t("Hittade inget som matchar")} ”{query}”.</p>}</section> : <>
      {card("Min profil", "Ditt konto, dina inställningar och din familj", User, "lavender", "/profil")}
      <Link href="/installningar" onClick={(event) => navigate(event, "/installningar")} className="pace-more-settings"><Settings2 size={16} />{t("Inställningar")}</Link>
      {(visible(DAILY.map((item) => item.href)).length > 0 || minDag || hemVardag) && section("MIN VARDAG", <>
        <div className="pace-more-daily">
          {DAILY.filter((item) => visible([item.href]).length).map((item) => <div key={item.href}>{card(item.label, item.hint, item.icon, item.tone, item.href, undefined, undefined, true)}</div>)}
          {minDag}
          {hemVardag}
          {dailyExpansion("Min dag")}
          {dailyExpansion("Hem och vardag")}
        </div>
      </>)}
      {(visible(["/traning"]).length > 0 || ork) && section("HÄLSA & VÄLMÅENDE", <>
        {visible(["/traning"]).length > 0 && card("Träning och rörelse", "Rörelse på dina villkor", HeartPulse, "lavender", "/traning")}
        {ork}
      </>)}
      {flowSamtal && section("STÖD & SAMTAL", flowSamtal)}
      {family.length > 0 && section("FAMILJ & RELATIONER", card("Familj", "Familjens vardag", Users, "sage", undefined, "family", rows(family)))}
      {insights.length > 0 && section("ÖVERBLICK & INSIKTER", card("Insikter och historik", "Se mönster över tid", BarChart3, "lavender", undefined, "insights", rows(insights)))}
      {section("FLER VERKTYG", <>
        {card("Fler funktioner", "Alla andra verktyg i appen", Sparkles, "lavender", undefined, "tools", MORE_TOOL_GROUPS.map((group) => {
          const entries = visible(group.hrefs);
          return entries.length ? <section key={group.title} className="pace-more-tool-group"><h3>{t(group.title)}</h3>{rows(entries)}</section> : null;
        }))}
        {legacy.length > 0 && <div className="pace-more-legacy">{card("Äldre funktioner", "Äldre Hem, balans och belöningar", History, "plain", undefined, "legacy", rows(legacy))}</div>}
      </>)}
      <div className="pace-more-reminder"><Sprig /><p>{t("Allt behöver inte få plats på en dag.")}</p><Sprig /></div>
    </>}
  </div>;
}