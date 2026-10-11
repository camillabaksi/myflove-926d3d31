import { Link } from "wouter";
import { ArrowRight, Dumbbell, Pill, Sunrise } from "lucide-react";

const tools = [
  {
    href: "/traning",
    icon: Dumbbell,
    title: "Träning & promenader",
    description: "Pass efter din ork.",
  },
  {
    href: "/daglig-rutin",
    icon: Pill,
    title: "Rutiner & medicin",
    description: "Rutiner och dagens doser.",
  },
  {
    href: "/daglig-rutin",
    icon: Sunrise,
    title: "Morgonstart",
    description: "En lugn start på dagen.",
  },
];

/** Presentation only: the existing health destinations, without account state. */
export function HealthToolLinks() {
  return (
    <ul className="pace-place-tool-list divide-y divide-border/50">
      {tools.map(({ href, icon: Icon, title, description }) => (
        <li key={title} className="min-w-0">
          <Link
            href={href}
            className="pace-place-entry pace-place-tool-link flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-muted/40"
          >
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="pace-place-entry-title block font-sans text-lg font-semibold leading-snug text-ink">
                {title}
              </span>
              <span className="block text-sm text-muted-foreground">{description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
