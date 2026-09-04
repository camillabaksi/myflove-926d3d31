import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { useSituation } from "@/hooks/use-situation";
import { lifeProfileCompletion, lifeProfileSummary } from "@/lib/life-profile";

/** Liten ingång till Min livsprofil – en enda profil, inga dubbla vägar. */
export default function LifeProfileLink() {
  const { profile } = useLifeProfile();
  const { situation } = useSituation();
  const percent = lifeProfileCompletion(profile, situation);

  return (
    <Link
      to="/profil"
      className="flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-ink">Min livsprofil</span>
        <span className="block truncate text-sm text-muted-foreground">
          {lifeProfileSummary(profile, situation)}
        </span>
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">{percent} %</span>
    </Link>
  );
}
