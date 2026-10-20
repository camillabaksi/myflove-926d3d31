import { Link, useSearch } from "@tanstack/react-router";
import { useUser } from "@clerk/react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { PacePageHeader } from "@/components/paceable/page-header";
import Layout from "@/components/layout";
import { PlanningWorkspace } from "@/components/day/planning-workspace";
import { useLang } from "@/hooks/use-language";

export default function PlanningPage() {
  const { audience, period } = useSearch({ from: "/_app/planera" });
  const { user } = useUser();
  const { t } = useLang();
  return (
    <Layout>
      <div className="pace-next-page mx-auto w-full max-w-6xl space-y-6">
        <Link to="/idag" className="inline-flex min-h-11 items-center gap-2 text-sm">
          <ArrowLeft size={16} aria-hidden />
          {t("Till min dag")}
        </Link>
        <PacePageHeader icon={CalendarDays} title={t(audience === "children" ? "Barnens schema" : "Planera")} />
        <nav className="flex flex-wrap gap-2" aria-label={t("Vem vill du planera för?")}>
          {(
            [
              ["me", "Min plan"],
              ["children", "Barnens schema"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              to="/planera"
              search={{ audience: value, period }}
              aria-current={audience === value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm ${audience === value ? "bg-primary text-primary-foreground" : "bg-card text-ink"}`}
            >
              {t(label)}
            </Link>
          ))}
        </nav>
        {user ? (
          <div key={user.id}>
            {(["me", "children"] as const).map((value) => (
              <div key={value} hidden={audience !== value}>
                <PlanningWorkspace
                  owner={user.id}
                  audience={value}
                  requestedPeriod={audience === value ? period : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <p role="status">{t("Laddar ditt konto...")}</p>
        )}
      </div>
    </Layout>
  );
}
