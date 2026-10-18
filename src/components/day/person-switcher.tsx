import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound, UsersRound, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ME_ID } from "@/lib/family-perspective";

export interface Person {
  id: string;
  name: string;
  avatar?: string | null;
}

export type Perspective = string; // ME_ID | childId | "familj"
export const FAMILY_ID = "familj";

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  const avatar = person.avatar?.trim();
  const isImage = !!avatar && /^(https?:|data:|\/)/.test(avatar);
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-[11px] font-bold text-ink",
        className,
      )}
      aria-hidden
    >
      {isImage ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : avatar && /\p{L}/u.test(avatar.charAt(0)) ? (
        avatar.charAt(0).toUpperCase()
      ) : avatar ? (
        firstGrapheme(avatar)
      ) : person.id === ME_ID ? (
        "Du"
      ) : (
        person.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function firstGrapheme(value: string): string {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const part of seg.segment(value)) return part.segment;
  }
  return Array.from(value)[0] ?? "";
}

export function possessive(name: string): string {
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}

/** [Min dag] [Bella] [Bianca] [Familj] – en svepbar rad; alltid tydligt vems dag som visas. */
export function PersonSwitcher({
  people,
  value,
  onChange,
  compact = false,
}: {
  people: Person[];
  value: Perspective;
  onChange: (value: Perspective) => void;
  compact?: boolean;
}) {
  const options: Array<{ id: string; label: string; person?: Person }> = [
    { id: ME_ID, label: "Min dag", person: { id: ME_ID, name: "Du" } },
    ...people.map((p) => ({ id: p.id, label: p.name, person: p })),
    { id: FAMILY_ID, label: "Familj" },
  ];
  const rowRef = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const update = () => setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [options.length]);

  if (compact) return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Vems dag vill du se?">
      <button type="button" onClick={() => onChange(ME_ID)} aria-pressed={value === ME_ID} className={cn("inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border px-2 text-sm font-semibold", value === ME_ID ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-ink")}><UserRound size={18} aria-hidden /> Min dag</button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button type="button" className={cn("inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 text-sm font-semibold", value !== ME_ID ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-ink")} aria-label="Visa barnen och familjens dag"><UsersRound size={18} aria-hidden /><span className="truncate">{value === ME_ID ? "Visa barnen" : value === FAMILY_ID ? "Familjens dag" : people.find(p => p.id === value)?.name ?? "Visa barnen"}</span><ChevronDown size={14} aria-hidden /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {people.map(p => <DropdownMenuItem key={p.id} onSelect={() => onChange(p.id)}>{p.name}</DropdownMenuItem>)}
          <DropdownMenuItem onSelect={() => onChange(FAMILY_ID)}>Familjens dag</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="relative min-w-0">
      <div
        ref={rowRef}
        role="radiogroup"
        aria-label="Vems dag vill du se?"
        data-person-switcher-row=""
        className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              className="group inline-flex min-h-11 shrink-0 snap-start items-center rounded-full focus-visible:outline-none"
            >
              <span
                className={cn(
                  "press inline-flex min-h-[2.125rem] max-w-[14rem] items-center gap-1.5 rounded-full border px-2.5 text-sm font-semibold group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-ink group-hover:bg-secondary/60",
                )}
              >
                {o.person ? <PersonAvatar person={o.person} className="h-5 w-5 text-[10px]" /> : <Users size={16} aria-hidden />}
                <span className="truncate">{o.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      {moreRight && (
        <span
          aria-hidden
          data-person-switcher-more=""
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
        />
      )}
    </div>
  );
}
