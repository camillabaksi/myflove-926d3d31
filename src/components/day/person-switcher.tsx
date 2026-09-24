import { Users } from "lucide-react";
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

/** [Min dag] [Bella] [Bianca] [Familj] – alltid tydligt vems dag som visas. */
export function PersonSwitcher({
  people,
  value,
  onChange,
}: {
  people: Person[];
  value: Perspective;
  onChange: (value: Perspective) => void;
}) {
  const options: Array<{ id: string; label: string; person?: Person }> = [
    { id: ME_ID, label: "Min dag", person: { id: ME_ID, name: "Du" } },
    ...people.map((p) => ({ id: p.id, label: p.name, person: p })),
    { id: FAMILY_ID, label: "Familj" },
  ];
  return (
    <div role="radiogroup" aria-label="Vems dag vill du se?" className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "press inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm font-semibold",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-ink hover:bg-secondary/60",
            )}
          >
            {o.person ? <PersonAvatar person={o.person} className="h-5 w-5 text-[10px]" /> : <Users size={15} aria-hidden />}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
