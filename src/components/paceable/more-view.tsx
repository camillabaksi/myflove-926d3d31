import { useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode, type CSSProperties } from "react";
import { Link } from "wouter";
import { User, Settings2, Search, X, ChevronRight, ChevronDown, Wallet, BookOpen, Briefcase, HeartPulse, Users, BarChart3, Sparkles, History, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyFloveIcon } from "@/components/myflove";
import { cn } from "@/lib/utils";
import { areaColor, type LifeArea } from "@/lib/life-areas";

export type MoreItem = {
  href: string;
  label: string;
  hint: string;
  essential?: boolean;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

export type MoreArea = { title: string; area: LifeArea | null; hint: string; icon: typeof User; tone: string; hrefs: readonly string[] };
/** Livsområden i samma indelning och färg som kalendern. Familj+Barn och Hälsa+Egen tid delar kort. */
export const MORE_AREAS: readonly MoreArea[] = [
  { title: "Hem & vardag", area: "vardag", hint: "Dagen, uppgifter och hemmet", icon: Home, tone: "sage", hrefs: ["/idag", "/kalender", "/tasks", "/paminnelser", "/daglig-rutin", "/matlista", "/shopping", "/stadning"] },
  { title: "Arbete", area: "jobb", hint: "Din arbetsvardag", icon: Briefcase, tone: "blush", hrefs: ["/jobb"] },
  { title: "Studier", area: "studier", hint: "Lärande i din takt", icon: BookOpen, tone: "peach", hrefs: ["/studyflow"] },
  { title: "Ekonomi", area: "ekonomi", hint: "Pengar och överblick", icon: Wallet, tone: "sage", hrefs: ["/finances"] },
  { title: "Hälsa & egen tid", area: "halsa", hint: "Ork, återhämtning och rörelse", icon: HeartPulse, tone: "lavender", hrefs: ["/halsa", "/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/traning", "/pomodoro"] },
  { title: "Familj & barn", area: "privat", hint: "Familjens vardag och relationer", icon: Users, tone: "blush", hrefs: ["/familjeflow", "/familj", "/barn", "/relationer"] },
];
export const MORE_OVERALL: readonly MoreArea[] = [
  { title: "Stöd & reflektion", area: null, hint: "Pace, Fånga och anteckningar", icon: MessageCircle, tone: "peach", hrefs: ["/assistant", "/quickflow", "/anteckningar", "/planera", "/flowplan"] },
  { title: "Insikter & historik", area: null, hint: "Se mönster över tid", icon: BarChart3, tone: "lavender", hrefs: ["/insight", "/statistik", "/friktionsindex"] },
];
export const MORE_TOOL_GROUPS = [
  { title: "Konto och app", hrefs: ["/installningar"] },
  { title: "Admin", hrefs: ["/admin", "/admin-statistik"] },
] as const;
export const MORE_LEGACY = ["/flowscore", "/beloningar"];
/** Direkta entrycksgenvägar högst upp i Mer med det namn användaren letar efter; varje adress visas bara här. */
export const MORE_QUICK_LINKS = ["/historik"] as const;
export const MORE_ALL_HREFS: string[] = [...MORE_AREAS, ...MORE_OVERALL, ...MORE_TOOL_GROUPS].flatMap((g) => [...g.hrefs]).concat(MORE_LEGACY, MORE_QUICK_LINKS);

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
      <span className="min-w-0"><span className="block font-semibold">{item.label}</span><span className="pace-more-muted block text-xs">{item.hint}</span></span>
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
  const groupCard = (g: MoreArea) => {
    const entries = visible(g.hrefs);
    if (!entries.length) return null;
    const content = entries.length === 1 && g.area
      ? card(g.title, g.hint, g.icon, g.tone, entries[0].href)
      : card(g.title, g.hint, g.icon, g.tone, undefined, g.title, rows(entries));
    return <div key={g.title} className="pace-more-area" style={g.area ? { "--pace-more-area-color": areaColor(g.area) } as CSSProperties : undefined}>{content}</div>;
  };
  const areas = MORE_AREAS.map(groupCard).filter(Boolean), overall = MORE_OVERALL.map(groupCard).filter(Boolean), legacy = visible(MORE_LEGACY), quick = visible(MORE_QUICK_LINKS);
  return <div className={cn("pace-more-view", enlarged && "pace-more-enlarged")}>
    <div className="pace-more-tools">
      <Button variant="ghost" onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen} aria-controls="pace-more-search" className="pace-more-search-trigger"><Search aria-hidden />{t("Sök i appen")}</Button>
      <Button ref={closeRef} variant="ghost" size="icon" onClick={onClose} aria-label={t("Stäng Mer")}><X /></Button>
    </div>
    <header className="pace-more-header"><div className="min-w-0"><h1>{t("Mer av din vardag")}</h1><p>{t("Dina verktyg, när du behöver dem.")}</p></div><Sprig /></header>
    {searchOpen && <div id="pace-more-search" className="pace-more-search"><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Sök i appen…")} aria-label={t("Sök i appen")} /></div>}
    {query.trim() ? <section aria-label={t("Sökresultat")}>{results.length ? rows(results) : <p className="pace-more-muted">{t("Hittade inget som matchar")} ”{query}”.</p>}</section> : <>
      {card("Min profil", "Ditt konto, dina inställningar och din familj", User, "lavender", "/profil")}
      <nav aria-label={t("Genvägar")} className="pace-more-quick">
        {quick.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={(event) => navigate(event, item.href)} className="pace-more-settings"><Icon size={16} className="shrink-0" />{t("Historik")}</Link>; })}
        <Link href="/installningar" onClick={(event) => navigate(event, "/installningar")} className="pace-more-settings"><Settings2 size={16} aria-hidden />{t("Inställningar")}</Link>
      </nav>
      {areas.length > 0 && section("DINA LIVSOMRÅDEN", <div className="grid gap-2">{areas}</div>)}
      {overall.length > 0 && section("ÖVERGRIPANDE", <div className="grid gap-2">{overall}</div>)}
      {section("FLER VERKTYG", <>
        {card("Fler funktioner", "Alla andra verktyg i appen", Sparkles, "lavender", undefined, "tools", MORE_TOOL_GROUPS.map((group) => {
          const entries = visible(group.hrefs);
          return entries.length ? <section key={group.title} className="pace-more-tool-group"><h3>{t(group.title)}</h3>{rows(entries)}</section> : null;
        }))}
        {legacy.length > 0 && <div className="pace-more-legacy">{card("Äldre funktioner", "Balans och belöningar", History, "plain", undefined, "legacy", rows(legacy))}</div>}
      </>)}
      <div className="pace-more-reminder"><Sprig /><p>{t("Allt behöver inte få plats på en dag.")}</p><Sprig /></div>
    </>}
  </div>;
}
